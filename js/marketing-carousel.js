/* ============================================
   MARKETING DIARIO — ENGINE DE CARROSSEL DIARIO
   ============================================
   Componente reutilizavel pra renderizar o "dia" como cartao
   completo. Cada pagina de marketing chama:

     MarketingCarousel.mount({
        container: '#root',
        showTracks: ['post','loja','ads','promo','metricas','tarefas','quickWin','seo'],
        title: '🚀 Marketing Diario',
        accent: '#EC407A'
     });

   Carrega APOS marketing-90days.js.
   ============================================ */
(function (global) {
    if (!global.MarketingDiario) {
        console.error('[marketing-carousel] MarketingDiario nao carregado.');
        return;
    }

    const MD = global.MarketingDiario;
    const TODAY = new Date().toISOString().slice(0, 10);

    // ────────── CSS injetado uma vez ──────────
    function injectCSS() {
        if (document.getElementById('mc-styles')) return;
        const css = `
.mc-wrap{max-width:1100px;margin:0 auto;font-family:'Nunito',sans-serif;color:#1A2740}
.mc-hero{background:linear-gradient(135deg,#FFE0EC,#E3F2FD);border-radius:24px;padding:24px 26px;margin-bottom:18px;box-shadow:0 12px 40px rgba(236,64,122,.12)}
.mc-hero h1{font-family:'Baloo 2',cursive;font-size:1.9rem;font-weight:900;color:#C2185B;margin-bottom:6px;line-height:1}
.mc-hero p{color:#6B7A95;font-size:.95rem;line-height:1.4;max-width:700px}
.mc-hero-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:16px}
.mc-hero-stat{background:rgba(255,255,255,.7);border-radius:12px;padding:10px 12px}
.mc-hero-stat .v{font-family:'Baloo 2',cursive;font-size:1.3rem;color:#C2185B;font-weight:900;line-height:1}
.mc-hero-stat .l{font-size:.68rem;color:#7c3aed;text-transform:uppercase;letter-spacing:.5px;font-weight:800;margin-top:3px}

.mc-nav{position:sticky;top:0;background:#FFF5F8;padding:12px 0;margin-bottom:14px;z-index:50;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.mc-nav-btn{background:#fff;border:2px solid #EDE7F6;color:#7c3aed;padding:8px 14px;border-radius:100px;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;font-size:.85rem;transition:all .15s}
.mc-nav-btn:hover{border-color:#7c3aed}
.mc-nav-btn.primary{background:linear-gradient(135deg,#EC407A,#7c3aed);color:#fff;border-color:transparent}
.mc-nav-input{background:#fff;border:2px solid #EDE7F6;color:#1A2740;padding:8px 14px;border-radius:100px;font-family:'Nunito',sans-serif;font-size:.85rem}
.mc-nav-input:focus{outline:none;border-color:#EC407A}
.mc-nav-spacer{flex:1}
.mc-nav-counter{font-weight:800;color:#C2185B;font-size:.9rem}

.mc-card{background:#fff;border-radius:24px;box-shadow:0 12px 40px rgba(0,0,0,.08);overflow:hidden;margin-bottom:18px;border:3px solid transparent}
.mc-card.is-today{border-color:#EC407A;box-shadow:0 16px 48px rgba(236,64,122,.25)}
.mc-card-head{background:linear-gradient(135deg,var(--c1, #EC407A),var(--c2, #42A5F5));color:#fff;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.mc-card-head .lead h3{font-family:'Baloo 2',cursive;font-size:1.5rem;font-weight:900;line-height:1.05;margin:0}
.mc-card-head .lead .when{font-size:.82rem;opacity:.9;margin-top:4px}
.mc-card-head .badges{display:flex;gap:6px;flex-wrap:wrap}
.mc-badge{background:rgba(255,255,255,.22);padding:4px 10px;border-radius:100px;font-size:.7rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase}
.mc-badge.today{background:#fff;color:#EC407A}
.mc-card-mission{background:#FAF5FF;padding:12px 24px;font-size:.85rem;color:#5B21B6;border-bottom:1px solid #EDE7F6}
.mc-card-mission strong{color:#7c3aed}

.mc-tabs{display:flex;gap:0;flex-wrap:wrap;border-bottom:2px solid #F3E5F5;background:#FAFAFA;padding:0 12px}
.mc-tab{background:transparent;border:none;padding:12px 14px;font-family:'Nunito',sans-serif;font-weight:800;font-size:.78rem;color:#999;cursor:pointer;border-bottom:3px solid transparent;text-transform:uppercase;letter-spacing:.5px;transition:all .15s;white-space:nowrap}
.mc-tab:hover{color:#7c3aed}
.mc-tab.active{color:#EC407A;border-bottom-color:#EC407A;background:#fff}

.mc-tab-body{padding:20px 24px;display:none}
.mc-tab-body.active{display:block}

.mc-block{background:#FAFAFA;border:1.5px solid #EEE;border-radius:14px;padding:14px 18px;margin-bottom:12px}
.mc-block-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px}
.mc-block-h strong{font-size:.74rem;color:#666;text-transform:uppercase;letter-spacing:.5px;font-weight:800}
.mc-block pre{margin:0;white-space:pre-wrap;font-family:'Nunito',sans-serif;font-size:.9rem;color:#333;line-height:1.5}
.mc-copy-btn{background:linear-gradient(135deg,#EC407A,#42A5F5);color:#fff;border:none;padding:6px 12px;border-radius:100px;font-size:.72rem;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif}
.mc-copy-btn.copied{background:#10B981}

.mc-img-block{background:linear-gradient(135deg,#FFF8E1,#FFE0B2);border-color:#FFB300}
.mc-vid-block{background:linear-gradient(135deg,#E1F5FE,#B3E5FC);border-color:#03A9F4}
.mc-cap-block{background:linear-gradient(135deg,#F3E5F5,#E1BEE7);border-color:#9C27B0}
.mc-hash-block{background:#fff;border-color:#7c3aed}
.mc-mus-block{background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-color:#4CAF50}
.mc-cta-block{background:linear-gradient(135deg,#FFEBEE,#FFCDD2);border-color:#F44336}
.mc-loja-block{background:linear-gradient(135deg,#FCE4EC,#F8BBD0);border-color:#EC407A}
.mc-ads-block{background:linear-gradient(135deg,#E3F2FD,#BBDEFB);border-color:#42A5F5}
.mc-promo-block{background:linear-gradient(135deg,#FFF3E0,#FFE0B2);border-color:#FF9800}
.mc-metr-block{background:linear-gradient(135deg,#F3E5F5,#E1BEE7);border-color:#7c3aed}
.mc-task-block{background:#fff;border-color:#10B981}
.mc-task-block ul{margin:0;padding-left:20px}
.mc-task-block li{margin-bottom:6px;font-size:.92rem;line-height:1.4}
.mc-quick-block{background:linear-gradient(135deg,#FFF59D,#FFE082);border-color:#FFC107;font-weight:700}
.mc-seo-block{background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-color:#4CAF50}

.mc-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:8px}
.mc-mini{background:#fff;border-radius:10px;padding:10px 12px;border:1px solid #EEE}
.mc-mini .l{font-size:.7rem;color:#999;text-transform:uppercase;letter-spacing:.5px;font-weight:800;margin-bottom:3px}
.mc-mini .v{font-size:.92rem;color:#1A2740;font-weight:600;line-height:1.3}

.mc-arrows{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;z-index:60}
.mc-arrow-btn{background:linear-gradient(135deg,#EC407A,#42A5F5);color:#fff;border:none;width:52px;height:52px;border-radius:50%;font-size:1.3rem;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(236,64,122,.4)}
.mc-arrow-btn:disabled{opacity:.4;cursor:not-allowed}
.mc-arrow-btn.today-btn{background:linear-gradient(135deg,#10B981,#4CAF50);font-size:.7rem;line-height:1}
.mc-arrow-btn.print-btn{background:linear-gradient(135deg,#7c3aed,#42A5F5);font-size:1rem}

.mc-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;padding:12px 22px;border-radius:100px;font-weight:800;z-index:9999;box-shadow:0 8px 28px rgba(16,185,129,.4);animation:mcToastIn .3s}
@keyframes mcToastIn{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}

.mc-modeswitch{display:inline-flex;background:#fff;border-radius:100px;padding:3px;border:2px solid #EDE7F6}
.mc-modeswitch button{border:none;background:transparent;padding:6px 14px;border-radius:100px;font-family:'Nunito',sans-serif;font-weight:800;cursor:pointer;color:#999;font-size:.8rem}
.mc-modeswitch button.active{background:linear-gradient(135deg,#EC407A,#7c3aed);color:#fff}

@media print{
    .mc-nav,.mc-arrows,.panel-sidebar,.panel-header{display:none !important}
    .mc-card{break-inside:avoid;page-break-inside:avoid;box-shadow:none;border:1px solid #ddd}
    .mc-tab-body{display:block !important}
    .mc-tabs{display:none}
}
@media (max-width:680px){
    .mc-hero{padding:18px 16px}
    .mc-hero h1{font-size:1.4rem}
    .mc-card-head{padding:14px 16px}
    .mc-card-head .lead h3{font-size:1.15rem}
    .mc-tab{padding:10px 8px;font-size:.7rem}
    .mc-arrows{bottom:14px;right:14px}
    .mc-arrow-btn{width:44px;height:44px;font-size:1.1rem}
}
`;
        const style = document.createElement('style');
        style.id = 'mc-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Theme color map (mesmo do belinha viewer)
    const themeColors = {
        rotina:['#EC407A','#9C27B0'], asmr:['#03A9F4','#26C6DA'], humor:['#FFB74D','#EC407A'],
        promo:['#F44336','#FFB74D'], viral:['#7c3aed','#EC407A'], wholesome:['#FF80AB','#42A5F5'],
        sazonal:['#10B981','#42A5F5'], novidade:['#42A5F5','#7c3aed'], family:['#FFB300','#FF80AB'],
        milestone:['#FFD700','#EC407A'], localcontent:['#26A69A','#42A5F5'],
        tutorial:['#5C6BC0','#26C6DA'], storytelling:['#9575CD','#EC407A']
    };

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function ptDate(iso) {
        if (!iso) return '';
        const [y,m,d] = iso.split('-');
        const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
        return d + ' ' + meses[parseInt(m,10)-1] + ' ' + y;
    }

    // ────────── TABS ──────────
    const TAB_RENDERERS = {
        post: (d, idPrefix) => `
            <div class="mc-block mc-img-block">
                <div class="mc-block-h"><strong>🎨 Prompt de imagem (IA)</strong>
                    <button class="mc-copy-btn" data-copy="${idPrefix}_prompt">📋 Copiar</button></div>
                <pre id="${idPrefix}_prompt">${escapeHtml(d.post.prompt)}</pre>
            </div>
            <div class="mc-block mc-vid-block">
                <div class="mc-block-h"><strong>🎬 Roteiro (cena por cena)</strong>
                    <button class="mc-copy-btn" data-copy="${idPrefix}_script">📋 Copiar</button></div>
                <pre id="${idPrefix}_script">${escapeHtml(d.post.script)}</pre>
            </div>
            <div class="mc-block mc-cap-block">
                <div class="mc-block-h"><strong>📝 Legenda pronta</strong>
                    <button class="mc-copy-btn" data-copy="${idPrefix}_caption">📋 Copiar</button></div>
                <pre id="${idPrefix}_caption">${escapeHtml(d.post.caption)}</pre>
            </div>
            <div class="mc-block mc-hash-block">
                <div class="mc-block-h"><strong>#️⃣ Hashtags</strong>
                    <button class="mc-copy-btn" data-copy="${idPrefix}_hash">📋 Copiar</button></div>
                <pre id="${idPrefix}_hash">${escapeHtml(d.post.hashtags)}</pre>
            </div>
            <div class="mc-block mc-mus-block">
                <div class="mc-block-h"><strong>🎵 Audio sugerido</strong>
                    <button class="mc-copy-btn" data-copy="${idPrefix}_mus">📋 Copiar</button></div>
                <pre id="${idPrefix}_mus">${escapeHtml(d.post.music)}</pre>
            </div>
            ${d.post.cta ? `<div class="mc-block mc-cta-block">
                <div class="mc-block-h"><strong>🎯 CTA / Stories</strong></div>
                <pre>${escapeHtml(d.post.cta)}</pre>
            </div>` : ''}
        `,

        loja: (d) => `
            <div class="mc-block mc-loja-block">
                <div class="mc-block-h"><strong>🏪 Loja fisica — ambiente</strong></div>
                <div class="mc-grid-2">
                    <div class="mc-mini"><div class="l">Decoracao</div><div class="v">${escapeHtml(d.loja.decoracao)}</div></div>
                    <div class="mc-mini"><div class="l">Equipe</div><div class="v">${escapeHtml(d.loja.equipe)}</div></div>
                    <div class="mc-mini"><div class="l">Visual / Foto</div><div class="v">${escapeHtml(d.loja.visual)}</div></div>
                </div>
            </div>
            <div class="mc-block mc-loja-block" style="margin-top:14px">
                <div class="mc-block-h"><strong>💡 Por que isso importa</strong></div>
                <pre>A loja fisica e o "set" do conteudo de hoje. Cliente que entrar bate olho no que tu vai postar mais tarde — multiplica viralizacao porque ele MESMO vai querer fotografar/marcar.</pre>
            </div>`,

        ads: (d) => `
            <div class="mc-block mc-ads-block">
                <div class="mc-block-h"><strong>📣 Mídia paga — campanha do dia</strong></div>
                <div class="mc-grid-2">
                    <div class="mc-mini"><div class="l">Plataforma</div><div class="v">${escapeHtml(d.ads.plataforma)}</div></div>
                    <div class="mc-mini"><div class="l">Objetivo</div><div class="v">${escapeHtml(d.ads.objetivo)}</div></div>
                    <div class="mc-mini"><div class="l">Budget sugerido</div><div class="v">${escapeHtml(d.ads.budget)}</div></div>
                    <div class="mc-mini"><div class="l">Publico</div><div class="v">${escapeHtml(d.ads.publico)}</div></div>
                    <div class="mc-mini"><div class="l">Criativo</div><div class="v">${escapeHtml(d.ads.creative)}</div></div>
                    <div class="mc-mini"><div class="l">Duracao</div><div class="v">${escapeHtml(d.ads.dur)}</div></div>
                </div>
            </div>
            <div class="mc-block mc-ads-block" style="margin-top:14px">
                <div class="mc-block-h"><strong>📐 Regra de ouro</strong></div>
                <pre>So suba boost se o post organico passar dos 7% de SAVE RATE. Se nao salvou organicamente, dinheiro pago nao vai salvar tambem. Save rate &gt; like rate &gt; share rate &gt; comment rate (nessa ordem decidem se vale boost).</pre>
            </div>`,

        promo: (d) => `
            <div class="mc-block mc-promo-block">
                <div class="mc-block-h"><strong>🎁 Promo / Recompensa do dia</strong></div>
                <div class="mc-grid-2">
                    <div class="mc-mini"><div class="l">Nome</div><div class="v">${escapeHtml(d.promo.nome)}</div></div>
                    <div class="mc-mini"><div class="l">Cupom</div><div class="v"><code>${escapeHtml(d.promo.cupom)}</code></div></div>
                    <div class="mc-mini"><div class="l">Como ativar</div><div class="v">${escapeHtml(d.promo.como)}</div></div>
                    <div class="mc-mini"><div class="l">Validade</div><div class="v">${escapeHtml(d.promo.valido)}</div></div>
                </div>
            </div>`,

        metricas: (d) => `
            <div class="mc-block mc-metr-block">
                <div class="mc-block-h"><strong>📊 Metricas a olhar HOJE (22h)</strong></div>
                <div class="mc-grid-2">
                    ${d.metricas.map(m => `
                        <div class="mc-mini">
                            <div class="l">${escapeHtml(m.kpi)}</div>
                            <div class="v"><strong style="color:#7c3aed">Meta:</strong> ${escapeHtml(m.meta)}<br><small style="color:#999">${escapeHtml(m.onde)}</small></div>
                        </div>
                    `).join('')}
                </div>
            </div>`,

        tarefas: (d) => `
            <div class="mc-block mc-task-block">
                <div class="mc-block-h"><strong>✅ Checklist do dia</strong></div>
                <ul>
                    ${d.tarefas.map((t, i) => `<li><label style="cursor:pointer;display:flex;align-items:flex-start;gap:8px"><input type="checkbox" data-task="${d.d}_${i}" style="margin-top:4px"> <span>${escapeHtml(t)}</span></label></li>`).join('')}
                </ul>
            </div>`,

        quickWin: (d) => `
            <div class="mc-block mc-quick-block">
                <div class="mc-block-h"><strong>⚡ Quick Win do dia (alto impacto, 5min)</strong></div>
                <pre>${escapeHtml(d.quickWin)}</pre>
            </div>`,

        seo: (d) => `
            <div class="mc-block mc-seo-block">
                <div class="mc-block-h"><strong>🔍 Acao SEO local hoje</strong></div>
                <pre>${escapeHtml(d.seo)}</pre>
                <div style="margin-top:8px"><a href="https://business.google.com/" target="_blank" style="color:#10B981;font-weight:800;text-decoration:none">→ Abrir Google Business Profile</a></div>
            </div>`
    };

    const TAB_LABELS = {
        post: '📱 Post',
        loja: '🏪 Loja',
        ads: '📣 Ads',
        promo: '🎁 Promo',
        metricas: '📊 Metricas',
        tarefas: '✅ Tarefas',
        quickWin: '⚡ Quick Win',
        seo: '🔍 SEO'
    };

    // ────────── MOUNT ──────────
    function mount(opts) {
        injectCSS();
        const config = Object.assign({
            container: '#root',
            showTracks: ['post','loja','ads','promo','metricas','tarefas','quickWin','seo'],
            title: '🚀 Marketing Diario',
            subtitle: 'Tudo que um profissional de marketing de loja fisica faz hoje pra viralizar — e converter virariliacao em venda.',
            mode: 'carousel' // 'carousel' or 'list'
        }, opts);

        const root = typeof config.container === 'string'
            ? document.querySelector(config.container)
            : config.container;
        if (!root) { console.error('[mc] container nao encontrado:', config.container); return; }

        const days = MD.days;
        const todayDay = MD.findClosestDay(TODAY);
        let currentIdx = days.indexOf(todayDay);
        if (currentIdx < 0) currentIdx = 0;
        let activeTab = config.showTracks[0];
        let mode = config.mode;

        function render() {
            const d = days[currentIdx];
            const colors = themeColors[d.theme] || themeColors.rotina;
            const isToday = d.date === TODAY;
            const tabs = config.showTracks;

            // Stats hero
            const totalDoneDays = days.filter(x => x.date < TODAY).length;
            const restam = days.length - totalDoneDays;

            root.innerHTML = `
                <div class="mc-wrap">
                    <div class="mc-hero">
                        <h1>${escapeHtml(config.title)}</h1>
                        <p>${escapeHtml(config.subtitle)}</p>
                        <div class="mc-hero-stats">
                            <div class="mc-hero-stat"><div class="v">${days.length}</div><div class="l">Dias planejados</div></div>
                            <div class="mc-hero-stat"><div class="v">#${d.d}</div><div class="l">Dia atual</div></div>
                            <div class="mc-hero-stat"><div class="v">${d.opsDay}</div><div class="l">Dias de operacao</div></div>
                            <div class="mc-hero-stat"><div class="v">${d.week}/13</div><div class="l">Semana</div></div>
                            <div class="mc-hero-stat"><div class="v">${restam}</div><div class="l">Restam</div></div>
                        </div>
                    </div>

                    <div class="mc-nav">
                        <button class="mc-nav-btn" id="mc-prev">← Ontem</button>
                        <input type="date" class="mc-nav-input" id="mc-date" value="${d.date}" min="${days[0].date}" max="${days[days.length-1].date}">
                        <button class="mc-nav-btn" id="mc-next">Amanha →</button>
                        <button class="mc-nav-btn" id="mc-today">📍 Hoje</button>
                        <span class="mc-nav-spacer"></span>
                        <span class="mc-nav-counter">${currentIdx+1}/${days.length}</span>
                        <div class="mc-modeswitch">
                            <button class="${mode==='carousel'?'active':''}" id="mc-mode-c">Dia</button>
                            <button class="${mode==='list'?'active':''}" id="mc-mode-l">Lista</button>
                        </div>
                    </div>

                    <div id="mc-content"></div>
                </div>

                <div class="mc-arrows">
                    <button class="mc-arrow-btn today-btn" id="mc-arrow-today" title="Hoje">📍<br>HOJE</button>
                    <button class="mc-arrow-btn print-btn" onclick="window.print()" title="PDF">🖨</button>
                </div>
            `;

            const content = root.querySelector('#mc-content');
            if (mode === 'carousel') renderCarousel(d, colors, isToday, tabs, content);
            else renderList(tabs, content);

            wireNav(root, days);
        }

        function renderCarousel(d, colors, isToday, tabs, content) {
            content.innerHTML = `
                <div class="mc-card ${isToday ? 'is-today' : ''}" style="--c1:${colors[0]};--c2:${colors[1]}">
                    <div class="mc-card-head">
                        <div class="lead">
                            <h3>📅 Dia ${d.d} — ${d.dow} · ${escapeHtml(d.title)}</h3>
                            <div class="when">${ptDate(d.date)} · Operacao Dia ${d.opsDay} · Formato ${escapeHtml(d.format)}</div>
                        </div>
                        <div class="badges">
                            ${isToday ? '<span class="mc-badge today">📍 HOJE</span>' : ''}
                            <span class="mc-badge">${escapeHtml(d.theme)}</span>
                            <span class="mc-badge">SEM ${d.week}</span>
                        </div>
                    </div>
                    <div class="mc-card-mission">
                        <strong>🎯 Foco do dia:</strong> ${escapeHtml(d.focoDoDia)} ·
                        <strong>Missao da semana:</strong> ${escapeHtml(d.weekMission)} (${escapeHtml(d.weekPillar)})
                    </div>
                    <div class="mc-tabs" id="mc-tabs">
                        ${tabs.map(t => `<button class="mc-tab ${t===activeTab?'active':''}" data-tab="${t}">${TAB_LABELS[t]||t}</button>`).join('')}
                    </div>
                    ${tabs.map(t => `
                        <div class="mc-tab-body ${t===activeTab?'active':''}" data-tab-body="${t}">
                            ${(TAB_RENDERERS[t]||(()=>''))(d, 'd'+d.d+'_'+t)}
                        </div>
                    `).join('')}
                </div>
            `;

            // Bind tabs
            content.querySelectorAll('.mc-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    const t = btn.dataset.tab;
                    activeTab = t;
                    content.querySelectorAll('.mc-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === t));
                    content.querySelectorAll('.mc-tab-body').forEach(x => x.classList.toggle('active', x.dataset.tabBody === t));
                });
            });

            wireCopy(content);
            wireTaskCheckboxes(content, d);
        }

        function renderList(tabs, content) {
            const html = days.map(d => {
                const colors = themeColors[d.theme] || themeColors.rotina;
                const isToday = d.date === TODAY;
                return `
                    <div class="mc-card ${isToday?'is-today':''}" style="--c1:${colors[0]};--c2:${colors[1]}" id="d${d.d}">
                        <div class="mc-card-head">
                            <div class="lead">
                                <h3>📅 Dia ${d.d} — ${d.dow} · ${escapeHtml(d.title)}</h3>
                                <div class="when">${ptDate(d.date)} · Op Dia ${d.opsDay}</div>
                            </div>
                            <div class="badges">
                                ${isToday?'<span class="mc-badge today">📍 HOJE</span>':''}
                                <span class="mc-badge">${escapeHtml(d.theme)}</span>
                            </div>
                        </div>
                        <div class="mc-card-mission"><strong>🎯</strong> ${escapeHtml(d.focoDoDia)}</div>
                        <div class="mc-tab-body active" style="padding:14px 20px">
                            ${tabs.map(t => `<details style="margin-bottom:8px"><summary style="cursor:pointer;font-weight:800;color:#7c3aed;padding:6px 0">${TAB_LABELS[t]||t}</summary>${(TAB_RENDERERS[t]||(()=>''))(d, 'l'+d.d+'_'+t)}</details>`).join('')}
                        </div>
                    </div>`;
            }).join('');
            content.innerHTML = html;
            wireCopy(content);

            // Auto-scroll para hoje
            setTimeout(() => {
                const todayCard = content.querySelector('.mc-card.is-today');
                if (todayCard) todayCard.scrollIntoView({behavior:'smooth', block:'start'});
            }, 200);
        }

        function wireNav(root, days) {
            const prev = root.querySelector('#mc-prev');
            const next = root.querySelector('#mc-next');
            const todayBtn = root.querySelector('#mc-today');
            const dateInput = root.querySelector('#mc-date');
            const arrowToday = root.querySelector('#mc-arrow-today');
            const modeC = root.querySelector('#mc-mode-c');
            const modeL = root.querySelector('#mc-mode-l');

            if (prev) prev.addEventListener('click', () => { if (currentIdx > 0) { currentIdx--; render(); } });
            if (next) next.addEventListener('click', () => { if (currentIdx < days.length-1) { currentIdx++; render(); } });
            if (todayBtn) todayBtn.addEventListener('click', goToday);
            if (arrowToday) arrowToday.addEventListener('click', goToday);
            if (dateInput) dateInput.addEventListener('change', e => {
                const target = e.target.value;
                const idx = days.findIndex(x => x.date === target);
                if (idx >= 0) { currentIdx = idx; render(); }
            });
            if (modeC) modeC.addEventListener('click', () => { mode='carousel'; render(); });
            if (modeL) modeL.addEventListener('click', () => { mode='list'; render(); });

            function goToday() {
                const t = MD.findClosestDay(TODAY);
                const idx = days.indexOf(t);
                if (idx >= 0) { currentIdx = idx; render(); }
            }

            // Keyboard
            document.addEventListener('keydown', e => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                if (e.key === 'ArrowLeft' && prev) prev.click();
                if (e.key === 'ArrowRight' && next) next.click();
            });
        }

        function wireCopy(root) {
            root.querySelectorAll('.mc-copy-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const id = btn.dataset.copy;
                    const el = document.getElementById(id);
                    if (!el) return;
                    navigator.clipboard.writeText(el.textContent).then(() => {
                        btn.classList.add('copied');
                        const orig = btn.textContent;
                        btn.textContent = '✓ Copiado';
                        showToast('📋 Copiado!');
                        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1500);
                    });
                });
            });
        }

        function wireTaskCheckboxes(root, d) {
            const key = 'mc_tasks_' + d.d;
            const saved = JSON.parse(localStorage.getItem(key) || '{}');
            root.querySelectorAll('input[type=checkbox][data-task]').forEach(cb => {
                if (saved[cb.dataset.task]) cb.checked = true;
                cb.addEventListener('change', () => {
                    const cur = JSON.parse(localStorage.getItem(key) || '{}');
                    cur[cb.dataset.task] = cb.checked;
                    localStorage.setItem(key, JSON.stringify(cur));
                });
            });
        }

        function showToast(msg) {
            const old = document.querySelector('.mc-toast');
            if (old) old.remove();
            const t = document.createElement('div');
            t.className = 'mc-toast';
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 2000);
        }

        render();
    }

    global.MarketingCarousel = { mount };
})(typeof window !== 'undefined' ? window : this);
