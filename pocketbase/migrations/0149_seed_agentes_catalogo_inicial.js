// Catálogo inicial de agentes/perigos — conjunto de partida para testar o
// motor de ponta a ponta (matriz, laudos, LTCAT), NÃO o catálogo completo.
// codigo_esocial só é preenchido nos poucos códigos confirmados na pesquisa
// (02.01.001 ruído; 09.01.001 ausência de agente; 05.01.001 decisão
// judicial) — os demais ficam em branco de propósito, porque os espelhos da
// Tabela 24 divergem entre si na numeração; a expansão deve seguir o mesmo
// processo já usado no catálogo de checklists (conferir cada código na fonte
// oficial do eSocial antes de gravar), não reaproveitar números de blogs.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')

    const criar = (dados) => {
      const r = new Record(col)
      r.set('organizacao_id', '')
      r.set('ativo', true)
      Object.entries(dados).forEach(([k, v]) => r.set(k, v))
      app.save(r)
    }

    // ---------- Físicos ----------
    criar({
      nome: 'Ruído contínuo ou intermitente',
      tipo: 'Físico',
      codigo_esocial: '02.01.001',
      codigo_anexo_iv: '2.0.1',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '1',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      limite_tolerancia_valor: 85,
      limite_tolerancia_unidade: 'dB(A) NEN (8h, q=5)',
      nivel_acao_formula: 'Dose de 50% (NR-09, 9.6.1)',
      fonte_geradora_tipica: 'Máquinas, motores, equipamentos, ferramentas',
      meio_propagacao: 'Ar',
      danos_saude_tipicos: 'Perda auditiva induzida por ruído (PAIR), estresse',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'Enclausuramento, manutenção preditiva, protetor auditivo (NRRsf)',
    })
    criar({
      nome: 'Ruído de impacto',
      tipo: 'Físico',
      codigo_anexo_iv: '2.0.1',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '2',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      limite_tolerancia_valor: 130,
      limite_tolerancia_unidade: 'dB linear (pico)',
      fonte_geradora_tipica: 'Prensas, martelos, marteletes, forjas',
      meio_propagacao: 'Ar',
      danos_saude_tipicos: 'Perda auditiva, trauma acústico',
      efeito_saude_aiha: '3',
    })
    criar({
      nome: 'Calor',
      tipo: 'Físico',
      codigo_anexo_iv: '2.0.4',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '3',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      limite_tolerancia_unidade: 'IBUTG °C (Quadro 1, NR-09 Anexo III, conforme taxa metabólica)',
      nivel_acao_formula: 'IBUTG acima do Quadro 1 do Anexo III da NR-09',
      fonte_geradora_tipica: 'Fornos, fundição, caldeiras, trabalho a céu aberto com sol',
      meio_propagacao: 'Ar/radiação',
      danos_saude_tipicos: 'Exaustão térmica, intermação, desidratação',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Ventilação, pausas, hidratação, rodízio',
    })
    criar({
      nome: 'Vibração de corpo inteiro',
      tipo: 'Físico',
      codigo_anexo_iv: '2.0.2',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '8',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      limite_tolerancia_valor: 1.1,
      limite_tolerancia_unidade: 'm/s² aren (ou VDVR 21 m/s^1,75)',
      nivel_acao_formula: 'aren 0,5 m/s² (NR-09) ou VDVR 9,1',
      fonte_geradora_tipica: 'Veículos, máquinas pesadas, tratores',
      meio_propagacao: 'Estrutura/assento',
      danos_saude_tipicos: 'Lesões de coluna, distúrbios circulatórios',
      efeito_saude_aiha: '2',
    })
    criar({
      nome: 'Vibração de mãos e braços',
      tipo: 'Físico',
      codigo_anexo_iv: '2.0.2',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '8',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      limite_tolerancia_valor: 5,
      limite_tolerancia_unidade: 'm/s² aren',
      nivel_acao_formula: 'aren 2,5 m/s² (NR-09)',
      fonte_geradora_tipica: 'Ferramentas manuais motorizadas, lixadeiras, esmerilhadeiras',
      meio_propagacao: 'Empunhadura',
      danos_saude_tipicos: 'Síndrome de Raynaud, lesões articulares',
      efeito_saude_aiha: '2',
    })
    criar({
      nome: 'Radiações ionizantes',
      tipo: 'Físico',
      codigo_anexo_iv: '2.0.3',
      anos_aposentadoria_especial: '15',
      anexo_nr15: '5',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      limite_tolerancia_unidade: 'limites CNEN',
      fonte_geradora_tipica: 'Equipamentos de raio-X, radiografia industrial, radioterapia',
      danos_saude_tipicos: 'Câncer, danos celulares',
      efeito_saude_aiha: '4',
    })
    criar({
      nome: 'Frio',
      tipo: 'Físico',
      anexo_nr15: '9',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      fonte_geradora_tipica: 'Câmaras frigoríficas, processamento de carnes/pescados',
      danos_saude_tipicos: 'Hipotermia, problemas circulatórios',
      efeito_saude_aiha: '1',
    })

    // ---------- Químicos ----------
    criar({
      nome: 'Sílica livre cristalizada',
      tipo: 'Químico',
      codigo_esocial: '01.18.001',
      codigo_anexo_iv: '1.0.18',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '12',
      tipo_avaliacao_nr15: 'Quantitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      limite_tolerancia_unidade: 'mg/m³, fórmula 24/(%quartzo+3) total; 8/(%quartzo+2) respirável',
      grupo_linach: '1',
      via_absorcao_pele: false,
      fonte_geradora_tipica: 'Jateamento, corte de pedra, fundição, mineração',
      danos_saude_tipicos: 'Silicose, câncer de pulmão',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'Umectação, exaustão, respirador com filtro P3',
    })
    criar({
      nome: 'Asbesto (crisotila)',
      tipo: 'Químico',
      codigo_anexo_iv: '1.0.2',
      anos_aposentadoria_especial: '20',
      anexo_nr15: '12',
      tipo_avaliacao_nr15: 'Quantitativa',
      limite_tolerancia_valor: 2.0,
      limite_tolerancia_unidade: 'f/cm³',
      grupo_linach: '1',
      fonte_geradora_tipica: 'Materiais de fricção antigos, telhas de amianto',
      danos_saude_tipicos: 'Asbestose, mesotelioma, câncer de pulmão',
      efeito_saude_aiha: '4',
    })
    criar({
      nome: 'Benzeno',
      tipo: 'Químico',
      codigo_anexo_iv: '1.0.4',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '13-A',
      tipo_avaliacao_nr15: 'Quantitativa',
      limite_tolerancia_valor: 1.0,
      limite_tolerancia_unidade: 'ppm (VRT; 2,5 ppm na siderurgia)',
      grupo_linach: '1',
      via_absorcao_pele: true,
      fonte_geradora_tipica: 'Petroquímica, coquerias, uso de solventes com benzeno',
      danos_saude_tipicos: 'Leucemia, aplasia medular',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas: 'PPEOB — sistema fechado, exaustão, monitoramento biológico',
    })
    criar({
      nome: 'Poeiras, fumos e gases não listados (avaliação por TLV/ACGIH)',
      tipo: 'Químico',
      anexo_nr15: '11',
      tipo_avaliacao_nr15: 'Quantitativa',
      fonte_geradora_tipica: 'Diversos processos industriais',
      danos_saude_tipicos: 'Depende do agente específico',
      efeito_saude_aiha: '2',
    })
    criar({
      nome: 'Solventes orgânicos (genérico)',
      tipo: 'Químico',
      anexo_nr15: '11',
      tipo_avaliacao_nr15: 'Quantitativa',
      via_absorcao_pele: true,
      fonte_geradora_tipica: 'Pintura, limpeza, desengraxe, colas',
      danos_saude_tipicos: 'Irritação respiratória, neurotoxicidade, dermatite',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Cabine de pintura, exaustão, luvas e respirador adequados',
    })
    criar({
      nome: 'Óleos minerais (contato com a pele)',
      tipo: 'Químico',
      anexo_nr15: '13',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Médio (20%)',
      fonte_geradora_tipica: 'Usinagem, lubrificação, manutenção mecânica',
      danos_saude_tipicos: 'Dermatite, foliculite',
      efeito_saude_aiha: '1',
    })

    // ---------- Biológicos ----------
    criar({
      nome: 'Agentes biológicos — contato com pacientes/material infectocontagiante',
      tipo: 'Biológico',
      codigo_anexo_iv: '3.0.1',
      anos_aposentadoria_especial: '25',
      anexo_nr15: '14',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      fonte_geradora_tipica: 'Hospitais, laboratórios, coleta de lixo, saneamento',
      danos_saude_tipicos: 'Infecções diversas',
      efeito_saude_aiha: '3',
      medidas_controle_tipicas: 'EPI, vacinação, procedimentos de biossegurança',
    })
    criar({
      nome: 'Higienização de instalações sanitárias de uso público/coletivo',
      tipo: 'Biológico',
      anexo_nr15: '14',
      tipo_avaliacao_nr15: 'Qualitativa',
      grau_insalubridade_nr15: 'Máximo (40%)',
      fonte_geradora_tipica: 'Limpeza de banheiros públicos ou de grande circulação',
      danos_saude_tipicos: 'Infecções diversas (Súmula 448 TST)',
      efeito_saude_aiha: '2',
    })

    // ---------- Ergonômicos ----------
    criar({
      nome: 'Levantamento e transporte manual de cargas',
      tipo: 'Ergonômico',
      fonte_geradora_tipica: 'Movimentação manual de materiais',
      danos_saude_tipicos: 'Lombalgia, hérnia de disco, LER/DORT',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas: 'Ajuda mecânica, treinamento, rodízio, redução de peso',
    })
    criar({
      nome: 'Posturas forçadas e repetitividade',
      tipo: 'Ergonômico',
      fonte_geradora_tipica: 'Trabalho em linha de produção, digitação intensiva',
      danos_saude_tipicos: 'LER/DORT, tendinites',
      efeito_saude_aiha: '2',
    })
    criar({
      nome: 'Mobiliário e posto de trabalho inadequados',
      tipo: 'Ergonômico',
      fonte_geradora_tipica: 'Postos administrativos, operacionais',
      danos_saude_tipicos: 'Dores posturais, fadiga',
      efeito_saude_aiha: '1',
    })

    // ---------- Psicossociais ----------
    criar({
      nome: 'Sobrecarga de trabalho e pressão por metas',
      tipo: 'Psicossocial',
      fonte_geradora_tipica: 'Volume de trabalho acima da capacidade, prazos apertados',
      danos_saude_tipicos: 'Estresse ocupacional, burnout, ansiedade',
      efeito_saude_aiha: '2',
      medidas_controle_tipicas:
        'Dimensionamento adequado de equipe, pausas, canais de escuta, redistribuição de tarefas',
    })
    criar({
      nome: 'Assédio moral e conflitos interpessoais',
      tipo: 'Psicossocial',
      fonte_geradora_tipica: 'Relações de trabalho conflituosas, liderança inadequada',
      danos_saude_tipicos: 'Sofrimento psíquico, depressão, ansiedade',
      efeito_saude_aiha: '3',
    })
    criar({
      nome: 'Violência no trabalho (interna ou externa)',
      tipo: 'Psicossocial',
      fonte_geradora_tipica:
        'Atendimento ao público, segurança patrimonial, trabalho noturno isolado',
      danos_saude_tipicos: 'Transtorno de estresse, trauma',
      efeito_saude_aiha: '3',
    })

    // ---------- Acidentes / mecânicos ----------
    criar({
      nome: 'Queda de mesmo nível',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Pisos molhados, desnivelados, obstruídos',
      danos_saude_tipicos: 'Contusões, fraturas',
      efeito_saude_aiha: '1',
      medidas_controle_tipicas: 'Piso antiderrapante, sinalização, ordem e limpeza',
    })
    criar({
      nome: 'Queda de diferença de nível / trabalho em altura',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Telhados, andaimes, plataformas (NR-35)',
      danos_saude_tipicos: 'Fraturas graves, óbito',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas: 'Sistema de ancoragem, guarda-corpo, cinto tipo paraquedista, PT',
    })
    criar({
      nome: 'Contato com partes móveis de máquinas',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Máquinas sem proteção (NR-12)',
      danos_saude_tipicos: 'Amputação, esmagamento',
      efeito_saude_aiha: '4',
      medidas_controle_tipicas: 'Proteções fixas/móveis, dispositivos de segurança, LOTO',
    })
    criar({
      nome: 'Choque elétrico',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Instalações e equipamentos elétricos (NR-10)',
      danos_saude_tipicos: 'Queimaduras, parada cardíaca, óbito',
      efeito_saude_aiha: '4',
      anexo_nr16: '4',
      item_nr16: 'Sistema Elétrico de Potência / atividades com energia elétrica',
      medidas_controle_tipicas: 'Desenergização, EPI isolante, procedimentos NR-10',
    })
    criar({
      nome: 'Incêndio e explosão — inflamáveis',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Armazenamento/manuseio de inflamáveis acima do limite',
      danos_saude_tipicos: 'Queimaduras graves, óbito',
      efeito_saude_aiha: '4',
      anexo_nr16: '2',
      item_nr16: 'Inflamáveis — áreas de risco conforme quantidade armazenada',
      medidas_controle_tipicas: 'Armazenamento adequado, sinalização, combate a incêndio',
    })
    criar({
      nome: 'Uso de motocicleta em vias públicas',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Motoboy, entregador, técnico de campo com deslocamento em moto',
      danos_saude_tipicos: 'Acidente de trânsito, fraturas, óbito',
      efeito_saude_aiha: '3',
      anexo_nr16: '5',
      item_nr16: 'Uso de motocicleta em vias abertas à circulação pública (Portaria 2.021/2025)',
    })
    criar({
      nome: 'Assalto / roubo — segurança patrimonial',
      tipo: 'Acidente',
      fonte_geradora_tipica: 'Vigilância, transporte de valores, comércio',
      danos_saude_tipicos: 'Trauma físico e psicológico, óbito',
      efeito_saude_aiha: '4',
      anexo_nr16: '3',
      item_nr16: 'Segurança patrimonial ou pessoal (Portaria 1.885/2013)',
    })

    // ---------- Ausência (eSocial) ----------
    criar({
      nome: 'Ausência de agente nocivo (função sem exposição ao Anexo IV)',
      tipo: 'Acidente',
      codigo_esocial: '09.01.001',
      fonte_geradora_tipica: 'Uso exclusivo no LTCAT/eSocial — não gera avaliação de matriz',
    })
  },
  (app) => {
    const col = app.findCollectionByNameOrId('agentes_catalogo')
    const registros = app.findRecordsByFilter(col, "organizacao_id = ''", '', 0, 0)
    registros.forEach((r) => app.delete(r))
  },
)
