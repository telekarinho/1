/* ============================================================
   MilkyPot — Stock Alerts (FASE 8)
   ============================================================
   Cloud Function que detecta insumos críticos e envia alerta
   via email + (futuramente) WhatsApp.

   Lógica portada do browser (MarginIntelligence + PurchaseIntelligence)
   pra rodar em Node sem dependência de window/DOM.

   Critério:
     diasRestantes = estoqueAtual / consumoMedioDiario
     diasRestantes < 3 → 🚨 CRÍTICO
     diasRestantes < 7 → ⚠️ ATENÇÃO
     ≥ 7 → 🟢 OK (não envia)

   Dedup: 1x por dia por insumo (collection alert_dedup_<fid>).
   Permite desativar via insumo.alertasDesativados = true.
   ============================================================ */

const admin = require("firebase-admin");

const VALID_STATUSES = ["confirmado", "entregue", "pago"];

function _r3(n) { return Math.round(Number(n) * 1000) / 1000; }
function _r1(n) { return Math.round(Number(n) * 10) / 10; }

/** Lê doc do Firestore datastore e parse JSON value */
async function _readDatastoreDoc(db, docId) {
    const snap = await db.collection("datastore").doc(docId).get();
    if (!snap.exists) return null;
    try { return JSON.parse(snap.data().value); }
    catch (e) { return null; }
}

/** Converte qty entre unidades — fallback simples */
function _convertUnit(qty, fromUnit, toUnit) {
    if (fromUnit === toUnit) return qty;
    if (fromUnit === "kg" && toUnit === "g") return qty * 1000;
    if (fromUnit === "g" && toUnit === "kg") return qty / 1000;
    if (fromUnit === "L" && toUnit === "ml") return qty * 1000;
    if (fromUnit === "ml" && toUnit === "L") return qty / 1000;
    return null;
}

/** Constrói recipe map: productId → { name, receita[] } */
function _buildRecipeMap(catalogV2List, catalogConfig) {
    const map = {};
    // CatalogV2 primeiro (autoritativo)
    (catalogV2List || []).forEach(p => {
        if (!p || !p.id) return;
        const ins = (p.custos && Array.isArray(p.custos.insumos)) ? p.custos.insumos : [];
        const valid = ins.filter(r => r && r.insumoId && Number(r.qty) > 0 && r.unit);
        if (valid.length) map[p.id] = { name: p.name, receita: valid };
    });
    // catalog_config legado (fallback)
    if (catalogConfig) {
        const addLeg = (g) => {
            if (!g || !g.items) return;
            g.items.forEach(item => {
                if (!item || !item.id || map[item.id]) return;
                const rec = Array.isArray(item.receita)
                    ? item.receita.filter(r => r && r.insumoId && Number(r.qty) > 0 && r.unit)
                    : [];
                if (rec.length) map[item.id] = { name: item.name, receita: rec };
            });
        };
        Object.values(catalogConfig.sabores || {}).forEach(addLeg);
        Object.values(catalogConfig.adicionais || {}).forEach(addLeg);
        (catalogConfig.bebidas || []).forEach(item => {
            if (!item || !item.id || map[item.id]) return;
            const rec = Array.isArray(item.receita)
                ? item.receita.filter(r => r && r.insumoId && Number(r.qty) > 0 && r.unit)
                : [];
            if (rec.length) map[item.id] = { name: item.name, receita: rec };
        });
    }
    return map;
}

/**
 * Calcula consumo de insumos pra UMA franquia, baseado nos pedidos.
 * Análoga a MarginIntelligence.getConsumoInsumos() do browser.
 */
