/* ============================================================
   MilkyPot — Stock Alerts (FASE 8.1)
   ============================================================
   Cloud Function que detecta insumos críticos e envia alerta.

   Canais:
     ✅ Email   — canal PRINCIPAL (sempre que houver alerta)
     🟡 WhatsApp — APENAS persiste em fila (whatsapp_queue),
                   não envia até Codex integrar provider real

   Lógica portada do browser (MarginIntelligence + PurchaseIntelligence)
   pra rodar em Node sem dependência de window/DOM.

   Dedup: 1x por dia POR FRANQUIA (agrupa todos insumos no mesmo email).
   Permite desativar por insumo via insumo.alertasDesativados = true.
   Permite desativar por franquia via stockAlertConfig.emailEnabled = false.
   ============================================================ */

const admin = require("firebase-admin");

const VALID_STATUSES = ["confirmado", "entregue", "pago"];
const PAINEL_COMPRAS_URL = "https://milkypot.com/painel/produtos.html#compras";

function _r3(n) { return Math.round(Number(n) * 1000) / 1000; }
function _r1(n) { return Math.round(Number(n) * 10) / 10; }

/** YYYY-MM-DD em fuso Brasília (UTC-3), timezone-safe. */
function _todayBSB() {
    return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Lê doc do Firestore datastore e parse JSON value */
async function _readDatastoreDoc(db, docId) {
    const snap = await db.collection("datastore").doc(docId).get();
    if (!snap.exists) return null;
    try { return JSON.parse(snap.data().value); }
    catch (e) { return null; }
}

function _convertUnit(qty, fromUnit, toUnit) {
    if (fromUnit === toUnit) return qty;
    if (fromUnit === "kg" && toUnit === "g") return qty * 1000;
    if (fromUnit === "g" && toUnit === "kg") return qty / 1000;
    if (fromUnit === "L" && toUnit === "ml") return qty * 1000;
    if (fromUnit === "ml" && toUnit === "L") return qty / 1000;
    return null;
}

function _buildRecipeMap(catalogV2List, catalogConfig) {
    const map = {};
    (catalogV2List || []).forEach(p => {
        if (!p || !p.id) return;
        const ins = (p.custos && Array.isArray(p.custos.insumos)) ? p.custos.insumos : [];
        const valid = ins.filter(r => r && r.insumoId && Number(r.qty) > 0 && r.unit);
        if (valid.length) map[p.id] = { name: p.name, receita: valid };
    });
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

async function getConsumoInsumosForFranchise(db, franchiseId, days) {
    days = days || 30;
    const orders = (await _readDatastoreDoc(db, "orders_" + franchiseId)) || [];
    const inventory = (await _readDatastoreDoc(db, "inventory_" + franchiseId)) || [];
    const catalogV2Doc = await db.collection("catalogo_v2").doc(franchiseId).get();
    let catalogV2List = [];
    if (catalogV2Doc.exists) {
        const d = catalogV2Doc.data();
        catalogV2List = Array.isArray(d.produtos) ? d.produtos : [];
    }
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

function calcSugestao(consumoMedioDiario, estoqueAtual, diasCobertura) {
    diasCobertura = diasCobertura || 7;
    if (consumoMedioDiario <= 0) return 0;
    return _r3(Math.max(0, consumoMedioDiario * diasCobertura - estoqueAtual));
}

/** Constrói subject conforme spec FASE 8.1 */
function _buildSubject(franchiseDisplay, criticos, atencoes) {
    if (criticos > 0) {
        const plural = criticos === 1 ? "item" : "itens";
        return `🚨 Estoque Crítico — Milkypot ${franchiseDisplay} — ${criticos} ${plural} ${criticos === 1 ? "precisa" : "precisam"} de compra`;
    }
    if (atencoes > 0) {
        const plural = atencoes === 1 ? "item" : "itens";
        return `⚠️ Estoque Atenção — Milkypot ${franchiseDisplay} — ${atencoes} ${plural} abaixo de 7 dias`;
    }
    return `📦 Estoque — Milkypot ${franchiseDisplay}`;
}

/** Constrói HTML do email — formato FASE 8.1 */
function _buildAlertHtml(franchiseDisplay, franchiseId, insumosAlertas) {
    const dt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const fmtQty = (n, unit) => `${Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
    const criticos = insumosAlertas.filter(i => i.status === "critico");
    const atencoes = insumosAlertas.filter(i => i.status === "atencao");

    const renderRow = (ins) => {
        const sugestao = calcSugestao(ins.consumoMedioDiario, ins.estoqueAtual, 7);
        const dias = ins.diasRestantes !== null ? ins.diasRestantes.toFixed(1).replace(".", ",") + " dias" : "—";
        const isCrit = ins.status === "critico";
        const bg = isCrit ? "#FEE2E2" : "#FEF3C7";
        const color = isCrit ? "#991B1B" : "#92400E";
        const labelStatus = isCrit ? "🚨 CRÍTICO" : "⚠️ ATENÇÃO";
        return `
        <tr style="background:${bg}">
          <td style="padding:10px;font-weight:700;color:${color}">${ins.nome}</td>
          <td style="padding:10px;text-align:right">${fmtQty(ins.estoqueAtual, ins.unit)}</td>
          <td style="padding:10px;text-align:right">${fmtQty(ins.consumoMedioDiario, ins.unit + "/dia")}</td>
          <td style="padding:10px;text-align:right;font-weight:800;color:${color}">${dias}</td>
          <td style="padding:10px;text-align:right;color:#16A34A;font-weight:700">${sugestao > 0 ? "+" + fmtQty(sugestao, ins.unit) : "—"}</td>
          <td style="padding:10px;text-align:center;font-size:11px;font-weight:800;color:${color}">${labelStatus}</td>
        </tr>`;
    };

    return `
<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:16px;background:#f9fafb">
  <div style="background:linear-gradient(135deg,#DC2626,#F59E0B);color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
    <h2 style="margin:0;font-size:22px">📦 Alerta de Estoque — Milkypot</h2>
    <div style="opacity:.92;font-size:13px;margin-top:6px">${franchiseDisplay} · ${dt}</div>
  </div>
  <div style="background:#fff;padding:18px 22px;border:1px solid #e5e7eb;border-top:0">
    <div style="background:#F9FAFB;border-radius:10px;padding:14px 16px;margin-bottom:18px;border-left:4px solid #7E57C2">
      <h3 style="margin:0 0 8px;font-size:15px;color:#1F2937">📋 Resumo</h3>
      <table style="font-size:13px;color:#374151;border-spacing:0 4px">
        <tr><td style="padding:2px 12px 2px 0;color:#6B7280">Franquia:</td><td style="font-weight:700">${franchiseDisplay}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6B7280">Data:</td><td style="font-weight:700">${dt}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6B7280">Itens críticos:</td><td style="font-weight:800;color:#991B1B">🚨 ${criticos.length}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:#6B7280">Itens em atenção:</td><td style="font-weight:800;color:#92400E">⚠️ ${atencoes.length}</td></tr>
      </table>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px">
      <tr style="background:#F3F4F6">
        <th style="padding:10px 8px;text-align:left;font-weight:700;color:#374151">Insumo</th>
        <th style="padding:10px 8px;text-align:right;font-weight:700;color:#374151">Estoque</th>
        <th style="padding:10px 8px;text-align:right;font-weight:700;color:#374151">Consumo médio/dia</th>
        <th style="padding:10px 8px;text-align:right;font-weight:700;color:#374151">Dias restantes</th>
        <th style="padding:10px 8px;text-align:right;font-weight:700;color:#374151">Sugestão compra</th>
        <th style="padding:10px 8px;text-align:center;font-weight:700;color:#374151">Status</th>
      </tr>
      ${[...criticos, ...atencoes].map(renderRow).join("")}
    </table>

    <div style="text-align:center;margin:22px 0 8px">
      <a href="${PAINEL_COMPRAS_URL}" style="display:inline-block;background:linear-gradient(135deg,#5E35B1,#7E57C2);color:#fff;text-decoration:none;font-weight:800;padding:14px 30px;border-radius:10px;font-size:14px;box-shadow:0 4px 12px rgba(94,53,177,.35)">
        🛒 Abrir painel de compras
      </a>
    </div>
    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin:6px 0 0">
      ${PAINEL_COMPRAS_URL}
    </p>
  </div>
  <div style="text-align:center;color:#9ca3af;font-size:11px;margin-top:14px">
    Alerta automático MilkyPot · enviado 1x por dia por franquia<br>
    Pra desativar alertas de um insumo específico: aba Ingredientes → marcar 🔕 "Desativar alertas"
  </div>
</div>`;
}

function _buildAlertText(franchiseDisplay, franchiseId, insumosAlertas) {
    const dt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const criticos = insumosAlertas.filter(i => i.status === "critico");
    const atencoes = insumosAlertas.filter(i => i.status === "atencao");

    let body = "📦 ALERTA DE ESTOQUE — Milkypot\n";
    body += "==================================\n\n";
    body += "RESUMO:\n";
    body += `  Franquia:           ${franchiseDisplay}\n`;
    body += `  Data:               ${dt}\n`;
    body += `  Itens críticos:     🚨 ${criticos.length}\n`;
    body += `  Itens em atenção:   ⚠️ ${atencoes.length}\n\n`;

    [...criticos, ...atencoes].forEach(ins => {
        const sugestao = calcSugestao(ins.consumoMedioDiario, ins.estoqueAtual, 7);
        const labelStatus = ins.status === "critico" ? "🚨 CRÍTICO" : "⚠️ ATENÇÃO";
        body += `${labelStatus} — ${ins.nome}\n`;
        body += `  Estoque atual:        ${ins.estoqueAtual} ${ins.unit}\n`;
        body += `  Consumo médio diário: ${ins.consumoMedioDiario} ${ins.unit}/dia\n`;
        body += `  Dias restantes:       ${ins.diasRestantes !== null ? ins.diasRestantes + " dias" : "—"}\n`;
        body += `  Quantidade sugerida:  ${sugestao > 0 ? "+" + sugestao + " " + ins.unit : "—"}\n`;
        body += `  Status:               ${labelStatus}\n\n`;
    });

    body += "Abrir painel de compras:\n";
    body += `${PAINEL_COMPRAS_URL}\n`;
    return body;
}

/** Mensagem WhatsApp formato FASE 8.1 (texto puro, multilinhas) */
function _buildWhatsAppMessage(franchiseDisplay, insumosAlertas) {
    const criticos = insumosAlertas.filter(i => i.status === "critico");
    const atencoes = insumosAlertas.filter(i => i.status === "atencao");
    let msg = "🚨 ALERTA DE ESTOQUE — Milkypot\n\n";
    msg += `Franquia: ${franchiseDisplay}\n\n`;
    if (criticos.length > 0) {
        msg += `${criticos.length} ${criticos.length === 1 ? "item crítico" : "itens críticos"}:\n\n`;
        criticos.forEach(ins => {
            const sugestao = calcSugestao(ins.consumoMedioDiario, ins.estoqueAtual, 7);
            msg += `• ${ins.nome}\n`;
            msg += `  Estoque: ${ins.estoqueAtual} ${ins.unit}\n`;
            msg += `  Consumo médio: ${ins.consumoMedioDiario} ${ins.unit}/dia\n`;
            msg += `  Dias restantes: ${ins.diasRestantes !== null ? ins.diasRestantes : "—"}\n`;
            msg += `  Sugestão de compra: ${sugestao > 0 ? sugestao + " " + ins.unit : "—"}\n\n`;
        });
    }
    if (atencoes.length > 0) {
        msg += `${atencoes.length} ${atencoes.length === 1 ? "item em atenção" : "itens em atenção"}:\n\n`;
        atencoes.forEach(ins => {
            const sugestao = calcSugestao(ins.consumoMedioDiario, ins.estoqueAtual, 7);
            msg += `• ${ins.nome}\n`;
            msg += `  Estoque: ${ins.estoqueAtual} ${ins.unit}\n`;
            msg += `  Dias restantes: ${ins.diasRestantes !== null ? ins.diasRestantes : "—"}\n`;
            msg += `  Sugestão: ${sugestao > 0 ? sugestao + " " + ins.unit : "—"}\n\n`;
        });
    }
    msg += `Acesse:\n${PAINEL_COMPRAS_URL}`;
    return msg;
}

/** Default config se franquia não definir */
function _defaultStockAlertConfig() {
    return {
        emailEnabled: true,
        whatsappEnabled: false,         // não envia WhatsApp ainda
        whatsappQueueOnly: true,         // mas persiste em fila pra Codex consumir
        alertEmails: [],                  // vazio = usa RECIPIENTS globais
        alertPhones: [],
        dailyHour: 8,
    };
}

/** Lê config da franquia + merge com defaults */
async function _getStockAlertConfig(db, franchiseId) {
    const defaults = _defaultStockAlertConfig();
    try {
        const fSnap = await db.collection("datastore").doc("franchises").get();
        if (fSnap.exists) {
            const fs = JSON.parse(fSnap.data().value || "[]");
            const f = (fs || []).find(x => x && x.id === franchiseId);
            if (f) {
                const cfg = f.stockAlertConfig || {};
                return {
                    emailEnabled: cfg.emailEnabled !== false,
                    whatsappEnabled: !!cfg.whatsappEnabled,
                    whatsappQueueOnly: cfg.whatsappQueueOnly !== false,
                    alertEmails: Array.isArray(cfg.alertEmails) ? cfg.alertEmails : [],
                    alertPhones: Array.isArray(cfg.alertPhones) ? cfg.alertPhones : [],
                    dailyHour: Number(cfg.dailyHour) || 8,
                    franchiseDisplay: f.name || f.id || franchiseId,
                };
            }
        }
    } catch (e) { /* fallback aos defaults */ }
    return Object.assign(defaults, { franchiseDisplay: franchiseId });
}

/**
 * Roda análise de uma franquia + envia alerta SE há insumos críticos/atenção.
 * Dedup: 1x por dia POR FRANQUIA (agrupa todos insumos no mesmo email).
 *
 * @param {object} db
 * @param {string} franchiseId
 * @param {object} opts - { sendEmail (fn), defaultRecipients, force, logFallback (fn) }
 * @returns {object} { fid, scanned, alertaveis, enviado, dedupSkipped, channels }
 */
async function runStockAlertCheckForFranchise(db, franchiseId, opts) {
    opts = opts || {};
    const config = await _getStockAlertConfig(db, franchiseId);
    const insumos = await getConsumoInsumosForFranchise(db, franchiseId, 30);
    const alertaveis = insumos.filter(i => {
        if (i.alertasDesativados) return false;
        return i.status === "critico" || i.status === "atencao";
    });
    if (!alertaveis.length) {
        return {
            fid: franchiseId, scanned: insumos.length,
            alertaveis: 0, enviado: false,
            reason: "sem-alertas",
            config: { emailEnabled: config.emailEnabled, whatsappQueueOnly: config.whatsappQueueOnly },
        };
    }

    // Dedup POR FRANQUIA (não por insumo)
    const today = _todayBSB();
    const dedupRef = db.collection("alert_dedup").doc("stock_franquia_" + franchiseId + "_" + today);
    if (!opts.force) {
        const snap = await dedupRef.get();
        if (snap.exists) {
            return {
                fid: franchiseId, scanned: insumos.length,
                alertaveis: alertaveis.length,
                enviado: false, dedupSkipped: true,
                reason: "ja-enviado-hoje",
                lastSentAt: snap.data().sentAt || null,
            };
        }
    }

    const recipients = (config.alertEmails && config.alertEmails.length)
        ? config.alertEmails
        : (opts.defaultRecipients || []);

    const channels = { email: null, whatsapp_queued: 0 };
    const subject = _buildSubject(config.franchiseDisplay, alertaveis.filter(i => i.status === "critico").length, alertaveis.filter(i => i.status === "atencao").length);
    const html = _buildAlertHtml(config.franchiseDisplay, franchiseId, alertaveis);
    const text = _buildAlertText(config.franchiseDisplay, franchiseId, alertaveis);

    // === CANAL 1: EMAIL ===
    if (config.emailEnabled && typeof opts.sendEmail === "function" && recipients.length > 0) {
        try {
            const emailRes = await opts.sendEmail({ to: recipients, subject, html, text });
            channels.email = {
                ok: !!emailRes.ok,
                queued: !!emailRes.queued,
                sentTo: emailRes.sentTo || (emailRes.ok ? recipients.length : 0),
                recipients,
                error: emailRes.error || null,
            };
            // mail_fallback_log
            if (typeof opts.logFallback === "function") {
                await opts.logFallback({
                    franchiseId,
                    type: "stock_alert",
                    enviado: !!emailRes.ok,
                    falhou: !emailRes.ok && !emailRes.queued,
                    fallback: !!emailRes.queued,
                    destinatarios: recipients,
                    quantidadeAlertas: alertaveis.length,
                    motivo: emailRes.error || emailRes.reason || null,
                    timestampBRT: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
                });
            }
        } catch (e) {
            channels.email = { ok: false, error: e.message, recipients };
        }
    } else {
        channels.email = { ok: false, skipped: true, reason: !config.emailEnabled ? "emailDisabled" : "no-recipients" };
    }

    // === CANAL 2: WHATSAPP (queue only — Codex consome depois) ===
    if (config.whatsappQueueOnly || config.whatsappEnabled) {
        const message = _buildWhatsAppMessage(config.franchiseDisplay, alertaveis);
        const phones = config.alertPhones.length > 0 ? config.alertPhones : [null]; // null = queue genérico
        for (const phone of phones) {
            try {
                await db.collection("whatsapp_queue").add({
                    franchiseId,
                    franchiseDisplay: config.franchiseDisplay,
                    tipo: "stock_alert",
                    phone: phone || null,
                    message,
                    status: "pending",
                    provider: "codex_whatsapp_pending",
                    payload: {
                        alertasCount: alertaveis.length,
                        criticos: alertaveis.filter(i => i.status === "critico").length,
                        atencoes: alertaveis.filter(i => i.status === "atencao").length,
                        insumos: alertaveis.map(i => ({
                            insumoId: i.insumoId, nome: i.nome, status: i.status,
                            estoqueAtual: i.estoqueAtual, diasRestantes: i.diasRestantes,
                            sugestao: calcSugestao(i.consumoMedioDiario, i.estoqueAtual, 7),
                        })),
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                channels.whatsapp_queued++;
            } catch (e) {
                console.warn("whatsapp_queue add falhou:", e.message);
            }
        }
    }

    // === Dedup: marca enviado HOJE ===
    if (!opts.force) {
        try {
            await dedupRef.set({
                franchiseId,
                sentAt: new Date().toISOString(),
                serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                alertasCount: alertaveis.length,
                channels,
            });
        } catch (e) { console.warn("dedup write falhou:", e.message); }
    }

    // === stock_alerts_log (per-insumo detalhado) ===
    try {
        await db.collection("stock_alerts_log").add({
            franchiseId,
            ranAt: admin.firestore.FieldValue.serverTimestamp(),
            ranAtBRT: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            scanned: insumos.length,
            alertaveis: alertaveis.length,
            insumos: alertaveis.map(i => ({
                insumoId: i.insumoId, nome: i.nome, status: i.status,
                diasRestantes: i.diasRestantes, estoqueAtual: i.estoqueAtual,
                consumoMedioDiario: i.consumoMedioDiario,
                sugestao: calcSugestao(i.consumoMedioDiario, i.estoqueAtual, 7),
            })),
            channels,
        });
    } catch (e) { console.warn("audit stock_alerts_log falhou:", e.message); }

    return {
        fid: franchiseId,
        franchiseDisplay: config.franchiseDisplay,
        scanned: insumos.length,
        alertaveis: alertaveis.length,
        enviado: !!(channels.email && channels.email.ok),
        dedupSkipped: false,
        channels,
        config: { emailEnabled: config.emailEnabled, whatsappQueueOnly: config.whatsappQueueOnly },
    };
}

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
            if (r.enviado) totalEnviados++;
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
    _buildWhatsAppMessage,
    _buildSubject,
    _getStockAlertConfig,
    _defaultStockAlertConfig,
};
