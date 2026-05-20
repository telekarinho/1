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
        var html = MENU_STRUCTURE.map(function (cat) {
            return renderCategory(cat, currentPage);
        }).join('');

        nav.innerHTML = html;
        nav.dataset.mpRendered = '1';
        nav.classList.add('mp-menu-collapsible');

        bindToggleEvents(nav);
        return true;
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
            // Mobile: header maior pra clicar facil
            '@media (max-width: 768px){',
            '  .mp-menu-cat-header{padding:12px 14px;font-size:14px}',
            '  .mp-menu-cat-items .sidebar-link{padding:11px 14px 11px 22px}',
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
        renderMenu();
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