async function getConsumoInsumosForFranchise(db, franchiseId, days) {
    days = days || 30;
    const orders = (await _readDatastoreDoc(db, "orders_" + franchiseId)) || [];
    const inventory = (await _readDatastoreDoc(db, "inventory_" + franchiseId)) || [];
    // CatalogV2 dos produtos
    const catalogV2Doc = await db.collection("catalogo_v2").doc(franchiseId).get();
    let catalogV2List = [];
    if (catalogV2Doc.exists) {
        const d = catalogV2Doc.data();
        catalogV2List = Array.isArray(d.produtos) ? d.produtos : [];
    }
    // Fallback: catalog_config global
    let catalogConfig = null;
    try {
        const cc = await _readDatastoreDoc(db, "catalog_config");
        if (cc && typeof cc === "object") catalogConfig = cc;
    } catch (_) {}

    const recipeMap = _buildRecipeMap(catalogV2List, catalogConfig);

    const insByID = {};
    inventory.forEach(i => { if (i && i.id) insByID[i.id] = i; });

    const sinceMs = Date.now() - days * 86400000;
    const periodOrders = orders.filter(o => {
        if (!o || !o.createdAt) return false;
        if (VALID_STATUSES.indexOf(o.status) === -1) return false;
        return new Date(o.createdAt).getTime() >= sinceMs;
    });

    const weekAgoMs = Date.now() - 7 * 86400000;
    const consumo = {};

    periodOrders.forEach(o => {
        const oMs = o.createdAt ? new Date(o.createdAt).getTime() : 0;
        const isSemana = oMs >= weekAgoMs;
        (o.items || []).forEach(item => {
            const pid = item && item.productId;
            if (!pid) return;
            const recipe = recipeMap[pid];
            if (!recipe || !recipe.receita || !recipe.receita.length) return;
            const qty = Number(item.qty || item.quantity || 1);
            recipe.receita.forEach(r => {
                const ins = insByID[r.insumoId];
                if (!ins) return;
                const conv = _convertUnit(Number(r.qty) * qty, r.unit, ins.unit);
                if (conv === null) return;
                if (!consumo[r.insumoId]) {
                    consumo[r.insumoId] = {
                        insumoId: r.insumoId,
                        nome: ins.name || r.insumoId,
                        unit: ins.unit,
                        consumoSemana: 0,
                        consumoPeriodo: 0,
                        estoqueAtual: Number(ins.quantity || 0),
                        alertasDesativados: !!ins.alertasDesativados,
                    };
                }
                const c = consumo[r.insumoId];
                c.consumoPeriodo += conv;
                if (isSemana) c.consumoSemana += conv;
            });
        });
    });

    // Adiciona insumos do inventory que não foram consumidos no período
    inventory.forEach(ins => {
        if (!ins || !ins.id || consumo[ins.id]) return;
        consumo[ins.id] = {
            insumoId: ins.id,
            nome: ins.name || ins.id,
            unit: ins.unit,
            consumoSemana: 0,
            consumoPeriodo: 0,
            estoqueAtual: Number(ins.quantity || 0),
            alertasDesativados: !!ins.alertasDesativados,
        };
    });

    const insumos = Object.values(consumo).map(ins => {
        ins.consumoSemana = _r3(ins.consumoSemana);
        ins.consumoPeriodo = _r3(ins.consumoPeriodo);
        const diario = ins.consumoSemana / 7;
        ins.consumoMedioDiario = _r3(diario);
        ins.diasRestantes = diario > 0 ? _r1(ins.estoqueAtual / diario) : null;
        if (ins.diasRestantes !== null && ins.diasRestantes < 3) {
            ins.status = "critico"; ins.statusIcon = "🚨";
        } else if (ins.diasRestantes !== null && ins.diasRestantes < 7) {
            ins.status = "atencao"; ins.statusIcon = "⚠️";
        } else if (ins.diasRestantes !== null) {
            ins.status = "ok"; ins.statusIcon = "🟢";
        } else {
            ins.status = "sem-dado"; ins.statusIcon = "⚪";
        }
        return ins;
    });

    return insumos;
}

/** Calcula sugestão de compra (cobertura padrão 7d) */
function calcSugestao(consumoMedioDiario, estoqueAtual, diasCobertura) {
    diasCobertura = diasCobertura || 7;
    if (consumoMedioDiario <= 0) return 0;
    return _r3(Math.max(0, consumoMedioDiario * diasCobertura - estoqueAtual));
}

