/* ============================================================
   MilkyPot - Weekly Stock Audit
   ============================================================
   Contagem semanal obrigatoria de toda a loja.

   Fonte de verdade:
   - inventory_<fid>: insumos, embalagens, caldas, copos, bases, buffet etc.
   - CatalogV2.produtos[].picoleFlavors: camada extra por sabor do picole.
   - inventory[].auditVariants: camada extra opcional por sabor/variante de
     sorvete, acai, topping, calda ou qualquer item que precise ser contado
     separado sem deixar de baixar o estoque geral.
   ============================================================ */
(function(global) {
    'use strict';

    var DAY_MS = 86400000;

    function DS() { return global.DataStore; }
    function esc(s) {
        if (global.Utils && Utils.escapeHtml) return Utils.escapeHtml(s);
        return String(s || '').replace(/[&<>"']/g, function(c) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
        });
    }
    function r3(n) { return Math.round((Number(n) || 0) * 1000) / 1000; }
    function slug(s) {
        return String(s || 'item').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
    }
    function dateKey(d) {
        d = d ? new Date(d) : new Date();
        return d.toISOString().slice(0, 10);
    }
    function mondayOf(date) {
        var d = date ? new Date(date) : new Date();
        d.setHours(0, 0, 0, 0);
        var day = d.getDay(); // 0 dom, 1 seg
        var diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        return d;
    }
    function auditWindow(date) {
        var start = mondayOf(date);
        var due = new Date(start);
        due.setDate(start.getDate() + 1);
        due.setHours(23, 59, 59, 999);
        var end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return {
            weekStart: dateKey(start),
            dueUntil: dateKey(due),
            weekEnd: dateKey(end),
            isOpen: Date.now() <= due.getTime()
        };
    }
    function getLastAudit(fid) {
        var list = DS().getCollection('weekly_stock_audits', fid) || [];
        return list.slice().sort(function(a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        })[0] || null;
    }
    function getStatus(fid) {
        var w = auditWindow();
        var last = getLastAudit(fid);
        var doneThisWeek = !!(last && last.weekStart === w.weekStart);
        return Object.assign({}, w, {
            doneThisWeek: doneThisWeek,
            overdue: !doneThisWeek && !w.isOpen,
            label: doneThisWeek ? 'Auditoria da semana concluida'
                 : w.isOpen ? 'Auditoria aberta ate terca'
                 : 'Auditoria semanal atrasada',
            lastAuditAt: last ? last.createdAt : null
        });
    }
    function getPicoleProduct(fid) {
        if (!global.CatalogV2) return null;
        try {
            var catalog = CatalogV2.load(fid);
            var product = (catalog.produtos || []).find(function(p) {
                var name = String(p.name || '').toLowerCase();
                return p.active !== false && (p.categoriaId === 'cat_picole' || name.indexOf('picol') >= 0);
            });
            return product ? { catalog: catalog, product: product } : null;
        } catch(e) {
            return null;
        }
    }
    function listAuditRows(fid) {
        var inventory = DS().getCollection('inventory', fid) || [];
        var rows = [];

        inventory.forEach(function(item) {
            if (!item || !item.id) return;
            var variants = Array.isArray(item.auditVariants) ? item.auditVariants : [];
            if (variants.length) {
                variants.forEach(function(v) {
                    rows.push({
                        key: 'variant:' + item.id + ':' + v.id,
                        source: 'inventoryVariant',
                        parentId: item.id,
                        id: v.id,
                        name: (item.name || item.id) + ' - ' + (v.name || v.id),
                        group: item.category || 'Estoque',
                        unit: v.unit || item.unit,
                        expected: Number(v.stock ?? v.quantity ?? 0),
                        minStock: Number(v.minStock ?? v.targetStock ?? 0),
                        targetStock: Number(v.targetStock ?? v.minStock ?? 0),
                        cost: Number(item.cost || 0),
                        raw: v
                    });
                });
            } else {
                rows.push({
                    key: 'inventory:' + item.id,
                    source: 'inventory',
                    id: item.id,
                    name: item.name || item.id,
                    group: item.category || 'Estoque',
                    unit: item.unit || 'unid',
                    expected: Number(item.quantity || 0),
                    minStock: Number(item.minStock || 0),
                    targetStock: Number(item.targetStock || item.minStock || 0),
                    cost: Number(item.cost || 0),
                    raw: item
                });
            }
        });

        var pic = getPicoleProduct(fid);
        if (pic && Array.isArray(pic.product.picoleFlavors)) {
            pic.product.picoleFlavors.forEach(function(f) {
                rows.push({
                    key: 'picoleFlavor:' + f.id,
                    source: 'picoleFlavor',
                    id: f.id,
                    name: 'Picole - ' + (f.name || f.id),
                    group: 'Picoles por sabor',
                    unit: 'unid',
                    expected: Number(f.stock || 0),
                    minStock: Number(f.minStock || 0),
                    targetStock: Number(f.targetStock || 30),
                    cost: 0,
                    raw: f
                });
            });
        }

        return rows.sort(function(a, b) {
            return String(a.group).localeCompare(String(b.group)) || String(a.name).localeCompare(String(b.name));
        });
    }
    function addVariant(fid, parentId, name, opts) {
        opts = opts || {};
        var inventory = DS().getCollection('inventory', fid) || [];
        var item = inventory.find(function(i) { return i && i.id === parentId; });
        if (!item) return { ok: false, error: 'Item de estoque nao encontrado' };
        item.auditVariants = Array.isArray(item.auditVariants) ? item.auditVariants : [];
        var id = opts.id || ('var_' + slug(name) + '_' + Date.now().toString(36));
        item.auditVariants.push({
            id: id,
            name: name,
            unit: opts.unit || item.unit || 'unid',
            stock: Number(opts.stock || 0),
            minStock: Number(opts.minStock || 0),
            targetStock: Number(opts.targetStock || 0),
            active: true,
            createdAt: new Date().toISOString()
        });
        DS().setCollection('inventory', fid, inventory);
        return { ok: true, id: id };
    }
    function applyCounts(fid, countedRows, opts) {
        opts = opts || {};
        var now = new Date().toISOString();
        var inventory = DS().getCollection('inventory', fid) || [];
        var pic = getPicoleProduct(fid);
        var applied = [];

        countedRows.forEach(function(row) {
            var counted = r3(row.counted);
            var expected = r3(row.expected);
            var diff = r3(counted - expected);
            applied.push(Object.assign({}, row, { counted: counted, diff: diff }));

            if (row.source === 'inventory') {
                var item = inventory.find(function(i) { return i && i.id === row.id; });
                if (item) {
                    item.quantity = counted;
                    item.lastAuditAt = now;
                    item.lastAuditDiff = diff;
                }
            } else if (row.source === 'inventoryVariant') {
                var parent = inventory.find(function(i) { return i && i.id === row.parentId; });
                if (parent && Array.isArray(parent.auditVariants)) {
                    var variant = parent.auditVariants.find(function(v) { return v && v.id === row.id; });
                    if (variant) {
                        variant.stock = counted;
                        variant.lastAuditAt = now;
                        variant.lastAuditDiff = diff;
                    }
                    parent.quantity = r3(parent.auditVariants.reduce(function(sum, v) {
                        return sum + Number(v.stock ?? v.quantity ?? 0);
                    }, 0));
                    parent.lastAuditAt = now;
                }
            } else if (row.source === 'picoleFlavor' && pic) {
                var f = (pic.product.picoleFlavors || []).find(function(x) { return x && x.id === row.id; });
                if (f) {
                    f.stock = counted;
                    f.lastCountAt = now;
                    f.lastAuditDiff = diff;
                }
            }
        });

        DS().setCollection('inventory', fid, inventory);
        if (pic && global.CatalogV2) {
            CatalogV2.save(fid, pic.catalog);
            if (CatalogV2.syncToLegacy) CatalogV2.syncToLegacy(fid);
        }

        var win = auditWindow();
        var audit = {
            id: 'wsa_' + Date.now().toString(36),
            weekStart: win.weekStart,
            weekEnd: win.weekEnd,
            dueUntil: win.dueUntil,
            createdAt: now,
            createdBy: opts.userName || null,
            rows: applied
        };
        var audits = DS().getCollection('weekly_stock_audits', fid) || [];
        audits.push(audit);
        DS().setCollection('weekly_stock_audits', fid, audits);
        return audit;
    }
    function salesCoverageDays() {
        var w = auditWindow();
        var today = new Date();
        var end = new Date(w.weekEnd + 'T23:59:59');
        return Math.max(1, Math.ceil((end.getTime() - today.getTime()) / DAY_MS) + 1);
    }
    function purchaseSuggestions(fid, opts) {
        opts = opts || {};
        var daysToCover = Number(opts.daysToCover || salesCoverageDays() || 7);
        var base = [];
        if (global.PurchaseIntelligence && PurchaseIntelligence.listSugestoes) {
            try {
                base = PurchaseIntelligence.listSugestoes(fid, {
                    diasCoberturaDesejados: daysToCover,
                    days: opts.analysisDays || 30
                }).sugestoes || [];
            } catch(e) {
                base = [];
            }
        }
        var rows = listAuditRows(fid);
        var byId = {};
        base.forEach(function(s) { byId[s.insumoId] = s; });

        rows.forEach(function(r) {
            if (r.source !== 'inventoryVariant' && r.source !== 'picoleFlavor') return;
            var target = Number(r.targetStock || r.minStock || 0);
            if (target <= 0) return;
            base.push({
                insumoId: r.key,
                nome: r.name,
                unit: r.unit,
                estoqueAtual: Number(r.expected || 0),
                consumoMedioDiario: 0,
                diasRestantes: null,
                status: Number(r.expected || 0) < target ? 'atencao' : 'ok',
                statusIcon: Number(r.expected || 0) < target ? '!' : 'OK',
                diasCoberturaDesejados: daysToCover,
                quantidadeSugerida: r3(Math.max(0, target - Number(r.expected || 0))),
                prioridade: Number(r.expected || 0) < target ? 1 : 2,
                auditOnly: true
            });
        });

        return base.sort(function(a, b) {
            var pa = a.prioridade ?? 3;
            var pb = b.prioridade ?? 3;
            if (pa !== pb) return pa - pb;
            return (b.quantidadeSugerida || 0) - (a.quantidadeSugerida || 0);
        });
    }
    function addQuantity(fid, key, quantity) {
        quantity = Number(quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, error: 'Quantidade invalida' };
        var row = listAuditRows(fid).find(function(r) { return r.key === key; });
        if (!row) return { ok: false, error: 'Item nao encontrado' };
        var current = Number(row.expected || 0);
        var counted = r3(current + quantity);

        var inventory = DS().getCollection('inventory', fid) || [];
        if (row.source === 'inventoryVariant') {
            var parent = inventory.find(function(i) { return i && i.id === row.parentId; });
            if (!parent || !Array.isArray(parent.auditVariants)) return { ok: false, error: 'Variante nao encontrada' };
            var variant = parent.auditVariants.find(function(v) { return v && v.id === row.id; });
            if (!variant) return { ok: false, error: 'Variante nao encontrada' };
            variant.stock = counted;
            variant.lastPurchaseAt = new Date().toISOString();
            parent.quantity = r3(parent.auditVariants.reduce(function(sum, v) {
                return sum + Number(v.stock ?? v.quantity ?? 0);
            }, 0));
            DS().setCollection('inventory', fid, inventory);
        } else if (row.source === 'picoleFlavor') {
            var pic = getPicoleProduct(fid);
            if (!pic) return { ok: false, error: 'Produto de picole nao encontrado' };
            var f = (pic.product.picoleFlavors || []).find(function(x) { return x && x.id === row.id; });
            if (!f) return { ok: false, error: 'Sabor de picole nao encontrado' };
            f.stock = counted;
            f.lastPurchaseAt = new Date().toISOString();
            CatalogV2.save(fid, pic.catalog);
            if (CatalogV2.syncToLegacy) CatalogV2.syncToLegacy(fid);
        } else {
            var item = inventory.find(function(i) { return i && i.id === row.id; });
            if (!item) return { ok: false, error: 'Item nao encontrado' };
            item.quantity = counted;
            item.lastPurchaseAt = new Date().toISOString();
            DS().setCollection('inventory', fid, inventory);
        }
        return { ok: true, estoqueAnterior: current, estoqueNovo: counted };
    }

    global.WeeklyAudit = {
        esc: esc,
        auditWindow: auditWindow,
        getStatus: getStatus,
        listAuditRows: listAuditRows,
        addVariant: addVariant,
        applyCounts: applyCounts,
        addQuantity: addQuantity,
        salesCoverageDays: salesCoverageDays,
        purchaseSuggestions: purchaseSuggestions
    };
})(typeof window !== 'undefined' ? window : this);
