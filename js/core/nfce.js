/* ============================================================
   MilkyPot NFC-e — Emissor de nota fiscal
   ============================================================
   Suporte a 2 modos:

   1. "manual" (default) — registra venda localmente como "NF pendente"
      Operador emite externamente no app do Bling/Tiny/SEFAZ e preenche
      número/chave depois.

   2. "bling" — integração API Bling (requer OAuth + NCM/CEST cadastrados).
      Cada venda gera 1 NFC-e via POST /Api/v3/nfce
      https://developer.bling.com.br/referencia#/NFC-e

   ATENÇÃO: NFC-e em produção exige:
     - Certificado A1 cadastrado (Bling resolve)
     - Inscrição estadual ativa
     - NCM correto por produto
     - CEST se contribuinte substituto
     - CRT definido (Simples Nacional = 1)
     - Homologação SEFAZ/PR

   Storage:
     nfe_config_{fid}  — { mode, apiKey, cnpj, ie, crt, serie, proximoNumero }
     nfe_log_{fid}     — [{ id, orderId, numero, chave, status, at }]
   ============================================================ */
(function(global){
    'use strict';

    function getConfig(fid) {
        if (!global.DataStore || !fid) return { mode: 'manual' };
        return global.DataStore.get('nfe_config_' + fid) || { mode: 'manual' };
    }

    function setConfig(fid, cfg) {
        const current = getConfig(fid);
        const merged = Object.assign(current, cfg);
        global.DataStore.set('nfe_config_' + fid, merged);
        return merged;
    }

    function getLog(fid) {
        return (global.DataStore && global.DataStore.get('nfe_log_' + fid)) || [];
    }

    function _addLog(fid, entry) {
        const log = getLog(fid);
        log.push(Object.assign({ id: 'nfe_' + Date.now().toString(36), at: new Date().toISOString() }, entry));
        global.DataStore.set('nfe_log_' + fid, log);
        return log;
    }

    /**
     * Emite NFC-e (ou registra pendente).
     * @returns Promise<{ status, numero?, chave?, error? }>
     */
    function emit(fid, order) {
        const cfg = getConfig(fid);

        if (cfg.mode === 'manual') {
            const entry = _addLog(fid, {
                orderId: order.id, status: 'pendente_manual',
                valor: order.total, forma: order.paymentMethod || 'indefinido'
            });
            return Promise.resolve({ status: 'pendente_manual', logId: entry[entry.length-1].id });
        }

        if (cfg.mode === 'bling') {
            if (!cfg.apiKey || !cfg.cnpj) {
                return Promise.resolve({ status: 'erro', error: 'Bling não configurado (apiKey/cnpj)' });
            }
            return _emitBling(fid, order, cfg);
        }

        return Promise.resolve({ status: 'erro', error: 'Modo NFE desconhecido: ' + cfg.mode });
    }

    function _emitBling(fid, order, cfg) {
        // Monta payload Bling NFC-e v3
        const payload = {
            tipo: 1,
            numero: cfg.proximoNumero || null,
            serie: cfg.serie || 1,
            dataEmissao: new Date().toISOString(),
            contato: {
                nome: order.customer && order.customer.name || 'Consumidor',
                tipoPessoa: 'F',
                numeroDocumento: order.customer && order.customer.cpf || ''
            },
            itens: (order.items || []).map((it, i) => ({
                codigo: it.id || 'PROD' + i,
                descricao: it.name,
                unidade: 'UN',
                quantidade: it.qty || 1,
                valor: it.unitPrice || it.total,
                tipo: 'P',
                ncm: cfg.ncmPadrao || '21050000',  // Sorvete
                cfop: '5102',
                origem: 0
            })),
            parcelas: [{ dataVencimento: new Date().toISOString().slice(0,10), valor: order.total, formaPagamento: 1 }]
        };

        return fetch('https://www.bling.com.br/Api/v3/nfce', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + cfg.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(data => {
            if (data.data && data.data.numero) {
                setConfig(fid, { proximoNumero: Number(data.data.numero) + 1 });
                _addLog(fid, {
                    orderId: order.id, status: 'autorizada',
                    numero: data.data.numero, chave: data.data.chaveAcesso,
                    valor: order.total
                });
                return { status: 'autorizada', numero: data.data.numero, chave: data.data.chaveAcesso };
            }
            _addLog(fid, {
                orderId: order.id, status: 'rejeitada',
                error: data.error && data.error.description || 'desconhecido'
            });
            return { status: 'rejeitada', error: data.error && data.error.description };
        })
        .catch(err => {
            _addLog(fid, { orderId: order.id, status: 'erro_rede', error: err.message });
            return { status: 'erro_rede', error: err.message };
        });
    }

    function updatePendente(fid, logId, data) {
        const log = getLog(fid);
        const idx = log.findIndex(l => l.id === logId);
        if (idx < 0) return false;
        log[idx] = Object.assign(log[idx], data, { status: data.status || 'autorizada' });
        global.DataStore.set('nfe_log_' + fid, log);
        return log[idx];
    }

    function resumoPendentes(fid) {
        const log = getLog(fid);
        return {
            total: log.length,
            pendentes: log.filter(l => l.status === 'pendente_manual').length,
            autorizadas: log.filter(l => l.status === 'autorizada').length,
            rejeitadas: log.filter(l => l.status === 'rejeitada').length
        };
    }

    global.NFCe = {
        emit, getConfig, setConfig, getLog, updatePendente, resumoPendentes
    };
})(typeof window !== 'undefined' ? window : this);
