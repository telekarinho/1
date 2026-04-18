/* ============================================
   MilkyPot - Estoque (Controle anti-roubo)
   ============================================
   Event-log de movimentos por item. Cada entrada/saida
   e imutavel; correcoes geram novo movimento com motivo.
   Contagem fisica obrigatoria diaria.

   Tipos de movimento:
   - entrada: compra, reabastecimento, devolucao
   - venda: venda automatica (via Recipes em pedido entregue)
   - saida: perda, vencimento, consumo interno, ajuste (-)
   - contagem: contagem fisica (nao altera saldo; registra diff)

   Storage: estoque_mov_{franchiseId} (collection via DataStore)
   Cada movimento:
   {
     id, itemId, itemName, categoria,
     type: 'entrada'|'venda'|'saida'|'contagem',
     subtype: 'compra'|'perda'|'consumo'|'ajuste'|'quebra',
     qty: number (positivo=entra, negativo=sai),
     unitCost: number (opcional, pra movimentos 'entrada'),
     totalCost: qty * unitCost,
     motivo: string,
     orderId: string (se type=venda),
     expectedBefore: saldo esperado antes do movimento (auditoria),
     createdAt, createdBy, createdByName, createdByRole
   }

   Calculo de saldo:
   saldo = soma de todos os movimentos.qty do item

   Contagem fisica:
   diff = qty_contada - saldo_esperado
   Se |diff| > 0, gera alerta de divergencia.
   Se |diff| > threshold (ex: R$ 5 ou 10%), exige aprovacao.
   ============================================ */

