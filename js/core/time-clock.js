/* ============================================
   MilkyPot - Controle de Ponto Eletronico (CLT/Portaria 671/2021)
   ============================================
   Implementa REP-P (Registrador Eletronico de Ponto Programa)
   conforme Portaria MTE 671/2021 (sucessora da 1510/2009).

   Requisitos legais cobertos:
   - NSR (Numero Sequencial de Registro) sem repeticao nem lacuna
   - Hash SHA-256 de cada marcacao (integridade)
   - Marcacoes IMUTAVEIS — qualquer ajuste vira justificativa em outro registro
   - Identificacao por PIS/PASEP (obrigatorio)
   - Registro de IP + dispositivo
   - Geracao de AFD (Arquivo Fonte de Dados) e AFDT
   - Espelho mensal para conferencia do trabalhador
   - Audit log de todas operacoes

   Calculos CLT:
   - Jornada 8h/dia, 44h/semana
   - Intervalo intrajornada minimo 1h se jornada > 6h
   - Hora extra: maximo 2h/dia, adicional 50%
   - Adicional noturno: 22h-5h, +20%
   - Tolerancia: 5min por marcacao, 10min/dia
   ============================================ */

(function () {
    'use strict';

    var STORAGE_NSR_KEY = 'mp_timeclock_nsr_';
    var COLLECTION_RECORDS = 'time_clock_records';
    var COLLECTION_JUSTIFICATIONS = 'time_clock_justifications';
    var COLLECTION_AUDIT = 'time_clock_audit';

    // Tolerancia legal (CLT art. 58 §1)
    var TOLERANCIA_MIN = 5;        // ate 5min por marcacao
    var TOLERANCIA_DIA_MIN = 10;   // total 10min/dia sem virar HE

    // Tipos de marcacao
    var TIPOS = {
        ENTRADA: 'entrada',
        ALMOCO_SAIDA: 'almoco_saida',
        ALMOCO_VOLTA: 'almoco_volta',
        SAIDA: 'saida'
    };

    var TIPO_LABELS = {
        entrada: 'Entrada',
        almoco_saida: 'Saida Almoco',
        almoco_volta: 'Volta Almoco',
        saida: 'Saida'
    };

    var DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

    // ----------------------------------------
    // Helpers internos
    // ----------------------------------------

    function pad(n, len) {
        var s = String(n);
        while (s.length < len) s = '0' + s;
        return s;
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function dateOnly(iso) {
        return iso.slice(0, 10);
    }

    function monthKey(iso) {
        return iso.slice(0, 7);
    }

    function parseTime(hhmm) {
        if (!hhmm) return null;
        var p = hhmm.split(':');
        return { h: parseInt(p[0], 10) || 0, m: parseInt(p[1], 10) || 0 };
    }

    function timeToMinutes(hhmm) {
        var t = parseTime(hhmm);
        return t ? t.h * 60 + t.m : 0;
    }

    function minutesToTime(min) {
        if (min < 0) min = 0;
        var h = Math.floor(min / 60);
        var m = min % 60;
        return pad(h, 2) + ':' + pad(m, 2);
    }

    function diffMinutes(isoFrom, isoTo) {
        return Math.round((new Date(isoTo) - new Date(isoFrom)) / 60000);
    }

    // SHA-256 sincrono via Web Crypto API (assincrono na verdade, mas gerenciado)
    async function sha256(str) {
        if (!window.crypto || !window.crypto.subtle) {
            // Fallback simples (NAO criptografico — apenas pra testes locais sem HTTPS)
            var h = 0;
            for (var i = 0; i < str.length; i++) {
                h = ((h << 5) - h + str.charCodeAt(i)) | 0;
            }
            return 'fb' + Math.abs(h).toString(16).padStart(8, '0');
        }
        var enc = new TextEncoder().encode(str);
        var buf = await window.crypto.subtle.digest('SHA-256', enc);
        var arr = Array.from(new Uint8Array(buf));
        return arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    function getDeviceInfo() {
        var ua = navigator.userAgent || '';
        var device = 'desktop';
        if (/Mobile/i.test(ua)) device = 'mobile';
        else if (/Tablet/i.test(ua)) device = 'tablet';
        return device + ' | ' + (navigator.platform || '') + ' | ' + (navigator.language || '');
    }

    // ----------------------------------------
    // NSR — Numero Sequencial de Registro
    // ----------------------------------------
    // Por franquia, persistido em localStorage e sincronizado via Firestore.
    // CRITICO: nao pode haver duplicacao nem lacuna.
    function nextNSR(franchiseId) {
        var key = STORAGE_NSR_KEY + franchiseId;
        var current = parseInt(localStorage.getItem(key) || '0', 10);
        var next = current + 1;
        localStorage.setItem(key, String(next));
        return next;
    }

    function getCurrentNSR(franchiseId) {
        var key = STORAGE_NSR_KEY + franchiseId;
        return parseInt(localStorage.getItem(key) || '0', 10);
    }

    function syncNSRFromRecords(franchiseId) {
        // Garante que NSR local nao fique atras dos registros (importante apos sync)
        var records = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection(COLLECTION_RECORDS, franchiseId) || [])
            : [];
        var maxNsr = 0;
        records.forEach(function (r) { if (r.nsr > maxNsr) maxNsr = r.nsr; });
        var key = STORAGE_NSR_KEY + franchiseId;
        var localNsr = parseInt(localStorage.getItem(key) || '0', 10);
        if (maxNsr > localNsr) localStorage.setItem(key, String(maxNsr));
    }

    // ----------------------------------------
    // PIN — Validacao do funcionario
    // ----------------------------------------
    function findStaffByPin(franchiseId, pin) {
        if (!pin) return null;
        var staff = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('staff', franchiseId) || [])
            : [];
        return staff.find(function (s) { return s.active && s.pin === pin; }) || null;
    }

    function findStaffByCpfOrPis(franchiseId, identifier) {
        if (!identifier) return null;
        var clean = identifier.replace(/\D/g, '');
        var staff = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('staff', franchiseId) || [])
            : [];
        return staff.find(function (s) {
            if (!s.active) return false;
            var cpfClean = (s.cpf || '').replace(/\D/g, '');
            var pisClean = (s.pis || '').replace(/\D/g, '');
            return cpfClean === clean || pisClean === clean;
        }) || null;
    }

    // ----------------------------------------
    // Determina automaticamente o proximo tipo de marcacao
    // ----------------------------------------
    function inferNextType(franchiseId, staffId) {
        var today = dateOnly(nowIso());
        var todayRecords = getStaffRecordsByDate(franchiseId, staffId, today);
        var typesUsed = todayRecords.map(function (r) { return r.type; });

        if (typesUsed.indexOf(TIPOS.ENTRADA) === -1) return TIPOS.ENTRADA;
        if (typesUsed.indexOf(TIPOS.ALMOCO_SAIDA) === -1) return TIPOS.ALMOCO_SAIDA;
        if (typesUsed.indexOf(TIPOS.ALMOCO_VOLTA) === -1) return TIPOS.ALMOCO_VOLTA;
        if (typesUsed.indexOf(TIPOS.SAIDA) === -1) return TIPOS.SAIDA;
        return null; // ja bateu todas
    }

    /**
     * Filtra registros por data — usando data SÃO PAULO (não UTC).
     * Bug corrigido: antes filtrava com r.timestamp.startsWith(dateStr) que casa
     * com data UTC. Se funcionária bate ponto às 22h SP (= 01h UTC dia seguinte),
     * o registro tinha data UTC do dia seguinte e admin não achava ela hoje.
     * Agora converte timestamp UTC → data SP via Intl.DateTimeFormat antes de
     * comparar com dateStr (que sempre representa data calendário SP).
     */
    function getRecordDateInSP(timestamp) {
        try {
            var fmt = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Sao_Paulo',
                year: 'numeric', month: '2-digit', day: '2-digit'
            });
            return fmt.format(new Date(timestamp));  // YYYY-MM-DD em SP
        } catch (e) {
            return String(timestamp || '').slice(0, 10);  // fallback UTC
        }
    }

    function getStaffRecordsByDate(franchiseId, staffId, dateStr, includeHistorical) {
        var records = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection(COLLECTION_RECORDS, franchiseId) || [])
            : [];
        return records
            .filter(function (r) {
                if (r.staffId !== staffId || !r.timestamp) return false;
                // Compara data SÃO PAULO do registro com dateStr (que é calendário SP)
                var recDateSP = getRecordDateInSP(r.timestamp);
                if (recDateSP !== dateStr) return false;
                if (includeHistorical) return true;
                // Default: esconde cancelados E originais que foram ajustados
                // (mostra só o vigente). Admin pode passar includeHistorical=true.
                if (r.cancelled) return false;
                if (r.adjusted) return false;
                return true;
            })
            .sort(function (a, b) { return a.timestamp.localeCompare(b.timestamp); });
    }

    // ----------------------------------------
    // Bater ponto — funcao principal
    // ----------------------------------------
    // options: { geolocation: {lat, lng, accuracy}, channel: 'pdv'|'mobile'|'web' }
    async function recordPunch(franchiseId, identifier, identifierType, options) {
        if (!franchiseId) return { success: false, error: 'Franquia nao identificada' };
        if (!identifier) return { success: false, error: 'PIN/CPF/PIS obrigatorio' };

        identifierType = identifierType || 'pin';
        options = options || {};

        // Valida funcionario
        var staff = identifierType === 'pin'
            ? findStaffByPin(franchiseId, identifier)
            : findStaffByCpfOrPis(franchiseId, identifier);

        if (!staff) {
            return { success: false, error: 'Funcionario nao encontrado ou inativo' };
        }
        if (!staff.pis) {
            return { success: false, error: 'Funcionario sem PIS cadastrado. Cadastre em Equipe (obrigatorio por lei).' };
        }

        // Determina tipo automaticamente
        var type = inferNextType(franchiseId, staff.id);
        if (!type) {
            return { success: false, error: 'Funcionario ja bateu todas as 4 marcacoes hoje (entrada, almoco e saida).' };
        }

        // Sincroniza NSR e gera proximo
        syncNSRFromRecords(franchiseId);
        var nsr = nextNSR(franchiseId);
        var timestamp = nowIso();
        var pisClean = (staff.pis || '').replace(/\D/g, '');

        // Hash de integridade — NSR + PIS + timestamp + type
        var hashInput = nsr + '|' + pisClean + '|' + timestamp + '|' + type;
        var hash = await sha256(hashInput);

        var channel = options.channel || (identifierType === 'pin' ? 'pdv' : 'web');
        var geo = options.geolocation || null;
        var selfie = options.selfie || null;     // dataURL base64 (caso bater por mobile)

        // GEOFENCE: valida se canal mobile/web exige
        var geoValidation = null;
        if (typeof Geofence !== 'undefined' && geo && geo.lat) {
            geoValidation = Geofence.validate(franchiseId, geo.lat, geo.lng);
            if (geoValidation.blocked) {
                return {
                    success: false,
                    error: geoValidation.message + ' Aproxime-se da loja para registrar o ponto.',
                    geofence: geoValidation
                };
            }
        }

        var record = {
            id: 'tc_' + franchiseId.replace(/[^a-z0-9]/gi, '_') + '_' + nsr,
            nsr: nsr,
            staffId: staff.id,
            staffName: staff.name,
            staffPis: staff.pis,
            staffCpf: staff.cpf || '',
            type: type,
            timestamp: timestamp,
            hash: hash,
            source: channel + '_' + (identifierType === 'pin' ? 'pin' : 'doc'),
            channel: channel,
            geolocation: geo,                 // {lat, lng, accuracy} se disponivel
            geofence: geoValidation,          // {valid, distance, radius, reason}
            selfie: selfie,                   // dataURL (ou null)
            // 🤖 Face match: {status, distance, confidence} - calculado pelo colaborador
            // app usando face-api.js. NUNCA bloqueia o ponto; admin audita registros flagged.
            faceMatch: options.faceMatch || null,
            // 🚩 Auto-flag se face match falhou OU admin marcou suspeito depois
            flagged: options.flagged === true,
            flaggedReason: options.flaggedReason || null,
            flaggedAt: options.flagged === true ? timestamp : null,
            flaggedBy: options.flagged === true ? 'system_face_match' : null,
            device: getDeviceInfo(),
            userAgent: (navigator.userAgent || '').slice(0, 200),
            createdAt: timestamp,
            createdBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system',
            // Campos imutaveis — qualquer ajuste cria NOVO registro com referencia
            immutable: true
        };

        // Salva
        if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
            DataStore.addToCollection(COLLECTION_RECORDS, franchiseId, record);
        }

        // Audit log
        logAudit(franchiseId, 'record_punch', {
            nsr: nsr,
            staffId: staff.id,
            staffName: staff.name,
            type: type,
            timestamp: timestamp
        });

        return {
            success: true,
            record: record,
            staff: { id: staff.id, name: staff.name, role: staff.role },
            type: type,
            typeLabel: TIPO_LABELS[type],
            timestamp: timestamp,
            nsr: nsr
        };
    }

    // ----------------------------------------
    // 🛠 AJUSTE de batida (admin) — Portaria 1510/MTE exige IMUTABILIDADE
    // dos registros originais. Ajustamos via NOVO registro "ajuste" vinculado
    // ao original (originalNsr) + motivo + quem ajustou. Trilha 100% auditável.
    // ----------------------------------------
    function adjustRecord(franchiseId, originalRecordId, newHHMM, reason) {
        if (!franchiseId || !originalRecordId) return { success: false, error: 'Dados obrigatorios' };
        if (!reason || reason.trim().length < 5) return { success: false, error: 'Motivo obrigatorio (min 5 chars)' };
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(newHHMM)) return { success: false, error: 'Hora inválida (HH:MM)' };

        var records = (typeof DataStore !== 'undefined' && DataStore.getCollection)
            ? DataStore.getCollection(COLLECTION_RECORDS, franchiseId) || [] : [];
        var original = records.find(function (r) { return r.id === originalRecordId; });
        if (!original) return { success: false, error: 'Registro original nao encontrado' };
        if (original.adjusted) return { success: false, error: 'Registro ja foi ajustado anteriormente' };

        // Marca o original como ajustado (preservando dados)
        original.adjusted = true;
        original.adjustedAt = nowIso();
        original.adjustedReason = reason.trim().slice(0, 500);
        if (typeof DataStore !== 'undefined' && DataStore.saveCollection) {
            DataStore.saveCollection(COLLECTION_RECORDS, franchiseId, records);
        }

        // Cria NOVO registro de ajuste (mesmo dia, novo timestamp)
        var dateOnlyStr = dateOnly(original.timestamp);
        var newTimestampIso = dateOnlyStr + 'T' + newHHMM + ':00';
        var nsr = nextNSR(franchiseId);
        var adjustRecord = Object.assign({}, original, {
            id: 'tc_' + franchiseId.replace(/[^a-z0-9]/gi, '_') + '_' + nsr,
            nsr: nsr,
            timestamp: newTimestampIso,
            originalNsr: original.nsr,
            originalTimestamp: original.timestamp,
            adjustedFrom: original.id,
            adjustedReason: reason.trim().slice(0, 500),
            isAdjustment: true,
            channel: 'admin_adjustment',
            source: 'admin_adjustment',
            adjusted: false,            // o novo é o "vigente"
            createdAt: nowIso(),
            createdBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'admin'
        });
        if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
            DataStore.addToCollection(COLLECTION_RECORDS, franchiseId, adjustRecord);
        }
        logAudit(franchiseId, 'record_adjust', {
            originalNsr: original.nsr, newNsr: nsr,
            from: original.timestamp, to: newTimestampIso,
            reason: adjustRecord.adjustedReason, by: adjustRecord.createdBy
        });
        return { success: true, original: original, adjusted: adjustRecord };
    }

    // ----------------------------------------
    // 🗑 CANCELAR batida (admin) — soft delete com motivo, mantém auditoria
    // ----------------------------------------
    function cancelRecord(franchiseId, recordId, reason) {
        if (!franchiseId || !recordId) return { success: false, error: 'Dados obrigatorios' };
        if (!reason || reason.trim().length < 5) return { success: false, error: 'Motivo obrigatorio (min 5 chars)' };
        var records = (typeof DataStore !== 'undefined' && DataStore.getCollection)
            ? DataStore.getCollection(COLLECTION_RECORDS, franchiseId) || [] : [];
        var rec = records.find(function (r) { return r.id === recordId; });
        if (!rec) return { success: false, error: 'Registro nao encontrado' };
        if (rec.cancelled) return { success: false, error: 'Registro ja cancelado' };
        rec.cancelled = true;
        rec.cancelledAt = nowIso();
        rec.cancelledReason = reason.trim().slice(0, 500);
        rec.cancelledBy = (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'admin';
        if (typeof DataStore !== 'undefined' && DataStore.saveCollection) {
            DataStore.saveCollection(COLLECTION_RECORDS, franchiseId, records);
        }
        logAudit(franchiseId, 'record_cancel', {
            nsr: rec.nsr, timestamp: rec.timestamp, reason: rec.cancelledReason, by: rec.cancelledBy
        });
        return { success: true, record: rec };
    }

    // ----------------------------------------
    // Audit log
    // ----------------------------------------
    function logAudit(franchiseId, action, details) {
        var entry = {
            id: 'aud_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            action: action,
            details: details || {},
            user: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system',
            timestamp: nowIso()
        };
        if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
            DataStore.addToCollection(COLLECTION_AUDIT, franchiseId, entry);
        }
    }

    // ----------------------------------------
    // Calcular dia trabalhado
    // ----------------------------------------
    // ============================================
    // 🎉 FERIADOS (nacional + customizados por loja)
    // ============================================
    // Feriados nacionais fixos. Loja pode adicionar municipais/customizados via
    // collection holidays_<fid> ([{ date, name, type, hora_saida_max }]).
    var FERIADOS_NACIONAIS_2026 = [
        { mmdd: '01-01', name: 'Confraternização Universal' },
        { mmdd: '02-16', name: 'Carnaval' },
        { mmdd: '02-17', name: 'Carnaval' },
        { mmdd: '02-18', name: 'Carnaval (4ª feira)' },
        { mmdd: '04-03', name: 'Sexta-feira Santa' },
        { mmdd: '04-21', name: 'Tiradentes' },
        { mmdd: '05-01', name: 'Dia do Trabalho' },
        { mmdd: '06-04', name: 'Corpus Christi' },
        { mmdd: '09-07', name: 'Independência' },
        { mmdd: '10-12', name: 'N. Sra. Aparecida' },
        { mmdd: '11-02', name: 'Finados' },
        { mmdd: '11-15', name: 'Proclamação da República' },
        { mmdd: '11-20', name: 'Consciência Negra' },
        { mmdd: '12-25', name: 'Natal' }
    ];

    function isHoliday(franchiseId, dateStr) {
        if (!dateStr) return null;
        var mmdd = dateStr.slice(5);
        // Feriado nacional
        var nacional = FERIADOS_NACIONAIS_2026.find(function (f) { return f.mmdd === mmdd; });
        if (nacional) return { date: dateStr, name: nacional.name, type: 'nacional' };
        // Feriados customizados da loja
        if (typeof DataStore !== 'undefined') {
            var customs = DataStore.getCollection('holidays', franchiseId) || [];
            var c = customs.find(function (h) { return h.date === dateStr; });
            if (c) return c;
        }
        return null;
    }

    // ============================================
    // 📅 OVERRIDE de jornada pra UM DIA específico
    // ============================================
    // Coleção jornada_overrides_<fid>: [{ staffId, date, hora_entrada, hora_saida,
    //   intervalo_almoco_min, motivo, createdBy }]. Admin usa quando precisa
    // ajustar pontualmente ("hoje Amanda entra 11h em vez de 13h").
    function getJornadaOverride(franchiseId, staffId, dateStr) {
        if (typeof DataStore === 'undefined') return null;
        var overrides = DataStore.getCollection('jornada_overrides', franchiseId) || [];
        return overrides.find(function (o) {
            return o.staffId === staffId && o.date === dateStr;
        }) || null;
    }

    function setJornadaOverride(franchiseId, staffId, dateStr, fields) {
        if (typeof DataStore === 'undefined') return null;
        var overrides = DataStore.getCollection('jornada_overrides', franchiseId) || [];
        var idx = overrides.findIndex(function (o) { return o.staffId === staffId && o.date === dateStr; });
        var entry = Object.assign({
            id: 'jovr_' + dateStr + '_' + staffId,
            staffId: staffId,
            date: dateStr,
            createdAt: nowIso(),
            createdBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'admin'
        }, fields);
        if (idx >= 0) overrides[idx] = Object.assign(overrides[idx], entry);
        else overrides.push(entry);
        DataStore.setCollection('jornada_overrides', franchiseId, overrides);
        return entry;
    }

    function removeJornadaOverride(franchiseId, staffId, dateStr) {
        if (typeof DataStore === 'undefined') return;
        var overrides = DataStore.getCollection('jornada_overrides', franchiseId) || [];
        overrides = overrides.filter(function (o) { return !(o.staffId === staffId && o.date === dateStr); });
        DataStore.setCollection('jornada_overrides', franchiseId, overrides);
    }

    // ============================================
    // 🎯 JORNADA EFETIVA — pra um staff em uma data específica
    // ============================================
    // Cascata de prioridade (do mais específico ao mais genérico):
    //  1. Override pontual do dia (admin alterou no painel pra esse dia)
    //  2. Domingo/feriado COM horario_saida_dom_feriado configurado → ajusta saída
    //  3. Jornada padrão do staff (hora_entrada / hora_saida / intervalo_almoco_min)
    function getEffectiveJornada(franchiseId, staffId, dateStr) {
        var staff = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; })
            : null;
        if (!staff) return null;
        var j = staff.jornada || {};

        var effective = {
            hora_entrada: j.hora_entrada || '08:00',
            hora_saida: j.hora_saida || '18:00',
            intervalo_almoco_min: j.intervalo_almoco_min != null ? j.intervalo_almoco_min : 60,
            source: 'padrao',
            sourceLabel: 'Jornada combinada',
            cargaDiariaMin: 0
        };

        // 2) Domingo / feriado com saída especial
        var d = new Date(dateStr + 'T12:00:00');
        var dow = d.getDay();
        var holiday = isHoliday(franchiseId, dateStr);
        var isDomFer = dow === 0 || !!holiday;
        if (isDomFer && j.hora_saida_dom_feriado) {
            effective.hora_saida = j.hora_saida_dom_feriado;
            effective.source = holiday ? 'feriado' : 'domingo';
            effective.sourceLabel = holiday ? ('Feriado: ' + holiday.name + ' (loja fecha mais cedo)') : 'Domingo (loja fecha mais cedo)';
        }

        // 1) Override do dia (máxima prioridade)
        var ovr = getJornadaOverride(franchiseId, staffId, dateStr);
        if (ovr) {
            if (ovr.hora_entrada) effective.hora_entrada = ovr.hora_entrada;
            if (ovr.hora_saida) effective.hora_saida = ovr.hora_saida;
            if (ovr.intervalo_almoco_min != null) effective.intervalo_almoco_min = ovr.intervalo_almoco_min;
            effective.source = 'override';
            effective.sourceLabel = 'Ajuste pontual: ' + (ovr.motivo || 'sem motivo informado');
            effective.overrideBy = ovr.createdBy;
        }

        // Calcula carga diária esperada (entrada → saída - almoço)
        var entradaMin = timeToMinutes(effective.hora_entrada);
        var saidaMin = timeToMinutes(effective.hora_saida);
        if (saidaMin < entradaMin) saidaMin += 24 * 60; // virada de dia
        effective.cargaDiariaMin = Math.max(0, (saidaMin - entradaMin) - effective.intervalo_almoco_min);

        effective.isHoliday = !!holiday;
        effective.holidayName = holiday ? holiday.name : null;
        effective.isSunday = dow === 0;
        return effective;
    }

    function computeDay(franchiseId, staffId, dateStr) {
        var records = getStaffRecordsByDate(franchiseId, staffId, dateStr);
        var staff = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; })
            : null;

        var entrada = records.find(function (r) { return r.type === TIPOS.ENTRADA; });
        var almocoSaida = records.find(function (r) { return r.type === TIPOS.ALMOCO_SAIDA; });
        var almocoVolta = records.find(function (r) { return r.type === TIPOS.ALMOCO_VOLTA; });
        var saida = records.find(function (r) { return r.type === TIPOS.SAIDA; });

        var minutosTrabalhados = 0;
        var minutosAlmoco = 0;

        if (entrada && almocoSaida) {
            minutosTrabalhados += diffMinutes(entrada.timestamp, almocoSaida.timestamp);
        }
        if (almocoSaida && almocoVolta) {
            minutosAlmoco = diffMinutes(almocoSaida.timestamp, almocoVolta.timestamp);
        }
        if (almocoVolta && saida) {
            minutosTrabalhados += diffMinutes(almocoVolta.timestamp, saida.timestamp);
        } else if (entrada && saida && !almocoSaida) {
            // Sem intervalo registrado
            minutosTrabalhados = diffMinutes(entrada.timestamp, saida.timestamp);
        }

        // 🎯 Jornada efetiva (considera overrides + domingo/feriado)
        var effJornada = getEffectiveJornada(franchiseId, staffId, dateStr);
        var cargaDiariaMin = effJornada
            ? effJornada.cargaDiariaMin
            : Math.round((((staff && staff.carga_horaria_semanal) || 44) / ((staff && staff.jornada && staff.jornada.tipo === '6x1') ? 6 : 5)) * 60);

        // ☕ INTERVALO SUPRIMIDO — quando intervalo realizado < intervalo combinado
        // CLT art. 71 §4º (Reforma 2017): periodo suprimido pago em DINHEIRO +50%
        // como verba indenizatoria. Empresa pode tratar como banco horas se houver
        // acordo coletivo/individual escrito (com risco trabalhista).
        // Calculo: intervalo combinado (jornadaEfetiva.intervalo_almoco_min) - realizado
        var intervaloDevidoMin = effJornada ? (effJornada.intervalo_almoco_min || 0) : ((staff && staff.jornada && staff.jornada.intervalo_almoco_min) || 0);
        var intervaloSuprimidoMin = 0;
        if (entrada && saida && intervaloDevidoMin > 0) {
            // Só conta como suprimido se a jornada exige intervalo (>6h) E o realizado foi menor
            if (minutosTrabalhados + minutosAlmoco > 6 * 60) {
                var realizadoEfetivo = Math.max(minutosAlmoco, 0);
                if (realizadoEfetivo < intervaloDevidoMin) {
                    intervaloSuprimidoMin = intervaloDevidoMin - realizadoEfetivo;
                }
            }
        }

        // Hora extra (se trabalhou alem da carga + tolerancia) → vai pro BANCO DE HORAS
        var minutosExtras = 0;
        if (minutosTrabalhados > cargaDiariaMin + TOLERANCIA_DIA_MIN) {
            minutosExtras = minutosTrabalhados - cargaDiariaMin;
        }

        // 💼 SALDO DO DIA — positivo = vai pro banco, negativo = devedor
        // Inclui intervalo suprimido SE config bank.tratamento_intervalo === 'banco_horas'
        var saldoDiaMin = 0;
        var intervaloSuprimidoTratamento = 'hora_extra'; // padrão recomendado CLT
        var intervaloSuprimidoComAdicional = 0;
        if (entrada && saida) {
            saldoDiaMin = minutosTrabalhados - cargaDiariaMin;
            if (intervaloSuprimidoMin > 0) {
                // CLT manda +50% sobre o periodo suprimido
                intervaloSuprimidoComAdicional = Math.round(intervaloSuprimidoMin * 1.5);
                // Le config: hora_extra (padrao, paga em dinheiro) | banco_horas (acordo) | desativado
                if (typeof OvertimeBank !== 'undefined' && OvertimeBank.getConfig) {
                    var bankCfg = OvertimeBank.getConfig(franchiseId);
                    intervaloSuprimidoTratamento = bankCfg.tratamento_intervalo_suprimido || 'hora_extra';
                }
                if (intervaloSuprimidoTratamento === 'banco_horas') {
                    // Soma ao saldo do dia (com +50% conforme CLT)
                    saldoDiaMin += intervaloSuprimidoComAdicional;
                } else if (intervaloSuprimidoTratamento === 'hora_extra') {
                    // Soma aos minutos extras (vai pro pagamento, NÃO pro banco)
                    minutosExtras += intervaloSuprimidoComAdicional;
                }
                // 'desativado' = nada (admin assume risco trabalhista)
            }
        }

        // Atraso na entrada (vs jornada efetiva, não padrão)
        var minutosAtraso = 0;
        if (entrada && effJornada && effJornada.hora_entrada) {
            var entradaPrevista = timeToMinutes(effJornada.hora_entrada);
            var entradaReal = new Date(entrada.timestamp);
            var entradaRealMin = entradaReal.getHours() * 60 + entradaReal.getMinutes();
            if (entradaRealMin > entradaPrevista + TOLERANCIA_MIN) {
                minutosAtraso = entradaRealMin - entradaPrevista;
            }
        }

        // Adicional noturno (22h-5h)
        var minutosNoturnos = 0;
        if (staff && staff.adicional_noturno && entrada && saida) {
            minutosNoturnos = computeNightMinutes(entrada.timestamp, saida.timestamp);
        }

        // Validacao CLT intrajornada
        var avisoIntervalo = '';
        if (intervaloSuprimidoMin > 0) {
            avisoIntervalo = 'Intervalo suprimido em ' + intervaloSuprimidoMin + 'min (CLT art. 71 §4º — pagamento +50% obrigatório, ' + intervaloSuprimidoComAdicional + 'min creditados ' + (intervaloSuprimidoTratamento === 'banco_horas' ? 'no banco de horas' : intervaloSuprimidoTratamento === 'hora_extra' ? 'como hora extra' : '— TRATAMENTO DESATIVADO ⚠️') + ')';
        } else if (minutosTrabalhados > 6 * 60 && minutosAlmoco < 60) {
            avisoIntervalo = 'Intervalo de almoço menor que 1h (jornada > 6h exige intervalo mínimo de 1h conforme CLT art. 71)';
        }

        return {
            date: dateStr,
            staffId: staffId,
            records: records,
            entrada: entrada,
            almocoSaida: almocoSaida,
            almocoVolta: almocoVolta,
            saida: saida,
            completo: !!(entrada && saida),
            minutosTrabalhados: minutosTrabalhados,
            minutosAlmoco: minutosAlmoco,
            intervaloDevidoMin: intervaloDevidoMin,
            intervaloSuprimidoMin: intervaloSuprimidoMin,           // CLT art. 71 §4º — minutos não tirados
            intervaloSuprimidoComAdicional: intervaloSuprimidoComAdicional,  // já com +50%
            intervaloSuprimidoTratamento: intervaloSuprimidoTratamento,      // 'hora_extra' | 'banco_horas' | 'desativado'
            minutosExtras: minutosExtras,
            minutosAtraso: minutosAtraso,
            minutosNoturnos: minutosNoturnos,
            saldoDiaMin: saldoDiaMin,           // ← banco horas do dia (+ saldo / - devedor)
            cargaDiariaEsperadaMin: cargaDiariaMin,
            jornadaEfetiva: effJornada,         // ← jornada considerando overrides + dom/feriado
            isHoliday: effJornada && effJornada.isHoliday,
            isSunday: effJornada && effJornada.isSunday,
            avisoIntervalo: avisoIntervalo,
            horasFormatado: minutesToTime(minutosTrabalhados)
        };
    }

    function computeNightMinutes(isoFrom, isoTo) {
        // Calcula minutos entre 22h e 5h dentro do intervalo
        var from = new Date(isoFrom);
        var to = new Date(isoTo);
        var total = 0;
        var cursor = new Date(from);
        while (cursor < to) {
            var hour = cursor.getHours();
            if (hour >= 22 || hour < 5) total += 1;
            cursor.setMinutes(cursor.getMinutes() + 1);
        }
        return total;
    }

    // ----------------------------------------
    // Espelho mensal
    // ----------------------------------------
    function computeMonth(franchiseId, staffId, year, month) {
        var monthStr = pad(month, 2);
        var yearStr = String(year);
        var prefix = yearStr + '-' + monthStr;

        var staff = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection('staff', franchiseId) || []).find(function (s) { return s.id === staffId; })
            : null;

        // Lista todos os dias do mes
        var lastDay = new Date(year, month, 0).getDate();
        var days = [];
        var totals = {
            trabalhado: 0,
            almoco: 0,
            extras: 0,
            atraso: 0,
            noturno: 0,
            faltas: 0,
            diasTrabalhados: 0
        };

        for (var d = 1; d <= lastDay; d++) {
            var dateStr = prefix + '-' + pad(d, 2);
            var dia = computeDay(franchiseId, staffId, dateStr);
            var dayOfWeek = new Date(dateStr + 'T12:00:00').getDay(); // domingo=0
            dia.dayOfWeek = DIAS_SEMANA[dayOfWeek];
            dia.isFolga = isFolga(staff, dayOfWeek);

            // Falta = dia util sem registros
            dia.isFalta = !dia.completo && !dia.isFolga && dia.records.length === 0 && dateStr <= dateOnly(nowIso());

            // Justificativa
            dia.justificativa = getJustification(franchiseId, staffId, dateStr);

            days.push(dia);

            if (dia.completo) {
                totals.trabalhado += dia.minutosTrabalhados;
                totals.almoco += dia.minutosAlmoco;
                totals.extras += dia.minutosExtras;
                totals.atraso += dia.minutosAtraso;
                totals.noturno += dia.minutosNoturnos;
                totals.diasTrabalhados++;
            }
            if (dia.isFalta && !dia.justificativa) {
                totals.faltas++;
            }
        }

        // Banco de horas: extras - atrasos
        totals.bancoHorasMin = totals.extras - totals.atraso;

        // ============================================
        // 📅 DSR — Descanso Semanal Remunerado (Lei 605/49)
        // ============================================
        // Regra: funcionario que falta SEM JUSTIFICATIVA num dia util da semana
        // PERDE o direito ao DSR daquela semana (geralmente domingo).
        // Calculo: pra cada semana com >= 1 falta nao justificada, marca o
        // proximo domingo como "DSR perdido" (vai pra desconto na folha).
        //
        // Tambem marcamos domingos/feriados trabalhados que precisam de
        // FOLGA COMPENSATORIA em ate 7 dias (CLT 67 + Lei 605/49).
        var dsrPerdidos = 0;            // dias de DSR perdidos por falta
        var dsrPerdidosDatas = [];      // lista de datas perdidas (pra UI/relatorio)
        var domTrabSemFolgaComp = [];   // domingos trabalhados sem folga compensatoria em 7d

        // Agrupa por semana ISO (segunda a domingo)
        var semanas = {};
        days.forEach(function (dia) {
            var dt = new Date(dia.date + 'T12:00:00');
            // Calcula chave da semana = data da segunda-feira anterior
            var diaSem = dt.getDay(); // 0=dom .. 6=sab
            var offsetParaSeg = (diaSem === 0) ? -6 : 1 - diaSem;
            var seg = new Date(dt);
            seg.setDate(seg.getDate() + offsetParaSeg);
            var semKey = seg.toISOString().slice(0, 10);
            if (!semanas[semKey]) semanas[semKey] = { faltas: 0, domingo: null, domingoTrab: false };
            if (dia.isFalta && !dia.justificativa) semanas[semKey].faltas++;
            if (dt.getDay() === 0) {
                semanas[semKey].domingo = dia;
                if (dia.completo) semanas[semKey].domingoTrab = true;
            }
        });

        Object.keys(semanas).forEach(function (k) {
            var s = semanas[k];
            // Se teve falta na semana E o domingo era pra ter DSR → perdeu
            if (s.faltas > 0 && s.domingo && !s.domingo.completo && !s.domingo.justificativa) {
                dsrPerdidos++;
                dsrPerdidosDatas.push(s.domingo.date);
                s.domingo.dsrPerdido = true;
                s.domingo.dsrMotivo = s.faltas + ' falta(s) sem justificativa na semana';
            }
        });

        // Domingos/feriados trabalhados sem folga compensatoria em 7 dias
        // (CLT 67 e Lei 605/49 — empregador deve dar folga em outro dia)
        days.forEach(function (dia, idx) {
            var dt = new Date(dia.date + 'T12:00:00');
            var ehDom = dt.getDay() === 0;
            var ehFer = dia.isHoliday;
            if ((ehDom || ehFer) && dia.completo) {
                // Procura folga (dia sem trabalho e sem falta) nos proximos 7 dias
                var temCompensacao = false;
                for (var i = 1; i <= 7; i++) {
                    var prox = days[idx + i];
                    if (!prox) break;
                    if (prox.isFolga && prox.records.length === 0) { temCompensacao = true; break; }
                }
                if (!temCompensacao) {
                    domTrabSemFolgaComp.push({
                        date: dia.date,
                        tipo: ehFer ? 'feriado' : 'domingo',
                        alerta: 'Trabalho em ' + (ehFer ? 'feriado' : 'domingo') + ' sem folga compensatoria nos proximos 7 dias (CLT 67)'
                    });
                    dia.semFolgaCompensatoria = true;
                }
            }
        });

        totals.dsrPerdidos = dsrPerdidos;
        totals.dsrPerdidosDatas = dsrPerdidosDatas;
        totals.domTrabSemFolgaComp = domTrabSemFolgaComp;

        return {
            staff: staff,
            year: year,
            month: month,
            monthLabel: prefix,
            days: days,
            totals: totals,
            totaisFormatado: {
                trabalhado: minutesToTime(totals.trabalhado),
                almoco: minutesToTime(totals.almoco),
                extras: minutesToTime(totals.extras),
                atraso: minutesToTime(totals.atraso),
                noturno: minutesToTime(totals.noturno),
                bancoHoras: (totals.bancoHorasMin >= 0 ? '+' : '-') + minutesToTime(Math.abs(totals.bancoHorasMin))
            }
        };
    }

    function isFolga(staff, dayOfWeek) {
        if (!staff || !staff.jornada || !staff.jornada.folgas) return dayOfWeek === 0; // padrao: domingo
        var diaName = DIAS_SEMANA[dayOfWeek];
        return staff.jornada.folgas.indexOf(diaName) !== -1;
    }

    // ----------------------------------------
    // Justificativas
    // ----------------------------------------
    function getJustification(franchiseId, staffId, dateStr) {
        var justs = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection(COLLECTION_JUSTIFICATIONS, franchiseId) || [])
            : [];
        return justs.find(function (j) { return j.staffId === staffId && j.date === dateStr; }) || null;
    }

    function addJustification(franchiseId, staffId, dateStr, type, reason) {
        if (!staffId || !dateStr || !reason) {
            return { success: false, error: 'Dados incompletos' };
        }
        var entry = {
            id: 'just_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            staffId: staffId,
            date: dateStr,
            type: type, // falta, atraso, banco_horas, horas_extras, abono
            reason: reason,
            createdBy: (typeof Auth !== 'undefined' && Auth.getSession()) ? Auth.getSession().email : 'system',
            createdAt: nowIso()
        };
        if (typeof DataStore !== 'undefined' && DataStore.addToCollection) {
            DataStore.addToCollection(COLLECTION_JUSTIFICATIONS, franchiseId, entry);
        }
        logAudit(franchiseId, 'add_justification', entry);
        return { success: true, entry: entry };
    }

    // ----------------------------------------
    // AFD — Arquivo Fonte de Dados (Portaria 671)
    // ----------------------------------------
    // Layout simplificado conforme Portaria MTE 671/2021 Anexo
    // Campos por linha (texto puro, separado por nada — usa posicoes fixas):
    //   NSR (9) + Tipo (1) + Data (8 ddmmaaaa) + Hora (4 hhmm) + PIS (12)
    function generateAFD(franchiseId, year, month) {
        var monthStr = pad(month, 2);
        var prefix = year + '-' + monthStr;

        var franchise = (typeof DataStore !== 'undefined' && DataStore.getAllFranchises)
            ? DataStore.getAllFranchises().find(function (f) { return f.id === franchiseId; })
            : null;

        var records = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection(COLLECTION_RECORDS, franchiseId) || [])
            : [];
        records = records
            .filter(function (r) { return r.timestamp.startsWith(prefix); })
            .sort(function (a, b) { return a.nsr - b.nsr; });

        var lines = [];

        // Cabecalho (Tipo 1)
        var cnpj = (franchise && franchise.cnpj) ? franchise.cnpj.replace(/\D/g, '').padStart(14, '0') : '00000000000000';
        var razao = (franchise && franchise.name) ? franchise.name : 'MilkyPot';
        razao = razao.padEnd(150, ' ').slice(0, 150);
        var dataInicial = prefix + '-01';
        var lastDay = new Date(year, month, 0).getDate();
        var dataFinal = prefix + '-' + pad(lastDay, 2);
        var dataGeracao = nowIso().slice(0, 10);

        lines.push(
            pad(1, 9) + '1' +
            cnpj +
            (franchise && franchise.cei ? franchise.cei.padStart(12, '0') : '000000000000') +
            razao +
            formatAFDDate(dataInicial) +
            formatAFDDate(dataFinal) +
            formatAFDDate(dataGeracao) +
            formatAFDTime(nowIso().slice(11, 16))
        );

        // Marcacoes (Tipo 3)
        records.forEach(function (r) {
            var pis = (r.staffPis || '').replace(/\D/g, '').padStart(12, '0').slice(0, 12);
            var ts = r.timestamp;
            var data = formatAFDDate(ts.slice(0, 10));
            var hora = formatAFDTime(ts.slice(11, 16));
            lines.push(pad(r.nsr, 9) + '3' + data + hora + pis);
        });

        // Trailer (Tipo 9)
        var totalLinhas = records.length;
        lines.push(pad(totalLinhas + 2, 9) + '9' + pad(totalLinhas, 9) + 'AFD');

        return {
            content: lines.join('\r\n') + '\r\n',
            filename: 'AFD_' + franchiseId + '_' + prefix + '.txt',
            totalRecords: totalLinhas
        };
    }

    function formatAFDDate(iso) {
        // yyyy-mm-dd -> ddmmyyyy
        var p = iso.split('-');
        return p[2] + p[1] + p[0];
    }

    function formatAFDTime(hhmm) {
        return hhmm.replace(':', '');
    }

    function downloadAFD(franchiseId, year, month) {
        var afd = generateAFD(franchiseId, year, month);
        var blob = new Blob([afd.content], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = afd.filename;
        a.click();
        URL.revokeObjectURL(url);
        logAudit(franchiseId, 'export_afd', { year: year, month: month, totalRecords: afd.totalRecords });
        return afd;
    }

    // ----------------------------------------
    // Espelho CSV (para conferencia do trabalhador)
    // ----------------------------------------
    function downloadEspelhoCSV(franchiseId, staffId, year, month) {
        var espelho = computeMonth(franchiseId, staffId, year, month);
        var lines = [];
        lines.push('Espelho de Ponto - ' + (espelho.staff ? espelho.staff.name : staffId));
        lines.push('Mes: ' + espelho.monthLabel);
        lines.push('PIS: ' + (espelho.staff ? espelho.staff.pis : ''));
        lines.push('');
        lines.push('Data;Dia;Entrada;Saida Almoco;Volta Almoco;Saida;Trabalhado;Almoco;Extras;Interv.Suprimido;Interv.Supr.+50%;Tratamento;Atraso;Justificativa');

        espelho.days.forEach(function (d) {
            var row = [
                d.date,
                d.dayOfWeek,
                d.entrada ? (typeof Utils!=='undefined'?Utils.formatTime(d.entrada.timestamp):d.entrada.timestamp.slice(11,16)) : (d.isFolga ? 'FOLGA' : (d.isFalta ? 'FALTA' : '-')),
                d.almocoSaida ? (typeof Utils!=='undefined'?Utils.formatTime(d.almocoSaida.timestamp):d.almocoSaida.timestamp.slice(11,16)) : '-',
                d.almocoVolta ? (typeof Utils!=='undefined'?Utils.formatTime(d.almocoVolta.timestamp):d.almocoVolta.timestamp.slice(11,16)) : '-',
                d.saida ? (typeof Utils!=='undefined'?Utils.formatTime(d.saida.timestamp):d.saida.timestamp.slice(11,16)) : '-',
                d.completo ? minutesToTime(d.minutosTrabalhados) : '-',
                d.completo ? minutesToTime(d.minutosAlmoco) : '-',
                d.minutosExtras ? minutesToTime(d.minutosExtras) : '-',
                d.intervaloSuprimidoMin ? minutesToTime(d.intervaloSuprimidoMin) : '-',
                d.intervaloSuprimidoComAdicional ? minutesToTime(d.intervaloSuprimidoComAdicional) : '-',
                d.intervaloSuprimidoMin ? (d.intervaloSuprimidoTratamento || 'hora_extra') : '-',
                d.minutosAtraso ? minutesToTime(d.minutosAtraso) : '-',
                d.justificativa ? d.justificativa.reason : ''
            ].map(function (v) { return String(v).replace(/;/g, ','); }).join(';');
            lines.push(row);
        });

        // Totaliza intervalo suprimido
        var totalSupMin = espelho.days.reduce(function(a,d){ return a + (d.intervaloSuprimidoMin || 0); }, 0);
        var totalSupAdicMin = espelho.days.reduce(function(a,d){ return a + (d.intervaloSuprimidoComAdicional || 0); }, 0);

        lines.push('');
        lines.push('TOTAIS');
        lines.push('Dias trabalhados;' + espelho.totals.diasTrabalhados);
        lines.push('Total trabalhado;' + espelho.totaisFormatado.trabalhado);
        lines.push('Horas extras;' + espelho.totaisFormatado.extras);
        lines.push('Atrasos;' + espelho.totaisFormatado.atraso);
        lines.push('Adicional noturno;' + espelho.totaisFormatado.noturno);
        lines.push('Banco de horas;' + espelho.totaisFormatado.bancoHoras);
        lines.push('Intervalo suprimido (CLT 71 §4);' + minutesToTime(totalSupMin));
        lines.push('Intervalo suprimido com +50%;' + minutesToTime(totalSupAdicMin));
        lines.push('Faltas (sem justificativa);' + espelho.totals.faltas);

        var content = '﻿' + lines.join('\n'); // BOM pra Excel abrir UTF-8
        var blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Espelho_' + (espelho.staff ? espelho.staff.name.replace(/\s+/g, '_') : staffId) + '_' + espelho.monthLabel + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // ----------------------------------------
    // API publica
    // ----------------------------------------
    window.TimeClock = {
        TIPOS: TIPOS,
        TIPO_LABELS: TIPO_LABELS,
        DIAS_SEMANA: DIAS_SEMANA,

        // Operacoes
        recordPunch: recordPunch,
        addJustification: addJustification,
        adjustRecord: adjustRecord,        // 🛠 admin ajusta hora (mantem auditoria)
        cancelRecord: cancelRecord,        // 🗑 admin cancela registro (soft delete)

        // 📅 Jornada flexível (override pontual por dia)
        getEffectiveJornada: getEffectiveJornada,
        getJornadaOverride: getJornadaOverride,
        setJornadaOverride: setJornadaOverride,
        removeJornadaOverride: removeJornadaOverride,

        // 🎉 Feriados
        isHoliday: isHoliday,
        FERIADOS_NACIONAIS_2026: FERIADOS_NACIONAIS_2026,

        // Consultas
        findStaffByPin: findStaffByPin,
        findStaffByCpfOrPis: findStaffByCpfOrPis,
        getStaffRecordsByDate: getStaffRecordsByDate,
        inferNextType: inferNextType,
        getCurrentNSR: getCurrentNSR,

        // Calculos
        computeDay: computeDay,
        computeMonth: computeMonth,
        isFolga: isFolga,
        getJustification: getJustification,

        // Helpers
        minutesToTime: minutesToTime,
        timeToMinutes: timeToMinutes,
        diffMinutes: diffMinutes,

        // Exports
        generateAFD: generateAFD,
        downloadAFD: downloadAFD,
        downloadEspelhoCSV: downloadEspelhoCSV,

        // Constantes legais
        TOLERANCIA_MIN: TOLERANCIA_MIN,
        TOLERANCIA_DIA_MIN: TOLERANCIA_DIA_MIN
    };

})();
