/* ============================================================
   MilkyPot — Recurring Expenses (FASE 3)
   ============================================================
   Custos fixos automaticos. Regra principal:
     "Custo fixo nao pode depender de relancamento manual."

   Schema (collection: recurring_expenses_<fid>):
     {
       id, franchiseId, descricao, categoria, valor,
       recorrencia: 'mensal',
       diaVencimento: 1..28,
       ativo: true|false,
       dataInicio: 'YYYY-MM-DD',
       dataFim: 'YYYY-MM-DD'|null,
       criadoEm: ISO,
       atualizadoEm: ISO
     }

   Lancamento gerado (na collection 'finances' usada pela DRE):
     {
       id, type: 'expense', category, amount, description, date,
       _origem: 'recorrente',
       _recurringExpenseId: <id>,
       _competencia: 'YYYY-MM',
       createdAt
     }

   Idempotencia:
     - Chave: (recurringExpenseId, competencia)
     - generateForMonth() filtra finances ja existentes com mesma chave
       antes de criar. Pode rodar varias vezes no mesmo mes — nao duplica.

   Editar recorrente NAO altera historico:
     - save() so modifica o template; lancamentos passados ficam imutaveis
     - Proximo mes pega valor novo automaticamente
   ============================================================ */
(function (global) {
    'use strict';

    var COL = 'recurring_expenses';
    var COL_FIN = 'finances';

    // Categorias permitidas (devem casar com FIXAS_CATS da DRE).
    var FIXAS_CATS = ['aluguel', 'salarios', 'energia', 'agua', 'internet',
        'utilidades', 'franquia', 'taxa_franquia', 'contabilidade',
        'seguro', 'manutencao_fixa'];

    function _now() { return new Date().toISOString(); }

    function _genId() {
        if (global.Utils && Utils.generateId) return Utils.generateId();
        return 'rec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function _competenciaFromDate(d) {
        var dt = (d instanceof Date) ? d : new Date(d);
        if (isNaN(dt)) return null;
        return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
    }

    // 'YYYY-MM' + dia => 'YYYY-MM-DD' (clamped pro ultimo dia do mes se passar)
    function _dateForCompetencia(competencia, dia) {
        var parts = (competencia || '').split('-');
        if (parts.length !== 2) return null;
        var y = parseInt(parts[0], 10);
        var m = parseInt(parts[1], 10);
        if (!y || !m || m < 1 || m > 12) return null;
        var lastDay = new Date(y, m, 0).getDate();
        var d = Math.min(Math.max(parseInt(dia, 10) || 1, 1), lastDay);
        return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }

    // Itera 'YYYY-MM' >= 'YYYY-MM' (inclusive)
    function _competenciaGte(a, b) {
        return (a || '') >= (b || '');
    }
    function _competenciaLte(a, b) {
        return (a || '') <= (b || '');
    }

    // ============================================================
    // CRUD
    // ============================================================
    function list(franchiseId, opts) {
        opts = opts || {};
        if (!franchiseId || !global.DataStore) return [];
        var all = DataStore.getCollection(COL, franchiseId) || [];
        if (opts.onlyActive) {
            return all.filter(function (r) { return r && r.ativo !== false; });
        }
        return all;
    }

    function getById(franchiseId, id) {
        var all = list(franchiseId);
        for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
        return null;
    }

    function save(franchiseId, payload) {
        if (!franchiseId || !global.DataStore) {
            return { ok: false, error: 'sem-franquia-ou-datastore' };
        }
        if (!payload || !payload.descricao || !payload.categoria) {
            return { ok: false, error: 'descricao-e-categoria-obrigatorias' };
        }
        if (FIXAS_CATS.indexOf(payload.categoria) < 0) {
            return { ok: false, error: 'categoria-invalida', allowed: FIXAS_CATS };
        }
        var valor = Number(payload.valor);
        if (!isFinite(valor) || valor <= 0) {
            return { ok: false, error: 'valor-invalido' };
        }
        var dia = parseInt(payload.diaVencimento, 10);
        if (!dia || dia < 1 || dia > 28) {
            return { ok: false, error: 'dia-vencimento-1-a-28' };
        }
        var dataInicio = payload.dataInicio;
        if (!dataInicio || !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) {
            // default: hoje
            dataInicio = new Date().toISOString().slice(0, 10);
        }
        var dataFim = payload.dataFim || null;
        if (dataFim && !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
            return { ok: false, error: 'data-fim-invalida' };
        }

        if (payload.id) {
            // UPDATE — historico nao muda; so o template
            var existing = getById(franchiseId, payload.id);
            if (!existing) return { ok: false, error: 'nao-encontrado' };
            var updated = {
                descricao: String(payload.descricao).trim(),
                categoria: payload.categoria,
                valor: Math.round(valor * 100) / 100,
                recorrencia: 'mensal',
                diaVencimento: dia,
                ativo: payload.ativo !== false,
                dataInicio: dataInicio,
                dataFim: dataFim,
                atualizadoEm: _now()
            };
            DataStore.updateInCollection(COL, franchiseId, payload.id, updated);
            return { ok: true, action: 'updated', recurring: Object.assign({}, existing, updated) };
        }

        // CREATE
        var record = {
            id: _genId(),
            franchiseId: franchiseId,
            descricao: String(payload.descricao).trim(),
            categoria: payload.categoria,
            valor: Math.round(valor * 100) / 100,
            recorrencia: 'mensal',
            diaVencimento: dia,
            ativo: payload.ativo !== false,
            dataInicio: dataInicio,
            dataFim: dataFim,
            criadoEm: _now(),
            atualizadoEm: _now()
        };
        DataStore.addToCollection(COL, franchiseId, record);
        return { ok: true, action: 'created', recurring: record };
    }

    function deactivate(franchiseId, id) {
        if (!franchiseId || !id || !global.DataStore) return { ok: false };
        DataStore.updateInCollection(COL, franchiseId, id, { ativo: false, atualizadoEm: _now() });
        return { ok: true };
    }

    function activate(franchiseId, id) {
        if (!franchiseId || !id || !global.DataStore) return { ok: false };
        DataStore.updateInCollection(COL, franchiseId, id, { ativo: true, atualizadoEm: _now() });
        return { ok: true };
    }

    // ============================================================
    // GERACAO IDEMPOTENTE
    // ============================================================
    // Retorna lancamentos ja gerados pra (recurringExpenseId, competencia)
    function findGenerated(franchiseId, recurringExpenseId, competencia) {
        var fin = DataStore.getCollection(COL_FIN, franchiseId) || [];
        return fin.filter(function (f) {
            return f && f._origem === 'recorrente'
                && f._recurringExpenseId === recurringExpenseId
                && f._competencia === competencia;
        });
    }

    // Aplicabilidade da recorrencia naquela competencia
    function _isApplicableInMonth(rec, competencia) {
        if (!rec || rec.ativo === false) return false;
        var inicioComp = _competenciaFromDate(rec.dataInicio);
        if (inicioComp && competencia < inicioComp) return false;
        if (rec.dataFim) {
            var fimComp = _competenciaFromDate(rec.dataFim);
            if (fimComp && competencia > fimComp) return false;
        }
        return true;
    }

    // Gera todos os lancamentos pendentes de UMA competencia.
    // Idempotente — se ja gerou, pula.
    function generateForMonth(franchiseId, competencia) {
        if (!franchiseId || !global.DataStore) return { ok: false, error: 'sem-franquia' };
        if (!/^\d{4}-\d{2}$/.test(competencia || '')) {
            return { ok: false, error: 'competencia-invalida' };
        }

        var recs = list(franchiseId, { onlyActive: true });
        var created = [];
        var skipped = [];
        var inapplicable = [];

        recs.forEach(function (r) {
            if (!_isApplicableInMonth(r, competencia)) {
                inapplicable.push({ id: r.id, descricao: r.descricao, motivo: 'fora-do-periodo-ou-inativa' });
                return;
            }
            var existing = findGenerated(franchiseId, r.id, competencia);
            if (existing.length > 0) {
                skipped.push({ id: r.id, descricao: r.descricao, motivo: 'ja-gerado', entryId: existing[0].id });
                return;
            }
            // CRIA o lancamento na collection 'finances' (que a DRE le)
            var date = _dateForCompetencia(competencia, r.diaVencimento);
            var entry = {
                id: _genId(),
                type: 'expense',
                category: r.categoria,
                amount: r.valor,
                description: r.descricao + ' (recorrente)',
                date: date,
                _origem: 'recorrente',
                _recurringExpenseId: r.id,
                _competencia: competencia,
                _diaVencimento: r.diaVencimento,
                _snapshotValor: r.valor, // congelado — editar recorrente nao muda historico
                createdAt: _now()
            };
            DataStore.addToCollection(COL_FIN, franchiseId, entry);
            created.push({ id: r.id, descricao: r.descricao, valor: r.valor, entryId: entry.id });
        });

        return {
            ok: true,
            franchiseId: franchiseId,
            competencia: competencia,
            created: created,
            skipped: skipped,
            inapplicable: inapplicable,
            summary: {
                criados: created.length,
                pulados: skipped.length,
                naoAplicaveis: inapplicable.length
            }
        };
    }

    // Gera para todos os meses entre dataInicio e a competencia atual.
    // Util pra cadastrar recorrencia pre-existente sem precisar gerar mes a mes.
    function backfillUpTo(franchiseId, untilCompetencia) {
        if (!franchiseId) return { ok: false };
        if (!/^\d{4}-\d{2}$/.test(untilCompetencia || '')) {
            untilCompetencia = _competenciaFromDate(new Date());
        }
        var recs = list(franchiseId, { onlyActive: true });
        if (!recs.length) return { ok: true, runs: [], summary: 'nenhuma-recorrencia' };

        // Encontra a competencia mais antiga entre as recorrencias ativas
        var earliest = null;
        recs.forEach(function (r) {
            var c = _competenciaFromDate(r.dataInicio);
            if (c && (!earliest || c < earliest)) earliest = c;
        });
        if (!earliest) return { ok: true, runs: [] };

        var runs = [];
        var startParts = earliest.split('-');
        var y = parseInt(startParts[0], 10);
        var m = parseInt(startParts[1], 10);
        var current = earliest;
        var safety = 120; // max 10 anos
        while (current <= untilCompetencia && safety-- > 0) {
            runs.push(generateForMonth(franchiseId, current));
            m++;
            if (m > 12) { m = 1; y++; }
            current = y + '-' + String(m).padStart(2, '0');
        }
        return {
            ok: true,
            runs: runs,
            totalCriados: runs.reduce(function (s, r) { return s + (r.summary ? r.summary.criados : 0); }, 0)
        };
    }

    // ============================================================
    // QUERY HELPERS
    // ============================================================
    // Lancamentos recorrentes de uma competencia (pra UI mostrar)
    function listGeneratedInMonth(franchiseId, competencia) {
        var fin = DataStore.getCollection(COL_FIN, franchiseId) || [];
        return fin.filter(function (f) {
            return f && f._origem === 'recorrente' && f._competencia === competencia;
        });
    }

    function competenciaAtual() {
        return _competenciaFromDate(new Date());
    }

    global.RecurringExpenses = {
        // CRUD
        list: list,
        getById: getById,
        save: save,
        deactivate: deactivate,
        activate: activate,
        // Geracao
        generateForMonth: generateForMonth,
        backfillUpTo: backfillUpTo,
        findGenerated: findGenerated,
        listGeneratedInMonth: listGeneratedInMonth,
        // Helpers
        competenciaAtual: competenciaAtual,
        FIXAS_CATS: FIXAS_CATS,
        _competenciaFromDate: _competenciaFromDate,
        _dateForCompetencia: _dateForCompetencia
    };
})(typeof window !== 'undefined' ? window : this);
