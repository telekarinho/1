/* ============================================
   MilkyPot — eSocial XML Export (Leiaute S-1.2)
   ============================================
   Gera XMLs dos principais eventos do eSocial conforme Decreto 8.373/2014
   e Manual de Orientacao do eSocial (MOS) v.S-1.2.

   Eventos cobertos:
   - S-1000: Informacoes do empregador
   - S-1005: Tabela de estabelecimentos
   - S-2200: Cadastramento inicial / Admissao de trabalhador
   - S-1200: Remuneracao do trabalhador (mensal)
   - S-1210: Pagamentos de rendimentos
   - S-2299: Desligamento

   IMPORTANTE: estes XMLs precisam ser ASSINADOS com certificado digital
   ICP-Brasil A1 ou A3 antes de enviar ao webservice do governo.
   Esse modulo gera o XML pronto; assinatura precisa ser feita por:
     - Servico externo (ex: ContaAzul, Tagplus)
     - Ferramenta com certificado (Receitanet, eSocialBr)
     - SDK propio com biblioteca XmlDsig

   Endpoint producao: webservices.envio.esocial.gov.br
   Endpoint testes:   webservices.producaorestrita.esocial.gov.br

   Layouts oficiais: https://www.gov.br/esocial/pt-br/documentacao-tecnica
   ============================================ */

