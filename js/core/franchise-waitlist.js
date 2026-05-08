/* ============================================
   MilkyPot — Lista VIP Pré-Lançamento Franquia
   ============================================
   Captura de lead pra interessados em franquia ANTES da abertura
   oficial. Fluxo:

     Click no botão → abre modal → preenche 6 campos →
     submit → signInAnonymously() → grava em /franchise_leads/<id>
     → grava em /mail/<id> (Trigger Email Extension dispara email
     pro lead com cópia pra milkypot.com@gmail.com) → mostra success.

   NÃO mexe em rules de produção: usa Auth anônima do Firebase
   (já habilitada no projeto) pra satisfazer "allow create: if
   isAuthenticated()" da rule /mail.

   Tag automática (Growth Hacker):
     • Capital R$ 30k+        → HOT-LOJA   (Jocimar liga pessoalmente)
     • Capital R$ 15-30k      → PRO-DARK   (foco em case dark kitchen)
     • Capital R$ 5-15k       → PRO-DARK
     • Capital até R$ 5k      → DELIVERY   (produto mais pronto)
     • "Ainda não sei"        → EDUCAR     (sequência de nutrição longa)
   ============================================ */

(function () {
    'use strict';

    // ---- Config ----
    var ADMIN_EMAIL = 'milkypot.com@gmail.com';
    var WHATSAPP_JOCIMAR = '5543999919777';
    var COL_LEADS = 'franchise_leads';
    var COL_MAIL = 'mail';

    // ---- Estado ----
    var modalEl = null;
    var preselectFormato = null;

    // ---- Estados brasileiros ----
    var UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

    // ---- Helpers ----
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function onlyDigits(s) {
        return String(s || '').replace(/\D/g, '');
    }

    function tagFor(capital) {
        if (capital === '30k+') return 'HOT-LOJA';
        if (capital === '15-30k') return 'PRO-DARK';
        if (capital === '5-15k') return 'PRO-DARK';
        if (capital === 'ate-5k') return 'DELIVERY';
        return 'EDUCAR';
    }

    // ============================================
    // HTML do modal
    // ============================================
    function buildModalHtml() {
        var preselect = preselectFormato || '';
        var checked = function (v) { return preselect === v ? ' checked' : ''; };
        return '' +
            '<div id="mp-fw-overlay" style="position:fixed;inset:0;background:rgba(13,11,26,.75);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;animation:mpFwIn .25s ease-out">' +
                '<div role="dialog" aria-labelledby="mp-fw-title" style="background:#fff;border-radius:20px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,.4);position:relative;animation:mpFwSlide .3s cubic-bezier(.2,.8,.2,1)">' +
                    // ---- Header ----
                    '<div style="background:linear-gradient(135deg,#7B1FA2 0%,#FF4F8A 60%,#FFD54F 100%);color:#fff;padding:24px 24px 20px;border-radius:20px 20px 0 0;position:relative">' +
                        '<button type="button" id="mp-fw-close" aria-label="Fechar" style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,.22);border:0;color:#fff;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;line-height:1">×</button>' +
                        '<div style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;opacity:.9;margin-bottom:6px">🐑 Lista VIP MilkyPot</div>' +
                        '<h2 id="mp-fw-title" style="font-family:\'Baloo 2\',cursive;font-size:22px;font-weight:900;line-height:1.2;margin:0">Você está entrando na lista VIP de fundadores MilkyPot.</h2>' +
                        '<p style="font-size:14px;line-height:1.5;margin:10px 0 0;opacity:.95">Antes do público geral. Com preço de pré-lançamento e conversa direta com o Jocimar, dono da marca.</p>' +
                    '</div>' +

                    // ---- Form ----
                    '<form id="mp-fw-form" style="padding:22px 24px 16px">' +
                        '<div id="mp-fw-error" style="display:none;background:#FEF2F2;border-left:4px solid #DC2626;padding:10px 14px;border-radius:8px;color:#991B1B;font-size:13px;margin-bottom:14px"></div>' +

                        // Nome
                        '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:4px">Seu nome <span style="color:#DC2626">*</span></label>' +
                        '<input name="nome" type="text" required maxlength="120" autocomplete="name" placeholder="Como prefere ser chamado(a)" style="width:100%;padding:11px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;margin-bottom:12px;font-family:inherit">' +

                        // WhatsApp
                        '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:4px">WhatsApp (com DDD) <span style="color:#DC2626">*</span></label>' +
                        '<input name="whatsapp" type="tel" required maxlength="20" autocomplete="tel" inputmode="tel" placeholder="(43) 99991-9777" style="width:100%;padding:11px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;margin-bottom:12px;font-family:inherit">' +

                        // Email (opcional pra confirmação)
                        '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:4px">Email <span style="color:#DC2626">*</span></label>' +
                        '<input name="email" type="email" required maxlength="120" autocomplete="email" placeholder="seu@email.com" style="width:100%;padding:11px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;margin-bottom:12px;font-family:inherit">' +

                        // Cidade + UF
                        '<div style="display:grid;grid-template-columns:1fr 90px;gap:10px;margin-bottom:12px">' +
                            '<div>' +
                                '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:4px">Cidade <span style="color:#DC2626">*</span></label>' +
                                '<input name="cidade" type="text" required maxlength="80" placeholder="Sua cidade" style="width:100%;padding:11px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;font-family:inherit">' +
                            '</div>' +
                            '<div>' +
                                '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:4px">UF <span style="color:#DC2626">*</span></label>' +
                                '<select name="uf" required style="width:100%;padding:11px 8px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:15px;font-family:inherit;background:#fff">' +
                                    '<option value="">UF</option>' +
                                    UFS.map(function (u) { return '<option value="' + u + '">' + u + '</option>'; }).join('') +
                                '</select>' +
                            '</div>' +
                        '</div>' +

                        // Capital disponível
                        '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:6px">Capital disponível pra começar <span style="color:#DC2626">*</span></label>' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
                            radio('capital', 'ate-5k', 'até R$ 5 mil') +
                            radio('capital', '5-15k', 'R$ 5-15 mil') +
                            radio('capital', '15-30k', 'R$ 15-30 mil') +
                            radio('capital', '30k+', 'R$ 30 mil+') +
                        '</div>' +

                        // Formato preferido
                        '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:6px">Formato de interesse <span style="color:#DC2626">*</span></label>' +
                        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
                            radio('formato', 'delivery', '🛵 Delivery em Casa', checked('delivery')) +
                            radio('formato', 'pro', '🚀 Pro Dark Kitchen', checked('pro')) +
                            radio('formato', 'loja', '🏪 Loja/Quiosque', checked('loja')) +
                            radio('formato', 'nao-sei', '🤔 Ainda não sei', checked('todos') || checked('nao-sei')) +
                        '</div>' +

                        // Perfil
                        '<label style="display:block;font-size:13px;font-weight:700;color:#374151;margin-bottom:6px">Seu perfil <span style="color:#DC2626">*</span></label>' +
                        '<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:14px">' +
                            radio('perfil', 'ja-empreendo', 'Já empreendo / tenho outro negócio') +
                            radio('perfil', 'primeiro', 'É meu primeiro negócio') +
                            radio('perfil', 'investidor', 'Invisto em outras coisas') +
                        '</div>' +

                        // Disclaimer
                        '<div style="background:#F0F9FF;border-left:4px solid #0284c7;padding:10px 12px;border-radius:8px;margin-bottom:14px;font-size:12.5px;line-height:1.5;color:#0c4a6e">' +
                            '🌎 <strong>Vagas limitadas por região.</strong> Cada cidade tem número limitado de unidades — quem entra primeiro tem prioridade na escolha.' +
                        '</div>' +

                        // Submit
                        '<button id="mp-fw-submit" type="submit" style="width:100%;padding:14px;background:linear-gradient(135deg,#FF4F8A,#7E57C2);color:#fff;border:none;border-radius:100px;font-family:\'Baloo 2\',cursive;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 8px 20px rgba(126,87,194,.3);transition:transform .12s">🐑 Garantir minha vaga na Lista VIP</button>' +

                        '<p style="font-size:11.5px;color:#6B7280;text-align:center;margin:10px 0 0;line-height:1.5">Você vai receber um email de confirmação. A Lilo te chama em breve com os próximos passos.</p>' +
                    '</form>' +
                '</div>' +
            '</div>' +
            '<style>' +
                '@keyframes mpFwIn{from{opacity:0}to{opacity:1}}' +
                '@keyframes mpFwSlide{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}' +
                '.mp-fw-radio{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1.5px solid #E5E7EB;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;transition:all .15s;font-family:inherit}' +
                '.mp-fw-radio:hover{border-color:#FF4F8A;background:#FFF0F6}' +
                '.mp-fw-radio input{accent-color:#FF4F8A;cursor:pointer}' +
                '.mp-fw-radio.checked{border-color:#FF4F8A;background:#FFF0F6;color:#7E57C2}' +
                '#mp-fw-form input:focus,#mp-fw-form select:focus{outline:none;border-color:#FF4F8A;box-shadow:0 0 0 3px rgba(255,79,138,.12)}' +
                '#mp-fw-submit:hover:not(:disabled){transform:translateY(-1px)}' +
                '#mp-fw-submit:disabled{opacity:.6;cursor:not-allowed}' +
            '</style>';
    }

    function radio(name, value, label, extra) {
        var ex = extra || '';
        return '<label class="mp-fw-radio' + (ex.indexOf('checked') >= 0 ? ' checked' : '') + '"><input type="radio" name="' + name + '" value="' + value + '" required' + ex + '><span>' + label + '</span></label>';
    }

    // ============================================
    // Validação
    // ============================================
    function validate(data) {
        var errs = [];
        if (!data.nome || data.nome.length < 2) errs.push('Nome');
        var wppDigits = onlyDigits(data.whatsapp);
        if (wppDigits.length < 10 || wppDigits.length > 13) errs.push('WhatsApp (DDD + número)');
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.push('Email');
        if (!data.cidade || data.cidade.length < 2) errs.push('Cidade');
        if (!data.uf || data.uf.length !== 2) errs.push('UF');
        if (!data.capital) errs.push('Capital disponível');
        if (!data.formato) errs.push('Formato de interesse');
        if (!data.perfil) errs.push('Perfil');
        return errs;
    }

    // ============================================
    // Email automático (HTML do email enviado pro lead)
    // ============================================
    function buildLeadEmailHtml(d) {
        var nome = esc((d.nome || '').split(' ')[0] || d.nome);
        return '' +
            '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F9FAFB">' +
                '<div style="background:linear-gradient(135deg,#7B1FA2 0%,#FF4F8A 60%,#FFD54F 100%);color:#fff;padding:32px 24px;text-align:center">' +
                    '<div style="font-size:64px;line-height:1;margin-bottom:8px">🐑</div>' +
                    '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:.9;font-weight:800;margin-bottom:6px">🐑 Lista VIP MilkyPot</div>' +
                    '<h1 style="font-family:\'Baloo 2\',cursive;font-size:28px;font-weight:900;margin:0;line-height:1.2">Bem-vindo ao primeiro lote, ' + nome + '!</h1>' +
                '</div>' +
                '<div style="background:#fff;padding:28px 24px;font-size:15px;line-height:1.6;color:#374151">' +
                    '<p style="margin:0 0 14px">Oi, ' + nome + ', tudo bem?</p>' +
                    '<p style="margin:0 0 14px">Aqui é da MilkyPot. Sua inscrição na <strong>Lista VIP de fundadores</strong> está confirmada. Obrigado pela confiança — isso aqui é grande pra gente.</p>' +
                    '<p style="margin:0 0 14px">A MilkyPot está abrindo <strong>mini-franquias em todo Brasil</strong>. São três modelos pensados pra caber em qualquer realidade:</p>' +
                    '<div style="background:#F9FAFB;border-radius:10px;padding:14px 16px;margin:0 0 16px">' +
                        '<div style="padding:6px 0;border-bottom:1px solid #E5E7EB">🛵 <strong>Delivery em Casa</strong> — a partir de R$ 3.499</div>' +
                        '<div style="padding:6px 0;border-bottom:1px solid #E5E7EB">🚀 <strong>Pro Dark Kitchen</strong> — a partir de R$ 4.997</div>' +
                        '<div style="padding:6px 0">🏪 <strong>Loja / Quiosque</strong> — a partir de R$ 25.000</div>' +
                    '</div>' +
                    '<p style="margin:0 0 14px">A operação já está rodando em <strong>Londrina-PR</strong> e queremos VOCÊ no primeiro lote — não só avisado depois.</p>' +
                    '<p style="margin:0 0 8px"><strong>Como fundador da Lista VIP, você recebe:</strong></p>' +
                    '<ul style="margin:0 0 16px;padding-left:20px;line-height:1.8">' +
                        '<li>Convite pra conversa direta com o Jocimar antes do público geral</li>' +
                        '<li>Aviso antecipado da abertura oficial</li>' +
                        '<li>Tabela de pré-lançamento exclusiva dos três modelos</li>' +
                        '<li><strong>🌎 Prioridade na escolha da sua região</strong> — vagas limitadas por cidade</li>' +
                    '</ul>' +
                    '<p style="margin:0 0 14px">Em breve a Lilo te chama por aqui com os próximos passos. Fica de olho na caixa de entrada (e no spam, só por garantia).</p>' +
                    '<div style="background:#FFF0F6;border-left:4px solid #FF4F8A;padding:12px 16px;border-radius:8px;margin:16px 0;font-size:14px">' +
                        '💬 <strong>Dúvida urgente?</strong> Fala direto com o Jocimar no WhatsApp:<br>' +
                        '<a href="https://wa.me/' + WHATSAPP_JOCIMAR + '" style="color:#7E57C2;text-decoration:none;font-weight:700">https://wa.me/' + WHATSAPP_JOCIMAR + '</a>' +
                    '</div>' +
                    '<p style="margin:18px 0 0;color:#6B7280;font-size:14px">Um abraço,<br><strong style="color:#7E57C2">Jocimar e a Lilo 🐑</strong></p>' +
                '</div>' +
                '<div style="text-align:center;color:#9CA3AF;font-size:11px;padding:14px;background:#F9FAFB;border-radius:0 0 8px 8px">' +
                    'MilkyPot — feito com carinho em Londrina-PR<br>' +
                    '<span style="opacity:.7">Você está recebendo porque entrou na Lista VIP em milkypot.com</span>' +
                '</div>' +
            '</div>';
    }

    function buildAdminEmailHtml(d, tag) {
        var capLabel = { 'ate-5k': 'até R$ 5k', '5-15k': 'R$ 5-15k', '15-30k': 'R$ 15-30k', '30k+': 'R$ 30k+' }[d.capital] || d.capital;
        var fmtLabel = { 'delivery': '🛵 Delivery', 'pro': '🚀 Pro Dark', 'loja': '🏪 Loja/Quiosque', 'nao-sei': '🤔 Não sei' }[d.formato] || d.formato;
        var perfilLabel = { 'ja-empreendo': 'Já empreende', 'primeiro': 'Primeiro negócio', 'investidor': 'Investe em outros' }[d.perfil] || d.perfil;
        var wppDigits = onlyDigits(d.whatsapp);
        if (wppDigits.length === 11) wppDigits = '55' + wppDigits;
        return '' +
            '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">' +
                '<div style="background:#7B1FA2;color:#fff;padding:14px;border-radius:10px 10px 0 0">' +
                    '<h2 style="margin:0;font-size:17px">🐑 Novo lead Lista VIP — <span style="background:#FFD54F;color:#7B1FA2;padding:2px 8px;border-radius:10px;font-size:13px">' + tag + '</span></h2>' +
                '</div>' +
                '<div style="background:#fff;padding:18px;border:1px solid #E5E7EB;border-top:0;border-radius:0 0 10px 10px;font-size:14px;line-height:1.7">' +
                    '<div><strong>Nome:</strong> ' + esc(d.nome) + '</div>' +
                    '<div><strong>WhatsApp:</strong> <a href="https://wa.me/' + wppDigits + '">' + esc(d.whatsapp) + '</a></div>' +
                    '<div><strong>Email:</strong> <a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a></div>' +
                    '<div><strong>Cidade:</strong> ' + esc(d.cidade) + '/' + esc(d.uf) + '</div>' +
                    '<div><strong>Capital:</strong> ' + capLabel + '</div>' +
                    '<div><strong>Formato:</strong> ' + fmtLabel + '</div>' +
                    '<div><strong>Perfil:</strong> ' + perfilLabel + '</div>' +
                '</div>' +
                '<div style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:8px">Lead registrado em /franchise_leads — origem landing#franquia</div>' +
            '</div>';
    }

    // ============================================
    // Submit handler
    // ============================================
    function handleSubmit(form) {
        var fd = new FormData(form);
        var data = {
            nome: (fd.get('nome') || '').toString().trim(),
            whatsapp: (fd.get('whatsapp') || '').toString().trim(),
            email: (fd.get('email') || '').toString().trim().toLowerCase(),
            cidade: (fd.get('cidade') || '').toString().trim(),
            uf: (fd.get('uf') || '').toString().trim().toUpperCase(),
            capital: (fd.get('capital') || '').toString(),
            formato: (fd.get('formato') || '').toString(),
            perfil: (fd.get('perfil') || '').toString()
        };

        var errs = validate(data);
        var errEl = document.getElementById('mp-fw-error');
        if (errs.length) {
            errEl.textContent = '⚠️ Preencha: ' + errs.join(', ');
            errEl.style.display = 'block';
            return;
        }
        errEl.style.display = 'none';

        var btn = document.getElementById('mp-fw-submit');
        btn.disabled = true;
        btn.textContent = '⏳ Garantindo sua vaga...';

        var tag = tagFor(data.capital);
        var leadId = 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

        var leadDoc = {
            id: leadId,
            nome: data.nome,
            whatsapp: onlyDigits(data.whatsapp),
            whatsappRaw: data.whatsapp,
            email: data.email,
            cidade: data.cidade,
            uf: data.uf,
            capital: data.capital,
            formato: data.formato,
            perfil: data.perfil,
            tag: tag,
            origem: 'landing#franquia',
            preselectFormato: preselectFormato || null,
            criadoEm: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 200)
        };

        // Auth anônima → grava lead → grava email → mostra sucesso
        ensureAuth()
            .then(function () {
                if (typeof firebase === 'undefined' || !firebase.firestore) {
                    throw new Error('Firebase não carregado');
                }
                var db = firebase.firestore();

                // 1. Lead persistente em /franchise_leads/{leadId}
                var saveLead = db.collection(COL_LEADS).doc(leadId).set(leadDoc).catch(function (e) {
                    // Se rules bloquearem, ainda continua tentando email
                    console.warn('franchise_leads write falhou:', e && e.message);
                });

                // 2. Email pro lead (Trigger Email Extension envia)
                var leadMail = db.collection(COL_MAIL).add({
                    to: [data.email],
                    cc: [ADMIN_EMAIL],
                    from: 'MilkyPot <noreply@milkypot.com>',
                    replyTo: ADMIN_EMAIL,
                    message: {
                        subject: 'Bem-vindo ao primeiro lote MilkyPot, ' + (data.nome.split(' ')[0] || data.nome) + ' 🐑',
                        html: buildLeadEmailHtml(data)
                    },
                    metadata: { leadId: leadId, tag: tag, origem: 'franchise_waitlist' }
                });

                // 3. Email pro admin (notificação interna)
                var adminMail = db.collection(COL_MAIL).add({
                    to: [ADMIN_EMAIL],
                    from: 'MilkyPot Lead <noreply@milkypot.com>',
                    message: {
                        subject: '[' + tag + '] Novo lead Lista VIP: ' + data.nome + ' (' + data.cidade + '/' + data.uf + ')',
                        html: buildAdminEmailHtml(data, tag)
                    },
                    metadata: { leadId: leadId, tag: tag, origem: 'franchise_waitlist_admin_notify' }
                });

                return Promise.all([saveLead, leadMail, adminMail]);
            })
            .then(function () {
                showSuccess(data.nome);
            })
            .catch(function (err) {
                console.error('franchise-waitlist submit erro:', err);
                btn.disabled = false;
                btn.textContent = '🐑 Garantir minha vaga na Lista VIP';
                errEl.innerHTML = '⚠️ Não conseguimos registrar agora. Fala direto com o Jocimar no WhatsApp: <a href="https://wa.me/' + WHATSAPP_JOCIMAR + '?text=Vim%20da%20landing%20interessado%20em%20franquia%20mas%20o%20site%20deu%20erro" target="_blank" style="color:#7E57C2;font-weight:700">clique aqui</a>';
                errEl.style.display = 'block';
            });
    }

    // ============================================
    // Auth anônima — silent (não pede credenciais)
    // ============================================
    function ensureAuth() {
        return new Promise(function (resolve, reject) {
            if (typeof firebase === 'undefined' || !firebase.auth) {
                resolve(); // sem firebase, vai falhar no firestore mesmo
                return;
            }
            var current = firebase.auth().currentUser;
            if (current) { resolve(current); return; }
            firebase.auth().signInAnonymously()
                .then(function (cred) { resolve(cred && cred.user); })
                .catch(function (err) {
                    // Se anon auth falhar (provavelmente desabilitado), seguimos
                    // assim mesmo — write no /mail vai falhar mas /franchise_leads
                    // pode ter rule mais permissiva. O catch do submit cuida.
                    console.warn('signInAnonymously falhou:', err && err.code);
                    resolve(null);
                });
        });
    }

    // ============================================
    // Tela de sucesso (substitui form)
    // ============================================
    function showSuccess(nome) {
        var firstName = (nome || '').split(' ')[0] || nome || 'fundador';
        var dialog = modalEl && modalEl.querySelector('[role="dialog"]');
        if (!dialog) return;
        dialog.innerHTML = '' +
            '<div style="background:linear-gradient(135deg,#10B981 0%,#7B1FA2 100%);color:#fff;padding:40px 28px;border-radius:20px;text-align:center">' +
                '<div style="font-size:80px;line-height:1;margin-bottom:14px">🐑</div>' +
                '<h2 style="font-family:\'Baloo 2\',cursive;font-size:28px;font-weight:900;margin:0 0 10px">Bem-vindo, ' + esc(firstName) + '!</h2>' +
                '<p style="font-size:16px;line-height:1.5;margin:0 0 18px;opacity:.95">Sua vaga na <strong>Lista VIP de fundadores</strong> está garantida. Acabamos de mandar um email de confirmação.</p>' +
                '<div style="background:rgba(255,255,255,.15);backdrop-filter:blur(6px);border-radius:14px;padding:14px 18px;margin:18px 0;text-align:left;font-size:14px;line-height:1.6">' +
                    '<div style="margin-bottom:6px">📩 <strong>Confira sua caixa de entrada</strong> (e o spam, só por garantia)</div>' +
                    '<div style="margin-bottom:6px">🌎 <strong>Sua região</strong> está reservada na fila VIP</div>' +
                    '<div>💬 Em breve o Jocimar te chama no WhatsApp</div>' +
                '</div>' +
                '<a href="https://wa.me/' + WHATSAPP_JOCIMAR + '?text=Acabei%20de%20entrar%20na%20Lista%20VIP%20da%20MilkyPot" target="_blank" style="display:inline-block;background:#fff;color:#7E57C2;padding:12px 26px;border-radius:100px;text-decoration:none;font-weight:800;font-family:\'Baloo 2\',cursive;font-size:15px;margin:6px 0">💬 Chamar o Jocimar agora</a>' +
                '<div style="margin-top:18px"><button type="button" id="mp-fw-close-success" style="background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;padding:10px 22px;border-radius:100px;font-family:inherit;font-weight:600;cursor:pointer">Fechar</button></div>' +
            '</div>';
        var closeBtn = document.getElementById('mp-fw-close-success');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
    }

    // ============================================
    // Open / Close modal
    // ============================================
    function openModal(formato) {
        preselectFormato = formato || null;
        if (modalEl) closeModal();
        var wrap = document.createElement('div');
        wrap.innerHTML = buildModalHtml();
        modalEl = wrap.firstChild;
        document.body.appendChild(modalEl);
        // Adiciona o style separadamente (último elemento do innerHTML)
        var style = wrap.querySelector('style');
        if (style) document.head.appendChild(style);

        // Eventos
        var form = document.getElementById('mp-fw-form');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSubmit(form);
        });
        document.getElementById('mp-fw-close').addEventListener('click', closeModal);
        modalEl.addEventListener('click', function (e) {
            if (e.target === modalEl) closeModal();
        });

        // Visual feedback nos radios
        modalEl.querySelectorAll('.mp-fw-radio input[type=radio]').forEach(function (input) {
            input.addEventListener('change', function () {
                var name = input.name;
                modalEl.querySelectorAll('.mp-fw-radio input[name=' + name + ']').forEach(function (i) {
                    i.parentElement.classList.toggle('checked', i.checked);
                });
            });
        });

        // Foca no nome
        setTimeout(function () {
            var nameInput = form.querySelector('input[name=nome]');
            if (nameInput) nameInput.focus();
        }, 100);

        // ESC fecha
        document.addEventListener('keydown', escHandler);
    }

    function closeModal() {
        if (!modalEl) return;
        modalEl.remove();
        modalEl = null;
        document.removeEventListener('keydown', escHandler);
    }

    function escHandler(e) {
        if (e.key === 'Escape') closeModal();
    }

    // ============================================
    // Export
    // ============================================
    window.MilkyFranchiseWaitlist = {
        open: openModal,
        close: closeModal
    };
})();
