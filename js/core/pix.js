/* ============================================================
   MilkyPot Pix — QR Code estático (copia-e-cola)
   ============================================================
   NÃO é Pix dinâmico (sem integração bancária direta).
   Gera código Pix BR Code (EMV) estático que o cliente copia
   e cola no app do banco dele pra pagar.

   Pro PDV:
     Pix.generatePayload({ chave, nome, cidade, valor, txid })
       → "00020126..." (string copia-e-cola)
     Pix.generateQrSvg(payload) → string SVG
     Pix.configLoja(fid, { chave, nome, cidade })

   OBS: pagamento é confirmado MANUALMENTE pelo caixa (operador vê o
   comprovante do cliente). Pro dia-1 é o bastante. Próxima fase:
   integrar webhook do banco (Inter, PJ Bank API).
   ============================================================ */
(function(global){
    'use strict';

    // ===== Utilitários CRC16-CCITT (padrão Pix) =====
    function crc16(str) {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            crc ^= (str.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
                else crc <<= 1;
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    function tlv(id, value) {
        const len = value.length.toString().padStart(2, '0');
        return id + len + value;
    }

    function sanitize(s, max, allowEmail) {
        // Remove acentos, mantém ASCII. Pra chave pix (email/telefone), mantém @ + +.
        const regex = allowEmail ? /[^a-zA-Z0-9 \-\.\+@]/g : /[^a-zA-Z0-9 \-\.]/g;
        return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                              .replace(regex, '').slice(0, max).trim();
    }

    /**
     * Gera BR Code Pix estático (EMV).
     * @param {object} opts
     *   chave: string (CPF/CNPJ/email/telefone/aleatória)
     *   nome: string (titular, max 25)
     *   cidade: string (max 15)
     *   valor: number (opcional — se omitido, cliente digita)
     *   txid: string (opcional, max 25)
     * @returns {string} payload copia-e-cola
     */
    function generatePayload(opts) {
        opts = opts || {};
        const chave = sanitize(opts.chave || '', 77, true);
        const nome = sanitize(opts.nome || 'MILKYPOT', 25).toUpperCase();
        const cidade = sanitize(opts.cidade || 'LONDRINA', 15).toUpperCase();
        const valor = Number(opts.valor || 0);
        const txid = sanitize(opts.txid || '***', 25);

        if (!chave) throw new Error('Chave Pix obrigatória');

        // Campo 26 — Merchant Account Info (Pix)
        const guiPix = tlv('00', 'br.gov.bcb.pix');
        const chaveField = tlv('01', chave);
        const mai = tlv('26', guiPix + chaveField);

        let payload = '';
        payload += tlv('00', '01');              // Payload Format Indicator
        payload += tlv('01', '12');              // Point of Initiation (12 = estático)
        payload += mai;                           // Merchant Account Info
        payload += tlv('52', '0000');            // Merchant Category Code
        payload += tlv('53', '986');             // Transaction Currency (986 = BRL)
        if (valor > 0) payload += tlv('54', valor.toFixed(2));
        payload += tlv('58', 'BR');              // Country
        payload += tlv('59', nome);              // Merchant Name
        payload += tlv('60', cidade);            // Merchant City
        payload += tlv('62', tlv('05', txid));   // Additional Data (txid)
        payload += '6304';                        // CRC placeholder (id+len)
        const crc = crc16(payload);
        return payload + crc;
    }

    // ===== QR code SVG gerator simples (nível Q de correção, 25x25 básico) =====
    // Pra produção real, use biblioteca como qrcode.js. Aqui é fallback minimal.
    function generateQrDataUrl(payload) {
        // Usa API pública do Google Charts como fallback (free, sem key)
        // Em produção, use biblioteca local (qrcode-generator) pra não depender de net
        const enc = encodeURIComponent(payload);
        return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${enc}`;
    }

    // ===== Config por loja =====
    function configLoja(fid, cfg) {
        if (!global.DataStore || !fid) return;
        const current = global.DataStore.get('pix_config_' + fid) || {};
        const merged = Object.assign(current, cfg);
        global.DataStore.set('pix_config_' + fid, merged);
        return merged;
    }

    function getConfig(fid) {
        if (!global.DataStore || !fid) return null;
        return global.DataStore.get('pix_config_' + fid);
    }

    /**
     * Gera payload + QR pra venda do PDV.
     */
    function forOrder(fid, order) {
        const cfg = getConfig(fid);
        if (!cfg || !cfg.chave) return { error: 'Pix não configurado. Vá em Configurações → Pix.' };
        const txid = ('PDV' + Date.now()).slice(0, 25);
        const payload = generatePayload({
            chave: cfg.chave,
            nome: cfg.nome || 'MILKYPOT',
            cidade: cfg.cidade || 'LONDRINA',
            valor: order.total,
            txid: txid
        });
        return {
            payload,
            qrUrl: generateQrDataUrl(payload),
            txid,
            valor: order.total,
            chave: cfg.chave,
            nome: cfg.nome
        };
    }

    global.Pix = {
        generatePayload, generateQrDataUrl, configLoja, getConfig, forOrder,
        _crc16: crc16
    };
})(typeof window !== 'undefined' ? window : this);
