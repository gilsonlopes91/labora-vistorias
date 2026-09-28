// Tabela 24 do eSocial (agentes nocivos para fins de aposentadoria especial,
// evento S-2240) — importada na íntegra a partir da planilha oficial
// fornecida pelo usuário (Tabela_24_Agentes_Nocivos_Aposentadoria_Especial),
// resolvendo a incerteza registrada nas migrações 0149/0150 sobre a
// numeração exata dos códigos.
//
// Estrutura oficial confirmada pela planilha:
//   01.xx.xxx = Químicos | 02.01.xxx = Físicos | 03.01.xxx = Biológicos
//   04.01.xxx = Associação de agentes físicos+químicos+biológicos (mineração
//   subterrânea) | 05.01.001 = outros agentes (decisão judicial/adm.) |
//   09.01.001 = ausência de agente nocivo.
// (Os dois códigos já gravados como "confirmados" em 0149 — ruído
// 02.01.001 e sílica 01.18.001 — batem exatamente com a planilha oficial.)
//
// Ergonômico e Acidente/mecânico continuam sem código próprio na Tabela 24
// (não é lacuna: esses riscos entram no PGR, mas não no enquadramento de
// aposentadoria especial do LTCAT/eSocial) — por isso não são tocados aqui.
//
// O que este arquivo faz:
// 1) Corrige/completa codigo_esocial nos agentes já existentes no catálogo
//    oficial que correspondem a um código da tabela.
// 2) Cria todos os agentes da Tabela 24 que ainda não tinham registro no
//    catálogo — nome e código exatamente como na planilha oficial, mais
//    fonte geradora, danos à saúde e medidas de controle típicas
//    preenchidas (campos editáveis por cada organização depois).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')

    const buscar = (nome) =>
      app.findRecordsByFilter(
        col,
        `organizacao_id = '' && nome = '${nome.replace(/'/g, "\\'")}'`,
        '',
        1,
        0,
      )[0]

    const atualizar = (nome, campos) => {
      const r = buscar(nome)
      if (r) {
        Object.entries(campos).forEach(([k, v]) => r.set(k, v))
        app.save(r)
      }
    }

    const criar = (dados) => {
      const r = new Record(col)
      r.set('organizacao_id', '')
      r.set('ativo', true)
      Object.entries(dados).forEach(([k, v]) => r.set(k, v))
      app.save(r)
    }

    // ---------------------------------------------------------------
    // 1) Corrige/completa código eSocial nos agentes já existentes
    // ---------------------------------------------------------------
    atualizar('Asbesto (crisotila)', { codigo_esocial: '01.02.001', grupo_linach: '1' })
    atualizar('Benzeno', { codigo_esocial: '01.03.001' })
    atualizar('Radiações ionizantes', { codigo_esocial: '02.01.006' })
    atualizar('Vibração de mãos e braços', { codigo_esocial: '02.01.002' })
    atualizar('Vibração de corpo inteiro', {
      codigo_esocial: '02.01.003',
      nivel_acao_formula:
        'aren 0,5 m/s² (NR-09) ou VDVR 9,1 — código eSocial alternativo por VDVR: 02.01.004',
    })
    atualizar('Calor', { codigo_esocial: '02.01.014' })
    atualizar('Chumbo e seus compostos', { codigo_esocial: '01.08.001', grupo_linach: '2A' })
    atualizar('Mercúrio e seus compostos', { codigo_esocial: '01.15.001' })
    atualizar('Cromo hexavalente e seus compostos', {
      codigo_esocial: '01.10.001',
      grupo_linach: '1',
      sinonimos: 'Código oficial da Tabela 24 é genérico ("Cromo e seus compostos tóxicos")',
    })
    atualizar('Cádmio e seus compostos', { codigo_esocial: '01.06.001' })
    atualizar('Agentes biológicos — contato com pacientes/material infectocontagiante', {
      codigo_esocial: '03.01.001',
    })
    atualizar('Sílica livre cristalizada', { grupo_linach: '1' })

    // ---------------------------------------------------------------
    // 2) Novos agentes químicos nominados (01.01 a 01.17)
    // ---------------------------------------------------------------
    criar({
      nome: 'Arsênio e seus compostos',
      tipo: 'Químico',
      codigo_esocial: '01.01.001',
      grupo_linach: '1',
      fonte_geradora_tipica:
        'Fundição de metais não ferrosos, fabricação de pesticidas antigos, indústria de vidro e semicondutores, tratamento de madeira (CCA)',
      danos_saude_tipicos:
        'Câncer de pele e pulmão, lesões dermatológicas, neuropatia periférica, intoxicação sistêmica',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Exaustão local, EPI respiratório, monitoramento biológico (arsênio urinário), controle médico periódico',
    })
    criar({
      nome: 'Estireno (vinilbenzeno)',
      tipo: 'Químico',
      codigo_esocial: '01.03.002',
      via_absorcao_pele: true,
      fonte_geradora_tipica:
        'Fabricação de plásticos reforçados com fibra de vidro (poliéster), borracha sintética, embalagens',
      danos_saude_tipicos:
        'Irritação respiratória e ocular, neurotoxicidade (efeitos no sistema nervoso central), possível efeito cancerígeno',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Exaustão local, sistema fechado, EPI respiratório com filtro para vapores orgânicos, monitoramento biológico (ácido mandélico urinário)',
    })
    criar({
      nome: 'Berílio e seus compostos tóxicos',
      tipo: 'Químico',
      codigo_esocial: '01.04.001',
      grupo_linach: '1',
      fonte_geradora_tipica:
        'Indústria aeroespacial, eletrônica (ligas de cobre-berílio), cerâmica especial, fundição',
      danos_saude_tipicos:
        'Beriliose (doença pulmonar granulomatosa crônica), câncer de pulmão, sensibilização',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Sistema fechado, exaustão de alta eficiência (HEPA), respirador PFF3, monitoramento médico (teste de proliferação linfocitária)',
    })
    criar({
      nome: 'Bromo e seus compostos tóxicos',
      tipo: 'Químico',
      codigo_esocial: '01.05.001',
      fonte_geradora_tipica:
        'Indústria química, retardantes de chama, tratamento de água, desinfecção',
      danos_saude_tipicos: 'Irritação respiratória grave, queimaduras químicas, edema pulmonar',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Sistema fechado, exaustão, chuveiro de emergência, EPI resistente a corrosivos',
    })
    criar({
      nome: 'Carvão mineral e seus derivados',
      tipo: 'Químico',
      codigo_esocial: '01.07.001',
      fonte_geradora_tipica: 'Mineração de carvão, coquerias, siderurgia, geração termelétrica',
      danos_saude_tipicos:
        'Pneumoconiose dos trabalhadores do carvão, bronquite crônica, câncer (nos derivados, por HPA)',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Umectação, exaustão, respirador contra poeira, monitoramento radiográfico periódico',
    })
    criar({
      nome: 'Cloro e seus compostos tóxicos',
      tipo: 'Químico',
      codigo_esocial: '01.09.001',
      fonte_geradora_tipica:
        'Tratamento de água/esgoto, indústria de celulose e papel, produção de PVC, desinfecção',
      danos_saude_tipicos:
        'Irritação respiratória e ocular grave, edema pulmonar, queimaduras químicas',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Sistema fechado, detector de vazamento, chuveiro/lava-olhos, proteção respiratória de emergência',
    })
    criar({
      nome: 'Metileno-ortocloroanilina (MOCA / MBOCA)',
      tipo: 'Químico',
      codigo_esocial: '01.09.002',
      cas: '101-14-4',
      grupo_linach: '1',
      via_absorcao_pele: true,
      fonte_geradora_tipica: 'Agente de cura de poliuretanos, indústria de elastômeros',
      danos_saude_tipicos: 'Substância cancerígena (bexiga), absorção cutânea significativa',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Sistema fechado, luvas impermeáveis específicas, monitoramento biológico, substituição quando possível',
    })
    criar({
      nome: 'Bis(cloro metil) éter',
      tipo: 'Químico',
      codigo_esocial: '01.09.003',
      grupo_linach: '1',
      fonte_geradora_tipica:
        'Síntese de resinas de troca iônica; subproduto de processos com formaldeído e ácido clorídrico',
      danos_saude_tipicos: 'Cancerígeno comprovado (câncer de pulmão)',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Eliminação/substituição do processo quando possível, sistema fechado, exaustão, controle médico rigoroso',
    })
    criar({
      nome: 'Biscloroetileter (éter dicloroetílico)',
      tipo: 'Químico',
      codigo_esocial: '01.09.004',
      fonte_geradora_tipica: 'Síntese química, uso como solvente industrial',
      danos_saude_tipicos: 'Cancerígeno suspeito, irritação respiratória',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'Sistema fechado, exaustão, EPI respiratório',
    })
    criar({
      nome: 'Clorambucil',
      tipo: 'Químico',
      codigo_esocial: '01.09.005',
      grupo_linach: '1',
      fonte_geradora_tipica:
        'Fabricação e manipulação de medicamento antineoplásico (indústria farmacêutica)',
      danos_saude_tipicos: 'Cancerígeno comprovado, mutagênico, mielossupressão',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Manipulação em capela de segurança farmacêutica, EPI completo, procedimento para quimioterápicos',
    })
    criar({
      nome: 'Cloropreno',
      tipo: 'Químico',
      codigo_esocial: '01.09.006',
      fonte_geradora_tipica: 'Fabricação de neoprene (borracha sintética)',
      danos_saude_tipicos: 'Cancerígeno suspeito (fígado e pulmão), irritação respiratória',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Sistema fechado, exaustão, EPI respiratório, monitoramento ambiental',
    })
    criar({
      nome: 'Dissulfeto de carbono',
      tipo: 'Químico',
      codigo_esocial: '01.11.001',
      via_absorcao_pele: true,
      fonte_geradora_tipica: 'Fabricação de viscose (rayon) e celofane, vulcanização da borracha',
      danos_saude_tipicos:
        'Neurotoxicidade (polineuropatia), efeitos cardiovasculares, distúrbios psiquiátricos',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Sistema fechado, exaustão, EPI respiratório, monitoramento biológico',
    })
    criar({
      nome: 'Fósforo e seus compostos tóxicos',
      tipo: 'Químico',
      codigo_esocial: '01.12.001',
      fonte_geradora_tipica:
        'Fabricação de fósforos de acender, pesticidas organofosforados, pirotecnia',
      danos_saude_tipicos: 'Necrose óssea (mandíbula), intoxicação sistêmica, queimaduras químicas',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'Sistema fechado, exaustão, EPI, monitoramento médico odontológico',
    })
    criar({
      nome: 'Iodo',
      tipo: 'Químico',
      codigo_esocial: '01.13.001',
      fonte_geradora_tipica: 'Indústria química e farmacêutica, desinfecção, radiografia',
      danos_saude_tipicos: 'Irritação respiratória e ocular, distúrbios da tireoide',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Ventilação, EPI respiratório, monitoramento da função tireoidiana',
    })
    criar({
      nome: 'Manganês e seus compostos',
      tipo: 'Químico',
      codigo_esocial: '01.14.001',
      fonte_geradora_tipica: 'Siderurgia, soldagem, fabricação de ligas metálicas, baterias',
      danos_saude_tipicos: 'Manganismo (síndrome neurológica semelhante ao Parkinson), pneumonite',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Exaustão localizada na solda, respirador adequado, monitoramento neurológico periódico',
    })
    criar({
      nome: 'Níquel e seus compostos tóxicos',
      tipo: 'Químico',
      codigo_esocial: '01.16.001',
      grupo_linach: '1',
      fonte_geradora_tipica: 'Galvanoplastia (niquelação), fabricação de aço inoxidável, baterias',
      danos_saude_tipicos:
        'Dermatite de contato (alergia), câncer de pulmão e de cavidade nasal (compostos específicos)',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Exaustão, EPI (luvas resistentes a níquel), ventilação do processo',
    })
    criar({
      nome: 'Petróleo, xisto betuminoso, gás natural e seus derivados',
      tipo: 'Químico',
      codigo_esocial: '01.17.001',
      fonte_geradora_tipica: 'Refino de petróleo, extração, petroquímica, postos de combustível',
      danos_saude_tipicos:
        'Dermatite, irritação respiratória, exposição a benzeno e HPA (cancerígenos), intoxicação por H2S',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Sistema fechado, exaustão, EPI, monitoramento de gases (H2S/hidrocarbonetos), programa de prevenção de riscos',
    })

    // ---------------------------------------------------------------
    // 3) "Outras substâncias químicas" (01.19.xxx) — lista de
    // substâncias reconhecidas como cancerígenas/mutagênicas para fins
    // de aposentadoria especial (Anexo IV do Decreto 3.048/1999).
    // Conteúdo técnico específico por substância varia muito e não foi
    // detalhado individualmente aqui — cada uma pode ser editada depois
    // com a ficha de segurança (FISPQ) do produto usado na empresa.
    // ---------------------------------------------------------------
    const carcinogenosBoilerplate = {
      tipo: 'Químico',
      fonte_geradora_tipica:
        'Uso, manipulação ou geração em processo industrial/químico específico — consultar a Ficha de Segurança (FISPQ) do produto e o processo que a gera ou utiliza',
      danos_saude_tipicos:
        'Substância listada no Anexo IV do Decreto 3.048/1999 como agente cancerígeno/mutagênico para fins de aposentadoria especial; efeitos específicos variam por substância',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Eliminação ou substituição do processo/produto sempre que possível; quando inevitável, sistema fechado, exaustão local, EPI respiratório adequado, monitoramento biológico quando disponível e controle médico ocupacional reforçado (PCMSO)',
    }
    const carcinogenos = [
      ['01.19.001', 'Butadieno-estireno'],
      ['01.19.002', 'Acrilonitrila'],
      ['01.19.003', '1,3-butadieno'],
      ['01.19.004', 'Mercaptanos (tióis)'],
      ['01.19.005', 'n-hexano'],
      ['01.19.006', 'Diisocianato de tolueno (TDI)'],
      ['01.19.007', 'Aminas aromáticas'],
      ['01.19.008', 'Aminobifenila (4-aminodifenil)'],
      ['01.19.009', 'Auramina'],
      ['01.19.010', 'Azatioprina'],
      ['01.19.011', '1,4-butanodiol'],
      ['01.19.012', 'Dimetanosulfonato (Mirelan)'],
      ['01.19.013', 'Ciclofosfamida'],
      ['01.19.014', 'Dietiletilbestrol'],
      ['01.19.015', 'Acronitrila'],
      ['01.19.016', 'Nitronaftilamina'],
      ['01.19.017', '4-dimetil-aminoazobenzeno'],
      ['01.19.018', 'Benzopireno'],
      ['01.19.019', 'Beta-propiolactona'],
      ['01.19.021', 'Dianizidina'],
      ['01.19.022', 'Dietilsulfato'],
      ['01.19.023', 'Dimetilsulfato'],
      ['01.19.024', 'Etilenoamina'],
      ['01.19.025', 'Etilenotiureia'],
      ['01.19.026', 'Fenacetina'],
      ['01.19.027', 'Iodeto de metila'],
      ['01.19.028', 'Etilnitrosureia'],
      ['01.19.029', 'Nitrosamina'],
      ['01.19.030', 'Ortotoluidina'],
      ['01.19.031', 'Oximetalona'],
      ['01.19.032', 'Procarbazina'],
      ['01.19.033', 'Propanosultona'],
      ['01.19.034', 'Óxido de etileno'],
      ['01.19.035', 'Estilbenzeno'],
      ['01.19.036', 'Creosoto'],
      ['01.19.038', 'Benzidina'],
      ['01.19.039', 'Betanaftilamina'],
      ['01.19.040', '1-cloro-2,4-nitrodifenil'],
      ['01.19.041', '3-epoxipropano (óxido de propileno)'],
    ]
    carcinogenos.forEach(([codigo, nome]) => {
      criar({ ...carcinogenosBoilerplate, nome, codigo_esocial: codigo })
    })

    // ---------------------------------------------------------------
    // 4) Novos agentes físicos (02.01.xxx)
    // ---------------------------------------------------------------
    criar({
      nome: 'Trabalhos com perfuratrizes e marteletes pneumáticos',
      tipo: 'Físico',
      codigo_esocial: '02.01.005',
      fonte_geradora_tipica:
        'Operação de perfuratrizes e marteletes pneumáticos (mineração, construção civil, demolição)',
      danos_saude_tipicos:
        'Vibração de mãos e braços (síndrome de Raynaud ocupacional), perda auditiva por ruído associado',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Equipamento com menor vibração/ruído, luvas antivibratórias, protetor auditivo, rodízio, pausas',
    })
    criar({
      nome: 'Extração e beneficiamento de minerais radioativos',
      tipo: 'Físico',
      codigo_esocial: '02.01.007',
      fonte_geradora_tipica: 'Mineração e beneficiamento de minérios radioativos (urânio, tório)',
      danos_saude_tipicos: 'Exposição à radiação ionizante, risco de câncer',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Monitoramento radiológico, blindagem, dosimetria individual, ventilação (radônio)',
    })
    criar({
      nome: 'Atividades em minerações com exposição ao radônio',
      tipo: 'Físico',
      codigo_esocial: '02.01.008',
      fonte_geradora_tipica: 'Minas subterrâneas com presença de gás radônio',
      danos_saude_tipicos:
        'Câncer de pulmão (radônio é reconhecido como a segunda maior causa, após o tabagismo)',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Ventilação forçada, monitoramento da concentração de radônio, redução do tempo de exposição',
    })
    criar({
      nome: 'Manutenção e supervisão em unidades com exposição a radiações ionizantes',
      tipo: 'Físico',
      codigo_esocial: '02.01.009',
      fonte_geradora_tipica:
        'Manutenção e supervisão em unidades de extração, tratamento e beneficiamento de minerais radioativos',
      danos_saude_tipicos: 'Exposição à radiação ionizante',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Dosimetria individual, procedimentos de radioproteção, blindagem, EPI',
    })
    criar({
      nome: 'Operações com reatores nucleares ou fontes radioativas',
      tipo: 'Físico',
      codigo_esocial: '02.01.010',
      fonte_geradora_tipica: 'Usinas nucleares, instalações com fontes radioativas seladas',
      danos_saude_tipicos: 'Exposição à radiação ionizante, risco de contaminação',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas: 'Blindagem, dosimetria, procedimentos CNEN, controle de acesso',
    })
    criar({
      nome: 'Trabalhos com raios Alfa, Beta, Gama e X, nêutrons e substâncias radioativas',
      tipo: 'Físico',
      codigo_esocial: '02.01.011',
      fonte_geradora_tipica:
        'Radiografia industrial, radioterapia, radiodiagnóstico médico, medicina nuclear',
      danos_saude_tipicos:
        'Exposição à radiação ionizante, risco de câncer, efeitos determinísticos em altas doses',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Blindagem, dosimetria individual (TLD), controle de distância e tempo de exposição, CNEN',
    })
    criar({
      nome: 'Fabricação e manipulação de produtos radioativos',
      tipo: 'Físico',
      codigo_esocial: '02.01.012',
      fonte_geradora_tipica:
        'Indústria de radiofármacos, fontes seladas, produtos com radioisótopos',
      danos_saude_tipicos: 'Exposição à radiação ionizante',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas: 'Blindagem, sistema fechado, dosimetria, procedimentos CNEN',
    })
    criar({
      nome: 'Pesquisas e estudos com radiações ionizantes em laboratórios',
      tipo: 'Físico',
      codigo_esocial: '02.01.013',
      fonte_geradora_tipica: 'Laboratórios de pesquisa com fontes radioativas',
      danos_saude_tipicos: 'Exposição à radiação ionizante',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Blindagem, dosimetria, procedimentos de radioproteção, treinamento',
    })
    criar({
      nome: 'Pressão atmosférica anormal',
      tipo: 'Físico',
      codigo_esocial: '02.01.015',
      anexo_nr15: '6',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      fonte_geradora_tipica: 'Trabalho em ambientes com pressão diferente da atmosférica normal',
      danos_saude_tipicos: 'Doença descompressiva, barotrauma',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Procedimentos de descompressão controlada, supervisão médica, equipamento adequado',
    })
    criar({
      nome: 'Trabalhos em caixões ou câmaras hiperbáricas',
      tipo: 'Físico',
      codigo_esocial: '02.01.016',
      fonte_geradora_tipica: 'Fundações em caixões pneumáticos, câmaras hiperbáricas de tratamento',
      danos_saude_tipicos: 'Doença descompressiva, barotrauma, embolia gasosa',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Tabela de descompressão, supervisão médica hiperbárica, equipamento certificado',
    })
    criar({
      nome: 'Trabalhos em tubulões ou túneis sob ar comprimido',
      tipo: 'Físico',
      codigo_esocial: '02.01.017',
      fonte_geradora_tipica: 'Escavação de túneis e tubulões com ar comprimido',
      danos_saude_tipicos: 'Doença descompressiva, barotrauma',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Câmara de descompressão, controle do tempo de exposição, supervisão médica',
    })
    criar({
      nome: 'Operações de mergulho com escafandros ou outros equipamentos',
      tipo: 'Físico',
      codigo_esocial: '02.01.018',
      fonte_geradora_tipica: 'Mergulho profissional (comercial, científico, resgate)',
      danos_saude_tipicos: 'Doença descompressiva, barotrauma, narcose por nitrogênio',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Tabela de mergulho, supervisão de mergulho, equipamento certificado, câmara hiperbárica de emergência',
    })

    // ---------------------------------------------------------------
    // 5) Novos agentes biológicos (03.01.xxx)
    // ---------------------------------------------------------------
    criar({
      nome: 'Trabalhos com animais infectados (soro, vacinas e outros produtos)',
      tipo: 'Biológico',
      codigo_esocial: '03.01.002',
      fonte_geradora_tipica:
        'Produção de soros e vacinas, biotérios de pesquisa com animais infectados',
      danos_saude_tipicos: 'Infecções zoonóticas diversas',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'EPI, vacinação, biossegurança (NB2/NB3), procedimentos de descarte',
    })
    criar({
      nome: 'Laboratórios de autópsia, anatomia e anátomo-histologia',
      tipo: 'Biológico',
      codigo_esocial: '03.01.003',
      fonte_geradora_tipica:
        'Necrotérios, laboratórios de anatomia patológica, serviços de verificação de óbito',
      danos_saude_tipicos: 'Infecções por contato com material cadavérico, exposição a formol',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'EPI completo, ventilação adequada, procedimentos de biossegurança',
    })
    criar({
      nome: 'Exumação de corpos e manipulação de resíduos de animais deteriorados',
      tipo: 'Biológico',
      codigo_esocial: '03.01.004',
      fonte_geradora_tipica: 'Exumação em cemitérios, remoção de carcaças',
      danos_saude_tipicos: 'Infecções diversas, exposição a gases de decomposição',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'EPI completo, máscara adequada, procedimento específico',
    })
    criar({
      nome: 'Trabalhos em galerias, fossas e tanques de esgoto',
      tipo: 'Biológico',
      codigo_esocial: '03.01.005',
      fonte_geradora_tipica: 'Manutenção de redes de esgoto, estações de tratamento',
      danos_saude_tipicos:
        'Infecções gastrointestinais, leptospirose, exposição a gases tóxicos (H2S)',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'EPI, vacinação, monitoramento de atmosfera, ventilação',
    })
    criar({
      nome: 'Esvaziamento de biodigestores',
      tipo: 'Biológico',
      codigo_esocial: '03.01.006',
      fonte_geradora_tipica: 'Manutenção e limpeza de biodigestores (agropecuária, saneamento)',
      danos_saude_tipicos: 'Infecções, intoxicação por gases (metano, H2S), asfixia',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas:
        'Monitoramento de atmosfera, ventilação, EPI, procedimento de espaço confinado',
    })
    criar({
      nome: 'Coleta e industrialização do lixo',
      tipo: 'Biológico',
      codigo_esocial: '03.01.007',
      fonte_geradora_tipica: 'Coleta de resíduos sólidos urbanos, triagem, reciclagem',
      danos_saude_tipicos: 'Infecções diversas, cortes com material perfurocortante',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas:
        'EPI completo, vacinação, treinamento, equipamento de coleta adequado',
    })

    // ---------------------------------------------------------------
    // 6) Associação de agentes (04.01.xxx) e outros/ausência (05/09)
    // ---------------------------------------------------------------
    criar({
      nome: 'Mineração subterrânea afastada da frente de produção',
      tipo: 'Físico',
      codigo_esocial: '04.01.001',
      sinonimos: 'Grupo eSocial 04 — associação de agentes físicos, químicos e biológicos',
      fonte_geradora_tipica:
        'Atividades de apoio em minas subterrâneas, afastadas da frente de lavra',
      danos_saude_tipicos: 'Exposição combinada a poeira, ruído, umidade e gases',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas:
        'Ventilação da mina, monitoramento ambiental, EPI conforme os agentes presentes',
    })
    criar({
      nome: 'Trabalhos permanentes no subsolo em frente de produção de minerações subterrâneas',
      tipo: 'Físico',
      codigo_esocial: '04.01.002',
      sinonimos: 'Grupo eSocial 04 — associação de agentes físicos, químicos e biológicos',
      fonte_geradora_tipica: 'Atividades de lavra na frente de produção em minas subterrâneas',
      danos_saude_tipicos:
        'Exposição combinada e intensa a poeira (sílica), ruído, vibração, calor e gases',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas: 'Ventilação forçada, monitoramento contínuo, EPI completo, rodízio',
    })
    criar({
      nome: 'Agentes nocivos reconhecidos por decisão judicial ou administrativa',
      tipo: 'Acidente',
      codigo_esocial: '05.01.001',
      fonte_geradora_tipica:
        'Uso exclusivo para enquadramento de agente nocivo fora do rol do Anexo IV, reconhecido por decisão judicial ou administrativa',
      danos_saude_tipicos: 'Depende da decisão e do agente específico reconhecido no caso concreto',
      medidas_controle_tipicas: 'Definidas caso a caso, conforme a decisão',
    })
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')
    const codigos = [
      '01.01.001',
      '01.03.002',
      '01.04.001',
      '01.05.001',
      '01.07.001',
      '01.09.001',
      '01.09.002',
      '01.09.003',
      '01.09.004',
      '01.09.005',
      '01.09.006',
      '01.11.001',
      '01.12.001',
      '01.13.001',
      '01.14.001',
      '01.16.001',
      '01.17.001',
      '01.19.001',
      '01.19.002',
      '01.19.003',
      '01.19.004',
      '01.19.005',
      '01.19.006',
      '01.19.007',
      '01.19.008',
      '01.19.009',
      '01.19.010',
      '01.19.011',
      '01.19.012',
      '01.19.013',
      '01.19.014',
      '01.19.015',
      '01.19.016',
      '01.19.017',
      '01.19.018',
      '01.19.019',
      '01.19.021',
      '01.19.022',
      '01.19.023',
      '01.19.024',
      '01.19.025',
      '01.19.026',
      '01.19.027',
      '01.19.028',
      '01.19.029',
      '01.19.030',
      '01.19.031',
      '01.19.032',
      '01.19.033',
      '01.19.034',
      '01.19.035',
      '01.19.036',
      '01.19.038',
      '01.19.039',
      '01.19.040',
      '01.19.041',
      '02.01.005',
      '02.01.007',
      '02.01.008',
      '02.01.009',
      '02.01.010',
      '02.01.011',
      '02.01.012',
      '02.01.013',
      '02.01.015',
      '02.01.016',
      '02.01.017',
      '02.01.018',
      '03.01.002',
      '03.01.003',
      '03.01.004',
      '03.01.005',
      '03.01.006',
      '03.01.007',
      '04.01.001',
      '04.01.002',
      '05.01.001',
    ]
    codigos.forEach((codigo) => {
      const registros = app.findRecordsByFilter(
        col,
        `organizacao_id = '' && codigo_esocial = '${codigo}'`,
        '',
        0,
        0,
      )
      registros.forEach((r) => app.delete(r))
    })
    // Nota: a reversão não desfaz as atualizações de codigo_esocial feitas
    // nos agentes pré-existentes (passo 1) — mesmo padrão já usado em 0150.
  },
)
