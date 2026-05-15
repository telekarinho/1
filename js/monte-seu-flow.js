/**
 * Monte do Seu Jeito — Modal Wizard 5 Passos
 *
 * Açaí · Smoothie · Shake Proteico
 *
 * Uso:
 *   MonteSeuFlow.open(item, { onAdd: function(cartItem){ ... } });
 *
 * item._v2.monteSeuJeito contém:
 *   - tipo: 'acai' | 'smoothie' | 'protein'
 *   - sabores: [{id,name,emoji,desc}, ...]
 *   - toppingsLimitPorTamanho: { var_essencial:2, var_supremo:3, ... }
 *   - toppingsCatalog: { complementos, caldas, cremes, frutas, bordas, whey }
 *   - wheyRequired: boolean
 *   - wheyDefault: 'w_choc' | 'w_morango' | 'w_baun'
 */
(function () {
    'use strict';

    var MS = {
        state: null,
        sheetEl: null,
        backdropEl: null
    };

    // Helpers
    function brl(n) { return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ','); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
    function el(sel) { return document.querySelector(sel); }

    // ============================================
    // OPEN / CLOSE
    // ============================================
    MS.open = function (item, opts) {
        opts = opts || {};
        var meta = item && item._v2 && item._v2.monteSeuJeito;
        if (!meta) { console.warn('[MonteSeuFlow] item sem monteSeuJeito'); return; }

        // Variantes — pega de _v2.variantes (4 tamanhos: essencial/supremo/monster/soberano)
        var variantes = (item._v2 && item._v2.variantes) || [];
        if (!variantes.length) { console.warn('[MonteSeuFlow] item sem variantes'); return; }

        MS.state = {
            item: item,
            meta: meta,
            variantes: variantes,
            channel: opts.channel || 'delivery',  // 'loja' | 'delivery' | 'ifood'
            step: 1,
            variantIdx: 0,
            sabor: null,
            toppings: { complementos: [], caldas: [], cremes: [] },
            frutas: [],
            bordas: [],
            whey: meta.wheyRequired ? (meta.wheyDefault || 'w_choc') : null,
            obs: '',
            opts: opts
        };

        ensureSheet();
        render();
        showSheet();
    };

    MS.close = function () {
        if (MS.sheetEl) {
            MS.sheetEl.classList.remove('sheet-open');
            // Espera animação de slide-down (350ms) antes de hidden — UX consistente com closeProductSheet
            setTimeout(function () {
                if (MS.sheetEl) MS.sheetEl.style.display = 'none';
                if (MS.backdropEl) MS.backdropEl.style.display = 'none';
            }, 350);
        }
        document.body.style.overflow = '';
        MS.state = null;
    };
    window.MonteSeuClose = MS.close;

    function ensureSheet() {
        // Reusa #productSheet + #productSheetBackdrop existentes
        MS.sheetEl = document.getElementById('productSheet');
        MS.backdropEl = document.getElementById('productSheetBackdrop');
        if (!MS.sheetEl || !MS.backdropEl) {
            console.warn('[MonteSeuFlow] productSheet/Backdrop não existe na página');
            return;
        }
        // Estilo overlay
        MS.sheetEl.style.position = 'fixed';
        MS.sheetEl.style.zIndex = '10001';
        MS.backdropEl.style.zIndex = '10000';
    }
    function showSheet() {
        if (!MS.sheetEl) return;
        // display:flex — msStyles posiciona header/steps/body/footer em coluna
        MS.sheetEl.style.display = 'flex';
        MS.backdropEl.style.display = 'block';
        document.body.style.overflow = 'hidden';
        // CRÍTICO: .product-sheet CSS tem transform: translateY(100%) (escondido).
        // A classe .sheet-open faz transform: translateY(0) → slide-up visível.
        // Sem essa classe, sheet fica fora da viewport e user só vê backdrop escurecido.
        // requestAnimationFrame garante que a transition rola (transform muda em frame separado)
        requestAnimationFrame(function () {
            if (MS.sheetEl) MS.sheetEl.classList.add('sheet-open');
        });
    }

    // ============================================
    // STATE HELPERS
    // ============================================
    function curVar() { return MS.state.variantes[MS.state.variantIdx] || {}; }
    function basePrice() {
        var v = curVar();
        var ch = MS.state.channel;
        var k = (ch === 'loja') ? 'precoLoja' : (ch === 'ifood' ? 'precoIfood' : 'precoDelivery');
        return Number(v[k] || v.precoLoja || 0);
    }
    function freeToppingsLimit() {
        var v = curVar();
        if (typeof v.toppingsGratis === 'number') return v.toppingsGratis;
        var map = MS.state.meta.toppingsLimitPorTamanho || {};
        return map[v.id] || 2;
    }
    function countedToppings() {
        // soma items dos grupos que contam na cota
        var s = MS.state.toppings;
        return (s.complementos.length + s.caldas.length + s.cremes.length);
    }
    function paidToppingsCount() {
        return Math.max(0, countedToppings() - freeToppingsLimit());
    }
    function findItem(group, id) {
        var cat = MS.state.meta.toppingsCatalog[group];
        if (!cat) return null;
        return (cat.items || []).find(function (it) { return it.id === id; });
    }
    function findWhey(id) {
        var w = MS.state.meta.toppingsCatalog.whey;
        if (!w) return null;
        return (w.items || []).find(function (it) { return it.id === id; });
    }
    function findSabor(id) {
        return (MS.state.meta.sabores || []).find(function (s) { return s.id === id; });
    }

    function calcTotal() {
        var total = basePrice();
        // Toppings: extras pagam R$ 3 (pega preço do grupo, todos iguais)
        var price3 = (MS.state.meta.toppingsCatalog.complementos && MS.state.meta.toppingsCatalog.complementos.price) || 3.00;
        total += paidToppingsCount() * price3;
        // Frutas (sempre R$ 4)
        var priceFruta = (MS.state.meta.toppingsCatalog.frutas && MS.state.meta.toppingsCatalog.frutas.price) || 4.00;
        total += MS.state.frutas.length * priceFruta;
        // Bordas (sempre R$ 5)
        var priceBorda = (MS.state.meta.toppingsCatalog.bordas && MS.state.meta.toppingsCatalog.bordas.price) || 5.00;
        total += MS.state.bordas.length * priceBorda;
        // Whey (R$ 5,99)
        if (MS.state.whey) {
            var priceWhey = (MS.state.meta.toppingsCatalog.whey && MS.state.meta.toppingsCatalog.whey.price) || 5.99;
            total += priceWhey;
        }
        return total;
    }

    // ============================================
    // ACTIONS
    // ============================================
    MS.setStep = function (n) {
        MS.state.step = Math.max(1, Math.min(5, n));
        render();
    };
    MS.selectVariante = function (i) { MS.state.variantIdx = i; render(); };
    MS.selectSabor = function (id) { MS.state.sabor = id; render(); };
    MS.toggleTopping = function (group, id) {
        var list = MS.state.toppings[group];
        var idx = list.indexOf(id);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(id);
        render();
    };
    MS.toggleExtra = function (group, id) {
        var list = MS.state[group];
        if (!list) return;
        var idx = list.indexOf(id);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(id);
        render();
    };
    MS.selectWhey = function (id) {
        // Se whey é obrigatório, sempre 1 selecionado. Se não, toggle.
        if (MS.state.meta.wheyRequired) {
            MS.state.whey = id;
        } else {
            MS.state.whey = (MS.state.whey === id) ? null : id;
        }
        render();
    };
    MS.setObs = function (txt) { MS.state.obs = txt; };

    // expose com prefixo MS_ pra HTML usar
    window.MS_setStep = MS.setStep;
    window.MS_selectVariante = MS.selectVariante;
    window.MS_selectSabor = MS.selectSabor;
    window.MS_toggleTopping = MS.toggleTopping;
    window.MS_toggleExtra = MS.toggleExtra;
    window.MS_selectWhey = MS.selectWhey;
    window.MS_setObs = MS.setObs;

    // ============================================
    // ADD TO CART
    // ============================================
    MS.addToCart = function () {
        if (!MS.state.sabor) {
            alert('Escolha um sabor antes de adicionar ao carrinho.');
            MS.setStep(2);
            return;
        }
        if (MS.state.meta.wheyRequired && !MS.state.whey) {
            alert('Escolha o sabor do Whey antes de adicionar.');
            MS.setStep(4);
            return;
        }
        var v = curVar();
        var sabor = findSabor(MS.state.sabor);
        var total = calcTotal();
        var price3 = (MS.state.meta.toppingsCatalog.complementos && MS.state.meta.toppingsCatalog.complementos.price) || 3.00;
        var priceFruta = (MS.state.meta.toppingsCatalog.frutas && MS.state.meta.toppingsCatalog.frutas.price) || 4.00;
        var priceBorda = (MS.state.meta.toppingsCatalog.bordas && MS.state.meta.toppingsCatalog.bordas.price) || 5.00;
        var priceWhey = (MS.state.meta.toppingsCatalog.whey && MS.state.meta.toppingsCatalog.whey.price) || 5.99;

        // Lista descritiva pra carrinho/impressão
        var descParts = [];
        if (sabor) descParts.push('Sabor: ' + sabor.name);
        var toppingsCount = countedToppings();
        var freeLimit = freeToppingsLimit();
        var paid = paidToppingsCount();
        var allTopps = []
            .concat(MS.state.toppings.complementos.map(function (id) { return findItem('complementos', id); }))
            .concat(MS.state.toppings.caldas.map(function (id) { return findItem('caldas', id); }))
            .concat(MS.state.toppings.cremes.map(function (id) { return findItem('cremes', id); }))
            .filter(Boolean);
        if (allTopps.length) {
            var labels = allTopps.map(function (t, idx) {
                return (idx < freeLimit ? '✓ ' : '+ ') + t.name + (idx >= freeLimit ? ' (' + brl(price3) + ')' : '');
            });
            descParts.push('Toppings (' + allTopps.length + '): ' + labels.join(', '));
            if (paid > 0) descParts.push(paid + ' extras × ' + brl(price3) + ' = ' + brl(paid * price3));
        }
        if (MS.state.frutas.length) {
            var frt = MS.state.frutas.map(function (id) { return findItem('frutas', id); }).filter(Boolean);
            descParts.push('Frutas: ' + frt.map(function (f) { return f.name; }).join(', ') + ' (' + frt.length + ' × ' + brl(priceFruta) + ')');
        }
        if (MS.state.bordas.length) {
            var brd = MS.state.bordas.map(function (id) { return findItem('bordas', id); }).filter(Boolean);
            descParts.push('Bordas: ' + brd.map(function (b) { return b.name; }).join(', ') + ' (' + brd.length + ' × ' + brl(priceBorda) + ')');
        }
        if (MS.state.whey) {
            var w = findWhey(MS.state.whey);
            if (w) descParts.push('Whey: ' + w.name + ' (' + brl(priceWhey) + ' · +' + (MS.state.meta.proteinaPorScoop || 26) + 'g proteína)');
        }
        if (MS.state.obs) descParts.push('Obs: ' + MS.state.obs);

        var cartEntry = {
            id: MS.state.item.id,
            productId: MS.state.item.id,
            name: MS.state.item.name + ' — ' + v.name + (sabor ? ' · ' + sabor.name : ''),
            emoji: MS.state.item.emoji || '🍇',
            varianteId: v.id,
            varianteName: v.name,
            unitPrice: total,
            price: total,
            qty: 1,
            quantity: 1,
            type: 'monte_seu',
            isMonteSeu: true,
            monteSeuJeito: {
                tipo: MS.state.meta.tipo,
                variantId: v.id,
                sabor: sabor,
                toppings: {
                    complementos: MS.state.toppings.complementos.map(function (id) { return findItem('complementos', id); }).filter(Boolean),
                    caldas: MS.state.toppings.caldas.map(function (id) { return findItem('caldas', id); }).filter(Boolean),
                    cremes: MS.state.toppings.cremes.map(function (id) { return findItem('cremes', id); }).filter(Boolean)
                },
                frutas: MS.state.frutas.map(function (id) { return findItem('frutas', id); }).filter(Boolean),
                bordas: MS.state.bordas.map(function (id) { return findItem('bordas', id); }).filter(Boolean),
                whey: MS.state.whey ? findWhey(MS.state.whey) : null,
                breakdown: {
                    base: basePrice(),
                    freeToppingsLimit: freeLimit,
                    paidToppingsCount: paid,
                    paidToppingsTotal: paid * price3,
                    frutasTotal: MS.state.frutas.length * priceFruta,
                    bordasTotal: MS.state.bordas.length * priceBorda,
                    wheyTotal: MS.state.whey ? priceWhey : 0,
                    total: total
                }
            },
            description: descParts.join(' · '),
            obs: MS.state.obs
        };

        if (MS.state.opts && typeof MS.state.opts.onAdd === 'function') {
            MS.state.opts.onAdd(cartEntry);
        }
        MS.close();
    };
    window.MS_addToCart = MS.addToCart;

    // ============================================
    // RENDER
    // ============================================
    function render() {
        if (!MS.sheetEl || !MS.state) return;
        var step = MS.state.step;
        var html = renderHeader() + renderStepsBar() + '<div class="ms-body">' + renderStep(step) + '</div>' + renderFooter();
        MS.sheetEl.innerHTML = html + msStyles();
    }

    function renderHeader() {
        var item = MS.state.item;
        // FOTO (v235): se item tem imagem (catalog_config.sabores.items[].imagem),
        // mostra foto real no header em vez de emoji. Fallback emoji se sem imageUrl.
        // FALLBACK hardcoded (v237): mapa estático resiliente a sobrescrita Firestore
        var MS_IMG_MAP = {
            'prod_monte_acai': '/images/produtos/monte-seu/acai-montado.webp',
            'prod_monte_smoothie': '/images/produtos/monte-seu/smoothie.webp',
            'prod_monte_shake_proteico': '/images/produtos/monte-seu/shake-proteico.webp'
        };
        var imgSrc = (item.imagem || (item._v2 && item._v2.imagem) || MS_IMG_MAP[item.id] || '').trim();
        var leadVisual = imgSrc
            ? '<img class="ms-header-img" src="' + esc(imgSrc) + '" alt="' + esc(item.name) + '" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'inline\')"><span class="ms-header-emoji" style="display:none">' + esc(item.emoji || '🎨') + '</span>'
            : '<span class="ms-header-emoji">' + esc(item.emoji || '🎨') + '</span>';
        return ''
            + '<div class="ms-header">'
            + '  <div class="ms-header-info">'
            + '    ' + leadVisual
            + '    <div>'
            + '      <div class="ms-header-tag">MONTE O SEU JEITO</div>'
            + '      <div class="ms-header-title">' + esc(item.name) + '</div>'
            + '    </div>'
            + '  </div>'
            + '  <button class="ms-close" onclick="MonteSeuClose()" aria-label="Fechar">×</button>'
            + '</div>';
    }

    function renderStepsBar() {
        var step = MS.state.step;
        var labels = ['Tamanho', 'Sabor', 'Toppings', 'Extras', 'Revisão'];
        var html = '<div class="ms-steps">';
        for (var i = 1; i <= 5; i++) {
            var done = i < step;
            var active = i === step;
            html += '<button class="ms-step ' + (active ? 'active' : '') + ' ' + (done ? 'done' : '') + '" onclick="MS_setStep(' + i + ')">'
                + '<span class="ms-step-num">' + (done ? '✓' : i) + '</span>'
                + '<span class="ms-step-lbl">' + labels[i - 1] + '</span>'
                + '</button>';
            if (i < 5) html += '<span class="ms-step-sep"></span>';
        }
        html += '</div>';
        return html;
    }

    function renderStep(n) {
        switch (n) {
            case 1: return renderStep1Tamanho();
            case 2: return renderStep2Sabor();
            case 3: return renderStep3Toppings();
            case 4: return renderStep4Extras();
            case 5: return renderStep5Revisao();
        }
        return '';
    }

    // ----- STEP 1: TAMANHO -----
    function renderStep1Tamanho() {
        var ch = MS.state.channel;
        var priceKey = ch === 'loja' ? 'precoLoja' : (ch === 'ifood' ? 'precoIfood' : 'precoDelivery');
        var html = '<div class="ms-section">'
            + '<h3 class="ms-section-title">1. Escolha o tamanho</h3>'
            + '<p class="ms-section-sub">Quanto maior o copo, mais toppings você ganha!</p>'
            + '<div class="ms-sizes">';
        MS.state.variantes.forEach(function (v, i) {
            var active = i === MS.state.variantIdx;
            var price = Number(v[priceKey] || v.precoLoja || 0);
            var free = typeof v.toppingsGratis === 'number' ? v.toppingsGratis : (MS.state.meta.toppingsLimitPorTamanho || {})[v.id] || 2;
            html += '<button class="ms-size-card ' + (active ? 'active' : '') + '" onclick="MS_selectVariante(' + i + ')">'
                + '<div class="ms-size-name">' + esc(v.name) + '</div>'
                + '<div class="ms-size-price">' + brl(price) + '</div>'
                + '<div class="ms-size-badge">🎁 ' + free + ' toppings grátis</div>'
                + '</button>';
        });
        html += '</div></div>';
        return html;
    }

    // ----- STEP 2: SABOR -----
    function renderStep2Sabor() {
        var html = '<div class="ms-section">'
            + '<h3 class="ms-section-title">2. Escolha o sabor</h3>'
            + '<p class="ms-section-sub">Selecione 1 de 11 sabores</p>'
            + '<div class="ms-flavors">';
        (MS.state.meta.sabores || []).forEach(function (s) {
            var active = MS.state.sabor === s.id;
            html += '<button class="ms-flavor-card ' + (active ? 'active' : '') + '" onclick="MS_selectSabor(\'' + s.id + '\')">'
                + '<span class="ms-flavor-emoji">' + esc(s.emoji || '🍇') + '</span>'
                + '<span class="ms-flavor-name">' + esc(s.name) + '</span>'
                + (s.desc ? '<span class="ms-flavor-desc">' + esc(s.desc) + '</span>' : '')
                + '</button>';
        });
        html += '</div></div>';
        return html;
    }

    // ----- STEP 3: TOPPINGS -----
    function renderStep3Toppings() {
        var limit = freeToppingsLimit();
        var count = countedToppings();
        var paid = paidToppingsCount();
        var price3 = (MS.state.meta.toppingsCatalog.complementos && MS.state.meta.toppingsCatalog.complementos.price) || 3.00;
        var counterClass = paid > 0 ? 'over' : (count > 0 ? 'in' : '');

        var html = '<div class="ms-section">'
            + '<h3 class="ms-section-title">3. Escolha seus toppings</h3>'
            + '<div class="ms-counter ' + counterClass + '">'
            + '  <div class="ms-counter-row">'
            + '    <strong>' + count + ' selecionados</strong> · <span>' + limit + ' grátis</span>'
            + '    + <span class="ms-paid">' + paid + ' extras × ' + brl(price3) + ' = ' + brl(paid * price3) + '</span>'
            + '  </div>'
            + '  <div class="ms-counter-hint">' + (paid > 0
                ? '⚠ Você ultrapassou os toppings grátis — os extras serão cobrados.'
                : (count < limit ? '🎁 Você ainda pode escolher ' + (limit - count) + ' grátis.' : '✓ Cota grátis atingida — extras a partir do próximo.'))
            + '</div></div>';

        ['complementos', 'caldas', 'cremes'].forEach(function (group) {
            var cat = MS.state.meta.toppingsCatalog[group];
            if (!cat || !cat.items || !cat.items.length) return;
            var selected = MS.state.toppings[group];
            html += '<details class="ms-group" open>'
                + '<summary>' + esc(cat.name) + ' <span class="ms-group-meta">(' + brl(cat.price) + ' / ' + esc(cat.unit || '') + ')</span> <span class="ms-group-count">' + selected.length + '</span></summary>'
                + '<div class="ms-items">';
            cat.items.forEach(function (t) {
                var sel = selected.indexOf(t.id) >= 0;
                // Determina se este item específico cairá em "grátis" ou "extra"
                // Conta posição na ordem global de seleção
                var selOrder = -1;
                if (sel) {
                    var all = [].concat(MS.state.toppings.complementos, MS.state.toppings.caldas, MS.state.toppings.cremes);
                    selOrder = all.indexOf(t.id);
                }
                var isPaid = sel && selOrder >= limit;
                html += '<button class="ms-item ' + (sel ? 'sel' : '') + ' ' + (isPaid ? 'paid' : '') + '" onclick="MS_toggleTopping(\'' + group + '\',\'' + t.id + '\')">'
                    + '<span class="ms-item-check">' + (sel ? (isPaid ? '+' + (selOrder - limit + 1) : '✓') : '+') + '</span>'
                    + '<span class="ms-item-name">' + esc(t.name) + '</span>'
                    + (isPaid ? '<span class="ms-item-extra">+' + brl(t.price) + '</span>' : '')
                    + '</button>';
            });
            html += '</div></details>';
        });
        html += '</div>';
        return html;
    }

    // ----- STEP 4: EXTRAS (frutas, bordas, whey) -----
    function renderStep4Extras() {
        var meta = MS.state.meta;
        var html = '<div class="ms-section"><h3 class="ms-section-title">4. Finalize com extras</h3>';

        // FRUTAS
        var frutas = meta.toppingsCatalog.frutas;
        if (frutas && frutas.items && frutas.items.length) {
            html += '<details class="ms-group" open><summary>🍓 ' + esc(frutas.name) + ' <span class="ms-group-meta">(' + brl(frutas.price) + ')</span> <span class="ms-group-count">' + MS.state.frutas.length + '</span></summary><div class="ms-items">';
            frutas.items.forEach(function (f) {
                var sel = MS.state.frutas.indexOf(f.id) >= 0;
                html += '<button class="ms-item always-paid ' + (sel ? 'sel' : '') + '" onclick="MS_toggleExtra(\'frutas\',\'' + f.id + '\')">'
                    + '<span class="ms-item-check">' + esc(f.emoji || (sel ? '✓' : '+')) + '</span>'
                    + '<span class="ms-item-name">' + esc(f.name) + '</span>'
                    + '<span class="ms-item-extra">+' + brl(f.price) + '</span>'
                    + '</button>';
            });
            html += '</div></details>';
        }

        // BORDAS
        var bordas = meta.toppingsCatalog.bordas;
        if (bordas && bordas.items && bordas.items.length) {
            html += '<details class="ms-group"><summary>🎨 ' + esc(bordas.name) + ' <span class="ms-group-meta">(' + brl(bordas.price) + ')</span> <span class="ms-group-count">' + MS.state.bordas.length + '</span></summary><div class="ms-items">';
            bordas.items.forEach(function (b) {
                var sel = MS.state.bordas.indexOf(b.id) >= 0;
                html += '<button class="ms-item always-paid ' + (sel ? 'sel' : '') + '" onclick="MS_toggleExtra(\'bordas\',\'' + b.id + '\')">'
                    + '<span class="ms-item-check">' + (sel ? '✓' : '+') + '</span>'
                    + '<span class="ms-item-name">' + esc(b.name) + '</span>'
                    + '<span class="ms-item-extra">+' + brl(b.price) + '</span>'
                    + '</button>';
            });
            html += '</div></details>';
        }

        // WHEY (sempre mostrar se categoria existe)
        var whey = meta.toppingsCatalog.whey;
        if (whey && whey.items && whey.items.length) {
            var required = meta.wheyRequired;
            html += '<details class="ms-group ' + (required ? 'required' : '') + '" ' + (required ? 'open' : '') + '><summary>💪 ' + esc(whey.name) + ' <span class="ms-group-meta">(' + brl(whey.price) + ' · +' + (meta.proteinaPorScoop || 26) + 'g proteína)</span>' + (required ? ' <span class="ms-required-badge">OBRIGATÓRIO</span>' : '') + '</summary><div class="ms-items">';
            if (required) {
                html += '<div class="ms-whey-info">⚠ Shake Proteico exige 1 sabor de Whey. Escolha:</div>';
            } else {
                html += '<div class="ms-whey-info">💡 Adicione Whey pra virar Shake Proteico — +26g de proteína.</div>';
            }
            whey.items.forEach(function (w) {
                var sel = MS.state.whey === w.id;
                html += '<button class="ms-item always-paid whey-item ' + (sel ? 'sel' : '') + '" onclick="MS_selectWhey(\'' + w.id + '\')">'
                    + '<span class="ms-item-check">' + esc(w.emoji || (sel ? '✓' : '+')) + '</span>'
                    + '<span class="ms-item-name">' + esc(w.name) + '</span>'
                    + '<span class="ms-item-extra">+' + brl(w.price) + '</span>'
                    + '</button>';
            });
            html += '</div></details>';
        }

        // OBSERVAÇÕES
        html += '<div class="ms-obs-wrap"><label>📝 Observações (opcional)</label>'
            + '<textarea class="ms-obs" oninput="MS_setObs(this.value)" placeholder="Sem amendoim · Pouco açúcar · etc">' + esc(MS.state.obs) + '</textarea></div>';

        html += '</div>';
        return html;
    }

    // ----- STEP 5: REVISÃO -----
    function renderStep5Revisao() {
        var v = curVar();
        var sabor = findSabor(MS.state.sabor);
        var price3 = (MS.state.meta.toppingsCatalog.complementos && MS.state.meta.toppingsCatalog.complementos.price) || 3.00;
        var priceFruta = (MS.state.meta.toppingsCatalog.frutas && MS.state.meta.toppingsCatalog.frutas.price) || 4.00;
        var priceBorda = (MS.state.meta.toppingsCatalog.bordas && MS.state.meta.toppingsCatalog.bordas.price) || 5.00;
        var priceWhey = (MS.state.meta.toppingsCatalog.whey && MS.state.meta.toppingsCatalog.whey.price) || 5.99;
        var base = basePrice();
        var freeLimit = freeToppingsLimit();
        var paid = paidToppingsCount();

        var html = '<div class="ms-section"><h3 class="ms-section-title">5. Revisão</h3>'
            + '<div class="ms-summary">';

        html += '<div class="ms-summary-row main">'
            + '<strong>' + esc(MS.state.item.name) + ' — ' + esc(v.name) + '</strong>'
            + '<span>' + brl(base) + '</span></div>';
        if (sabor) html += '<div class="ms-summary-row"><span>Sabor: <b>' + esc(sabor.name) + '</b></span><span></span></div>';

        // Toppings
        var allTopps = []
            .concat(MS.state.toppings.complementos.map(function (id) { return findItem('complementos', id); }))
            .concat(MS.state.toppings.caldas.map(function (id) { return findItem('caldas', id); }))
            .concat(MS.state.toppings.cremes.map(function (id) { return findItem('cremes', id); }))
            .filter(Boolean);
        if (allTopps.length) {
            html += '<div class="ms-summary-row"><span>' + allTopps.length + ' toppings · ' + freeLimit + ' grátis</span><span></span></div>';
            html += '<div class="ms-summary-sub">' + allTopps.map(function (t) { return esc(t.name); }).join(' · ') + '</div>';
            if (paid > 0) html += '<div class="ms-summary-row"><span>+ ' + paid + ' extras × ' + brl(price3) + '</span><span>' + brl(paid * price3) + '</span></div>';
        }

        if (MS.state.frutas.length) {
            var frtNames = MS.state.frutas.map(function (id) { var f = findItem('frutas', id); return f ? f.name : ''; }).filter(Boolean);
            html += '<div class="ms-summary-row"><span>Frutas (' + MS.state.frutas.length + '): ' + esc(frtNames.join(', ')) + '</span><span>' + brl(MS.state.frutas.length * priceFruta) + '</span></div>';
        }
        if (MS.state.bordas.length) {
            var brdNames = MS.state.bordas.map(function (id) { var b = findItem('bordas', id); return b ? b.name : ''; }).filter(Boolean);
            html += '<div class="ms-summary-row"><span>Bordas: ' + esc(brdNames.join(', ')) + '</span><span>' + brl(MS.state.bordas.length * priceBorda) + '</span></div>';
        }
        if (MS.state.whey) {
            var w = findWhey(MS.state.whey);
            if (w) html += '<div class="ms-summary-row"><span>💪 Whey ' + esc(w.name.replace(/^Whey /, '')) + ' (+26g proteína)</span><span>' + brl(priceWhey) + '</span></div>';
        }
        if (MS.state.obs) html += '<div class="ms-summary-obs">📝 ' + esc(MS.state.obs) + '</div>';

        html += '<div class="ms-summary-total"><span>Total</span><strong>' + brl(calcTotal()) + '</strong></div>';
        html += '</div></div>';
        return html;
    }

    // ----- FOOTER -----
    function renderFooter() {
        var step = MS.state.step;
        var total = calcTotal();
        var canNext = true;
        if (step === 2 && !MS.state.sabor) canNext = false;
        if (step === 4 && MS.state.meta.wheyRequired && !MS.state.whey) canNext = false;
        var isLast = step === 5;
        var nextLbl = isLast ? '+ Adicionar ao carrinho · ' + brl(total) : 'Continuar →';
        var nextAction = isLast ? 'MS_addToCart()' : 'MS_setStep(' + (step + 1) + ')';
        return ''
            + '<div class="ms-footer">'
            + '  <div class="ms-footer-total"><span>Total</span><strong>' + brl(total) + '</strong></div>'
            + '  <div class="ms-footer-btns">'
            + (step > 1 ? '<button class="ms-btn-back" onclick="MS_setStep(' + (step - 1) + ')">← Voltar</button>' : '')
            + '    <button class="ms-btn-next ' + (canNext ? '' : 'disabled') + '" ' + (canNext ? '' : 'disabled') + ' onclick="' + nextAction + '">' + nextLbl + '</button>'
            + '  </div>'
            + '</div>';
    }

    // ============================================
    // STYLES (injetado uma vez por render — auto-substitui)
    // ============================================
    function msStyles() {
        return '<style>'
            + '#productSheet{display:flex;flex-direction:column;max-height:96vh;height:96vh;overflow:hidden;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -8px 32px rgba(0,0,0,.2);padding:0}'
            + '@media(min-width:768px){#productSheet{max-width:560px;left:50%;transform:translateX(-50%);bottom:2vh;border-radius:20px;height:auto;max-height:90vh}}'
            + '.ms-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 12px;border-bottom:1px solid #eee;background:linear-gradient(135deg,#EC407A 0%,#AB47BC 50%,#5E35B1 100%);color:#fff;flex-shrink:0}'
            + '.ms-header-info{display:flex;align-items:center;gap:12px}'
            + '.ms-header-emoji{font-size:34px;line-height:1}'
            + '.ms-header-img{width:56px;height:56px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,.3);box-shadow:0 4px 12px rgba(0,0,0,.18)}'
            + '.ms-header-tag{font-size:11px;letter-spacing:1.5px;font-weight:700;opacity:.9}'
            + '.ms-header-title{font-size:22px;font-weight:800;line-height:1.1;margin-top:2px}'
            + '.ms-close{background:rgba(255,255,255,.25);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer}'
            + '.ms-close:hover{background:rgba(255,255,255,.4)}'
            + '.ms-steps{display:flex;align-items:center;padding:14px 14px 10px;border-bottom:1px solid #eee;background:#FAFAFA;flex-shrink:0}'
            + '.ms-step{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;cursor:pointer;flex:0 0 auto;padding:4px 6px}'
            + '.ms-step-num{width:30px;height:30px;border-radius:50%;background:#E0E0E0;color:#666;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;transition:.2s}'
            + '.ms-step-lbl{font-size:10px;color:#888;font-weight:700;letter-spacing:.3px}'
            + '.ms-step.active .ms-step-num{background:#EC407A;color:#fff;box-shadow:0 2px 8px rgba(236,64,122,.4)}'
            + '.ms-step.active .ms-step-lbl{color:#EC407A}'
            + '.ms-step.done .ms-step-num{background:#4CAF50;color:#fff}'
            + '.ms-step-sep{flex:1;height:2px;background:#E0E0E0;margin:0 4px;position:relative;top:-9px}'
            + '.ms-body{flex:1;overflow-y:auto;padding:18px 18px 100px}'
            + '.ms-section-title{font-size:18px;font-weight:800;color:#222;margin:0 0 4px}'
            + '.ms-section-sub{color:#777;margin:0 0 16px;font-size:14px}'
            + '.ms-sizes{display:grid;gap:10px}'
            + '.ms-size-card{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px;border:2px solid #E0E0E0;border-radius:14px;background:#fff;cursor:pointer;text-align:left;transition:.18s}'
            + '.ms-size-card:hover{border-color:#EC407A}'
            + '.ms-size-card.active{border-color:#EC407A;background:linear-gradient(135deg,#FFF0F5 0%,#FFE8F2 100%);box-shadow:0 2px 10px rgba(236,64,122,.2)}'
            + '.ms-size-name{font-size:17px;font-weight:800;color:#222}'
            + '.ms-size-price{font-size:22px;font-weight:900;color:#EC407A}'
            + '.ms-size-badge{font-size:12px;font-weight:700;color:#7B1FA2;background:#F3E5F5;padding:3px 8px;border-radius:10px}'
            + '.ms-flavors{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
            + '.ms-flavor-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px;border:2px solid #E0E0E0;border-radius:12px;background:#fff;cursor:pointer;text-align:center;transition:.18s}'
            + '.ms-flavor-card:hover{border-color:#AB47BC;transform:translateY(-1px)}'
            + '.ms-flavor-card.active{border-color:#AB47BC;background:linear-gradient(135deg,#F3E5F5 0%,#E1BEE7 100%);box-shadow:0 2px 12px rgba(171,71,188,.25)}'
            + '.ms-flavor-emoji{font-size:30px;line-height:1}'
            + '.ms-flavor-name{font-size:13px;font-weight:800;color:#222;line-height:1.1}'
            + '.ms-flavor-desc{font-size:11px;color:#777;display:none}'
            + '.ms-counter{padding:12px 14px;border-radius:12px;background:#FAFAFA;margin-bottom:14px;border:1px solid #E0E0E0}'
            + '.ms-counter.in{background:#FFF8E1;border-color:#FFD54F}'
            + '.ms-counter.over{background:#FFEBEE;border-color:#E57373}'
            + '.ms-counter-row{font-size:14px;color:#333;margin-bottom:4px}'
            + '.ms-counter .ms-paid{color:#E53935;font-weight:800}'
            + '.ms-counter-hint{font-size:12px;color:#666}'
            + '.ms-counter.over .ms-counter-hint{color:#E53935;font-weight:600}'
            + '.ms-group{border:1px solid #E0E0E0;border-radius:12px;margin-bottom:10px;background:#fff;overflow:hidden}'
            + '.ms-group summary{padding:12px 14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;list-style:none;background:#FAFAFA}'
            + '.ms-group summary::-webkit-details-marker{display:none}'
            + '.ms-group-meta{font-size:12px;color:#999;font-weight:500}'
            + '.ms-group-count{margin-left:auto;background:#EC407A;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:800;min-width:20px;text-align:center}'
            + '.ms-items{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px}'
            + '@media(max-width:380px){.ms-items{grid-template-columns:1fr}}'
            + '.ms-item{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #E0E0E0;border-radius:10px;background:#fff;cursor:pointer;text-align:left;font-size:13px;transition:.15s}'
            + '.ms-item:hover{border-color:#AB47BC;background:#FAFAFA}'
            + '.ms-item.sel{border-color:#4CAF50;background:#E8F5E9}'
            + '.ms-item.sel.paid{border-color:#E57373;background:#FFEBEE}'
            + '.ms-item.always-paid.sel{border-color:#FF9800;background:#FFF3E0}'
            + '.ms-item-check{width:24px;height:24px;border-radius:50%;background:#F5F5F5;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0}'
            + '.ms-item.sel .ms-item-check{background:#4CAF50;color:#fff}'
            + '.ms-item.sel.paid .ms-item-check{background:#E53935;color:#fff}'
            + '.ms-item.always-paid.sel .ms-item-check{background:#FF9800;color:#fff}'
            + '.ms-item-name{flex:1;font-weight:600;color:#333}'
            + '.ms-item-extra{font-size:11px;font-weight:800;color:#E53935;background:#FFEBEE;padding:2px 6px;border-radius:8px}'
            + '.ms-item.always-paid.sel .ms-item-extra{background:#FFF3E0;color:#E65100}'
            + '.ms-required-badge{margin-left:auto;background:#FFC107;color:#000;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800}'
            + '.ms-whey-info{padding:8px 12px;background:#E3F2FD;border-radius:8px;font-size:12px;color:#1565C0;margin-bottom:8px}'
            + '.ms-group.required .ms-whey-info{background:#FFF8E1;color:#F57C00}'
            + '.ms-obs-wrap{margin-top:14px}'
            + '.ms-obs-wrap label{font-size:13px;font-weight:700;color:#333;display:block;margin-bottom:6px}'
            + '.ms-obs{width:100%;border:1px solid #E0E0E0;border-radius:10px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;min-height:60px}'
            + '.ms-summary{background:#FAFAFA;border:1px solid #E0E0E0;border-radius:12px;padding:14px}'
            + '.ms-summary-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}'
            + '.ms-summary-row.main{border-bottom:1px solid #E0E0E0;padding-bottom:10px;margin-bottom:6px;font-size:15px}'
            + '.ms-summary-sub{font-size:12px;color:#666;padding:0 0 6px 4px}'
            + '.ms-summary-obs{font-size:13px;color:#444;padding:8px;background:#FFF8E1;border-radius:8px;margin-top:6px}'
            + '.ms-summary-total{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #EC407A;padding-top:10px;margin-top:10px;font-size:17px}'
            + '.ms-summary-total strong{font-size:24px;color:#EC407A;font-weight:900}'
            + '.ms-footer{position:absolute;bottom:0;left:0;right:0;padding:12px 14px;background:#fff;border-top:1px solid #E0E0E0;display:flex;flex-direction:column;gap:10px;flex-shrink:0;box-shadow:0 -4px 12px rgba(0,0,0,.08)}'
            + '.ms-footer-total{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#666}'
            + '.ms-footer-total strong{font-size:22px;color:#EC407A;font-weight:900}'
            + '.ms-footer-btns{display:flex;gap:10px}'
            + '.ms-btn-back{flex:0 0 90px;padding:14px 0;border:1px solid #E0E0E0;background:#fff;border-radius:12px;font-weight:700;cursor:pointer;color:#666;font-size:14px}'
            + '.ms-btn-next{flex:1;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#EC407A 0%,#AB47BC 100%);color:#fff;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 2px 12px rgba(236,64,122,.4)}'
            + '.ms-btn-next:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(236,64,122,.5)}'
            + '.ms-btn-next.disabled,.ms-btn-next:disabled{background:#BDBDBD;cursor:not-allowed;box-shadow:none}'
            + '</style>';
    }

    window.MonteSeuFlow = MS;
})();
