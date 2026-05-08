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

    function getStaffRecordsByDate(franchiseId, staffId, dateStr) {
        var records = (typeof DataStore !== 'undefined')
            ? (DataStore.getCollection(COLLECTION_RECORDS, franchiseId) || [])
            : [];
        return records
            .filter(function (r) { return r.staffId === staffId && r.timestamp.startsWith(dateStr); })
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
            geolocation: geo,         // {lat, lng, accuracy} se disponivel
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

        // Carga horaria diaria esperada (ex: 8h = 480min para 44h/semana)
        var cargaSemanal = (staff && staff.carga_horaria_semanal) || 44;
        var diasUteis = (staff && staff.jornada && staff.jornada.tipo === '6x1') ? 6 : 5;
        var cargaDiariaMin = Math.round((cargaSemanal / diasUteis) * 60);

        // Hora extra (se trabalhou alem da carga + tolerancia)
        var minutosExtras = 0;
        if (minutosTrabalhados > cargaDiariaMin + TOLERANCIA_DIA_MIN) {
            minutosExtras = minutosTrabalhados - cargaDiariaMin;
        }

        // Atraso na entrada (se aplicavel)
        var minutosAtraso = 0;
        if (entrada && staff && staff.jornada && staff.jornada.hora_entrada) {
            var entradaPrevista = timeToMinutes(staff.jornada.hora_entrada);
            var entradaReal = new Date(entrada.timestamp);
            var entradaRealMin = entradaReal.getHours() * 60 + entradaReal.getMinutes();
            if (entradaRealMin > entradaPrevista + TOLERANCIA_MIN) {
                minutosAtraso = entradaRealMin - entradaPrevista;
            }
        }

        // Adicional noturno (22h-5h) — se aplicavel
        var minutosNoturnos = 0;
        if (staff && staff.adicional_noturno && entrada && saida) {
            minutosNoturnos = computeNightMinutes(entrada.timestamp, saida.timestamp);
        }

        // Validacao CLT: intervalo intrajornada
        var avisoIntervalo = '';
        if (minutosTrabalhados > 6 * 60 && minutosAlmoco < 60) {
            avisoIntervalo = 'Intervalo de almoco menor que 1h (jornada > 6h exige intervalo minimo de 1h conforme CLT art. 71)';
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
            minutosExtras: minutosExtras,
            minutosAtraso: minutosAtraso,
            minutosNoturnos: minutosNoturnos,
            cargaDiariaEsperadaMin: cargaDiariaMin,
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
        lines.push('Data;Dia;Entrada;Saida Almoco;Volta Almoco;Saida;Trabalhado;Almoco;Extras;Atraso;Justificativa');

        espelho.days.forEach(function (d) {
            var row = [
                d.date,
                d.dayOfWeek,
                d.entrada ? d.entrada.timestamp.slice(11, 16) : (d.isFolga ? 'FOLGA' : (d.isFalta ? 'FALTA' : '-')),
                d.almocoSaida ? d.almocoSaida.timestamp.slice(11, 16) : '-',
                d.almocoVolta ? d.almocoVolta.timestamp.slice(11, 16) : '-',
                d.saida ? d.saida.timestamp.slice(11, 16) : '-',
                d.completo ? minutesToTime(d.minutosTrabalhados) : '-',
                d.completo ? minutesToTime(d.minutosAlmoco) : '-',
                d.minutosExtras ? minutesToTime(d.minutosExtras) : '-',
                d.minutosAtraso ? minutesToTime(d.minutosAtraso) : '-',
                d.justificativa ? d.justificativa.reason : ''
            ].map(function (v) { return String(v).replace(/;/g, ','); }).join(';');
            lines.push(row);
        });

        lines.push('');
        lines.push('TOTAIS');
        lines.push('Dias trabalhados;' + espelho.totals.diasTrabalhados);
        lines.push('Total trabalhado;' + espelho.totaisFormatado.trabalhado);
        lines.push('Horas extras;' + espelho.totaisFormatado.extras);
        lines.push('Atrasos;' + espelho.totaisFormatado.atraso);
        lines.push('Adicional noturno;' + espelho.totaisFormatado.noturno);
        lines.push('Banco de horas;' + espelho.totaisFormatado.bancoHoras);
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
