/**
 * MilkyPot - Sidebar Menu Component
 *
 * Renderiza um menu lateral colapsavel com categorias inteligentes.
 * Substitui o HTML estatico que estava duplicado em 41+ paginas.
 *
 * COMO FUNCIONA:
 * - Procura por `.sidebar-nav` em cada pagina e substitui o conteudo.
 * - Detecta a pagina ativa via location.pathname e:
 *     1. Marca o link como active
 *     2. Auto-expande a categoria que contem o link ativo
 * - Categorias colapsam/expandem clicando no header (com animacao CSS).
 * - Estado de "aberto/fechado" das categorias salvo em localStorage
 *   por categoria (chave 'mp_sidebar_open_<id>').
 *
 * COMO ADICIONAR/EDITAR ITEM:
 * Edite o array MENU_STRUCTURE abaixo. Recarregar a pagina ja aplica.
 *
 * COMO USAR EM UMA PAGINA NOVA:
 *   <nav class="sidebar-nav"></nav>
 *   <script src="../js/core/sidebar-menu.js" defer></script>
 */
(function () {
    'use strict';

    // ============================================================
    // ESTRUTURA DO MENU - categorias inteligentes
    // ============================================================
    // Cada categoria tem:
    //   id: chave unica (usada pra persistir aberto/fechado)
    //   label: nome exibido
    //   icon: emoji
    //   defaultOpen: bool — se abre por padrao
    //   highlight: bool — destaca visualmente (gradient)
    //   items: array de links
    // Cada item:
    //   href: URL (relativa do painel)
    //   label: texto
    //   icon: emoji
    //   badge: opcional, ID do elemento DOM pra contador (ex: 'newOrdersCount')
    //   highlight: bool — destaca visualmente
    //   highlightColor: cor da borda (ex: '#25D366')
    const MENU_STRUCTURE = [
        // ========== Operação Diária (sempre aberta - tudo que o caixa usa todo dia) ==========
        {
            id: 'operacao',
            label: 'Operação Diária',
            icon: '🏪',
            defaultOpen: true,
            items: [
                { href: 'index.html', label: 'Dashboard', icon: '📊' },
                { href: 'pdv.html', label: 'PDV / Caixa', icon: '🛒', highlight: true, highlightColor: '#FFD54F' },
                { href: 'pedidos.html', label: 'Pedidos', icon: '📋', badge: 'newOrdersCount' },
                { href: 'entregas.html', label: 'Entregas', icon: '🛵' },
                { href: 'ponto.html', label: 'Ponto Eletrônico', icon: '⏰' }
            ]
        },

        // ========== Belinha & WhatsApp ==========
        {
            id: 'belinha',
            label: 'Belinha & WhatsApp',
            icon: '🐑',
            defaultOpen: false,
            highlight: true,
            items: [
                { href: 'whatsapp-conectar.html', label: 'Conectar WhatsApp', icon: '📱', highlight: true, highlightColor: '#25D366' },
                { href: 'whatsapp-conversas.html', label: 'Conversas Belinha', icon: '💬' },
                { href: 'copilot-belinha.html', label: 'Belinha IA (Copilot)', icon: '🐑', highlight: true, highlightColor: '#FF4F8A' },
                { href: 'belinha-learnings.html', label: 'Treinar Belinha', icon: '🧠' }
            ]
        },

        // ========== Financeiro ==========
        {
            id: 'financeiro',
            label: 'Financeiro',
            icon: '💰',
            defaultOpen: false,
            items: [
                { href: 'financeiro.html', label: 'Visão Geral', icon: '💰' },
                { href: 'finance-os.html', label: 'Finance OS', icon: '🧮' },
                { href: 'fluxo-caixa.html', label: 'Fluxo de Caixa', icon: '💸' },
                { href: 'despesas.html', label: 'Despesas', icon: '🧾' },
                { href: 'conciliacao.html', label: 'Conciliação', icon: '🔄' },
                { href: 'fiscal.html', label: 'Fiscal / NFC-e', icon: '📑' },
                { href: 'escanear-nota.html', label: 'Escanear Nota', icon: '📸' },
                { href: 'auditoria.html', label: 'Auditoria', icon: '🔍' },
                { href: 'analise.html', label: 'Inteligência / BI', icon: '🧠' },
                { href: 'analytics.html', label: 'Analytics', icon: '📈' }
            ]
        },

        // ========== Produtos & Estoque ==========
        {
            id: 'produtos',
            label: 'Produtos & Estoque',
            icon: '🍦',
            defaultOpen: false,
            items: [
                { href: 'produtos.html', label: 'Catálogo Produtos', icon: '🍨' },
                { href: 'picoles.html', label: 'Picolés', icon: '🍡' },
                { href: 'estoque-inteligente.html', label: 'Estoque Inteligente', icon: '📦' },
                { href: 'compras.html', label: 'Compras', icon: '🛒' }
            ]
        },

        // ========== Equipe ==========
        {
            id: 'equipe',
            label: 'Equipe',
            icon: '👥',
            defaultOpen: false,
            items: [
                { href: 'equipe.html', label: 'Cadastro Equipe', icon: '👥' },
                { href: 'ponto.html', label: 'Ponto Eletrônico', icon: '⏰' },
                { href: 'folha.html', label: 'Folha de Pagamento', icon: '💵' },
                { href: 'relatorio-clt.html', label: 'Relatório CLT', icon: '📋' },
                { href: 'colaboradores-hub.html', label: 'Hub Colaboradores', icon: '🏢' },
                { href: 'operacional.html', label: 'Operacional', icon: '🎯' }
            ]
        },

        // ========== Fidelização ==========
        {
            id: 'fidelizacao',
            label: 'Fidelização Cliente',
            icon: '🎁',
            defaultOpen: false,
            items: [
                { href: 'fidelidade.html', label: 'Programa Fidelidade', icon: '🎁' },
                { href: 'recompensas.html', label: 'Recompensas', icon: '⭐' },
                { href: 'raspinha-config.html', label: 'Prêmios Raspinha', icon: '🎰' },
                { href: 'promocoes-oficiais.html', label: 'Promoções Oficiais', icon: '🏷️' }
            ]
        },

        // ========== Mídia In-Store ==========
        {
            id: 'midia',
            label: 'Mídia In-Store',
            icon: '📺',
            defaultOpen: false,
            items: [
                { href: 'tv-indoor.html', label: 'TV Indoor', icon: '📺' },
                { href: 'tv-desafio-slides.html', label: 'Slides Desafio', icon: '🎯' },
                { href: 'tv-slides-generator.html', label: 'Gerador de Slides', icon: '🎨' },
                { href: 'tv-auto-stories.html', label: 'Auto Stories', icon: '✨' },
                { href: 'tv-ugc-curadoria.html', label: 'UGC / Curadoria', icon: '👀' },
                { href: 'tv-promo-metrics.html', label: 'Métricas TV', icon: '📊' },
                { href: 'hall-fama.html', label: 'Hall da Fama', icon: '🏆' },
                { href: 'radio-indoor.html', label: 'Rádio Indoor', icon: '📻' }
            ]
        },

        // ========== Marketing & Crescimento ==========
        {
            id: 'marketing',
            label: 'Marketing & Site',
            icon: '📢',
            defaultOpen: false,
            items: [
                { href: '#', label: 'Meu Site', icon: '🌐', id: 'linkSiteFranquia' },
                { href: 'marketing.html', label: 'Campanhas', icon: '📢' },
                { href: 'ifood.html', label: 'iFood / Delivery', icon: '🛵' },
                { href: 'uber-entregas.html', label: 'Uber Direct', icon: '🚗' },
                { href: 'plano-acao.html', label: 'Plano de Ação', icon: '🚨', highlight: true, highlightColor: '#DC2626' },
                { href: 'arsenal.html', label: 'Arsenal', icon: '🎮', highlight: true, highlightColor: '#6C63FF' },
                { href: 'simulador.html', label: 'Simulador', icon: '🎲' }
            ]
        },

        // ========== Franquias (só admin master vê isso) ==========
        {
            id: 'franquia',
            label: 'Franquia',
            icon: '🐑',
            defaultOpen: false,
            items: [
                { href: 'franquia-leads.html', label: 'Leads VIP', icon: '🐑', highlight: true, highlightColor: '#7B1FA2' }
            ]
        },

        // ========== Configurações ==========
        {
            id: 'config',
            label: 'Configurações',
            icon: '⚙️',
            defaultOpen: false,
            items: [
                { href: 'configuracoes.html', label: 'Geral', icon: '⚙️' },
                { href: 'configurar-impressao-automatica.html', label: 'Impressão Automática', icon: '🖨️', highlight: true, highlightColor: '#FF9800' },
                { href: 'test-checklist.html', label: 'Checklist', icon: '🧪' }
            ]
        }
    ];

    // ============================================================
    // RENDER
    // ============================================================

    function getCurrentPage() {
        var path = location.pathname || '';
        var last = path.split('/').pop() || 'index.html';
        return last.toLowerCase();
    }

    function isActive(href, currentPage) {
        if (!href || href === '#') return false;
        return href.toLowerCase() === currentPage;
    }

    function getCategoryOpenState(catId, defaultOpen, containsActive) {
        // Se a categoria contem o link ativo, abre forcado
        if (containsActive) return true;
        // Senao, respeita o estado salvo, ou o default
        try {
            var saved = localStorage.getItem('mp_sidebar_open_' + catId);
            if (saved === '1') return true;
            if (saved === '0') return false;
        } catch (e) {}
        return defaultOpen;
    }

    function saveOpenState(catId, isOpen) {
        try {
            localStorage.setItem('mp_sidebar_open_' + catId, isOpen ? '1' : '0');
        } catch (e) {}
    }

    function renderItem(item, currentPage) {
        var active = isActive(item.href, currentPage);
        var classes = ['sidebar-link', 'mp-menu-item'];
        if (active) classes.push('active');

        var style = '';
        if (item.highlight && item.highlightColor) {
            var color = item.highlightColor;
            // gradient sutil com a cor do highlight
            style = 'background:linear-gradient(135deg,' + color + '22,' + color + '0d);border-left:3px solid ' + color + ';';
        }

        var badge = '';
        if (item.badge) {
            badge = '<span class="badge-count" id="' + item.badge + '">0</span>';
        }

        var idAttr = item.id ? ' id="' + item.id + '"' : '';
        var styleAttr = style ? ' style="' + style + '"' : '';

        return '<a href="' + item.href + '" class="' + classes.join(' ') + '"' + idAttr + styleAttr + '>' +
                '<span class="icon">' + item.icon + '</span> ' +
                '<span class="mp-menu-label">' + item.label + '</span>' +
                badge +
            '</a>';
    }

    function renderCategory(cat, currentPage) {
        var containsActive = cat.items.some(function (i) { return isActive(i.href, currentPage); });
        var isOpen = getCategoryOpenState(cat.id, cat.defaultOpen, containsActive);

        var headerClasses = ['mp-menu-cat-header'];
        if (cat.highlight) headerClasses.push('highlight');
        if (isOpen) headerClasses.push('open');

        var itemsHtml = cat.items.map(function (i) { return renderItem(i, currentPage); }).join('');

        return '<div class="mp-menu-cat" data-cat-id="' + cat.id + '" data-open="' + (isOpen ? '1' : '0') + '">' +
                '<button class="' + headerClasses.join(' ') + '" type="button" data-cat-toggle="' + cat.id + '">' +
                    '<span class="mp-menu-cat-icon">' + cat.icon + '</span>' +
                    '<span class="mp-menu-cat-label">' + cat.label + '</span>' +
                    '<span class="mp-menu-cat-chevron">▾</span>' +
                '</button>' +
                '<div class="mp-menu-cat-items" data-cat-items="' + cat.id + '" style="' +
                    (isOpen ? '' : 'max-height:0;overflow:hidden') + '">' +
                    itemsHtml +
                '</div>' +
            '</div>';
    }

    function renderMenu() {
        var nav = document.querySelector('.sidebar-nav');
        if (!nav) return false;
        // Defensivo: nao re-renderiza se ja foi renderizado
        if (nav.dataset.mpRendered === '1') return true;

        var currentPage = getCurrentPage();

        // BUSCA RAPIDA — input no topo do menu
        var searchHtml = '<div class="mp-menu-search">' +
            '<span class="mp-menu-search-icon">🔍</span>' +
            '<input type="text" class="mp-menu-search-input" id="mpMenuSearchInput" ' +
                'placeholder="Buscar página... (Ctrl+K)" autocomplete="off">' +
            '<span class="mp-menu-search-shortcut">Ctrl K</span>' +
            '</div>';

        var menuHtml = '<div class="mp-menu-list">' +
            MENU_STRUCTURE.map(function (cat) {
                return renderCategory(cat, currentPage);
            }).join('') +
            '</div>';

        // Resultados da busca (escondido por padrao)
        var resultsHtml = '<div class="mp-menu-search-results" id="mpMenuSearchResults" style="display:none"></div>';

        nav.innerHTML = searchHtml + resultsHtml + menuHtml;
        nav.dataset.mpRendered = '1';
        nav.classList.add('mp-menu-collapsible');

        bindToggleEvents(nav);
        bindSearchEvents(nav);
        bindCommandPalette();
        return true;
    }

    // ============================================================
    // BUSCA RAPIDA + COMMAND PALETTE
    // ============================================================

    // Achata MENU_STRUCTURE numa lista plana com category breadcrumb
    function getAllItems() {
        var out = [];
        MENU_STRUCTURE.forEach(function (cat) {
            cat.items.forEach(function (item) {
                if (!item.href || item.href === '#') return;
                out.push({
                    href: item.href,
                    label: item.label,
                    icon: item.icon,
                    catLabel: cat.label,
                    catIcon: cat.icon,
                    keywords: (item.keywords || []).concat([item.label, cat.label]).join(' ').toLowerCase(),
                    highlight: !!item.highlight,
                    highlightColor: item.highlightColor
                });
            });
        });
        // Sinonimos extras pra ajudar busca em portugues
        var EXTRA = {
            'pdv.html': 'caixa venda atender finalizar pedido cartao dinheiro pix',
            'pedidos.html': 'pedido entrega delivery ifood',
            'entregas.html': 'delivery motoboy entregar',
            'ponto.html': 'bater ponto funcionario clt jornada',
            'financeiro.html': 'dinheiro lucro receita faturamento',
            'despesas.html': 'gasto custo conta pagar',
            'fiscal.html': 'nota nfce nfe imposto',
            'estoque-inteligente.html': 'inventario produto faltando',
            'compras.html': 'comprar fornecedor pedido compra',
            'equipe.html': 'funcionario colaborador rh',
            'fidelidade.html': 'clube milkyclube ponto cliente vip',
            'raspinha-config.html': 'sorteio premio raspar',
            'tv-indoor.html': 'televisao loja tv',
            'marketing.html': 'campanha promocao anuncio',
            'plano-acao.html': 'urgente prioridade tarefa',
            'configuracoes.html': 'config setting ajuste',
            'configurar-impressao-automatica.html': 'impressora termica nao fiscal recibo kiosk printing chrome flag',
            'whatsapp-conectar.html': 'whatsapp zap qr code conectar',
            'whatsapp-conversas.html': 'whatsapp zap conversa mensagem',
            'copilot-belinha.html': 'belinha ia bot ajuda copilot',
            'belinha-learnings.html': 'belinha treinar ensinar resposta'
        };
        out.forEach(function (it) {
            if (EXTRA[it.href]) it.keywords += ' ' + EXTRA[it.href];
        });
        return out;
    }

    function fuzzyMatch(haystack, needle) {
        if (!needle) return true;
        needle = needle.toLowerCase().trim();
        if (!needle) return true;
        // Substring direta
        if (haystack.indexOf(needle) !== -1) return true;
        // Substring com cada palavra do needle (todas precisam dar match)
        var words = needle.split(/\s+/);
        return words.every(function (w) { return haystack.indexOf(w) !== -1; });
    }

    function searchItems(query) {
        if (!query || !query.trim()) return [];
        var all = getAllItems();
        return all.filter(function (it) { return fuzzyMatch(it.keywords, query); }).slice(0, 12);
    }

    function renderSearchResults(results, query) {
        if (!results.length) {
            return '<div class="mp-menu-search-empty">Nenhuma página encontrada para "' +
                escapeHtml(query) + '"</div>';
        }
        return results.map(function (r, idx) {
            var style = '';
            if (r.highlight && r.highlightColor) {
                style = 'border-left:3px solid ' + r.highlightColor + ';';
            }
            return '<a href="' + r.href + '" class="mp-menu-search-result" data-search-idx="' + idx + '" ' +
                'style="' + style + '">' +
                '<span class="mp-menu-search-result-icon">' + r.icon + '</span>' +
                '<div class="mp-menu-search-result-text">' +
                    '<div class="mp-menu-search-result-label">' + escapeHtml(r.label) + '</div>' +
                    '<div class="mp-menu-search-result-cat">' + r.catIcon + ' ' + escapeHtml(r.catLabel) + '</div>' +
                '</div>' +
                '</a>';
        }).join('');
    }

    function escapeHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function bindSearchEvents(nav) {
        var input = nav.querySelector('#mpMenuSearchInput');
        var results = nav.querySelector('#mpMenuSearchResults');
        var menuList = nav.querySelector('.mp-menu-list');
        if (!input || !results || !menuList) return;

        var selectedIdx = 0;
        var currentResults = [];

        function update() {
            var q = input.value;
            if (!q || !q.trim()) {
                results.style.display = 'none';
                menuList.style.display = '';
                results.innerHTML = '';
                currentResults = [];
                return;
            }
            currentResults = searchItems(q);
            selectedIdx = 0;
            results.innerHTML = renderSearchResults(currentResults, q);
            results.style.display = 'block';
            menuList.style.display = 'none';
            highlightSelected();
        }

        function highlightSelected() {
            results.querySelectorAll('.mp-menu-search-result').forEach(function (el, idx) {
                el.classList.toggle('selected', idx === selectedIdx);
            });
        }

        input.addEventListener('input', update);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                input.value = '';
                update();
                input.blur();
            } else if (e.key === 'ArrowDown' && currentResults.length) {
                e.preventDefault();
                selectedIdx = Math.min(selectedIdx + 1, currentResults.length - 1);
                highlightSelected();
            } else if (e.key === 'ArrowUp' && currentResults.length) {
                e.preventDefault();
                selectedIdx = Math.max(selectedIdx - 1, 0);
                highlightSelected();
            } else if (e.key === 'Enter' && currentResults.length) {
                e.preventDefault();
                var target = currentResults[selectedIdx];
                if (target) {
                    location.href = target.href;
                }
            }
        });
    }

    // COMMAND PALETTE — overlay global ativado por Ctrl+K
    function openCommandPalette() {
        if (document.getElementById('mpCommandPalette')) return;

        var overlay = document.createElement('div');
        overlay.id = 'mpCommandPalette';
        overlay.className = 'mp-cmd-palette';
        overlay.innerHTML =
            '<div class="mp-cmd-backdrop"></div>' +
            '<div class="mp-cmd-box">' +
                '<div class="mp-cmd-search">' +
                    '<span class="mp-cmd-icon">🔍</span>' +
                    '<input type="text" id="mpCmdInput" placeholder="Para onde você quer ir? Digite o nome da página..." autocomplete="off">' +
                    '<span class="mp-cmd-esc">ESC</span>' +
                '</div>' +
                '<div class="mp-cmd-results" id="mpCmdResults"></div>' +
                '<div class="mp-cmd-footer">' +
                    '<span>↑↓ navegar</span>' +
                    '<span>↵ abrir</span>' +
                    '<span>esc fechar</span>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        var input = overlay.querySelector('#mpCmdInput');
        var resultsEl = overlay.querySelector('#mpCmdResults');
        var selectedIdx = 0;
        var currentResults = [];

        function close() {
            overlay.remove();
        }

        function update() {
            var q = input.value;
            currentResults = q && q.trim() ? searchItems(q) : getAllItems().slice(0, 12);
            selectedIdx = 0;
            resultsEl.innerHTML = currentResults.length
                ? currentResults.map(function (r, idx) {
                    return '<a href="' + r.href + '" class="mp-cmd-result" data-idx="' + idx + '">' +
                        '<span class="mp-cmd-result-icon">' + r.icon + '</span>' +
                        '<div class="mp-cmd-result-text">' +
                            '<div class="mp-cmd-result-label">' + escapeHtml(r.label) + '</div>' +
                            '<div class="mp-cmd-result-cat">' + r.catIcon + ' ' + escapeHtml(r.catLabel) + '</div>' +
                        '</div>' +
                    '</a>';
                }).join('')
                : '<div class="mp-cmd-empty">🤷 Nenhuma página encontrada</div>';
            highlight();
        }

        function highlight() {
            resultsEl.querySelectorAll('.mp-cmd-result').forEach(function (el, idx) {
                el.classList.toggle('selected', idx === selectedIdx);
                if (idx === selectedIdx) {
                    el.scrollIntoView({ block: 'nearest' });
                }
            });
        }

        input.addEventListener('input', update);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { e.preventDefault(); close(); }
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIdx = Math.min(selectedIdx + 1, currentResults.length - 1);
                highlight();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIdx = Math.max(selectedIdx - 1, 0);
                highlight();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                var t = currentResults[selectedIdx];
                if (t) location.href = t.href;
            }
        });

        // Clica no backdrop fecha
        overlay.querySelector('.mp-cmd-backdrop').addEventListener('click', close);

        update();
        setTimeout(function () { input.focus(); }, 50);
    }

    function bindCommandPalette() {
        if (window.__mpCmdPaletteBound) return;
        window.__mpCmdPaletteBound = true;
        document.addEventListener('keydown', function (e) {
            // Ctrl+K ou Cmd+K
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                // Nao captura se foco ja ta num input/textarea (deixa o atalho do navegador)
                var t = e.target;
                var inField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
                if (inField && t.id !== 'mpCmdInput') return;
                e.preventDefault();
                openCommandPalette();
            }
        });
        // Expor pra outros componentes abrirem
        window.openCommandPalette = openCommandPalette;
    }

    function bindToggleEvents(nav) {
        nav.querySelectorAll('[data-cat-toggle]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var catId = btn.getAttribute('data-cat-toggle');
                var catEl = nav.querySelector('[data-cat-id="' + catId + '"]');
                var items = nav.querySelector('[data-cat-items="' + catId + '"]');
                if (!catEl || !items) return;

                var isOpen = catEl.dataset.open === '1';
                if (isOpen) {
                    // Fechar — anima max-height
                    items.style.maxHeight = items.scrollHeight + 'px';
                    items.offsetHeight; // force reflow
                    items.style.maxHeight = '0';
                    items.style.overflow = 'hidden';
                    catEl.dataset.open = '0';
                    btn.classList.remove('open');
                    saveOpenState(catId, false);
                } else {
                    // Abrir
                    items.style.maxHeight = items.scrollHeight + 'px';
                    items.style.overflow = 'visible';
                    setTimeout(function () {
                        if (catEl.dataset.open === '1') {
                            items.style.maxHeight = '';
                        }
                    }, 320);
                    catEl.dataset.open = '1';
                    btn.classList.add('open');
                    saveOpenState(catId, true);
                }
            });
        });
    }

    // ============================================================
    // CSS INJECTION (uma vez por pagina)
    // ============================================================
    function injectCss() {
        if (document.getElementById('mp-sidebar-menu-css')) return;
        var css = [
            '.mp-menu-collapsible .mp-menu-cat{margin:0 0 6px}',
            '.mp-menu-cat-header{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;background:transparent;border:0;border-radius:10px;color:#FFFFFF;font-family:inherit;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;cursor:pointer;text-align:left;opacity:.82;transition:opacity .15s,background .15s}',
            '.mp-menu-cat-header:hover{opacity:1;background:rgba(255,255,255,.05)}',
            '.mp-menu-cat-header.highlight{background:linear-gradient(135deg,rgba(255,79,138,.10),rgba(126,87,194,.10));opacity:1}',
            '.mp-menu-cat-icon{font-size:16px;flex-shrink:0}',
            '.mp-menu-cat-label{flex:1;min-width:0}',
            '.mp-menu-cat-chevron{font-size:14px;transition:transform .25s;opacity:.7}',
            '.mp-menu-cat-header.open .mp-menu-cat-chevron{transform:rotate(180deg)}',
            '.mp-menu-cat-items{transition:max-height .3s ease-out}',
            '.mp-menu-cat-items .sidebar-link{margin-left:6px;padding-left:18px;font-size:13.5px}',
            '.mp-menu-cat-items .sidebar-link .icon{font-size:15px;width:22px;text-align:center}',
            '.mp-menu-cat-items .sidebar-link.active{background:linear-gradient(135deg,rgba(255,213,79,.20),rgba(255,152,0,.15));border-left:3px solid #FFD54F;font-weight:700}',
            // BUSCA RAPIDA no topo do menu
            '.mp-menu-search{position:relative;margin:0 0 12px;background:rgba(255,255,255,.08);border-radius:10px;display:flex;align-items:center;padding:8px 10px;border:1px solid rgba(255,255,255,.12);transition:border-color .15s,background .15s}',
            '.mp-menu-search:focus-within{background:rgba(255,255,255,.15);border-color:rgba(255,213,79,.55)}',
            '.mp-menu-search-icon{font-size:14px;opacity:.7;margin-right:8px}',
            '.mp-menu-search-input{flex:1;background:transparent;border:0;outline:0;color:#fff;font-family:inherit;font-size:13px;font-weight:600;min-width:0}',
            '.mp-menu-search-input::placeholder{color:rgba(255,255,255,.5);font-weight:500}',
            '.mp-menu-search-shortcut{background:rgba(255,255,255,.15);color:rgba(255,255,255,.85);padding:2px 8px;border-radius:6px;font-size:10px;font-weight:800;letter-spacing:.5px;font-family:monospace;flex-shrink:0;margin-left:6px}',
            // Resultados busca local (substitui menu)
            '.mp-menu-search-results{display:flex;flex-direction:column;gap:4px;animation:mpFadeIn .15s ease}',
            '@keyframes mpFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}',
            '.mp-menu-search-result{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.04);border-radius:10px;text-decoration:none;color:#fff;transition:background .15s;border-left:3px solid transparent}',
            '.mp-menu-search-result:hover,.mp-menu-search-result.selected{background:rgba(255,213,79,.18);border-left-color:#FFD54F}',
            '.mp-menu-search-result-icon{font-size:18px;flex-shrink:0;width:24px;text-align:center}',
            '.mp-menu-search-result-text{flex:1;min-width:0}',
            '.mp-menu-search-result-label{font-weight:700;font-size:13px;line-height:1.2;color:#fff}',
            '.mp-menu-search-result-cat{font-size:10px;opacity:.65;margin-top:2px;text-transform:uppercase;letter-spacing:.4px}',
            '.mp-menu-search-empty{padding:18px 12px;text-align:center;color:rgba(255,255,255,.6);font-size:12px;font-style:italic}',
            // COMMAND PALETTE — overlay global Ctrl+K
            '.mp-cmd-palette{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:80px 20px 20px;font-family:"Nunito",sans-serif;animation:mpCmdFade .15s ease}',
            '@keyframes mpCmdFade{from{opacity:0}to{opacity:1}}',
            '.mp-cmd-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)}',
            '.mp-cmd-box{position:relative;width:100%;max-width:560px;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.4);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 120px);animation:mpCmdSlide .25s cubic-bezier(.34,1.56,.64,1)}',
            '@keyframes mpCmdSlide{from{transform:translateY(-20px);opacity:0}to{transform:none;opacity:1}}',
            '.mp-cmd-search{display:flex;align-items:center;padding:18px 20px;border-bottom:1px solid #EEE5FF;gap:12px}',
            '.mp-cmd-icon{font-size:20px;opacity:.6}',
            '.mp-cmd-search input{flex:1;border:0;outline:0;font-family:inherit;font-size:16px;font-weight:600;color:#3D2A55;background:transparent}',
            '.mp-cmd-search input::placeholder{color:#B0A0CC;font-weight:500}',
            '.mp-cmd-esc{background:#F0E0FF;color:#5A4570;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;font-family:monospace}',
            '.mp-cmd-results{flex:1;overflow-y:auto;padding:8px;max-height:60vh}',
            '.mp-cmd-result{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:10px;text-decoration:none;color:#3D2A55;transition:background .12s}',
            '.mp-cmd-result:hover,.mp-cmd-result.selected{background:linear-gradient(135deg,#FFF3CC,#FFE0EC)}',
            '.mp-cmd-result-icon{font-size:24px;width:32px;text-align:center;flex-shrink:0}',
            '.mp-cmd-result-text{flex:1;min-width:0}',
            '.mp-cmd-result-label{font-weight:800;font-size:15px;line-height:1.2;color:#3D2A55}',
            '.mp-cmd-result-cat{font-size:11px;color:#9484A8;margin-top:2px;text-transform:uppercase;letter-spacing:.4px;font-weight:700}',
            '.mp-cmd-empty{padding:36px 20px;text-align:center;color:#9484A8;font-size:14px;font-style:italic}',
            '.mp-cmd-footer{display:flex;gap:18px;padding:12px 20px;border-top:1px solid #EEE5FF;font-size:11px;color:#9484A8;font-weight:700;letter-spacing:.4px;text-transform:uppercase}',
            '.mp-cmd-footer span{display:flex;align-items:center;gap:4px}',
            // Mobile: header maior pra clicar facil
            '@media (max-width: 768px){',
            '  .mp-menu-cat-header{padding:12px 14px;font-size:14px}',
            '  .mp-menu-cat-items .sidebar-link{padding:11px 14px 11px 22px}',
            '  .mp-menu-search-shortcut{display:none}',
            '  .mp-cmd-palette{padding:20px 12px}',
            '  .mp-cmd-box{max-height:calc(100vh - 40px)}',
            '}'
        ].join('');
        var style = document.createElement('style');
        style.id = 'mp-sidebar-menu-css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ============================================================
    // BOOT
    // ============================================================
    function boot() {
        injectCss();
        var rendered = renderMenu();
        // Command palette funciona em TODAS as paginas (mesmo sem sidebar)
        // — Ctrl+K em qualquer lugar abre o navegador rapido
        if (!rendered) bindCommandPalette();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Expor pra debug e pra outros scripts re-renderizarem se quiserem
    window.SidebarMenu = {
        render: renderMenu,
        MENU: MENU_STRUCTURE
    };
})();