(function () {
    'use strict';

    var NAMESPACE = 'http://www.esocial.gov.br/schema/evt/';
    var LAYOUT_VERSION = 'S-1.2';

    function pad(n, l) { var s = String(n); while (s.length < l) s = '0' + s; return s; }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }
    function nowIdEvento() {
        var d = new Date();
        return 'ID' + d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2) + pad(d.getHours(), 2) + pad(d.getMinutes(), 2) + pad(d.getSeconds(), 2) + pad(d.getMilliseconds(), 3);
    }
    function getFranchise(franchiseId) {
        if (typeof DataStore === 'undefined') return null;
        return (DataStore.getAllFranchises() || []).find(function (f) { return f.id === franchiseId; });
    }
    function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }

    // ============================================
    // S-1000 — Informacoes do Empregador
    // ============================================
    function s1000(franchiseId) {
        var f = getFranchise(franchiseId);
        if (!f) throw new Error('Franquia nao encontrada');
        var cnpj = onlyDigits(f.cnpj);
        var id = nowIdEvento();
        var ini = (f.dataAbertura || new Date().toISOString().slice(0, 7)).replace('-', '').slice(0, 6);

        var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<eSocial xmlns="' + NAMESPACE + 'evtInfoEmpregador/v_S_01_02_00">' +
                '<evtInfoEmpregador Id="' + id + '">' +
                    '<ideEvento>' +
                        '<tpAmb>1</tpAmb>' +  // 1=producao, 2=testes
                        '<procEmi>1</procEmi>' +
                        '<verProc>MilkyPot-' + LAYOUT_VERSION + '</verProc>' +
                    '</ideEvento>' +
                    '<ideEmpregador>' +
                        '<tpInsc>1</tpInsc>' +  // 1=CNPJ
                        '<nrInsc>' + esc(cnpj.slice(0, 8)) + '</nrInsc>' +  // CNPJ raiz
                    '</ideEmpregador>' +
                    '<infoEmpregador>' +
                        '<inclusao>' +
                            '<idePeriodo><iniValid>' + ini.slice(0, 4) + '-' + ini.slice(4, 6) + '</iniValid></idePeriodo>' +
                            '<infoCadastro>' +
                                '<nmRazao>' + esc(f.razaoSocial || f.nome || 'MilkyPot') + '</nmRazao>' +
                                '<classTrib>99</classTrib>' +  // Simples Nacional (ajustar conforme regime)
                                '<natJurid>2240</natJurid>' +   // Sociedade Limitada
                                '<indCoop>0</indCoop>' +
                                '<indConstr>0</indConstr>' +
                                '<indDesFolha>0</indDesFolha>' +
                                '<indOptRegEletron>1</indOptRegEletron>' +
                                '<indEntEd>N</indEntEd>' +
                                '<indEtt>N</indEtt>' +
                                '<contato>' +
                                    '<nmCtt>' + esc(f.responsavel || 'Administrador') + '</nmCtt>' +
                                    '<cpfCtt>' + esc(onlyDigits(f.cpfResponsavel || '00000000000')) + '</cpfCtt>' +
                                    '<foneFixo>' + esc(onlyDigits(f.telefone || '')) + '</foneFixo>' +
                                    '<email>' + esc(f.email || '') + '</email>' +
                                '</contato>' +
                            '</infoCadastro>' +
                        '</inclusao>' +
                    '</infoEmpregador>' +
                '</evtInfoEmpregador>' +
            '</eSocial>';
        return { id: id, xml: xml, evento: 'S-1000' };
    }

    // ============================================
    // S-1005 — Tabela de Estabelecimentos
    // ============================================
    function s1005(franchiseId) {
        var f = getFranchise(franchiseId);
        if (!f) throw new Error('Franquia nao encontrada');
        var cnpj = onlyDigits(f.cnpj);
        var id = nowIdEvento();
        var ini = (f.dataAbertura || new Date().toISOString().slice(0, 7)).replace('-', '').slice(0, 6);

        var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<eSocial xmlns="' + NAMESPACE + 'evtTabEstab/v_S_01_02_00">' +
                '<evtTabEstab Id="' + id + '">' +
                    '<ideEvento><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>MilkyPot-' + LAYOUT_VERSION + '</verProc></ideEvento>' +
                    '<ideEmpregador><tpInsc>1</tpInsc><nrInsc>' + esc(cnpj.slice(0, 8)) + '</nrInsc></ideEmpregador>' +
                    '<infoEstab>' +
                        '<inclusao>' +
                            '<ideEstab><tpInsc>1</tpInsc><nrInsc>' + esc(cnpj) + '</nrInsc></ideEstab>' +
                            '<idePeriodo><iniValid>' + ini.slice(0, 4) + '-' + ini.slice(4, 6) + '</iniValid></idePeriodo>' +
                            '<dadosEstab>' +
                                '<cnaePrep>5611201</cnaePrep>' +  // Restaurantes / sorveterias
                                '<aliqGilrat><aliqRat>2</aliqRat><fap>1.0000</fap></aliqGilrat>' +
                            '</dadosEstab>' +
                        '</inclusao>' +
                    '</infoEstab>' +
                '</evtTabEstab>' +
            '</eSocial>';
        return { id: id, xml: xml, evento: 'S-1005' };
    }

    // ============================================
    // S-2200 — Admissao de Trabalhador
    // ============================================
    function s2200ForStaff(franchiseId, staff) {
        var f = getFranchise(franchiseId);
        var cnpj = onlyDigits(f.cnpj);
        var id = nowIdEvento();
        var cpf = onlyDigits(staff.cpf);
        var pis = onlyDigits(staff.pis);
        var nasc = staff.dataNascimento || '1990-01-01';
        var adm = staff.dataAdmissao || new Date().toISOString().slice(0, 10);

        var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<eSocial xmlns="' + NAMESPACE + 'evtAdmissao/v_S_01_02_00">' +
                '<evtAdmissao Id="' + id + '">' +
                    '<ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>MilkyPot-' + LAYOUT_VERSION + '</verProc></ideEvento>' +
                    '<ideEmpregador><tpInsc>1</tpInsc><nrInsc>' + esc(cnpj.slice(0, 8)) + '</nrInsc></ideEmpregador>' +
                    '<trabalhador>' +
                        '<cpfTrab>' + esc(cpf) + '</cpfTrab>' +
                        '<nmTrab>' + esc(staff.name) + '</nmTrab>' +
                        '<sexo>' + (staff.sexo === 'F' ? 'F' : 'M') + '</sexo>' +
                        '<racaCor>' + (staff.racaCor || '1') + '</racaCor>' +
                        '<estCiv>' + (staff.estadoCivil || '1') + '</estCiv>' +
                        '<grauInstr>' + (staff.escolaridade || '07') + '</grauInstr>' +
                        '<nascimento>' +
                            '<dtNascto>' + esc(nasc) + '</dtNascto>' +
                            '<paisNascto>105</paisNascto>' +
                            '<paisNac>105</paisNac>' +
                        '</nascimento>' +
                        '<endereco><brasil>' +
                            '<tpLograd>R</tpLograd>' +
                            '<dscLograd>' + esc(staff.endereco || 'Nao informado') + '</dscLograd>' +
                            '<nrLograd>SN</nrLograd>' +
                            '<bairro>' + esc(staff.bairro || 'Centro') + '</bairro>' +
                            '<cep>' + esc(onlyDigits(staff.cep) || '00000000') + '</cep>' +
                            '<codMunic>' + esc(staff.codMunic || '3550308') + '</codMunic>' +  // Sao Paulo default
                            '<uf>' + esc(staff.uf || 'SP') + '</uf>' +
                        '</brasil></endereco>' +
                    '</trabalhador>' +
                    '<vinculo>' +
                        '<matricula>' + esc(staff.id) + '</matricula>' +
                        '<tpRegTrab>1</tpRegTrab>' +
                        '<tpRegPrev>1</tpRegPrev>' +
                        '<infoRegimeTrab><infoCeletista>' +
                            '<dtAdm>' + esc(adm) + '</dtAdm>' +
                            '<tpAdmissao>1</tpAdmissao>' +
                            '<indAdmissao>1</indAdmissao>' +
                            '<tpRegJor>1</tpRegJor>' +
                            '<natAtividade>1</natAtividade>' +
                            '<dtOpcFGTS>' + esc(adm) + '</dtOpcFGTS>' +
                        '</infoCeletista></infoRegimeTrab>' +
                        '<infoContrato>' +
                            '<nmCargo>' + esc(staff.cargo || 'Atendente') + '</nmCargo>' +
                            '<CBOCargo>' + esc(staff.cbo || '513205') + '</CBOCargo>' +  // 513205 = atendente de lanchonete
                            '<remuneracao>' +
                                '<vrSalFx>' + (parseFloat(staff.salario_base) || 0).toFixed(2) + '</vrSalFx>' +
                                '<undSalFixo>5</undSalFixo>' +  // 5=mensal
                            '</remuneracao>' +
                            '<duracao><tpContr>' + (staff.contratoExperiencia ? '2' : '1') + '</tpContr></duracao>' +
                            '<localTrabalho><localTrabGeral>' +
                                '<tpInsc>1</tpInsc>' +
                                '<nrInsc>' + esc(cnpj) + '</nrInsc>' +
                            '</localTrabGeral></localTrabalho>' +
                            '<horContratual>' +
                                '<qtdHrsSem>44</qtdHrsSem>' +
                                '<tpJornada>1</tpJornada>' +
                                '<dscJorn>' + esc((staff.jornada && staff.jornada.hora_entrada) ? staff.jornada.hora_entrada + ' as ' + staff.jornada.hora_saida : '08:00 as 17:00') + '</dscJorn>' +
                                '<tmpParc>0</tmpParc>' +
                            '</horContratual>' +
                            '<filiacaoSindical><cnpjSindCategProf>00000000000000</cnpjSindCategProf></filiacaoSindical>' +
                        '</infoContrato>' +
                    '</vinculo>' +
                '</evtAdmissao>' +
            '</eSocial>';
        return { id: id, xml: xml, evento: 'S-2200', staffId: staff.id, staffName: staff.name };
    }

    function s2200(franchiseId) {
        var staff = (DataStore.getCollection('staff', franchiseId) || []).filter(function (s) { return s.active; });
        return staff.map(function (s) {
            try { return s2200ForStaff(franchiseId, s); }
            catch (e) { return { erro: e.message, staffId: s.id }; }
        });
    }

    // ============================================
    // S-1200 — Remuneracao Mensal
    // ============================================
    function s1200ForStaff(franchiseId, staffId, year, month) {
        if (typeof PayrollCompliance === 'undefined') throw new Error('PayrollCompliance nao carregado');
        var hol = PayrollCompliance.gerarHolerite(franchiseId, staffId, year, month);
        var f = getFranchise(franchiseId);
        var cnpj = onlyDigits(f.cnpj);
        var id = nowIdEvento();
        var apur = year + '-' + pad(month, 2);

        var rubricas = '';
        hol.proventos.forEach(function (p) {
            rubricas += '<itensRemun><codRubr>' + esc(p.codigo) + '</codRubr><ideTabRubr>MILKY01</ideTabRubr><vrRubr>' + p.valor.toFixed(2) + '</vrRubr></itensRemun>';
        });
        hol.descontos.forEach(function (d) {
            rubricas += '<itensRemun><codRubr>' + esc(d.codigo) + '</codRubr><ideTabRubr>MILKY01</ideTabRubr><vrRubr>' + d.valor.toFixed(2) + '</vrRubr></itensRemun>';
        });

        var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<eSocial xmlns="' + NAMESPACE + 'evtRemun/v_S_01_02_00">' +
                '<evtRemun Id="' + id + '">' +
                    '<ideEvento><indRetif>1</indRetif><indApuracao>1</indApuracao><perApur>' + apur + '</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>MilkyPot-' + LAYOUT_VERSION + '</verProc></ideEvento>' +
                    '<ideEmpregador><tpInsc>1</tpInsc><nrInsc>' + esc(cnpj.slice(0, 8)) + '</nrInsc></ideEmpregador>' +
                    '<ideTrabalhador><cpfTrab>' + esc(onlyDigits(hol.staff.cpf)) + '</cpfTrab></ideTrabalhador>' +
                    '<dmDev>' +
                        '<ideDmDev>RM' + apur.replace('-', '') + '</ideDmDev>' +
                        '<codCateg>101</codCateg>' +  // 101 = empregado celetista
                        '<infoPerApur><ideEstabLot>' +
                            '<tpInsc>1</tpInsc>' +
                            '<nrInsc>' + esc(cnpj) + '</nrInsc>' +
                            '<codLotacao>01</codLotacao>' +
                            '<detVerbas>' + rubricas + '</detVerbas>' +
                        '</ideEstabLot></infoPerApur>' +
                    '</dmDev>' +
                '</evtRemun>' +
            '</eSocial>';
        return { id: id, xml: xml, evento: 'S-1200', staffId: staffId, staffName: hol.staff.name, valorLiquido: hol.totais.liquido };
    }

    function s1200(franchiseId, opts) {
        opts = opts || {};
        var year = opts.ano || new Date().getFullYear();
        var month = opts.mes || (new Date().getMonth() + 1);
        var staff = (DataStore.getCollection('staff', franchiseId) || []).filter(function (s) { return s.active; });
        return staff.map(function (s) {
            try { return s1200ForStaff(franchiseId, s.id, year, month); }
            catch (e) { return { erro: e.message, staffId: s.id, staffName: s.name }; }
        });
    }

    // ============================================
    // S-1210 — Pagamentos de Rendimentos
    // ============================================
    function s1210ForStaff(franchiseId, staffId, year, month) {
        var hol = PayrollCompliance.gerarHolerite(franchiseId, staffId, year, month);
        var f = getFranchise(franchiseId);
        var cnpj = onlyDigits(f.cnpj);
        var id = nowIdEvento();
        var perApur = year + '-' + pad(month, 2);
        var dtPgto = year + '-' + pad(month, 2) + '-05';  // dia 5 do mes seguinte

        var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<eSocial xmlns="' + NAMESPACE + 'evtPgtos/v_S_01_02_00">' +
                '<evtPgtos Id="' + id + '">' +
                    '<ideEvento><indRetif>1</indRetif><perApur>' + perApur + '</perApur><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>MilkyPot-' + LAYOUT_VERSION + '</verProc></ideEvento>' +
                    '<ideEmpregador><tpInsc>1</tpInsc><nrInsc>' + esc(cnpj.slice(0, 8)) + '</nrInsc></ideEmpregador>' +
                    '<ideBenef><cpfBenef>' + esc(onlyDigits(hol.staff.cpf)) + '</cpfBenef></ideBenef>' +
                    '<infoPgto>' +
                        '<dtPgto>' + dtPgto + '</dtPgto>' +
                        '<tpPgto>1</tpPgto>' +
                        '<perRef>' + perApur + '</perRef>' +
                        '<vrLiq>' + hol.totais.liquido.toFixed(2) + '</vrLiq>' +
                    '</infoPgto>' +
                '</evtPgtos>' +
            '</eSocial>';
        return { id: id, xml: xml, evento: 'S-1210', staffId: staffId, staffName: hol.staff.name };
    }

    function s1210(franchiseId, opts) {
        opts = opts || {};
        var year = opts.ano || new Date().getFullYear();
        var month = opts.mes || (new Date().getMonth() + 1);
        var staff = (DataStore.getCollection('staff', franchiseId) || []).filter(function (s) { return s.active; });
        return staff.map(function (s) {
            try { return s1210ForStaff(franchiseId, s.id, year, month); }
            catch (e) { return { erro: e.message, staffId: s.id }; }
        });
    }

    // ============================================
    // S-2299 — Desligamento
    // ============================================
    function s2299ForStaff(franchiseId, staff, motivoCod, dataDeslig) {
        var f = getFranchise(franchiseId);
        var cnpj = onlyDigits(f.cnpj);
        var id = nowIdEvento();

        var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<eSocial xmlns="' + NAMESPACE + 'evtDeslig/v_S_01_02_00">' +
                '<evtDeslig Id="' + id + '">' +
                    '<ideEvento><indRetif>1</indRetif><tpAmb>1</tpAmb><procEmi>1</procEmi><verProc>MilkyPot-' + LAYOUT_VERSION + '</verProc></ideEvento>' +
                    '<ideEmpregador><tpInsc>1</tpInsc><nrInsc>' + esc(cnpj.slice(0, 8)) + '</nrInsc></ideEmpregador>' +
                    '<ideVinculo>' +
                        '<cpfTrab>' + esc(onlyDigits(staff.cpf)) + '</cpfTrab>' +
                        '<matricula>' + esc(staff.id) + '</matricula>' +
                    '</ideVinculo>' +
                    '<infoDeslig>' +
                        '<mtvDeslig>' + (motivoCod || '02') + '</mtvDeslig>' +
                        '<dtDeslig>' + esc(dataDeslig || new Date().toISOString().slice(0, 10)) + '</dtDeslig>' +
                        '<indPagtoAPI>S</indPagtoAPI>' +
                    '</infoDeslig>' +
                '</evtDeslig>' +
            '</eSocial>';
        return { id: id, xml: xml, evento: 'S-2299', staffId: staff.id, staffName: staff.name };
    }

    function s2299(franchiseId) {
        // Lista os ja desligados (active=false)
        var staff = (DataStore.getCollection('staff', franchiseId) || []).filter(function (s) { return !s.active && s.dataDesligamento; });
        return staff.map(function (s) {
            try { return s2299ForStaff(franchiseId, s, s.motivoDesligamento, s.dataDesligamento); }
            catch (e) { return { erro: e.message, staffId: s.id }; }
        });
    }

    // ============================================
    // ROUTER + DOWNLOAD
    // ============================================
    function gerar(franchiseId, evento, opts) {
        var resultado;
        switch (evento) {
            case 'S-1000': resultado = [s1000(franchiseId)]; break;
            case 'S-1005': resultado = [s1005(franchiseId)]; break;
            case 'S-2200': resultado = s2200(franchiseId); break;
            case 'S-1200': resultado = s1200(franchiseId, opts); break;
            case 'S-1210': resultado = s1210(franchiseId, opts); break;
            case 'S-2299': resultado = s2299(franchiseId); break;
            default: throw new Error('Evento desconhecido: ' + evento);
        }
        return { evento: evento, qtdEventos: resultado.length, xmls: resultado };
    }

    function download(evento, xmls) {
        // Gera um arquivo concatenado .xml com separador OU varios arquivos .xml em texto
        // Para producao real, use JSZip; aqui geramos um unico arquivo com TODOS os eventos
        var content = '<?xml version="1.0" encoding="UTF-8"?>\n';
        content += '<!-- MilkyPot — Lote eSocial ' + evento + ' (' + xmls.length + ' eventos) -->\n';
        content += '<lote>\n';
        xmls.forEach(function (x, i) {
            if (x.xml) {
                content += '<!-- evento ' + (i + 1) + ' — ' + (x.staffName || x.evento) + ' -->\n';
                content += x.xml.replace(/^<\?xml.*?\?>/, '') + '\n\n';
            }
        });
        content += '</lote>';
        var blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'esocial_' + evento + '_' + new Date().toISOString().slice(0, 10) + '.xml';
        a.click();
        URL.revokeObjectURL(url);
    }

    window.eSocialExport = {
        LAYOUT_VERSION: LAYOUT_VERSION,
        gerar: gerar,
        download: download,
        s1000: s1000,
        s1005: s1005,
        s2200: s2200,
        s1200: s1200,
        s1210: s1210,
        s2299: s2299
    };
})();
