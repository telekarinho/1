/* ============================================
   MilkyPot - Finance OS · UI Renderer
   ============================================
   Injeta a seção do Finance OS no topo de
   painel/financeiro.html. Controlada por
   FinanceOSUI.init({ franchiseId }).
   ============================================ */

const FinanceOSUI = (function () {
    'use strict';

    let _fid = null;
    let _currentPK = null;

    function init(opts) {
        opts = opts || {};
        _fid = opts.franchiseId || (typeof Auth !== 'undefined' ? Auth.getSession()?.franchiseId : null);
        if (!_fid) return;
        _currentPK = opts.periodKey || Financas.currentPeriodKey();
        ensureStyles();
        render();
    }

    function setPeriod(pk) {
        _currentPK = pk;
        render();
    }

    function render() {
        const mount = document.getElementById('financeOSMount');
        if (!mount) return;
        const meta = Financas.getPeriodMeta(_fid, _currentPK);
        const dre = Financas.computeDRE(_fid, _currentPK);
        const rel = Financas.reliabilityScore(_fid, _currentPK);
        const health = Financas.computeHealthScore(_fid, _currentPK);

        mount.innerHTML = `
            ${renderInterventionBanner(health)}
            ${renderHeader(meta, dre, rel, health)}
            ${renderHealthCard(health)}
            ${renderDRE(dre)}
            ${renderPendencias(dre.pendencias)}
            <div class="fos-grid-2">
              ${renderCostsCard('fixed', dre)}
              ${renderCostsCard('variable', dre)}
            </div>
            ${renderHistory()}
            ${renderRecurring()}
            ${renderSnapshots()}
        `;
    }

    /* ---- Banner de intervenção (score < 40) ---- */
    function renderInterventionBanner(health) {
        if (health.score >= 40) return '';
        return `
            <div style="background:linear-gradient(135deg,#7F1D1D,#991B1B);color:#fff;border-radius:14px;padding:18px 22px;margin-bottom:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div style="font-size:42px;line-height:1">🚨</div>
              <div style="flex:1;min-width:240px">
                <div style="font-weight:800;font-size:1.1rem;margin-bottom:4px">Intervenção imediata necessária</div>
                <div style="opacity:.9;font-size:.9rem">Score de saúde: <strong>${health.score}/100</strong>. Esta franquia está em risco operacional crítico. Revise custos fixos, eficiência e previsibilidade urgentemente.</div>
              </div>
              <div style="background:rgba(255,255,255,.15);padding:10px 18px;border-radius:10px;text-align:center">
                <div style="font-size:.7rem;opacity:.75;letter-spacing:.5px">SCORE</div>
                <div style="font-size:2rem;font-weight:800">${health.score}</div>
              </div>
            </div>
        `;
    }

    /* ---- Header ---- */
    function renderHeader(meta, dre, rel, health) {
        const closed = !!(meta && meta.status === 'fechado');
        const periodOptions = buildPeriodOptions();
        const statusBadge = closed
            ? `<span class="fos-badge fos-badge-red">🔒 Fechado em ${formatDate(meta.closedAt)} por ${esc(meta.closedByName || '—')}</span>`
            : `<span class="fos-badge fos-badge-green">🟢 Em aberto</span>`;
        const reliabilityColor = rel.score >= 80 ? '#10B981' : rel.score >= 50 ? '#F59E0B' : '#DC2626';

        return `
            <div class="panel-card fos-header">
              <div class="panel-card-body" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;justify-content:space-between">
                <div style="flex:1;min-width:240px">
                  <div style="font-size:.72rem;color:#777;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">Finance OS · Saúde da franquia</div>
                  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <select onchange="FinanceOSUI.setPeriod(this.value)" class="fos-select">${periodOptions}</select>
                    ${statusBadge}
                  </div>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                  <div class="fos-reliability" title="Confiabilidade dos dados — quanto dos obrigatórios está preenchido">
                    <div style="font-size:.7rem;color:#888;text-transform:uppercase;letter-spacing:.5px">Confiabilidade</div>
                    <div style="font-size:1.5rem;font-weight:800;color:${reliabilityColor}">${rel.score}%</div>
                  </div>
                  ${renderHeaderActions(closed)}
                </div>
              </div>
            </div>
        `;
    }

    function renderHeaderActions(closed) {
        if (closed) {
            const role = sessionRole();
            if (role === 'super_admin') {
                return `
                    <button class="btn btn-sm" style="background:#F59E0B;color:#fff" onclick="FinanceOSUI.reopenPeriod()">🔓 Reabrir período</button>
                    <button class="btn btn-sm btn-outline" onclick="FinanceOSUI.showRetifyModal()">📝 Retificar</button>
                `;
            }
            return `<span style="font-size:.8rem;color:#888">Somente super_admin pode retificar.</span>`;
        }
        return `
            <button class="btn btn-sm btn-outline" onclick="FinanceOSUI.generateRecurring()">🔁 Gerar recorrentes</button>
            <button class="btn btn-sm" style="background:#DC2626;color:#fff" onclick="FinanceOSUI.confirmClose()">🔒 Fechar mês</button>
        `;
    }

    /* ---- Health Score Card (5 pilares) ---- */
    function renderHealthCard(health) {
        const color = Financas.scoreColor(health.score);
        const label = Financas.scoreLabel(health.score);
        const pillarsKeys = ['liquidez', 'rentabilidade', 'eficiencia', 'previsibilidade', 'disciplina'];

        const pillarsHtml = pillarsKeys.map(k => {
            const v = health.pillars[k] || 0;
            const c = v >= 75 ? '#10B981' : v >= 50 ? '#F59E0B' : '#DC2626';
            const weight = Math.round(Financas.pillarWeight(k) * 100);
            return `
                <div class="fos-pillar">
                  <div class="fos-pillar-head">
                    <span class="fos-pillar-name">${esc(Financas.pillarLabel(k))}</span>
                    <span class="fos-pillar-weight">peso ${weight}%</span>
                  </div>
                  <div class="fos-pillar-bar"><div class="fos-pillar-fill" style="width:${v}%;background:${c}"></div></div>
                  <div class="fos-pillar-foot">
                    <span style="color:${c};font-weight:800">${v}</span>
                    <span class="fos-pillar-hint">${esc(Financas.pillarHint(k))}</span>
                  </div>
                </div>
            `;
        }).join('');

        return `
            <div class="panel-card fos-health">
              <div class="panel-card-header">
                <h3>❤️‍🩹 Saúde da Franquia</h3>
                <span style="font-size:.8rem;color:#666">cálculo ponderado · atualizado em tempo real</span>
              </div>
              <div class="panel-card-body">
                <div class="fos-health-top">
                  <div class="fos-health-ring" style="background:conic-gradient(${color} ${health.score * 3.6}deg, #EEE 0deg)">
                    <div class="fos-health-ring-inner">
                      <div style="font-size:2.4rem;font-weight:800;color:${color};line-height:1">${health.score}</div>
                      <div style="font-size:.7rem;color:#777;letter-spacing:.4px;text-transform:uppercase">/ 100</div>
                    </div>
                  </div>
                  <div style="flex:1;min-width:200px">
                    <div style="font-size:.7rem;color:#777;letter-spacing:.5px;text-transform:uppercase">Classificação</div>
                    <div style="font-size:1.3rem;font-weight:800;color:${color};margin-bottom:6px">${esc(label)}</div>
                    <div style="font-size:.82rem;color:#555">Caixa estimado: <strong>${Financas.formatBRL(health.cashBalance)}</strong> · Confiabilidade dos dados: <strong>${health.reliability}%</strong></div>
                  </div>
                </div>
                <div class="fos-pillars-grid">${pillarsHtml}</div>
              </div>
            </div>
        `;
    }

    /* ---- Histórico mês-a-mês ---- */
    function renderHistory() {
        const hist = Financas.healthHistory(_fid, 6);
        if (!hist || hist.length === 0) return '';
        const maxAbs = Math.max(1, ...hist.map(h => Math.abs(h.resultado)));

        const bars = hist.map(h => {
            const color = Financas.scoreColor(h.score);
            const resultColor = h.resultado >= 0 ? '#10B981' : '#DC2626';
            const resultPct = Math.min(100, Math.round((Math.abs(h.resultado) / maxAbs) * 100));
            const isCurrent = h.periodKey === _currentPK;
            return `
                <div class="fos-hist-bar ${isCurrent ? 'fos-hist-current' : ''}" onclick="FinanceOSUI.setPeriod('${h.periodKey}')">
                  <div class="fos-hist-score" style="background:${color}">${h.score}</div>
                  <div class="fos-hist-meta">
                    <div class="fos-hist-label">${esc(h.label.split(' de ')[0])}</div>
                    <div class="fos-hist-result" style="color:${resultColor}">${Financas.formatBRL(h.resultado)}</div>
                    <div class="fos-hist-receita">receita ${Financas.formatBRL(h.receita)}</div>
                  </div>
                  <div class="fos-hist-status">${h.fromSnapshot ? '🔒' : (isCurrent ? '🟢' : '⏳')}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="panel-card">
              <div class="panel-card-header">
                <h3>📈 Evolução da saúde · últimos 6 meses</h3>
                <span style="font-size:.8rem;color:#666">clique em um período para ver</span>
              </div>
              <div class="panel-card-body">
                <div class="fos-hist-grid">${bars}</div>
              </div>
            </div>
        `;
    }

    /* ---- DRE ---- */
    function renderDRE(dre) {
        const fmt = Financas.formatBRL;
        const pct = Financas.formatPct;
        const resultColor = dre.resultadoOperacional >= 0 ? '#10B981' : '#DC2626';

        return `
            <div class="panel-card">
              <div class="panel-card-header">
                <h3>📊 DRE · ${esc(dre.periodLabel)}</h3>
                <span style="font-size:.8rem;color:#666">${dre.salesCount} venda(s) · ${dre.itensSemCusto} item(ns) sem custo</span>
              </div>
              <div class="panel-card-body">
                <div class="fos-dre">
                  ${dreRow('Receita bruta', dre.receitaBruta, 'sum', '')}
                  ${dreRow('(−) Impostos', -dre.impostos, 'sub', '')}
                  ${dreRow('Receita líquida', dre.receitaLiquida, 'total', '')}
                  ${dreRow('(−) CMV (custo da mercadoria)', -dre.cmv, 'sub', 'cobertura ' + pct(dre.cmvCobertura))}
                  ${dreRow('Lucro bruto', dre.lucroBruto, 'total', '')}
                  ${dreRow('(−) Despesas variáveis (ex-impostos)', -dre.variaveisSemImpostos, 'sub', '')}
                  ${dreRow('Margem de contribuição', dre.margemContribuicao, 'total', dre.receitaLiquida > 0 ? 'MC% ' + pct(dre.mcPercent) : '')}
                  ${dreRow('(−) Custos fixos', -dre.totalFixed, 'sub', '')}
                  ${dreRow('Resultado operacional', dre.resultadoOperacional, 'result', '', resultColor)}
                </div>

                <div class="fos-kpi-row">
                  <div class="fos-kpi">
                    <div class="fos-kpi-label">Venda mínima mensal</div>
                    <div class="fos-kpi-value">${fmt(dre.breakEven)}</div>
                  </div>
                  <div class="fos-kpi">
                    <div class="fos-kpi-label">Venda mínima diária</div>
                    <div class="fos-kpi-value">${fmt(dre.vendaMinimaDiaria)}</div>
                  </div>
                  <div class="fos-kpi">
                    <div class="fos-kpi-label">Margem contribuição</div>
                    <div class="fos-kpi-value">${dre.receitaLiquida > 0 ? pct(dre.mcPercent) : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
        `;
    }

    function dreRow(label, valor, variant, hint, color) {
        const classes = {
            sum: 'fos-dre-sum',
            sub: 'fos-dre-sub',
            total: 'fos-dre-total',
            result: 'fos-dre-result'
        };
        const style = color ? `style="color:${color}"` : '';
        return `
            <div class="fos-dre-row ${classes[variant] || ''}" ${style}>
              <div>${esc(label)} ${hint ? `<small style="opacity:.6;margin-left:6px">${esc(hint)}</small>` : ''}</div>
              <div>${Financas.formatBRL(valor)}</div>
            </div>
        `;
    }

    /* ---- Pendências ---- */
    function renderPendencias(pends) {
        if (!pends || pends.length === 0) {
            return `<div class="panel-card"><div class="panel-card-body" style="color:#10B981;font-weight:600">✅ Sem pendências · dados completos para este período</div></div>`;
        }
        const items = pends.map(p => `
            <li style="margin-bottom:6px;padding:8px 12px;background:${p.severity === 'high' ? '#FEE2E2' : '#FEF3C7'};border-radius:8px;font-size:.88rem;color:${p.severity === 'high' ? '#991B1B' : '#92400E'}">
              ${p.severity === 'high' ? '🔴' : '🟡'} ${esc(p.label)}
            </li>`).join('');
        return `
            <div class="panel-card">
              <div class="panel-card-header"><h3>⚠️ Pendências do período</h3><span style="font-size:.8rem;color:#666">${pends.length} item(ns)</span></div>
              <div class="panel-card-body"><ul style="list-style:none;padding:0;margin:0">${items}</ul></div>
            </div>
        `;
    }

    /* ---- Cards de custos ---- */
    function renderCostsCard(kind, dre) {
        const title = kind === 'fixed' ? '🏢 Custos fixos' : '📦 Custos variáveis';
        const costs = Financas.getCostsByPeriod(_fid, _currentPK, kind);
        const total = kind === 'fixed' ? dre.totalFixed : dre.totalVariable;
        const mandatory = Financas.mandatoryCategories(kind);
        const lançados = new Set(costs.map(c => c.categoria));
        const faltantes = mandatory.filter(c => !lançados.has(c.key));
        const closed = dre.closed;

        const rows = costs.length > 0 ? costs.map(c => `
            <tr>
              <td><strong>${esc(c.categoriaLabel || c.categoria)}</strong>${c.mandatory ? ' <small style="color:#DC2626">·obrig</small>' : ''}<br>
                <small style="color:#888">${esc(c.descricao || '')}${c.source === 'recurring' ? ' · 🔁 recorrente' : ''}${c.source === 'retification' ? ' · 📝 retificação' : ''}</small>
              </td>
              <td style="text-align:right"><strong>${Financas.formatBRL(c.valor)}</strong></td>
              <td style="text-align:right;white-space:nowrap">
                ${!closed ? `<button class="btn-icon" onclick="FinanceOSUI.removeCost('${c.id}')" title="Remover">🗑️</button>` : ''}
              </td>
            </tr>`).join('') : `<tr><td colspan="3" style="text-align:center;color:#888;padding:18px">Nenhum lançamento</td></tr>`;

        const faltantesHtml = faltantes.length > 0 ? `
            <div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:.82rem;color:#92400E">
              🟡 Faltam obrigatórios: ${faltantes.map(f => esc(f.label)).join(', ')}
            </div>` : '';

        const addBtn = !closed ? `<button class="btn btn-sm btn-primary" onclick="FinanceOSUI.showAddCostModal('${kind}')">+ Adicionar</button>` : '';

        return `
            <div class="panel-card">
              <div class="panel-card-header">
                <h3>${title}</h3>
                <div style="display:flex;gap:8px;align-items:center">
                  <strong>${Financas.formatBRL(total)}</strong>
                  ${addBtn}
                </div>
              </div>
              <div class="panel-card-body" style="padding:0">
                <table class="panel-table">
                  <thead><tr><th>Categoria</th><th style="text-align:right">Valor</th><th></th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
                ${faltantesHtml}
              </div>
            </div>
        `;
    }

    /* ---- Recorrentes ---- */
    function renderRecurring() {
        const tpls = Financas.loadRecurring(_fid).filter(t => t.active !== false);
        if (tpls.length === 0) {
            return `
                <div class="panel-card">
                  <div class="panel-card-header">
                    <h3>🔁 Recorrências ativas</h3>
                    <button class="btn btn-sm btn-outline" onclick="FinanceOSUI.showAddRecurringModal()">+ Cadastrar</button>
                  </div>
                  <div class="panel-card-body" style="color:#888;text-align:center;padding:20px">
                    Nenhuma recorrência cadastrada. Crie templates que geram automaticamente os custos do mês.
                  </div>
                </div>`;
        }
        const rows = tpls.map(t => `
            <tr>
              <td><strong>${esc(t.categoriaLabel)}</strong><br><small style="color:#888">${esc(t.descricao || '')}</small></td>
              <td style="text-align:center">${t.kind === 'fixed' ? 'Fixo' : 'Variável'}</td>
              <td style="text-align:right"><strong>${Financas.formatBRL(t.valor)}</strong></td>
              <td style="text-align:center">${t.dueDay ? 'dia ' + t.dueDay : '—'}</td>
              <td style="text-align:right"><button class="btn-icon" onclick="FinanceOSUI.deactivateRecurring('${t.id}')" title="Desativar">🚫</button></td>
            </tr>`).join('');
        return `
            <div class="panel-card">
              <div class="panel-card-header">
                <h3>🔁 Recorrências ativas</h3>
                <button class="btn btn-sm btn-outline" onclick="FinanceOSUI.showAddRecurringModal()">+ Cadastrar</button>
              </div>
              <div class="panel-card-body" style="padding:0">
                <table class="panel-table">
                  <thead><tr><th>Categoria</th><th style="text-align:center">Tipo</th><th style="text-align:right">Valor</th><th style="text-align:center">Venc.</th><th></th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            </div>`;
    }

    /* ---- Snapshots (períodos fechados) ---- */
    function renderSnapshots() {
        const snaps = Financas.loadSnapshots(_fid).slice().reverse();
        if (snaps.length === 0) return '';
        const rows = snaps.slice(0, 12).map(s => {
            const result = s.dre ? s.dre.resultadoOperacional : 0;
            const resultColor = result >= 0 ? '#10B981' : '#DC2626';
            return `
                <tr>
                  <td><strong>${esc(Financas.formatPeriodLabel(s.periodKey))}</strong><br><small style="color:#888">${formatDate(s.createdAt || s.closedAt || '')} · ${esc(s.closedByName || '—')}</small></td>
                  <td style="text-align:right">${Financas.formatBRL(s.dre ? s.dre.receitaBruta : 0)}</td>
                  <td style="text-align:right;color:${resultColor};font-weight:700">${Financas.formatBRL(result)}</td>
                  <td style="text-align:center">${s.reliability ? s.reliability.score + '%' : '—'}</td>
                  <td style="text-align:center"><button class="btn btn-sm btn-outline" onclick="FinanceOSUI.setPeriod('${s.periodKey}')">Ver</button></td>
                </tr>`;
        }).join('');
        return `
            <div class="panel-card">
              <div class="panel-card-header"><h3>📜 Competências fechadas</h3><span style="font-size:.8rem;color:#666">${snaps.length} snapshot(s) imutáveis</span></div>
              <div class="panel-card-body" style="padding:0">
                <table class="panel-table">
                  <thead><tr><th>Período</th><th style="text-align:right">Receita</th><th style="text-align:right">Resultado</th><th style="text-align:center">Confiab.</th><th></th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            </div>`;
    }

    /* ============================================
       Ações — handlers
       ============================================ */
    function showAddCostModal(kind) {
        const cats = Financas.allCategories(kind);
        const options = cats.map(c => `<option value="${c.key}">${esc(c.label)}${c.mandatory ? ' *' : ''}</option>`).join('');
        openModal(`
            <div class="caixa-modal" role="dialog">
              <div class="caixa-modal-header">
                <h3>${kind === 'fixed' ? '🏢 Novo custo fixo' : '📦 Novo custo variável'}</h3>
                <button class="caixa-modal-close" data-caixa-close>✕</button>
              </div>
              <div class="caixa-modal-body">
                <label>Categoria</label>
                <select data-name="categoria">${options}</select>
                <label>Descrição</label>
                <input type="text" data-name="descricao" placeholder="Ex: aluguel loja matriz">
                <label>Valor</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric">
                <label>Dia de vencimento (opcional)</label>
                <input type="number" data-name="dueDay" min="1" max="31" placeholder="Ex: 5">
                <div class="caixa-info">Período: <strong>${esc(Financas.formatPeriodLabel(_currentPK))}</strong></div>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Lançar</button>
              </div>
            </div>
        `, (data) => {
            const r = Financas.addCost(_fid, {
                kind: kind,
                periodKey: _currentPK,
                categoria: data.categoria,
                descricao: data.descricao,
                valor: data.valor,
                dueDay: data.dueDay
            });
            if (!r.success) return showErr(r.error);
            render();
            return true;
        });
    }

    function showAddRecurringModal() {
        const kindOptions = `<option value="fixed">Fixo</option><option value="variable">Variável</option>`;
        openModal(`
            <div class="caixa-modal" role="dialog">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#8B5CF6,#6366F1)">
                <h3>🔁 Nova recorrência</h3>
                <button class="caixa-modal-close" data-caixa-close>✕</button>
              </div>
              <div class="caixa-modal-body">
                <label>Tipo</label>
                <select data-name="kind" id="fosRecKind">${kindOptions}</select>
                <label>Categoria</label>
                <select data-name="categoria" id="fosRecCat"></select>
                <label>Descrição</label>
                <input type="text" data-name="descricao" placeholder="Ex: Aluguel mensal loja">
                <label>Valor mensal</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric">
                <label>Dia de vencimento</label>
                <input type="number" data-name="dueDay" min="1" max="31">
                <div class="caixa-info">A cada mês que você clicar em "Gerar recorrentes", este lançamento será criado automaticamente (sem duplicar).</div>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-primary" data-caixa-confirm>Salvar recorrência</button>
              </div>
            </div>
        `, (data) => {
            const r = Financas.addRecurring(_fid, {
                kind: data.kind,
                categoria: data.categoria,
                descricao: data.descricao,
                valor: data.valor,
                dueDay: data.dueDay
            });
            if (!r.success) return showErr(r.error);
            render();
            return true;
        });
        // Popula categorias dinamicamente
        setTimeout(() => {
            const kindSel = document.getElementById('fosRecKind');
            const catSel = document.getElementById('fosRecCat');
            function populate() {
                const kind = kindSel.value;
                catSel.innerHTML = Financas.allCategories(kind)
                    .map(c => `<option value="${c.key}">${esc(c.label)}</option>`).join('');
            }
            kindSel.addEventListener('change', populate);
            populate();
        }, 60);
    }

    function deactivateRecurring(id) {
        if (!confirm('Desativar esta recorrência? Os lançamentos futuros não serão gerados. Os já criados permanecem.')) return;
        Financas.deactivateRecurring(_fid, id);
        render();
        Utils.showToast('Recorrência desativada', 'success');
    }

    function generateRecurring() {
        const r = Financas.generateRecurringForPeriod(_fid, _currentPK);
        if (!r.success) return Utils.showToast(r.error, 'error');
        if (r.generated === 0) return Utils.showToast('Nenhuma recorrência pendente para este período.', 'info');
        render();
        Utils.showToast(r.generated + ' lançamento(s) gerado(s) a partir das recorrências', 'success');
    }

    function removeCost(id) {
        if (!confirm('Remover este lançamento?')) return;
        const r = Financas.deleteCost(_fid, id);
        if (!r.success) return Utils.showToast(r.error, 'error');
        render();
        Utils.showToast('Lançamento removido', 'success');
    }

    function confirmClose() {
        const dre = Financas.computeDRE(_fid, _currentPK);
        const rel = Financas.reliabilityScore(_fid, _currentPK);
        const pends = dre.pendencias.filter(p => p.severity === 'high');
        const msg = pends.length > 0
            ? `Este período tem ${pends.length} pendência(s) obrigatória(s) sem lançamento.\nConfiabilidade: ${rel.score}%.\n\nDeseja fechar MESMO ASSIM? (snapshot ficará marcado com a confiabilidade atual)`
            : `Fechar ${Financas.formatPeriodLabel(_currentPK)}?\n\nConfiabilidade: ${rel.score}%.\nReceita: ${Financas.formatBRL(dre.receitaBruta)}\nResultado: ${Financas.formatBRL(dre.resultadoOperacional)}\n\nApós o fechamento, novos lançamentos exigem retificação (super_admin).`;
        if (!confirm(msg)) return;
        const r = Financas.closePeriod(_fid, _currentPK);
        if (!r.success) return Utils.showToast(r.error, 'error');
        render();
        Utils.showToast('Período fechado · snapshot imutável gerado.', 'success');
    }

    function reopenPeriod() {
        const motivo = prompt('Motivo para reabrir o período (obrigatório):');
        if (!motivo || !motivo.trim()) return;
        const r = Financas.reopenPeriod(_fid, _currentPK, motivo);
        if (!r.success) return Utils.showToast(r.error, 'error');
        render();
        Utils.showToast('Período reaberto. Edições ficam registradas na auditoria.', 'warning');
    }

    function showRetifyModal() {
        const kindOptions = `<option value="fixed">Fixo</option><option value="variable">Variável</option>`;
        openModal(`
            <div class="caixa-modal" role="dialog">
              <div class="caixa-modal-header" style="background:linear-gradient(135deg,#DC2626,#991B1B)">
                <h3>📝 Retificar · ${esc(Financas.formatPeriodLabel(_currentPK))}</h3>
                <button class="caixa-modal-close" data-caixa-close>✕</button>
              </div>
              <div class="caixa-modal-body">
                <div class="caixa-warn">⚠️ Retificação em período fechado. O snapshot original permanece; este lançamento aparece marcado como "retificação" na auditoria.</div>
                <label>Tipo</label>
                <select data-name="kind" id="fosRetKind">${kindOptions}</select>
                <label>Categoria</label>
                <select data-name="categoria" id="fosRetCat"></select>
                <label>Descrição</label>
                <input type="text" data-name="descricao">
                <label>Valor</label>
                <input type="text" class="caixa-brl" data-caixa-brl data-name="valor" inputmode="numeric">
                <label>Motivo da retificação (obrigatório)</label>
                <textarea data-name="motivo" placeholder="Ex: nota fiscal encontrada posteriormente, erro de digitação..."></textarea>
                <div class="caixa-danger" data-caixa-error style="display:none"></div>
              </div>
              <div class="caixa-modal-footer">
                <button class="caixa-btn-secondary" data-caixa-close>Cancelar</button>
                <button class="caixa-btn-danger" data-caixa-confirm>Retificar</button>
              </div>
            </div>
        `, (data) => {
            const r = Financas.retify(_fid, _currentPK, {
                kind: data.kind,
                categoria: data.categoria,
                descricao: data.descricao,
                valor: data.valor
            }, data.motivo);
            if (!r.success) return showErr(r.error);
            render();
            return true;
        });
        setTimeout(() => {
            const kindSel = document.getElementById('fosRetKind');
            const catSel = document.getElementById('fosRetCat');
            function populate() {
                catSel.innerHTML = Financas.allCategories(kindSel.value)
                    .map(c => `<option value="${c.key}">${esc(c.label)}</option>`).join('');
            }
            kindSel.addEventListener('change', populate);
            populate();
        }, 60);
    }

    /* ============================================
       Modal helpers (reusa estilos do caixa.js)
       ============================================ */
    function openModal(html, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'caixa-modal-overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        overlay.querySelectorAll('[data-caixa-close]').forEach(el => el.addEventListener('click', close));

        overlay.querySelectorAll('input[data-caixa-brl]').forEach(inp => {
            inp.addEventListener('input', e => {
                const digits = (e.target.value || '').replace(/\D/g, '');
                const reais = parseInt(digits || '0', 10) / 100;
                e.target.value = Financas.formatBRL(reais);
            });
            if (!inp.value) inp.value = Financas.formatBRL(0);
        });

        const confirmBtn = overlay.querySelector('[data-caixa-confirm]');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const data = {};
                overlay.querySelectorAll('[data-name]').forEach(el => {
                    const name = el.dataset.name;
                    let v = el.value;
                    if (el.dataset.caixaBrl !== undefined) {
                        const digits = String(v || '').replace(/\D/g, '');
                        v = parseInt(digits || '0', 10) / 100;
                    }
                    data[name] = v;
                });
                const res = onConfirm && onConfirm(data);
                if (res === true) close();
            });
        }
        return { close, overlay };
    }

    function showErr(msg) {
        const el = document.querySelector('.caixa-modal-overlay [data-caixa-error]');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
        return false;
    }

    /* ============================================
       Utils
       ============================================ */
    function esc(s) {
        return (typeof Utils !== 'undefined' && Utils.escapeHtml) ? Utils.escapeHtml(s) : String(s == null ? '' : s);
    }

    function formatDate(iso) {
        try { return new Date(iso).toLocaleDateString('pt-BR'); } catch (e) { return '—'; }
    }

    function sessionRole() {
        return (typeof Auth !== 'undefined' && Auth.getSession) ? Auth.getSession()?.role : null;
    }

    function buildPeriodOptions() {
        // Últimos 12 meses + próximos 2
        const now = new Date();
        const opts = [];
        for (let i = 12; i >= -2; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const pk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            const sel = pk === _currentPK ? ' selected' : '';
            opts.push(`<option value="${pk}"${sel}>${Financas.formatPeriodLabel(pk)}</option>`);
        }
        return opts.join('');
    }

    function ensureStyles() {
        if (document.getElementById('financeOSStyles')) return;
        const css = `
.fos-header .fos-select { padding: 8px 10px; border-radius: 8px; border: 1px solid #ddd; font-size: .92rem; }
.fos-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
.fos-badge-green { background: #D1FAE5; color: #065F46; }
.fos-badge-red { background: #FEE2E2; color: #991B1B; }
.fos-reliability { text-align: center; padding: 4px 14px; border-right: 1px solid #eee; padding-right: 18px; margin-right: 6px; }
.fos-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; margin-bottom: 20px; }
.fos-dre { background: #FAFAFA; border-radius: 12px; padding: 14px 18px; margin-bottom: 16px; }
.fos-dre-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: .92rem; }
.fos-dre-sum { color: #333; }
.fos-dre-sub { color: #B91C1C; }
.fos-dre-total { border-top: 1px solid #eee; padding-top: 10px; margin-top: 6px; font-weight: 700; }
.fos-dre-result { border-top: 2px solid #333; padding-top: 12px; margin-top: 10px; font-size: 1.05rem; font-weight: 800; }
.fos-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.fos-kpi { background: linear-gradient(135deg, #F8F9FA, #fff); border: 1px solid #eee; border-radius: 10px; padding: 12px 14px; text-align: center; }
.fos-kpi-label { font-size: .72rem; color: #777; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
.fos-kpi-value { font-size: 1.25rem; font-weight: 800; color: #1F2937; }
.btn-icon { background: transparent; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; }
.btn-icon:hover { transform: scale(1.1); }

/* Health score card */
.fos-health-top { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px dashed #e5e7eb; }
.fos-health-ring { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
.fos-health-ring-inner { width: 94px; height: 94px; border-radius: 50%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.fos-pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
.fos-pillar { padding: 12px 14px; background: #FAFAFA; border: 1px solid #eee; border-radius: 10px; }
.fos-pillar-head { display: flex; justify-content: space-between; font-size: .82rem; margin-bottom: 6px; }
.fos-pillar-name { font-weight: 700; color: #1F2937; }
.fos-pillar-weight { color: #888; font-size: .72rem; }
.fos-pillar-bar { background: #E5E7EB; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
.fos-pillar-fill { height: 100%; border-radius: 4px; transition: width .4s ease; }
.fos-pillar-foot { display: flex; gap: 8px; align-items: baseline; }
.fos-pillar-hint { font-size: .7rem; color: #888; line-height: 1.35; }

/* History */
.fos-hist-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.fos-hist-bar { cursor: pointer; padding: 12px; background: #FAFAFA; border: 1px solid #e5e7eb; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; transition: all .15s; position: relative; }
.fos-hist-bar:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.08); border-color: #D4A5FF; }
.fos-hist-current { border-color: #E91E63; background: linear-gradient(135deg, #FFF0F6, #FFF); }
.fos-hist-score { width: 44px; height: 44px; border-radius: 10px; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.05rem; }
.fos-hist-meta { font-size: .82rem; }
.fos-hist-label { font-weight: 700; text-transform: capitalize; color: #1F2937; }
.fos-hist-result { font-weight: 700; }
.fos-hist-receita { font-size: .72rem; color: #888; }
.fos-hist-status { position: absolute; top: 8px; right: 10px; font-size: .9rem; opacity: .7; }
`;
        const style = document.createElement('style');
        style.id = 'financeOSStyles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    return {
        init,
        setPeriod,
        showAddCostModal,
        showAddRecurringModal,
        deactivateRecurring,
        generateRecurring,
        removeCost,
        confirmClose,
        reopenPeriod,
        showRetifyModal,
        render
    };
})();
