/* ============================================
   MilkyPot — Termos Legais + Aceites
   ============================================
   Centraliza textos legais (CLT, LGPD, beneficios) e
   registra ACEITES com timestamp/IP/dispositivo (prova
   juridica em caso de processo).

   Coleção: legal_acceptances/{franchiseId}/entries
   ============================================ */

(function () {
    'use strict';

    var COLLECTION = 'legal_acceptances';
    var TERM_VERSION = '2026.05.08-v1';

    var TERMS = {
        // ===========================================
        // TERMO DE USO DO APP / PORTAL DO FUNCIONARIO
        // ===========================================
        EMPLOYEE_APP: {
            id: 'employee_app',
            version: TERM_VERSION,
            title: 'Termo de Uso do App MilkyPot Funcionário',
            summary: 'Antes de usar o app/portal, voce precisa concordar com algumas regras importantes para sua proteção e da empresa.',
            sections: [
                {
                    heading: '1. Identificação pessoal e PIN',
                    body: 'Seu PIN é PESSOAL E INTRANSFERÍVEL. Não compartilhe com colegas. ' +
                          'Toda batida feita com seu PIN é considerada SUA, mesmo que outra pessoa tenha digitado. ' +
                          'Se desconfiar que alguém usou seu PIN, avise o gerente IMEDIATAMENTE.'
                },
                {
                    heading: '2. Bater ponto — sua responsabilidade legal',
                    body: 'Você é obrigado a bater ponto em TODAS as 4 marcações diárias (entrada, saída almoço, ' +
                          'volta almoço, saída) conforme CLT art. 74. Esquecer é falta grave. ' +
                          'Se esqueceu, peça justificativa AO SEU GERENTE — não tente "compensar" depois.'
                },
                {
                    heading: '3. Localização e selfie',
                    body: 'Ao bater ponto, capturamos sua localização (GPS) e tiramos uma selfie automática. ' +
                          'Isso protege VOCÊ contra acusações de não estar trabalhando, e protege A EMPRESA contra fraude. ' +
                          'Se a selfie não foi tirada ou a localização foi negada, o ponto pode ser questionado.'
                },
                {
                    heading: '4. Direitos garantidos pela CLT',
                    body: 'Você tem direito a: jornada máxima de 8h/dia e 44h/semana (art. 7 XIII), ' +
                          'intervalo intrajornada de no mínimo 1h se trabalhar mais de 6h (art. 71), ' +
                          'descanso semanal remunerado de 24h (art. 67), ' +
                          'horas extras com adicional mínimo de 50% (art. 7 XVI), ' +
                          'adicional noturno de 20% das 22h às 5h (art. 73), ' +
                          'férias remuneradas com 1/3 constitucional (art. 7 XVII), ' +
                          'décimo terceiro salário (Lei 4.090/62), FGTS (Lei 8.036/90).'
                },
                {
                    heading: '5. Espelho de ponto e holerite',
                    body: 'Você tem direito de receber e conferir seu espelho de ponto MENSALMENTE (CLT art. 74 §2). ' +
                          'Disponível na aba "Mês" do app. Se notar erro, comunique imediatamente para correção via justificativa.'
                },
                {
                    heading: '6. Benefícios (sorvete do dia, refeição, lanche)',
                    body: 'Benefícios entregues pela loja (sorvete do dia, refeição, etc) são PESSOAIS E INTRANSFERÍVEIS. ' +
                          'Você não pode dar/vender/trocar com terceiros. ' +
                          'Tentar fraudar (pegar para outra pessoa) é falta grave (CLT art. 482, alínea a) ' +
                          'e pode resultar em CANCELAMENTO do benefício, advertência ou demissão por justa causa.'
                },
                {
                    heading: '7. Banco de horas',
                    body: 'Solicitações de banco de horas devem ter motivo justificado e podem ser aprovadas ou recusadas pelo gerente. ' +
                          'Compensação ocorre conforme CLT art. 59 §2 (até 6 meses por acordo individual, até 1 ano por acordo coletivo).'
                },
                {
                    heading: '8. Privacidade e dados (LGPD)',
                    body: 'Coletamos: CPF, PIS, nome, função, salário, localização (apenas no momento do ponto), ' +
                          'foto/selfie (apenas no ponto), token de notificação. ' +
                          'Dados são armazenados em servidores Firebase (Google Cloud Brasil) e usados EXCLUSIVAMENTE para gestão de RH. ' +
                          'Você tem direito a acessar, corrigir e solicitar exclusão dos seus dados (LGPD art. 18). ' +
                          'Para exercer, fale com o gerente.'
                },
                {
                    heading: '9. Em caso de fraude ou descumprimento',
                    body: 'Tentativas de bater ponto de outra pessoa, manipular geolocalização, usar PIN alheio, ' +
                          'ou fraudar benefícios constituem falta grave conforme CLT art. 482 (improbidade) ' +
                          'e podem resultar em advertência, suspensão, demissão por justa causa e ações cíveis/criminais.'
                }
            ],
            checkboxText: 'Li e concordo com os termos acima. Entendo meus direitos e responsabilidades como trabalhador conforme CLT.'
        },

        // ===========================================
        // TERMO DE BENEFICIO (mostrado no PDV ao lançar)
        // ===========================================
        BENEFIT_GRANT: {
            id: 'benefit_grant',
            version: TERM_VERSION,
            title: 'Recebimento de Benefício',
            summary: 'Antes de receber, leia:',
            sections: [
                {
                    heading: 'Benefício pessoal e intransferível',
                    body: 'Este benefício é exclusivamente para você. NÃO pode ser doado, vendido ou trocado com outras pessoas (clientes, amigos, familiares).'
                },
                {
                    heading: 'Limite de 1 por dia',
                    body: 'Cada funcionário tem direito a apenas 1 benefício diário do mesmo tipo. Se você já recebeu hoje, este lançamento é bloqueado.'
                },
                {
                    heading: 'Cancelamento em caso de fraude',
                    body: 'Tentativas de receber para outra pessoa, ou repassar o benefício, resultam em CANCELAMENTO do benefício e podem gerar advertência, suspensão ou demissão por justa causa (CLT art. 482).'
                },
                {
                    heading: 'Registro permanente',
                    body: 'Esta autorização fica registrada com seu nome, PIN, data, hora e operador. Não pode ser apagada — apenas cancelada por gerente em caso de fraude detectada.'
                }
            ],
            checkboxText: 'Eu, funcionário, autorizo este benefício PESSOALMENTE com meu PIN e declaro que é para meu consumo próprio.'
        },

        // ===========================================
        // TERMO DE PRIVACIDADE / LGPD
        // ===========================================
        PRIVACY: {
            id: 'privacy',
            version: TERM_VERSION,
            title: 'Política de Privacidade — LGPD',
            summary: 'Como tratamos seus dados pessoais:',
            sections: [
                {
                    heading: 'Dados coletados',
                    body: 'CPF, PIS, RG (opcional), nome completo, telefone, endereço (opcional), função, salário, ' +
                          'data de admissão, jornada cadastrada, marcações de ponto, geolocalização (apenas no ato), ' +
                          'foto (apenas no ato do ponto), token FCM (notificação), histórico de benefícios.'
                },
                {
                    heading: 'Finalidade',
                    body: 'Gestão de RH conforme CLT/Portaria MTE 671/2021: registro legal de jornada, cálculo de folha, ' +
                          'comunicação de lembretes, prevenção de fraude.'
                },
                {
                    heading: 'Armazenamento',
                    body: 'Servidores Firebase (Google Cloud), região southamerica-east1 (São Paulo). ' +
                          'Backup automático. Acesso restrito ao franqueado e administradores autorizados.'
                },
                {
                    heading: 'Compartilhamento',
                    body: 'Dados NUNCA são compartilhados com terceiros, exceto: contabilidade (apenas dados necessários ' +
                          'para folha), Receita Federal/eSocial (obrigação legal), Ministério do Trabalho (caso de fiscalização).'
                },
                {
                    heading: 'Seus direitos (LGPD art. 18)',
                    body: 'Você pode solicitar a qualquer momento: acesso aos seus dados, correção, anonimização, ' +
                          'portabilidade, eliminação (após desligamento), revogação de consentimento. ' +
                          'Solicite ao gerente da franquia ou via e-mail contato@milkypot.com.'
                },
                {
                    heading: 'Tempo de retenção',
                    body: 'Dados de jornada e folha: 5 anos após desligamento (CLT art. 11 + Decreto 99.684/90). ' +
                          'Demais dados: até 12 meses após desligamento.'
                }
            ],
            checkboxText: 'Li, compreendi e concordo com o tratamento dos meus dados conforme descrito acima.'
        }
    };

    function nowIso() { return new Date().toISOString(); }

    /**
     * Registra que um usuario aceitou um termo. Salva tudo pra valer juridicamente.
     */
    function recordAcceptance(franchiseId, params) {
        if (typeof DataStore === 'undefined') return { success: false };
        if (!franchiseId || !params || !params.termId) return { success: false, error: 'Dados incompletos' };

        var entry = {
            id:           'acc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            franchiseId:  franchiseId,
            termId:       params.termId,
            termVersion:  params.termVersion || TERM_VERSION,
            // Quem aceitou
            acceptorType: params.acceptorType || 'staff',  // 'staff' | 'admin'
            acceptorId:   params.acceptorId || null,
            acceptorName: params.acceptorName || '',
            acceptorCpf:  params.acceptorCpf || '',
            acceptorPis:  params.acceptorPis || '',
            // Contexto do aceite (prova juridica)
            timestamp:    nowIso(),
            userAgent:    (navigator.userAgent || '').slice(0, 200),
            language:     navigator.language || '',
            screen:       (screen.width + 'x' + screen.height),
            geolocation:  params.geolocation || null,
            channel:      params.channel || 'web',
            ipAddress:    null,            // Cloud Function pode preencher server-side
            metadata:     params.metadata || {}
        };

        DataStore.addToCollection(COLLECTION, franchiseId, entry);

        try {
            DataStore.addToCollection('legal_acceptances_audit', franchiseId, {
                id: 'aud_' + Date.now(),
                action: 'acceptance_recorded',
                entry: entry,
                timestamp: nowIso()
            });
        } catch (e) {}

        return { success: true, entry: entry };
    }

    /**
     * Verifica se um staff/admin ja aceitou determinado termo (em qualquer versao).
     */
    function hasAccepted(franchiseId, termId, acceptorId) {
        if (typeof DataStore === 'undefined') return false;
        var all = DataStore.getCollection(COLLECTION, franchiseId) || [];
        return all.some(function (e) {
            return e.termId === termId && e.acceptorId === acceptorId;
        });
    }

    function lastAcceptance(franchiseId, termId, acceptorId) {
        if (typeof DataStore === 'undefined') return null;
        var all = DataStore.getCollection(COLLECTION, franchiseId) || [];
        var matches = all.filter(function (e) { return e.termId === termId && e.acceptorId === acceptorId; });
        if (!matches.length) return null;
        return matches.sort(function (a, b) { return b.timestamp.localeCompare(a.timestamp); })[0];
    }

    /**
     * Renderiza um termo como HTML (para modais, paginas etc).
     */
    function renderTermHTML(termId) {
        var t = TERMS[termId] || TERMS[String(termId).toUpperCase()];
        if (!t) {
            for (var k in TERMS) if (TERMS[k].id === termId) { t = TERMS[k]; break; }
        }
        if (!t) return '<p>Termo nao encontrado.</p>';

        var html = '<div style="font-family:inherit">';
        html += '<h2 style="margin:0 0 6px;font-family:\'Baloo 2\',cursive;color:#16A34A">' + t.title + '</h2>';
        if (t.summary) html += '<p style="font-size:.85rem;color:#6B7280;margin:0 0 14px">' + t.summary + '</p>';

        t.sections.forEach(function (s) {
            html += '<div style="background:#F9FAFB;border-left:3px solid #16A34A;padding:10px 14px;border-radius:6px;margin-bottom:8px">';
            html += '<strong style="display:block;color:#14532D;font-size:.88rem;margin-bottom:4px">' + s.heading + '</strong>';
            html += '<p style="margin:0;font-size:.82rem;color:#374151;line-height:1.5">' + s.body + '</p>';
            html += '</div>';
        });

        html += '<p style="font-size:.7rem;color:#9CA3AF;margin-top:14px">Versão ' + t.version + '</p>';
        html += '</div>';
        return html;
    }

    function getTerm(termId) {
        var t = TERMS[termId] || TERMS[String(termId).toUpperCase()];
        if (!t) {
            for (var k in TERMS) if (TERMS[k].id === termId) return TERMS[k];
        }
        return t || null;
    }

    window.LegalTerms = {
        TERMS: TERMS,
        TERM_VERSION: TERM_VERSION,
        recordAcceptance: recordAcceptance,
        hasAccepted: hasAccepted,
        lastAcceptance: lastAcceptance,
        renderTermHTML: renderTermHTML,
        getTerm: getTerm
    };
})();