const Estoque = (function(){
    'use strict';

    const COL = 'estoque_mov';

    function sessionInfo(){
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            const s = Auth.getSession();
            if (s) return { id:s.userId, name:s.name, email:s.email, role:s.role };
        }
        return { id:'anonymous', name:'Sistema', email:null, role:null };
    }

    function audit(event, fid, details){
        try { if (typeof AuditLog !== 'undefined' && AuditLog.log) AuditLog.log(event, details||{}, fid); } catch(e){}
    }

    function loadMovements(fid){
        if (typeof DataStore === 'undefined') return [];
        return DataStore.getCollection(COL, fid) || [];
    }

    /** Item master: busca na colecao 'inventory' (ja existe em painel/produtos.html). */
    function loadItems(fid){
        if (typeof DataStore === 'undefined') return [];
        return DataStore.getCollection('inventory', fid) || [];
    }

    function saveItems(fid, items){
        if (typeof DataStore === 'undefined') return false;
        DataStore.setCollection('inventory', fid, items);
        return true;
    }

    /** Saldo atual de um item = soma dos movimentos.qty */
    function balance(fid, itemId){
        const moves = loadMovements(fid).filter(m => m.itemId === itemId);
        return moves.reduce((s, m) => s + Number(m.qty || 0), 0);
    }

    /** Saldo de todos os itens como mapa {itemId: qty} */
    function balanceAll(fid){
        const moves = loadMovements(fid);
        const map = {};
        moves.forEach(m => {
            map[m.itemId] = (map[m.itemId] || 0) + Number(m.qty || 0);
        });
        return map;
    }

    function createMovement(fid, partial){
        if (typeof DataStore === 'undefined' || !DataStore.addToCollection) return { success:false, error:'DataStore indisponivel' };
        const user = sessionInfo();
        const now = new Date();
        const expectedBefore = balance(fid, partial.itemId);
        const mov = {
            id: (typeof Utils !== 'undefined' ? Utils.generateId() : Date.now().toString(36)),
            itemId: partial.itemId,
            itemName: partial.itemName || '',
            categoria: partial.categoria || '',
            type: partial.type,
            subtype: partial.subtype || null,
            qty: Number(partial.qty || 0),
            unitCost: partial.unitCost ? Number(partial.unitCost) : null,
            totalCost: partial.unitCost ? (Number(partial.qty||0) * Number(partial.unitCost)) : null,
            motivo: String(partial.motivo || ''),
            orderId: partial.orderId || null,
            expectedBefore: expectedBefore,
            createdAt: now.toISOString(),
            createdBy: user.id,
            createdByName: user.name,
            createdByEmail: user.email,
            createdByRole: user.role
        };
        DataStore.addToCollection(COL, fid, mov);
        return { success:true, mov };
    }

    /* ============================================
       API publica
       ============================================ */
    function registerEntry(fid, payload){
        // payload: { itemId, itemName, categoria, qty, unitCost, subtype, motivo }
        if (!fid || !payload.itemId) return { success:false, error:'Dados invalidos' };
        const qty = Math.abs(Number(payload.qty || 0));
        if (qty <= 0) return { success:false, error:'Quantidade deve ser > 0' };
        if (!payload.motivo) return { success:false, error:'Motivo obrigatorio' };
        const r = createMovement(fid, {
            type: 'entrada',
            subtype: payload.subtype || 'compra',
            qty: qty,
            unitCost: payload.unitCost,
            motivo: payload.motivo,
            itemId: payload.itemId,
            itemName: payload.itemName,
            categoria: payload.categoria
        });
        if (r.success) audit('estoque.entrada', fid, { itemId:payload.itemId, qty, unitCost:payload.unitCost, motivo:payload.motivo });
        return r;
    }

    function registerExit(fid, payload){
        // payload: { itemId, itemName, categoria, qty, subtype: perda|consumo|quebra|ajuste, motivo }
        if (!fid || !payload.itemId) return { success:false, error:'Dados invalidos' };
        const qty = Math.abs(Number(payload.qty || 0));
        if (qty <= 0) return { success:false, error:'Quantidade deve ser > 0' };
        if (!payload.motivo || payload.motivo.length < 3) return { success:false, error:'Motivo obrigatorio (minimo 3 chars)' };
        const bal = balance(fid, payload.itemId);
        if (qty > bal && payload.subtype !== 'ajuste') {
            return { success:false, error: `Saldo insuficiente: ${bal} disponivel, ${qty} pedido.` };
        }
        const r = createMovement(fid, {
            type: 'saida',
            subtype: payload.subtype || 'perda',
            qty: -qty,
            motivo: payload.motivo,
            itemId: payload.itemId,
            itemName: payload.itemName,
            categoria: payload.categoria
        });
        if (r.success) audit('estoque.saida', fid, { itemId:payload.itemId, qty, subtype:payload.subtype, motivo:payload.motivo });
        return r;
    }

    function registerSale(fid, itemId, qty, orderId){
        if (!fid || !itemId) return { success:false, error:'Dados invalidos' };
        const q = Math.abs(Number(qty || 0));
        if (q <= 0) return { success:false, error:'Qty invalida' };
        const r = createMovement(fid, {
            type: 'venda',
            qty: -q,
            motivo: 'Venda pedido #' + (String(orderId||'').slice(-6)),
            orderId: orderId,
            itemId: itemId
        });
        return r;
    }

    /** Registra contagem fisica. Nao move saldo sozinho. Se diff > 0 ou exige ajuste. */
    function registerCount(fid, payload){
        // payload: { itemId, itemName, qtyContada, observacao }
        if (!fid || !payload.itemId) return { success:false, error:'Dados invalidos' };
        const qtdContada = Number(payload.qtyContada || 0);
        if (isNaN(qtdContada) || qtdContada < 0) return { success:false, error:'Quantidade invalida' };
        const expected = balance(fid, payload.itemId);
        const diff = qtdContada - expected;
        const r = createMovement(fid, {
            type: 'contagem',
            qty: 0, // contagem nao altera saldo; gera ajuste separado se user aprovar
            motivo: payload.observacao || 'Contagem fisica',
            itemId: payload.itemId,
            itemName: payload.itemName
        });
        if (r.success) {
            r.expected = expected;
            r.counted = qtdContada;
            r.diff = diff;
            audit('estoque.contagem', fid, { itemId:payload.itemId, expected, counted:qtdContada, diff });
        }
        return r;
    }

    /** Aplica ajuste baseado em diff de contagem (entrada positiva ou saida negativa). */
    function applyCountAdjustment(fid, itemId, diff, motivo){
        if (!motivo || motivo.length < 3) return { success:false, error:'Motivo obrigatorio' };
        const user = sessionInfo();
        // Ajustes significativos (>5 unidades ou mais de 10%) exigem manager ou super_admin
        const bal = balance(fid, itemId);
        const magnitude = Math.abs(diff);
        const pct = bal > 0 ? magnitude / bal : 1;
        const needsElevation = magnitude >= 5 || pct >= 0.1;
        if (needsElevation && user.role !== 'super_admin' && user.role !== 'manager' && user.role !== 'franchisee') {
            return { success:false, error:'Ajustes grandes exigem gerente ou franqueado aprovar' };
        }
        const r = createMovement(fid, {
            type: diff > 0 ? 'entrada' : 'saida',
            subtype: 'ajuste',
            qty: diff,
            motivo: '[AJUSTE CONTAGEM] ' + motivo,
            itemId: itemId
        });
        if (r.success) audit('estoque.ajuste', fid, { itemId, diff, motivo, by:user.name });
        return r;
    }

    /** Saldo esperado e contagem pendente (hoje) pro checklist de fechamento. */
    function getPendingCountsToday(fid){
        const today = new Date().toISOString().slice(0,10);
        const moves = loadMovements(fid);
        const countedToday = new Set(
            moves.filter(m => m.type === 'contagem' && m.createdAt.startsWith(today))
                 .map(m => m.itemId)
        );
        const items = loadItems(fid);
        return items.filter(i => i.requireDailyCount && !countedToday.has(i.id));
    }

    /** Movimentos de um item (historico). */
    function getHistory(fid, itemId, limit){
        const moves = loadMovements(fid).filter(m => m.itemId === itemId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
        return limit ? moves.slice(0, limit) : moves;
    }

    /** Divergencias recentes (contagens com diff != 0). */
    function getDivergences(fid, days){
        days = days || 30;
        const cutoff = new Date(Date.now() - days * 86400000).toISOString();
        const moves = loadMovements(fid);
        // Contagens que tiveram diff (comparado ao expectedBefore + qtyContada)
        // Como nao gravamos isso, calculamos re-consultando
        const byItem = {};
        moves.forEach(m => {
            if (!byItem[m.itemId]) byItem[m.itemId] = [];
            byItem[m.itemId].push(m);
        });
        const divergences = [];
        Object.entries(byItem).forEach(([itemId, list]) => {
            list.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
            let running = 0;
            list.forEach(m => {
                if (m.type === 'contagem' && m.createdAt >= cutoff) {
                    // Nota: esse modelo simples nao grava qty contada em m.qty (e 0).
                    // Divergencias aparecem nos ajustes subsequentes (subtype='ajuste').
                }
                if (m.subtype === 'ajuste' && m.createdAt >= cutoff) {
                    divergences.push(m);
                }
                running += Number(m.qty || 0);
            });
        });
        return divergences.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }

    /** Valor total do estoque em R$. */
    function getTotalValue(fid){
        const balances = balanceAll(fid);
        const items = loadItems(fid);
        let total = 0;
        items.forEach(it => {
            const qty = balances[it.id] || 0;
            const cost = Number(it.unitCost || it.costUnit || 0);
            total += qty * cost;
        });
        return total;
    }

    function formatBRL(v){
        const n = Number(v || 0);
        return 'R$ ' + Math.abs(n).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    return {
        // Leitura
        loadMovements,
        loadItems,
        saveItems,
        balance,
        balanceAll,
        getHistory,
        getDivergences,
        getPendingCountsToday,
        getTotalValue,
        // Escrita
        registerEntry,
        registerExit,
        registerSale,
        registerCount,
        applyCountAdjustment,
        formatBRL
    };
})();