/** Constrói HTML do alerta */
function _buildAlertHtml(franchiseId, insumosAlertas) {
    const dt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const fmtQty = (n, unit) => `${Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
    const rows = insumosAlertas.map(ins => {
        const sugestao = calcSugestao(ins.consumoMedioDiario, ins.estoqueAtual, 7);
        const dias = ins.diasRestantes !== null ? ins.diasRestantes.toFixed(1).replace(".", ",") + " dias" : "—";
        const bg = ins.status === "critico" ? "#FEE2E2" : "#FEF3C7";
        const color = ins.status === "critico" ? "#991B1B" : "#92400E";
        const labelStatus = ins.status === "critico" ? "🚨 CRÍTICO" : "⚠️ ATENÇÃO";
        return `
        <tr style="background:${bg}">
          <td style="padding:10px;font-weight:700;color:${color}">${ins.nome}</td>
          <td style="padding:10px;text-align:right">${fmtQty(ins.estoqueAtual, ins.unit)}</td>
          <td style="padding:10px;text-align:right">${fmtQty(ins.consumoMedioDiario, ins.unit + "/dia")}</td>
          <td style="padding:10px;text-align:right;font-weight:800;color:${color}">${dias}</td>
          <td style="padding:10px;text-align:right;color:#16A34A;font-weight:700">${sugestao > 0 ? "+" + fmtQty(sugestao, ins.unit) : "—"}</td>
          <td style="padding:10px;text-align:center;font-size:11px;font-weight:800;color:${color}">${labelStatus}</td>
        </tr>`;
    }).join("");
    return `
<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:16px;background:#f9fafb">
  <div style="background:linear-gradient(135deg,#DC2626,#F59E0B);color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
    <h2 style="margin:0;font-size:20px">📦 Alerta de Estoque — Milkypot</h2>
    <div style="opacity:.92;font-size:13px;margin-top:6px">${franchiseId} · ${dt}</div>
  </div>
  <div style="background:#fff;padding:18px;border:1px solid #e5e7eb;border-top:0">
    <p style="margin:0 0 12px;font-size:14px;color:#374151">
      <strong>${insumosAlertas.length} insumo(s)</strong> precisam de atenção. Sugestões abaixo (cobertura 7 dias):
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">
      <tr style="background:#F3F4F6">
        <th style="padding:9px 8px;text-align:left">Insumo</th>
        <th style="padding:9px 8px;text-align:right">Estoque</th>
        <th style="padding:9px 8px;text-align:right">Consumo médio</th>
        <th style="padding:9px 8px;text-align:right">Dias restantes</th>
        <th style="padding:9px 8px;text-align:right">Sugestão compra</th>
        <th style="padding:9px 8px;text-align:center">Status</th>
      </tr>
      ${rows}
    </table>
    <div style="margin-top:18px;padding:12px;background:#EFF6FF;border-left:4px solid #3B82F6;border-radius:6px">
      <p style="margin:0;font-size:13px;color:#1E3A8A">
        🛒 <strong>Acesse o painel para registrar a compra:</strong><br>
        <a href="https://milkypot.com/painel/produtos.html?tab=compras" style="color:#1D4ED8;text-decoration:none;font-weight:700">milkypot.com/painel/produtos.html → aba 📦 Compras</a>
      </p>
    </div>
  </div>
  <div style="text-align:center;color:#9ca3af;font-size:11px;margin-top:12px">
    Alerta automático MilkyPot · 1x por dia · pra desativar alertas de um insumo específico, marque "alertasDesativados" no inventário
  </div>
</div>`;
}

/** Constrói plain text do alerta */
function _buildAlertText(franchiseId, insumosAlertas) {
    const dt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    let body = "📦 ALERTA DE ESTOQUE — Milkypot\n";
    body += "==================================\n";
    body += `Franquia: ${franchiseId}\n`;
    body += `Data: ${dt}\n\n`;
    body += `${insumosAlertas.length} insumo(s) precisam de atenção:\n\n`;
    insumosAlertas.forEach(ins => {
        const sugestao = calcSugestao(ins.consumoMedioDiario, ins.estoqueAtual, 7);
        const labelStatus = ins.status === "critico" ? "🚨 CRÍTICO" : "⚠️ ATENÇÃO";
        body += `${labelStatus} — ${ins.nome}\n`;
        body += `  Estoque atual:   ${ins.estoqueAtual} ${ins.unit}\n`;
        body += `  Consumo médio:   ${ins.consumoMedioDiario} ${ins.unit}/dia\n`;
        body += `  Dias restantes:  ${ins.diasRestantes !== null ? ins.diasRestantes + " dias" : "—"}\n`;
        body += `  Sugestão:        ${sugestao > 0 ? "+" + sugestao + " " + ins.unit : "—"}\n\n`;
    });
    body += "🛒 Acesse: https://milkypot.com/painel/produtos.html → aba 📦 Compras\n";
    return body;
}

/**
 * Roda análise de uma franquia + envia alerta SE há insumos críticos/atenção
 * que ainda não foram alertados hoje.
 *
 * @param {object} db - Firestore admin
 * @param {string} franchiseId
 * @param {object} opts - { sendEmail (fn), recipients (array), force (bool ignora dedup) }
 * @returns {object} { fid, alertasEnviados, dedupSkipped, errors }
 */
async function runStockAlertCheckForFranchise(db, franchiseId, opts) {
    opts = opts || {};
    const insumos = await getConsumoInsumosForFranchise(db, franchiseId, 30);
    const alertaveis = insumos.filter(i => {
        if (i.alertasDesativados) return false;
        return i.status === "critico" || i.status === "atencao";
    });
    if (!alertaveis.length) {
        return { fid: franchiseId, scanned: insumos.length, alertaveis: 0, alertasEnviados: 0 };
    }

    // Dedup: 1x por dia por insumo (chave: YYYY-MM-DD + insumoId)
    const today = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10); // BRT
    const dedupRef = db.collection("alert_dedup").doc("stock_" + franchiseId + "_" + today);
    let alreadyAlerted = {};
    if (!opts.force) {
        const snap = await dedupRef.get();
        if (snap.exists) alreadyAlerted = snap.data().insumos || {};
    }
    const novosAlertas = alertaveis.filter(i => !alreadyAlerted[i.insumoId]);
    if (!novosAlertas.length) {
        return {
            fid: franchiseId, scanned: insumos.length,
            alertaveis: alertaveis.length, alertasEnviados: 0,
            dedupSkipped: alertaveis.length
        };
    }

    // Envia email se sendEmail provided
    let emailResult = null;
    if (typeof opts.sendEmail === "function") {
        try {
            const html = _buildAlertHtml(franchiseId, novosAlertas);
            const text = _buildAlertText(franchiseId, novosAlertas);
            const subject = `📦 Alerta de Estoque ${franchiseId} — ${novosAlertas.filter(i => i.status === "critico").length} crítico(s) · ${novosAlertas.filter(i => i.status === "atencao").length} atenção`;
            emailResult = await opts.sendEmail({
                to: opts.recipients || [],
                subject,
                html,
                text,
            });
        } catch (e) {
            emailResult = { ok: false, error: e.message };
        }
    }

    // Atualiza dedup
    if (!opts.force) {
        const updates = {};
        novosAlertas.forEach(i => { updates["insumos." + i.insumoId] = true; });
        updates.lastUpdate = admin.firestore.FieldValue.serverTimestamp();
        updates.fid = franchiseId;
        try { await dedupRef.set({ insumos: alreadyAlerted, fid: franchiseId, lastUpdate: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }); } catch(_){}
        try {
            const newDedup = Object.assign({}, alreadyAlerted);
            novosAlertas.forEach(i => { newDedup[i.insumoId] = { sentAt: new Date().toISOString(), status: i.status }; });
            await dedupRef.set({ insumos: newDedup, fid: franchiseId, lastUpdate: admin.firestore.FieldValue.serverTimestamp() }, { merge: false });
        } catch (e) {
            console.warn("dedup update falhou", e.message);
        }
    }

    // Audit log
    try {
        await db.collection("stock_alerts_log").add({
            franchiseId,
            ranAt: admin.firestore.FieldValue.serverTimestamp(),
            scanned: insumos.length,
            alertaveis: alertaveis.length,
            enviados: novosAlertas.length,
            insumos: novosAlertas.map(i => ({
                insumoId: i.insumoId,
                nome: i.nome,
                status: i.status,
                diasRestantes: i.diasRestantes,
                estoqueAtual: i.estoqueAtual,
                consumoMedioDiario: i.consumoMedioDiario,
            })),
            emailResult: emailResult || null,
        });
    } catch (e) { console.warn("audit log falhou", e.message); }

    return {
        fid: franchiseId,
        scanned: insumos.length,
        alertaveis: alertaveis.length,
        alertasEnviados: novosAlertas.length,
        emailResult,
    };
}

/** Roda pra todas franquias */
async function runStockAlertCheckAll(db, opts) {
    const franchisesData = await _readDatastoreDoc(db, "franchises");
    if (!Array.isArray(franchisesData)) {
        return { error: "franchises não encontradas ou formato inválido" };
    }
    const results = [];
    let totalEnviados = 0;
    for (const f of franchisesData) {
        if (!f || !f.id) continue;
        try {
            const r = await runStockAlertCheckForFranchise(db, f.id, opts);
            results.push(r);
            totalEnviados += r.alertasEnviados || 0;
        } catch (e) {
            results.push({ fid: f.id, error: e.message });
        }
    }
    return { franchises: franchisesData.length, totalEnviados, results };
}

module.exports = {
    getConsumoInsumosForFranchise,
    calcSugestao,
    runStockAlertCheckForFranchise,
    runStockAlertCheckAll,
    _buildAlertHtml,
    _buildAlertText,
};
