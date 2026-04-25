/* ============================================
   MilkyPot - Módulo de Caixa (PDV auditável)
   ============================================
   Event-log de movimentos por turno, por franquia.
   Cada movimento é imutável; correções geram novo
   movimento type='ajuste'. Toda mutação passa por
   AuditLog. Venda é disparada automaticamente pelo
   pedidos.html quando pedido vira 'entregue'.

   Movimento:
   {
     id, turnoId, dateKey, type, valor, metodo,
     orderId, descricao, motivo, createdAt,
     createdBy, createdByEmail, createdByRole,
     saldoEsperadoNaHora (para auditoria)
   }

   Tipos: abertura | venda | sangria | reforco |
          ajuste | fechamento
   ============================================ */

const Caixa = (function () {
    'use strict';

    const COLLECTION = 'caixa';

    /* ============================================
       Cálculo de estado do turno
       ============================================ */
    // Data LOCAL (UTC-3 Brasília) — toISOString() em UTC fazia o caixa
    // "rolar" pra amanhã às 21h locais, bloqueando reabertura no dia seguinte.
    function todayKey() {
        const d = new Date();
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
    }

    function turnoIdForDate(dateKey) {
        return 'T-' + (dateKey || todayKey());
    }

    function loadMovements(franchiseId) {
        if (typeof DataStore === 'undefined' || !DataStore.getCollection) return [];
        return DataStore.getCollection(COLLECTION, franchiseId) || [];
    }

    function byDate(moves, dateKey) {
        return moves.filter(m => m.dateKey === dateKey);
    }

    function getTurnoState(franchiseId, dateKey) {
        dateKey = dateKey || todayKey();
        const all = loadMovements(franchiseId);
        const moves = byDate(all, dateKey).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        const abertura = moves.find(m => m.type === 'abertura');
        const fechamento = moves.find(m => m.type === 'fechamento');
        const vendas = moves.filter(m => m.type === 'venda');
        const sangrias = moves.filter(m => m.type === 'sangria');
        const reforcos = moves.filter(m => m.type === 'reforco');
        const ajustes = moves.filter(m => m.type === 'ajuste');

        // Saldo em dinheiro esperado
        const valorAbertura = abertura ? Number(abertura.valor || 0) : 0;
        const vendasDinheiro = vendas
            .filter(m => m.metodo === 'dinheiro')
            .reduce((s, m) => s + Number(m.valor || 0), 0);
        const totalSangria = sangrias.reduce((s, m) => s + Number(m.valor || 0), 0);
        const totalReforco = reforcos.reduce((s, m) => s + Number(m.valor || 0), 0);
        const totalAjuste = ajustes.reduce((s, m) => s + Number(m.valor || 0), 0);

        const saldoEsperadoDinheiro = valorAbertura + vendasDinheiro + totalReforco - totalSangria + totalAjuste;

        // Faturamento bruto (todos os métodos)
        const faturamentoBruto = vendas.reduce((s, m) => s + Number(m.valor || 0), 0);
        const porMetodo = vendas.reduce((acc, m) => {
            const k = m.metodo || 'nao_informado';
            acc[k] = (acc[k] || 0) + Number(m.valor || 0);
            return acc;
        }, {});

        let status;
        if (!abertura) status = 'nao_aberto';
        else if (fechamento) status = 'fechado';
        else status = 'aberto';

        return {
            dateKey: dateKey,
            turnoId: turnoIdForDate(dateKey),
            status: status,
            abertura: abertura || null,
            fechamento: fechamento || null,
            moves: moves,
            vendas: vendas,
            sangrias: sangrias,
            reforcos: reforcos,
            ajustes: ajustes,
            valorAbertura: valorAbertura,
            vendasDinheiro: vendasDinheiro,
            totalSangria: totalSangria,
            totalReforco: totalReforco,
            totalAjuste: totalAjuste,
            saldoEsperadoDinheiro: saldoEsperadoDinheiro,
            faturamentoBruto: faturamentoBruto,
            porMetodo: porMetodo,
            valorContado: fechamento ? Number(fechamento.valor || 0) : null,
            diferenca: fechamento ? (Number(fechamento.valor || 0) - saldoEsperadoDinheiro) : null,
            motivoQuebra: fechamento ? (fechamento.motivo || '') : ''
        };
    }

    function isShiftOpen(franchiseId) {
        return getTurnoState(franchiseId).status === 'aberto';
    }

    /* ============================================
       Criação de movimentos (imutáveis)
       ============================================ */
    function sessionInfo() {
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            const s = Auth.getSession();
            if (s) return { id: s.userId, name: s.name, email: s.email, role: s.role };
        }
        return { id: 'anonymous', name: 'Sistema', email: null, role: null };
    }

    function createMovement(franchiseId, partial) {
        if (typeof DataStore === 'undefined' || !DataStore.addToCollection) {
            return { success: false, error: 'DataStore indisponível.' };
        }
        const now = new Date();
        const dateKey = partial.dateKey || todayKey();
        const user = sessionInfo();
        const state = getTurnoState(franchiseId, dateKey);

        const move = {
            id: (typeof Utils !== 'undefined' ? Utils.generateId() : Date.now().toString(36)),
            turnoId: turnoIdForDate(dateKey),
            dateKey: dateKey,
            type: partial.type,
            valor: Number(partial.valor || 0),
            metodo: partial.metodo || null,
            orderId: partial.orderId || null,
            descricao: partial.descricao || '',
            motivo: partial.motivo || '',
            createdAt: now.toISOString(),
            createdBy: user.id,
            createdByName: user.name,
            createdByEmail: user.email,
            createdByRole: user.role,
            saldoEsperadoAntes: state.saldoEsperadoDinheiro
        };

        DataStore.addToCollection(COLLECTION, franchiseId, move);
        return { success: true, move: move };
    }

    function audit(event, franchiseId, details) {
        try {
            if (typeof AuditLog !== 'undefined' && AuditLog.log) {
                AuditLog.log(event, details || {}, franchiseId);
            }
        } catch (e) {}
    }

    /* ============================================
       API pública — operações
       ============================================ */
    function openShift(franchiseId, valorAbertura) {
        if (!franchiseId) return { success: false, error: 'Franquia inválida.' };
        const st = getTurnoState(franchiseId);
        if (st.status === 'aberto') return { success: false, error: 'Já existe um caixa aberto hoje.' };
        if (st.status === 'fechado') return { success: false, error: 'O caixa de hoje já foi fechado. Peça ao gerente para abrir um novo turno.' };
        if (isNaN(valorAbertura) || valorAbertura < 0) return { success: false, error: 'Valor de abertura inválido.' };

        const r = createMovement(franchiseId, {
            type: 'abertura',
            valor: valorAbertura,
            descricao: 'Abertura de caixa'
        });
        if (!r.success) return r;
        audit(AuditLog.EVENTS.CAIXA_OPENED, franchiseId, { valor: valorAbertura, turnoId: r.move.turnoId });

        if (typeof Motivacional !== 'undefined' && Motivacional.toastCaixaAberto) {
            Motivacional.toastCaixaAberto();
        }
        return r;
    }

    function closeShift(franchiseId, valorContado, motivoQuebra) {
        if (!franchiseId) return { success: false, error: 'Franquia inválida.' };
        const st = getTurnoState(franchiseId);
        if (st.status === 'nao_aberto') return { success: false, error: 'Nenhum caixa aberto hoje.' };
        if (st.status === 'fechado') return { success: false, error: 'O caixa de hoje já foi fechado.' };

        // REGRA DE SEGURANÇA: Bloquear se houver pedidos pendentes (Fase 2)
        // Considera SOMENTE pedidos do dia atual em estados ativos do kanban.
        // 'aguardando_pagamento' (delivery legado) não bloqueia — cliente não pagou.
        // Pedidos antigos (>24h) também não bloqueiam — provavelmente abandonados.
        const orders = DataStore.getCollection('orders', franchiseId) || [];
        const today = new Date().toISOString().slice(0,10);
        const pendingOrders = orders.filter(o => {
            if (o.status === 'entregue' || o.status === 'cancelado') return false;
            if (o.status === 'aguardando_pagamento') return false;
            if (o.createdAt && o.createdAt.slice(0,10) !== today) return false;
            return true;
        });
        if (pendingOrders.length > 0) {
            return {
                success: false,
                error: `⚠️ Não é possível fechar o caixa. Existem ${pendingOrders.length} pedido(s) ativo(s) HOJE. Finalize ou cancele antes.`
            };
        }

        // REGRA DE SEGURANÇA: Bloquear se houver comandas/contas abertas
        const openTabs = DataStore.get('open_tabs_' + franchiseId) || [];
        if (openTabs.length > 0) {
            return { 
                success: false, 
                error: `⚠️ Existem ${openTabs.length} conta(s) aberta(s). Feche todas antes de encerrar o turno.` 
            };
        }

        if (isNaN(valorContado) || valorContado < 0) return { success: false, error: 'Valor contado inválido.' };

        const diff = valorContado - st.saldoEsperadoDinheiro;
        if (Math.abs(diff) > 5 && !(motivoQuebra && motivoQuebra.trim())) {
            return { success: false, error: '⚠️ Diferença maior que R$ 5,00 exige justificativa obrigatória.', diff: diff, esperado: st.saldoEsperadoDinheiro };
        }

        const r = createMovement(franchiseId, {
            type: 'fechamento',
            valor: valorContado,
            descricao: 'Fechamento de caixa · esperado ' + formatBRL(st.saldoEsperadoDinheiro),
            motivo: motivoQuebra || ''
        });
        if (!r.success) return r;
        audit(AuditLog.EVENTS.CAIXA_CLOSED, franchiseId, {
            valorContado: valorContado,
            saldoEsperado: st.saldoEsperadoDinheiro,
            diferenca: diff,
            motivo: motivoQuebra || ''
        });

        if (typeof Motivacional !== 'undefined' && Motivacional.toastCaixaFechado) {
            Motivacional.toastCaixaFechado();
        }

        // Trigger Automated Report via Cloud Functions
        try {
            if (typeof CloudFunctions !== 'undefined' && CloudFunctions.sendClosingReport) {
                const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
                CloudFunctions.sendClosingReport(franchiseId, {
                    operatorName: session ? session.name : 'Operador Desconhecido',
                    operatorEmail: session ? session.email : '',
                    valorContado: valorContado,
                    saldoEsperado: st.saldoEsperadoDinheiro,
                    diferenca: diff,
                    motivo: motivoQuebra,
                    fechamentoDate: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error('Falha ao acionar CloudFunctions (sendClosingReport):', e);
        }

        return Object.assign({}, r, { diff: diff, esperado: st.saldoEsperadoDinheiro });
    }

    function registerSale(franchiseId, order) {
        if (!franchiseId || !order) return { success: false, error: 'Dados inválidos.' };
        // Evita duplicidade: se já existe venda com este orderId, ignora
        const existing = loadMovements(franchiseId).find(m => m.type === 'venda' && m.orderId === order.id);
        if (existing) return { success: true, move: existing, alreadyRegistered: true };

        const metodo = normalizeMetodo(order.payment);
        const st = getTurnoState(franchiseId);
        if (st.status !== 'aberto') {
            // registra mesmo assim, mas sinaliza
            const r = createMovement(franchiseId, {
                type: 'venda',
                valor: Number(order.total || 0),
                metodo: metodo,
                orderId: order.id,
                descricao: 'Venda pedido #' + String(order.id).slice(-6) + ' (caixa não aberto)',
                motivo: 'Pedido entregue fora de turno aberto'
            });
            audit(AuditLog.EVENTS.CAIXA_SALE, franchiseId, {
                orderId: order.id, valor: order.total, metodo: metodo,
                warn: 'caixa_nao_aberto'
            });
            return Object.assign({}, r, { warn: 'caixa_nao_aberto' });
        }

        const r = createMovement(franchiseId, {
            type: 'venda',
            valor: Number(order.total || 0),
            metodo: metodo,
            orderId: order.id,
            descricao: 'Venda pedido #' + String(order.id).slice(-6)
        });
        audit(AuditLog.EVENTS.CAIXA_SALE, franchiseId, {
            orderId: order.id, valor: order.total, metodo: metodo
        });
        return r;
    }

    function registerSangria(franchiseId, valor, motivo) {
        const st = getTurnoState(franchiseId);
        if (st.status !== 'aberto') return { success: false, error: 'Abra o caixa antes de lançar uma sangria.' };
        if (isNaN(valor) || valor <= 0) return { success: false, error: 'Valor inválido.' };
        if (!motivo || !motivo.trim()) return { success: false, error: 'Motivo obrigatório.' };
        if (valor > st.saldoEsperadoDinheiro) return { success: false, error: 'Sangria maior que o saldo em dinheiro esperado (' + formatBRL(st.saldoEsperadoDinheiro) + ').' };

        const r = createMovement(franchiseId, {
            type: 'sangria',
            valor: valor,
            descricao: 'Sangria · ' + motivo,
            motivo: motivo
        });
        audit(AuditLog.EVENTS.CAIXA_SANGRIA, franchiseId, { valor: valor, motivo: motivo });
        return r;
    }

    function registerReforco(franchiseId, valor, motivo) {
        const st = getTurnoState(franchiseId);
        if (st.status !== 'aberto') return { success: false, error: 'Abra o caixa antes de lançar um reforço.' };
        if (isNaN(valor) || valor <= 0) return { success: false, error: 'Valor inválido.' };

        const r = createMovement(franchiseId, {
            type: 'reforco',
            valor: valor,
            descricao: 'Reforço · ' + (motivo || 'Troco'),
            motivo: motivo || ''
        });
        audit(AuditLog.EVENTS.CAIXA_REFORCO, franchiseId, { valor: valor, motivo: motivo || '' });
        return r;
    }

    function registerAjuste(franchiseId, valor, motivo) {
        // Somente super_admin / manager pode ajustar
        const user = sessionInfo();
        const allowedRoles = ['super_admin', 'manager', 'franchisee'];
        if (allowedRoles.indexOf(user.role) === -1) return { success: false, error: 'Sem permissão para ajuste.' };
        if (!motivo || !motivo.trim()) return { success: false, error: 'Motivo obrigatório para ajuste.' };
        if (isNaN(valor)) return { success: false, error: 'Valor inválido.' };

        const r = createMovement(franchiseId, {
            type: 'ajuste',
            valor: valor,
            descricao: 'Ajuste · ' + motivo,
            motivo: motivo
        });
        audit(AuditLog.EVENTS.CAIXA_AJUSTE, franchiseId, { valor: valor, motivo: motivo });
        return r;
    }

    /* ============================================
       UI — modais próprios (sem prompt())
       ============================================ */
    function ensureModalStyles() {
        if (document.getElementById('caixaModalStyles')) return;
        const css = `
.caixa-modal-overlay { position: fixed; inset: 0; background: rgba(45,27,78,0.55); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 16px; animation: caixaFadeIn .18s ease-out; }
.caixa-modal { background: #fff; border-radius: 16px; max-width: 440px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.25); overflow: hidden; animation: caixaSlideUp .2s ease-out; }
.caixa-modal-header { padding: 18px 22px; background: linear-gradient(135deg,#E91E63,#D4A5FF); color: #fff; display: flex; justify-content: space-between; align-items: center; }
.caixa-modal-header h3 { margin: 0; font-size: 1.05rem; font-family: 'Baloo 2', cursive; font-weight: 700; }
.caixa-modal-close { background: rgba(255,255,255,.2); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px; }
.caixa-modal-body { padding: 20px 22px; }
.caixa-modal-body label { display: block; font-size: .8rem; font-weight: 600; color: #555; margin-bottom: 6px; margin-top: 12px; }
.caixa-modal-body label:first-child { margin-top: 0; }
.caixa-modal-body input, .caixa-modal-body select, .caixa-modal-body textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; font-family: inherit; box-sizing: border-box; }
.caixa-modal-body input:focus, .caixa-modal-body select:focus, .caixa-modal-body textarea:focus { outline: none; border-color: #E91E63; }
.caixa-modal-body textarea { min-height: 70px; resize: vertical; }
.caixa-modal-body .caixa-brl { font-size: 1.5rem; text-align: center; font-weight: 700; color: #2E7D32; }
.caixa-modal-body .caixa-info { background: #F8F9FA; border-left: 3px solid #E91E63; padding: 10px 12px; border-radius: 8px; font-size: .85rem; color: #555; margin-top: 10px; }
.caixa-modal-body .caixa-warn { background: #FFF3CD; border-left: 3px solid #F59E0B; padding: 10px 12px; border-radius: 8px; font-size: .85rem; color: #92400E; margin-top: 10px; }
.caixa-modal-body .caixa-danger { background: #FEE2E2; border-left: 3px solid #DC2626; padding: 10px 12px; border-radius: 8px; font-size: .85rem; color: #991B1B; margin-top: 10px; }
.caixa-modal-footer { display: flex; gap: 10px; padding: 14px 22px; border-top: 1px solid #eee; background: #fafafa; }
.caixa-modal-footer button { flex: 1; padding: 11px 16px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; font-size: .92rem; }
.caixa-modal-footer .caixa-btn-primary { background: #E91E63; color: #fff; }
.caixa-modal-footer .caixa-btn-danger { background: #DC2626; color: #fff; }
.caixa-modal-footer .caixa-btn-secondary { background: #eee; color: #333; }
@keyframes caixaFadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes caixaSlideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
`;
        const style = document.createElement('style');
        style.id = 'caixaModalStyles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function openModal(html, onConfirm) {
        ensureModalStyles();
        const overlay = document.createElement('div');
        overlay.className = 'caixa-modal-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        overlay.querySelectorAll('[data-caixa-close]').forEach(el => el.addEventListener('click', close));

        const firstInput = overlay.querySelector('input[data-caixa-brl], input[type="text"], select, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 50);

        // máscara BRL
        overlay.querySelectorAll('input[data-caixa-brl]').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const digits = (e.target.value || '').replace(/\D/g, '');
                const cents = parseInt(digits || '0', 10);
                const reais = cents / 100;
                e.target.value = formatBRL(reais);
            });
            if (!inp.value) inp.value = formatBRL(0);
        });

        const confirmBtn = overlay.querySelector('[data-caixa-confirm]');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const data = {};
                overlay.querySelectorAll('[data-name]').forEach(el => {
                    const name = el.dataset.name;
                    let v = el.value;
                    if (el.dataset.caixaBrl !== undefined) v = parseBRL(v);
                    data[name] = v;
                });
                const res = onConfirm && onConfirm(data);
                if (res !== false) close();
            });
        }

        return { close: close, overlay: overlay };
    }

    function showOpenModal(franchiseId, cb) {
        // Se houver checklist configurado e ainda não executado hoje, exibe antes
        if (shouldShowChecklist('abertura', franchiseId)) {
            return showChecklistModal(franchiseId, 'abertura', () => {
                showOpenModal(franchiseId, cb);
            });
        }

        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Abrir caixa">
              <div class="caixa-modal-header">
                <h3>💰 Abrir caixa</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <label>Valor de abertura (troco inicial)</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric" placeholder="R$ 0,00">
                <div class="caixa-info">💡 Registre o valor em dinheiro no caixa antes de começar o turno. Esse será o saldo inicial para conferência no fechamento.</div>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Abrir caixa</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            const r = openShift(franchiseId, data.valor);
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error;
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
    }

    function shouldShowChecklist(phase, franchiseId) {
        if (typeof AdminConfig === 'undefined') return false;
        const tpls = AdminConfig.getChecklistTemplates(franchiseId);
        if (!tpls[phase] || tpls[phase].length === 0) return false;
        const exec = AdminConfig.getTodayChecklistExec(franchiseId, phase);
        return !exec; // só mostra se ainda não foi executado hoje
    }

    function showChecklistModal(franchiseId, phase, onDone) {
        const tpls = AdminConfig.getChecklistTemplates(franchiseId);
        const items = (tpls[phase] || []).map(i => Object.assign({}, i, { done: false }));
        const isAbertura = phase === 'abertura';
        const headerGradient = isAbertura
            ? 'linear-gradient(135deg,#10B981,#059669)'
            : 'linear-gradient(135deg,#DC2626,#991B1B)';
        const headerIcon = isAbertura ? '🟢' : '🔴';
        const headerTitle = isAbertura ? 'Checklist de abertura' : 'Checklist de fechamento';

        const rowsHtml = items.map((it, i) => `
            <label style="display:flex;gap:10px;padding:10px 12px;align-items:center;background:#FAFAFA;border:1px solid #eee;border-radius:8px;margin-bottom:6px;cursor:pointer">
              <input type="checkbox" data-idx="${i}" ${it.required ? 'data-required="1"' : ''} style="width:18px;height:18px;cursor:pointer">
              <span style="flex:1">${(typeof Utils !== 'undefined' && Utils.escapeHtml) ? Utils.escapeHtml(it.text) : it.text}${it.required ? ' <small style="color:#DC2626">*</small>' : ''}</span>
            </label>
        `).join('');

        const html = `
            <div class="caixa-modal" role="dialog" style="max-width:520px">
              <div class="caixa-modal-header" style="background:${headerGradient}">
                <h3>${headerIcon} ${headerTitle}</h3>
                <button class="caixa-modal-close" data-caixa-close>✕</button>
              </div>
              <div class="caixa-modal-body">
                <div class="caixa-info">Marque o que já foi feito. Itens com <strong style="color:#DC2626">*</strong> são obrigatórios e ficam registrados na auditoria.</div>
                <div style="margin-top:12px" id="checklistItems">${rowsHtml}</div>
                <div class="caixa-warn" data-checklist-warn style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" id="checklistConfirmBtn">Continuar</button>
              </div>
            </div>`;

        ensureModalStyles();
        const overlay = document.createElement('div');
        overlay.className = 'caixa-modal-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        overlay.querySelectorAll('[data-caixa-close]').forEach(el => el.addEventListener('click', close));
        overlay.querySelector('#checklistConfirmBtn').addEventListener('click', () => {
            const boxes = Array.from(overlay.querySelectorAll('#checklistItems input[type=checkbox]'));
            const result = boxes.map((b, i) => Object.assign({}, items[i], { done: b.checked }));
            const missingRequired = result.filter(r => r.required && !r.done);
            
            if (missingRequired.length > 0) {
                const warn = overlay.querySelector('[data-checklist-warn]');
                warn.innerHTML = '⚠️ Faltam itens obrigatórios: <strong>' + missingRequired.map(r => r.text).join(', ') + '</strong>.';
                warn.style.display = 'block';
                
                const userSession = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
                const role = userSession ? userSession.role : 'operator';
                
                if (role !== 'super_admin' && role !== 'franchisee' && role !== 'manager') {
                    alert('❌ AÇÃO BLOQUEADA\nVocê não concluiu todos os itens obrigatórios do checklist. Apenas o gerente pode forçar este avanço.');
                    return;
                } else {
                    const justificativa = prompt('⚠️ AUTORIZAÇÃO DE GERÊNCIA\n\nExistem ' + missingRequired.length + ' item(ns) obrigatório(s) pendente(s).\n\nInforme o motivo para forçar o fechamento/avanço:');
                    if (!justificativa || justificativa.trim().length < 3) {
                        alert('Justificativa obrigatória cancelada.');
                        return;
                    }
                    if (typeof AuditLog !== 'undefined') {
                        AuditLog.log('CHECKLIST_BYPASSED', { phase, justificativa, missingCount: missingRequired.length, missingItems: missingRequired.map(r => r.text) }, franchiseId);
                    }
                }
            }
            AdminConfig.recordChecklistExec(franchiseId, phase, result);
            close();
            if (onDone) onDone();
        });
    }

    function showCloseModal(franchiseId, cb) {
        // Checklist de fechamento antes do modal de valor
        if (shouldShowChecklist('fechamento', franchiseId)) {
            return showChecklistModal(franchiseId, 'fechamento', () => {
                showCloseModal(franchiseId, cb);
            });
        }

        const st = getTurnoState(franchiseId);
        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Fechar caixa">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#DC2626,#F59E0B)">
                <h3>🔒 Fechar caixa</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <div class="caixa-info">
                  Abertura: <strong>${formatBRL(st.valorAbertura)}</strong><br>
                  Vendas em dinheiro: <strong>${formatBRL(st.vendasDinheiro)}</strong><br>
                  Reforços: <strong>${formatBRL(st.totalReforco)}</strong><br>
                  Sangrias: <strong>-${formatBRL(st.totalSangria)}</strong><br>
                  <hr style="border:none;border-top:1px solid #ddd;margin:6px 0">
                  Saldo esperado em dinheiro: <strong style="color:#2E7D32">${formatBRL(st.saldoEsperadoDinheiro)}</strong>
                </div>
                <label>Valor real contado no caixa</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric" placeholder="R$ 0,00">
                <label>Justificativa (obrigatória se diferença &gt; R$ 5)</label>
                <textarea data-name="motivo" placeholder="Ex: troco dado a mais, erro de conferência..."></textarea>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-danger" data-caixa-confirm>Fechar caixa</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            const r = closeShift(franchiseId, data.valor, data.motivo);
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error + (r.esperado !== undefined ? ' (esperado ' + formatBRL(r.esperado) + ', diferença ' + formatBRL(r.diff) + ')' : '');
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
    }

    function showSangriaModal(franchiseId, cb) {
        const st = getTurnoState(franchiseId);
        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Sangria">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#F59E0B,#D97706)">
                <h3>📤 Sangria (retirada)</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <div class="caixa-info">Saldo em dinheiro disponível: <strong>${formatBRL(st.saldoEsperadoDinheiro)}</strong></div>
                <label>Valor retirado</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric">
                <label>Motivo (obrigatório)</label>
                <textarea data-name="motivo" placeholder="Ex: depósito banco, pagamento fornecedor X, troco para caixa auxiliar..."></textarea>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Registrar sangria</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            const r = registerSangria(franchiseId, data.valor, data.motivo);
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error;
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
    }

    function showReforcoModal(franchiseId, cb) {
        const html = `
            <div class="caixa-modal" role="dialog" aria-label="Reforço">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#10B981,#059669)">
                <h3>📥 Reforço (aporte)</h3>
                <button class="caixa-modal-close" data-caixa-close aria-label="Fechar">✕</button>
              </div>
              <div class="caixa-modal-body">
                <label>Valor aportado</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric">
                <label>Motivo</label>
                <textarea data-name="motivo" placeholder="Ex: troco adicional, suprimento de caixa..."></textarea>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Registrar reforço</button>
              </div>
            </div>`;
        const modal = openModal(html, (data) => {
            const r = registerReforco(franchiseId, data.valor, data.motivo);
            if (!r.success) {
                const err = modal.overlay.querySelector('[data-caixa-error]');
                err.textContent = r.error;
                err.style.display = 'block';
                return false;
            }
            if (cb) cb(r);
        });
    }

    /* ============================================
       Widget de dashboard
       ============================================ */
    function renderWidget(franchiseId) {
        const st = getTurnoState(franchiseId);

        const statusStyles = {
            aberto: { color: '#10B981', label: 'Caixa aberto' },
            fechado: { color: '#2196F3', label: 'Fechado hoje' },
            nao_aberto: { color: '#9E9E9E', label: 'Caixa fechado' }
        };
        const s = statusStyles[st.status];

        const hrIn = st.abertura ? formatHM(st.abertura.createdAt) : '—';
        const hrOut = st.fechamento ? formatHM(st.fechamento.createdAt) : '—';

        let actionBtns;
        if (st.status === 'nao_aberto') {
            actionBtns = `<button class="btn btn-primary btn-sm" onclick="Caixa.showOpenModal(Caixa._fid(), Caixa.refreshWidget)">🟢 Abrir caixa</button>`;
        } else if (st.status === 'aberto') {
            actionBtns = `
                <button class="btn btn-sm" style="background:#10B981;color:#fff" onclick="Caixa.showReforcoModal(Caixa._fid(), Caixa.refreshWidget)">📥 Reforço</button>
                <button class="btn btn-sm" style="background:#F59E0B;color:#fff" onclick="Caixa.showSangriaModal(Caixa._fid(), Caixa.refreshWidget)">📤 Sangria</button>
                <button class="btn btn-sm" style="background:#DC2626;color:#fff" onclick="Caixa.showCloseModal(Caixa._fid(), Caixa.refreshWidget)">🔒 Fechar caixa</button>`;
        } else {
            const diffColor = Math.abs(st.diferenca || 0) < 0.01 ? '#10B981' : '#DC2626';
            actionBtns = `<span style="color:${diffColor};font-weight:700">Diferença: ${formatBRL(st.diferenca)}</span>`;
        }

        const porMetodoHtml = Object.keys(st.porMetodo).length > 0
            ? Object.entries(st.porMetodo).map(([k, v]) =>
                `<span style="display:inline-block;margin:0 10px 4px 0;font-size:.78rem;color:#555">${metodoIcon(k)} ${metodoLabel(k)}: <strong>${formatBRL(v)}</strong></span>`
              ).join('')
            : '<span style="font-size:.8rem;color:#999">Nenhuma venda registrada ainda</span>';

        return `
            <div id="caixaWidget" class="panel-card" style="margin-bottom:20px">
              <div class="panel-card-header">
                <h3>💰 Caixa de Hoje</h3>
                <span class="status-badge" style="background:${s.color}15;color:${s.color};border:1px solid ${s.color}30">${s.label}</span>
              </div>
              <div class="panel-card-body">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:14px">
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Abertura</div>
                    <div style="font-weight:700">${hrIn} · ${formatBRL(st.valorAbertura)}</div>
                  </div>
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Faturamento</div>
                    <div style="font-weight:700;color:#2E7D32">${formatBRL(st.faturamentoBruto)}</div>
                  </div>
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Saldo em dinheiro</div>
                    <div style="font-weight:700;color:#E91E63">${formatBRL(st.saldoEsperadoDinheiro)}</div>
                  </div>
                  <div>
                    <div style="font-size:.72rem;color:var(--mp-text-light);text-transform:uppercase;letter-spacing:.5px">Fechamento</div>
                    <div style="font-weight:700">${hrOut}${st.fechamento ? ' · ' + formatBRL(st.valorContado) : ''}</div>
                  </div>
                </div>
                <div style="padding-top:12px;border-top:1px dashed #eee;margin-bottom:12px">
                  ${porMetodoHtml}
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">
                  ${actionBtns}
                </div>
              </div>
            </div>`;
    }

    function refreshWidget() {
        const el = document.getElementById('caixaWidget');
        if (!el) return;
        const fid = _fid();
        if (!fid) return;
        el.outerHTML = renderWidget(fid);
    }

    function _fid() {
        if (typeof Auth !== 'undefined' && Auth.getSession) {
            const s = Auth.getSession();
            return s ? s.franchiseId : null;
        }
        return null;
    }

    function initPanel() {
        const mount = document.getElementById('caixaMount');
        if (!mount) return;
        const fid = _fid();
        if (!fid) return;
        mount.innerHTML = renderWidget(fid);
    }

    /* ============================================
       Helpers
       ============================================ */
    function formatBRL(v) {
        const n = Number(v || 0);
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        return sign + 'R$ ' + abs.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function parseBRL(s) {
        if (typeof s !== 'string') return Number(s) || 0;
        const digits = s.replace(/\D/g, '');
        if (!digits) return 0;
        return parseInt(digits, 10) / 100;
    }

    function formatHM(iso) {
        try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
        catch (e) { return '—'; }
    }

    function normalizeMetodo(p) {
        if (!p) return 'nao_informado';
        const v = String(p).toLowerCase().trim();
        if (v.includes('pix')) return 'pix';
        if (v.includes('din')) return 'dinheiro';
        if (v.includes('cred')) return 'credito';
        if (v.includes('deb')) return 'debito';
        return v;
    }

    function metodoLabel(k) {
        const map = { pix: 'PIX', dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito', nao_informado: 'Não informado' };
        return map[k] || k;
    }

    function metodoIcon(k) {
        const map = { pix: '⚡', dinheiro: '💵', credito: '💳', debito: '💳', nao_informado: '❓' };
        return map[k] || '💰';
    }

    /* ============================================
       API pública
       ============================================ */
    return {
        // Leitura
        getTurnoState: getTurnoState,
        isShiftOpen: isShiftOpen,
        loadMovements: loadMovements,
        // Operações
        openShift: openShift,
        closeShift: closeShift,
        registerSale: registerSale,
        registerSangria: registerSangria,
        registerReforco: registerReforco,
        registerAjuste: registerAjuste,
        // Modais
        showOpenModal: showOpenModal,
        showCloseModal: showCloseModal,
        showSangriaModal: showSangriaModal,
        showReforcoModal: showReforcoModal,
        showChecklistModal: showChecklistModal,
        // Widget
        renderWidget: renderWidget,
        refreshWidget: refreshWidget,
        initPanel: initPanel,
        // Utils
        formatBRL: formatBRL,
        parseBRL: parseBRL,
        _fid: _fid
    };
})();

// Expose globally for browser (const is script-scoped, not a window property)
if (typeof window !== 'undefined') window.Caixa = Caixa;
if (typeof globalThis !== 'undefined') globalThis.Caixa = Caixa;
