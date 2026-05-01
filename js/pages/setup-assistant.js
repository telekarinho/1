/* ============================================================
   MilkyPot — Setup Assistant (IA-powered fill)
   ============================================================
   Ao invés do usuário digitar do zero, a Lilo sugere 3-5 opções
   prontas pra cada item do checklist. Cliente clica → grava.

   Uso:
     SetupAssistant.suggest(itemId, franchiseId) → Promise<Option[]>
     SetupAssistant.apply(itemId, franchiseId, optionData) → saves
   ============================================================ */
(function(global){
    'use strict';

    // Opções default (sem precisar da IA) — servem de fallback E de
    // "primeira sugestão rápida" antes da IA responder.
    const DEFAULTS = {
        'mk_ticker_msg': [
            { label: '🎯 Desafio 300g', text: 'ACERTOU 300g NA BALANÇA? POTINHO É POR NOSSA CONTA 🎯', tone: 'ousada' },
            { label: '⏱ Desafio 10s', text: 'PAROU O CRONÔMETRO EM 10s EXATOS? LEVA DE GRAÇA ⏱️', tone: 'ousada' },
            { label: '📸 Chamada Instagram', text: 'Foto do seu potinho + @milkypot nos stories = topping grátis na próxima 📸', tone: 'segura' },
            { label: '🐑 Fofura', text: 'A Lilo tá esperando você montar o seu potinho no balcão 🐑💖', tone: 'segura' }
        ],
        'mk_qr_overlay': [
            { label: 'Cardápio online', url: 'https://milkypot.com/cardapio.html?utm_source=tv&utm_medium=qr', tone: 'recomendado' },
            { label: 'Instagram', url: 'https://instagram.com/milkypot', tone: 'alternativo' },
            { label: 'Desafio 10s', url: 'https://milkypot.com/desafio.html?utm_source=tv', tone: 'viral' }
        ],
        'op_horario_funcionamento': [
            { label: 'Sorveteria padrão', data: { openHour: 14, closeHour: 22 }, tone: 'recomendado' },
            { label: 'Manhã + tarde', data: { openHour: 10, closeHour: 20 }, tone: 'alternativo' },
            { label: '12 horas seguidas', data: { openHour: 11, closeHour: 23 }, tone: 'alternativo' },
            { label: 'Fim de semana estendido', data: { openHour: 13, closeHour: 1 }, tone: 'madrugada' }
        ],
        'dl_tempo_preparo': [
            { label: 'Sorveteria rápida', data: { prepTimeMinutes: 3 }, tone: 'recomendado' },
            { label: 'Montagem complexa', data: { prepTimeMinutes: 5 }, tone: 'alternativo' },
            { label: 'Com topping quente', data: { prepTimeMinutes: 7 }, tone: 'alternativo' }
        ],
        'ds_voucher_config': [
            { label: '50% OFF no próximo potinho', data: { rewardName: '50% OFF próxima compra' }, tone: 'recomendado' },
            { label: 'Potinho pequeno grátis', data: { rewardName: 'Potinho P grátis' }, tone: 'ousada' },
            { label: 'Topping extra', data: { rewardName: 'Topping extra grátis' }, tone: 'segura' },
            { label: 'R$10 OFF em compras >R$30', data: { rewardName: 'R$10 OFF acima de R$30' }, tone: 'balanceada' }
        ]
    };

    // Mapa: como SALVAR cada tipo de item no DataStore
    const SAVERS = {
        'mk_ticker_msg': (fid, opt) => {
            const cfg = DataStore.get('tv_config_' + fid) || {};
            cfg.ticker = opt.text;
            cfg.newsTicker = opt.text;
            cfg.showNews = true;
            DataStore.set('tv_config_' + fid, cfg);
        },
        'mk_qr_overlay': (fid, opt) => {
            const cfg = DataStore.get('tv_config_' + fid) || {};
            cfg.qrUrl = opt.url;
            DataStore.set('tv_config_' + fid, cfg);
        },
        'op_horario_funcionamento': (fid, opt) => {
            const cfg = DataStore.get('tv_config_' + fid) || {};
            cfg.openHour = opt.data.openHour;
            cfg.closeHour = opt.data.closeHour;
            DataStore.set('tv_config_' + fid, cfg);
        },
        'dl_tempo_preparo': (fid, opt) => {
            const cfg = DataStore.get('store_config_' + fid) || {};
            cfg.prepTimeMinutes = opt.data.prepTimeMinutes;
            DataStore.set('store_config_' + fid, cfg);
        },
        'ds_voucher_config': (fid, opt) => {
            const cfg = DataStore.get('desafio_config_' + fid) || {};
            cfg.rewardName = opt.data.rewardName;
            DataStore.set('desafio_config_' + fid, cfg);
        }
    };

    function getDefaults(itemId) {
        return (DEFAULTS[itemId] || []).map(o => Object.assign({ source: 'default' }, o));
    }

    /**
     * Pede pra Lilo AI gerar 3-5 opções adicionais pro item.
     * Usa a API key já salva em lilo_settings.
     * Fallback: se sem API key ou erro, retorna só defaults.
     */
    async function suggest(itemId, fid) {
        const defaults = getDefaults(itemId);
        const settings = DataStore.get('lilo_settings') || {};
        if (!settings.apiKey) return defaults;

        // Monta contexto + prompt específico
        const item = (global.SetupChecklist?.ITEMS || []).find(i => i.id === itemId);
        if (!item) return defaults;

        const franchises = DataStore.get('franchises') || [];
        const f = franchises.find(x => x.id === fid) || {};

        const prompt = `Preciso configurar o item "${item.title}" na franquia "${f.name || 'MilkyPot'}" em Londrina-PR.

Descrição do item: ${item.detail}

Me dê **5 opções** de resposta pronta pra esse item, em ordem do mais recomendado pro mais ousado. Formato de saída EXATO (JSON array):

\`\`\`json
[
  {"label": "...nome curto...", "value": "...valor/texto/número...", "tone": "recomendado|seguro|ousado|viral"},
  ...
]
\`\`\`

Regras:
- Cada label: MÁXIMO 6 palavras, em PT-BR
- value: se for texto livre (ticker, mensagem), o texto completo pronto pra salvar (máx 80 chars)
- value: se for número (horário, tempo), só o número
- value: se for URL, URL completa com utm_source=tv quando fizer sentido
- Contextualize pra MilkyPot (sorveteria com potinhos personalizados, mascote ovelhinha Lilo, desafios 10s e 300g)
- Sem disclaimers. Sem texto fora do JSON.`;

        try {
            const r = await fetch('/api/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: settings.apiKey,
                    model: settings.model || 'claude-haiku-4',  // haiku = mais barato pra sugestões rápidas
                    messages: [{ role: 'user', content: prompt }],
                    context: { franchiseName: f.name, city: (f.territorio||{}).cidade }
                })
            });
            if (!r.ok) return defaults;
            const data = await r.json();
            const reply = data.reply || '';
            // Parse JSON do bloco ```json
            const match = reply.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (!match) return defaults;
            const arr = JSON.parse(match[1]);
            const iaOptions = (Array.isArray(arr) ? arr : []).map(o => Object.assign({ source: 'ia' }, o));
            return iaOptions.length ? iaOptions : defaults;
        } catch (e) {
            console.warn('[SetupAssistant] suggest err:', e);
            return defaults;
        }
    }

    /**
     * Grava a opção escolhida no DataStore.
     * Retorna { success, itemId, savedAs }
     */
    function apply(itemId, fid, option) {
        const saver = SAVERS[itemId];
        if (!saver) {
            // fallback genérico: grava como override ou manual value
            console.warn('[SetupAssistant] Sem saver pra', itemId, '— salvando como override "done"');
            if (global.SetupChecklist?.setOverride) global.SetupChecklist.setOverride(fid, itemId, 'done');
            return { success: true, itemId: itemId, fallback: true };
        }
        try {
            saver(fid, option);
            return { success: true, itemId: itemId };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    global.SetupAssistant = {
        suggest: suggest,
        apply: apply,
        getDefaults: getDefaults,
        SAVERS: SAVERS
    };
})(typeof window !== 'undefined' ? window : this);
