/* Modelos de propostas comerciais prontos para download em PDF.
   Conteúdo em PT-BR profissional voltado ao setor de Engenharia e SST (Segurança e Saúde no Trabalho).
   Os modelos utilizam campos editáveis entre colchetes [CAMPOS] para fácil preenchimento pelo usuário. */

export interface ItemInvestimentoModelo {
  item: string
  descricao: string
  unidade: string
  quantidade: string
  valorUnitario: string
  subtotal: string
}

export interface ModeloPropostaComercial {
  id: string
  nome: string
  categoria: string
  descricaoCurta: string
  iconeId: string
  tempoEstimado: string
  nrReferencia: string
  identificacao: {
    contratada: string
    contratante: string
    objetoResumo: string
  }
  apresentacao: string
  escopo: string[]
  metodologia: { etapa: string; descricao: string }[]
  itensNaoInclusos: string[]
  prazoExecucao: string
  itensInvestimento: ItemInvestimentoModelo[]
  condicoesPagamento: string[]
  validadeProposta: string
  obrigacoesPartes: {
    contratante: string[]
    contratada: string[]
  }
  disposicoesGerais: string[]
}

export const MODELOS_PROPOSTAS_COMERCIAIS: ModeloPropostaComercial[] = [
  {
    id: 'vistoria-sst-periodica',
    nome: 'Proposta de Serviços de Vistoria de Segurança do Trabalho',
    categoria: 'Auditoria & Vistorias de Campo',
    descricaoCurta:
      'Vistorias periódicas por NR, auditoria das condições de trabalho, identificação de não conformidades com estimativa de multas NR-28 e plano de ação.',
    iconeId: 'clipboard-check',
    tempoEstimado: '12 meses (contrato periódico) ou pontual',
    nrReferencia: 'NR-01, NR-05, NR-06, NR-10, NR-12, NR-18, NR-28 e NR-35',
    identificacao: {
      contratada:
        'LABORA vistorias — Engenharia de Segurança e Saúde Ocupacional\nCNPJ: [CNPJ DA CONTRATADA] | Registro CREA: [Nº REGISTRO CREA]\nEndereço: [ENDEREÇO DA CONTRATADA] | Contato: [TELEFONE/E-MAIL]',
      contratante:
        'Razão Social: [NOME DO CLIENTE / RAZÃO SOCIAL]\nCNPJ: [CNPJ DO CLIENTE] | Inscrição Estadual: [INSCRIÇÃO ESTADUAL]\nEndereço da Unidade: [ENDEREÇO DA PLANTA/OBRA VISTORIADA]\nRepresentante Comercial / Contato: [NOME DO REPRESENTANTE DO CLIENTE] — [CARGO / E-MAIL / FONE]',
      objetoResumo:
        'Prestação de serviços técnicos especializados de Engenharia de Segurança do Trabalho para realização de vistorias periódicas de conformidade legal, auditoria física in loco e elaboração de relatórios técnicos de vistoria com matriz de risco e plano de ação conforme normas regulamentadoras vigentes.',
    },
    apresentacao:
      'A LABORA vistorias apresenta esta proposta técnico-comercial com a finalidade de fornecer suporte contínuo e especializado na gestão preventiva dos ambientes de trabalho do CLIENTE. Nossa metodologia une vistorias presenciais rigorosas a relatórios digitais padronizados, conferindo transparência, respaldo legal e proteção contra penalidades fiscais e trabalhistas.',
    escopo: [
      'Planejamento prévio e alinhamento do cronograma de vistorias por unidade/setor;',
      'Vistoria física in loco periódica com checagem minuciosa dos postos de trabalho e instalações operacionais;',
      'Auditoria de conformidade com as Normas Regulamentadoras (NRs aplicáveis à atividade da empresa);',
      'Levantamento fotográfico geolocalizado de todas as não conformidades observadas;',
      'Enquadramento das irregularidades na NR-28 (Fiscalização e Penalidades) com estimativa de gradação de multas;',
      'Elaboração de Relatório Técnico de Vistoria com emissão de ART/RRT quando cabível;',
      'Emissão de Matriz de Risco e Plano de Ação corretivo e preventivo (metodologia 5W2H) com prazos sugeridos;',
      'Reunião técnica de alinhamento com a diretoria/CIPA para apresentação dos resultados e prioridades de intervenção.',
    ],
    metodologia: [
      {
        etapa: 'Etapa 1 — Alinhamento e Cronograma',
        descricao:
          'Reconhecimento preliminar das atividades, análise do organograma fabril/operacional e fixação das datas das vistorias mensais/periódicas.',
      },
      {
        etapa: 'Etapa 2 — Vistoria Técnica de Campo',
        descricao:
          'Inspeção detalhada de máquinas, setores de estocagem, rotas de fuga, proteção coletiva (EPC) e equipamentos de proteção individual (EPI).',
      },
      {
        etapa: 'Etapa 3 — Processamento e Cálculo de Risco',
        descricao:
          'Triagem das evidências fotográficas, verificação ementária do Ministério do Trabalho e cálculo estimativo de autuações e gravidades.',
      },
      {
        etapa: 'Etapa 4 — Entrega do Laudo e Devolutiva',
        descricao:
          'Disponibilização do laudo técnico assinado pelo Responsável Técnico e reunião executiva com a equipe gestora da empresa contratante.',
      },
    ],
    itensNaoInclusos: [
      'Aquisição, substituição ou calibração de Equipamentos de Proteção Coletiva (EPC) e EPIs;',
      'Adequações físicas, civis, mecânicas ou elétricas apontadas como pendência no relatório técnico;',
      'Avaliações quantitativas de agentes ambientais com instrumentação específica (dosimetrias, termômetros de globo, bombas de amostragem) salvo se expressamente cotadas em aditivo;',
      'Custos com taxas públicas de expedição de guias de ART/RRT ou custas de órgãos municipais/estaduais.',
    ],
    prazoExecucao:
      'Vistorias mensais com entrega do Relatório Técnico consolidado em até [X DIAS ÚTEIS, ex.: 5 dias úteis] após a execução de cada inspeção em campo. Vigência contratual proposta de [X MESES, ex.: 12 meses].',
    itensInvestimento: [
      {
        item: '01',
        descricao:
          'Vistoria Técnica Periódica de Segurança do Trabalho in loco (por ciclo de visita)',
        unidade: 'visita',
        quantidade: '[QUANTIDADE, ex.: 12]',
        valorUnitario: 'R$ [VALOR UNITÁRIO, ex.: 1.200,00]',
        subtotal: 'R$ [SUBTOTAL, ex.: 14.400,00]',
      },
      {
        item: '02',
        descricao:
          'Emissão de Relatório Técnico de Vistoria com Levantamento Fotográfico e Matriz de Não Conformidades (NR-28)',
        unidade: 'relatório',
        quantidade: '[QUANTIDADE, ex.: 12]',
        valorUnitario: 'Incluso no ciclo',
        subtotal: 'R$ 0,00',
      },
      {
        item: '03',
        descricao: 'Reunião Executiva Bimestral para Acompanhamento do Plano de Ação Corretivo',
        unidade: 'reunião',
        quantidade: '[QUANTIDADE, ex.: 6]',
        valorUnitario: 'Incluso no ciclo',
        subtotal: 'R$ 0,00',
      },
    ],
    condicoesPagamento: [
      'Investimento total estimado: R$ [VALOR TOTAL, ex.: 14.400,00] ou [X] parcelas mensais de R$ [VALOR PARCELA, ex.: 1.200,00];',
      'Vencimento da primeira parcela em [X DIAS APÓS A PRIMEIRA VISTORIA] e as demais nos meses subsequentes;',
      'Forma de pagamento: Boleto bancário ou transferência via PIX [CHAVE PIX DA CONTRATADA];',
      'Nota fiscal de serviços eletrônica emitida mensalmente após a conclusão de cada etapa.',
    ],
    validadeProposta:
      'Esta proposta tem validade de [XX DIAS, ex.: 15 dias] a contar de sua data de emissão.',
    obrigacoesPartes: {
      contratante: [
        'Garantir livre acesso da equipe técnica da CONTRATADA às dependências da unidade fabril/operacional;',
        'Designar um profissional de referência (Técnico de Segurança, RH ou Engenharia) para acompanhamento das vistorias;',
        'Fornecer informações fidedignas sobre layout, máquinas em operação e número de colaboradores por setor.',
      ],
      contratada: [
        'Executar os serviços com rigor técnico e observância estrita às normas regulamentadoras do MTE e ABNT;',
        'Utilizar profissionais devidamente habilitados, uniformizados e portando todos os EPIs necessários;',
        'Respeitar as normas internas de segurança, integridade patrimonial e sigilo das informações do CLIENTE.',
      ],
    },
    disposicoesGerais: [
      'Eventuais alterações de escopo, inclusão de novas unidades territoriais ou exigências periciais extraordinárias serão objeto de termo aditivo;',
      'Fica eleito o Foro da Comarca de [CIDADE/UF DA CONTRATADA] para dirimir quaisquer dúvidas decorrentes desta proposta.',
    ],
  },
  {
    id: 'laudo-tecnico-nr12',
    nome: 'Proposta de Elaboração de Laudo Técnico (LT) NR-12',
    categoria: 'Engenharia Mecânica & Segurança em Máquinas',
    descricaoCurta:
      'Apreciação de riscos (HRN / ISO 12100), inventário de máquinas e equipamentos, diagnóstico dos sistemas de proteção e ART registrada no CREA.',
    iconeId: 'cog',
    tempoEstimado: '15 a 30 dias úteis',
    nrReferencia: 'NR-12 (Segurança no Trabalho em Máquinas e Equipamentos) e NBR ISO 12100',
    identificacao: {
      contratada:
        'LABORA vistorias — Engenharia Mecânica e de Segurança do Trabalho\nCNPJ: [CNPJ DA CONTRATADA] | Registro CREA: [Nº REGISTRO CREA]\nResponsável Técnico: Eng. [NOME DO ENGENHEIRO MECÂNICO/SEGURANÇA] — CREA [Nº CREA/UF]\nEndereço: [ENDEREÇO DA CONTRATADA] | Contato: [TELEFONE/E-MAIL]',
      contratante:
        'Razão Social: [NOME DO CLIENTE / RAZÃO SOCIAL]\nCNPJ: [CNPJ DO CLIENTE] | Inscrição Estadual: [INSCRIÇÃO ESTADUAL]\nEndereço do Parque Fabril: [ENDEREÇO DA UNIDADE/PARQUE INDUSTRIAL]\nContato Responsável: [NOME DO ENGENHEIRO OU GERENTE INDUSTRIAL] — [E-MAIL / TELEFONE]',
      objetoResumo:
        'Elaboração de Inventário Técnico, Apreciação de Riscos (NBR ISO 12100 / HRN) e Laudo Técnico de Conformidade com a NR-12 para o parque de máquinas e equipamentos da CONTRATANTE, com emissão de ART no CREA.',
    },
    apresentacao:
      'A NR-12 exige que todas as empresas mantenham atualizados o inventário de máquinas, a apreciação de riscos das zonas perigosas e a comprovação da eficácia das proteções mecânicas e elétricas de segurança. A LABORA vistorias oferece laudo técnico detalhado e com fundamentação de engenharia para resguardar a integridade física dos operadores e a conformidade legal da empresa.',
    escopo: [
      'Levantamento físico e cadastramento de inventário do maquinário (marca, modelo, nº de série, capacidade, ano, localização e função);',
      'Identificação dos perigos e análise detalhada dos riscos segundo a metodologia HRN (Hazard Rating Number) e NBR ISO 12100;',
      'Verificação da conformidade dos sistemas de partida, parada, acionamento bimanual e circuitos de parada de emergência (categoria de segurança conforme NBR ISO 13849-1);',
      'Inspeção minuciosa das proteções fixas e móveis intertravadas com sensores de segurança;',
      'Avaliação dos dispositivos de sinalização, manuais de operação e procedimentos seguros de trabalho;',
      'Elaboração de Memorial Fotográfico e parecer conclusivo individualizado por máquina analisada;',
      'Recomendações técnicas detalhadas para adequação física, elétrica e pneumática das não conformidades identificadas;',
      'Emissão e registro de Anotação de Responsabilidade Técnica (ART) junto ao CREA competente.',
    ],
    metodologia: [
      {
        etapa: 'Etapa 1 — Inventário e Coleta de Campo',
        descricao:
          'Inspeção in loco por Engenheiro Mecânico/Segurança para coleta de dados técnicos, registros fotográficos e teste funcional dos dispositivos de segurança.',
      },
      {
        etapa: 'Etapa 2 — Modelagem e Análise de Risco',
        descricao:
          'Determinação do índice HRN atual de cada equipamento, classificação do nível de risco e categorização dos circuitos de segurança requeridos.',
      },
      {
        etapa: 'Etapa 3 — Recomendações e Plano de Ação',
        descricao:
          'Estruturação de projetos conceituais de proteção física e especificação técnica dos componentes de segurança a serem instalados.',
      },
      {
        etapa: 'Etapa 4 — Emissão do Laudo e ART',
        descricao:
          'Entrega formal do caderno do Laudo Técnico NR-12 encadernado/digital acompanhado do comprovante de pagamento da ART no CREA.',
      },
    ],
    itensNaoInclusos: [
      'Projetos executivos detalhados de fabricação mecânica ou diagramas elétricos unifilares de reforma;',
      'Fornecimento de materiais, peças de reposição, chaves de segurança, relés, barreiras ópticas ou mão de obra de serralheria/automação;',
      'Treinamentos de capacitação operacional específicos da NR-12 (disponíveis sob cotação avulsa).',
    ],
    prazoExecucao:
      'Início das coletas em campo em até [X DIAS ÚTEIS] após a aprovação formal da proposta. Entrega final do Laudo Técnico com ART em [XX DIAS ÚTEIS, ex.: 20 dias úteis].',
    itensInvestimento: [
      {
        item: '01',
        descricao:
          'Inspeção Técnica de Campo, Inventário e Apreciação de Riscos NR-12 (NBR ISO 12100 / HRN)',
        unidade: 'máquina',
        quantidade: '[QUANTIDADE DE MÁQUINAS, ex.: 15]',
        valorUnitario: 'R$ [VALOR UNITÁRIO, ex.: 450,00]',
        subtotal: 'R$ [SUBTOTAL, ex.: 6.750,00]',
      },
      {
        item: '02',
        descricao:
          'Consolidação do Laudo Técnico NR-12, Pareceres de Segurança e Plano de Adequações',
        unidade: 'laudo',
        quantidade: '01',
        valorUnitario: 'R$ [VALOR UNITÁRIO, ex.: 1.800,00]',
        subtotal: 'R$ [SUBTOTAL, ex.: 1.800,00]',
      },
      {
        item: '03',
        descricao:
          'Emissão e Registro de Anotação de Responsabilidade Técnica (ART/CREA) com recolhimento de taxa',
        unidade: 'guia',
        quantidade: '01',
        valorUnitario: 'Incluso no escopo',
        subtotal: 'R$ 0,00',
      },
    ],
    condicoesPagamento: [
      'Valor total da proposta: R$ [VALOR TOTAL, ex.: 8.550,00];',
      'Condição sugerida: 40% de entrada na assinatura do contrato + 30% na finalização das coletas de campo + 30% na entrega do laudo final e ART;',
      'Forma de pagamento: Transferência bancária ou PIX [CHAVE PIX DA CONTRATADA];',
      'Emissão da respectiva Nota Fiscal de Serviços Técnicos.',
    ],
    validadeProposta:
      'Esta proposta comercial possui validade de [XX DIAS, ex.: 20 dias] a contar desta data.',
    obrigacoesPartes: {
      contratante: [
        'Disponibilizar o maquinário para inspeção e testes com os operadores responsáveis presentes durante a visita;',
        'Fornecer manuais, diagramas elétricos e memoriais descritivos existentes das máquinas;',
        'Garantir isolamento das áreas no momento dos ensaios de segurança se necessário.',
      ],
      contratada: [
        'Emitir parecer técnico estritamente baseado nas premissas das normas ABNT e NR-12;',
        'Manter ART regularizada no conselho de classe de engenharia com profissional devidamente registrado;',
        'Prestar esclarecimentos e assessorar a contratante na interpretação técnica dos achados.',
      ],
    },
    disposicoesGerais: [
      'Caso durante a inspeção sejam identificadas máquinas adicionais não descritas no orçamento original, as mesmas serão faturadas pelo valor unitário contratado;',
      'Fica eleito o Foro de [CIDADE/UF DA CONTRATADA] para resolução de eventuais controvérsias.',
    ],
  },
  {
    id: 'consultoria-assessoria-mensal-sst',
    nome: 'Proposta de Consultoria em SST / Assessoria Mensal',
    categoria: 'Assessoria Continuada & Gestão SST',
    descricaoCurta:
      'Retainer mensal com dedicação técnica continuada, visitas e vistorias programadas, apoio à CIPA/CIPATR, gestão de documentos e suporte em fiscalizações.',
    iconeId: 'shield-check',
    tempoEstimado: 'Contrato de 12 meses renováveis',
    nrReferencia: 'NR-01, NR-04, NR-05, NR-07, NR-09 e eSocial SST',
    identificacao: {
      contratada:
        'LABORA vistorias — Gestão Estratégica em Engenharia e Segurança do Trabalho\nCNPJ: [CNPJ DA CONTRATADA] | Registro Profissional: [Nº REGISTRO]\nEndereço: [ENDEREÇO DA CONTRATADA] | Contato: [TELEFONE/E-MAIL]',
      contratante:
        'Razão Social: [NOME DO CLIENTE / RAZÃO SOCIAL]\nCNPJ: [CNPJ DO CLIENTE] | Grau de Risco: [GRAU DE RISCO, ex.: 2 ou 3] | CNAE: [CNAE PRINCIPAL]\nEndereço da Sede: [ENDEREÇO DA EMPRESA CLIENTE]\nGestor do Contrato: [NOME DO DIRETOR/GERENTE DE RH] — [CONTATO]',
      objetoResumo:
        'Contratação de assessoria e consultoria técnica continuada em Segurança e Saúde no Trabalho (SST), na modalidade de retainer mensal (mensalidade fixa), compreendendo visitas de auditoria periódica, gestão de documentos, suporte a fiscalizações e alinhamento do eSocial.',
    },
    apresentacao:
      'A terceirização da inteligência de SST permite à CONTRATANTE reduzir custos com equipe interna enquanto eleva o padrão de conformidade e prontidão fiscal. A LABORA vistorias atua como o braço técnico da sua empresa, orientando decisões, realizando vistorias preventivas e mantendo a empresa protegida contra passivos trabalhistas.',
    escopo: [
      'Disponibilização de suporte técnico remoto ilimitado (WhatsApp, telefone e e-mail) para dúvidas da diretoria, RH e supervisores;',
      'Realização de [X VISTORIAS MENSAIS INCLUSAS, ex.: 2 visitas técnicas mensais de vistoria preventiva] com elaboração de relatório sumário de recomendações;',
      'Acompanhamento e suporte técnico na constituição, processo eleitoral, posse e reuniões ordinárias da CIPA (NR-05);',
      'Auditoria contínua da entrega, higienização e ficha de controle de Equipamentos de Proteção Individual — EPIs (NR-06);',
      'Apoio técnico no controle dos eventos de SST no Sistema eSocial (S-2210, S-2220 e S-2240) em articulação com a contabilidade/RH;',
      'Assessoria imediata em caso de notificação ou fiscalização presencial por Auditores Fiscais do Trabalho;',
      'Investigação técnica e emissão de laudo analítico em ocorrências de acidentes de trabalho ou quase-acidentes;',
      'Emissão de Pareceres Técnicos pontuais para dirimir dúvidas relativas a adicionais de insalubridade e periculosidade.',
    ],
    metodologia: [
      {
        etapa: 'Módulo 1 — Diagnóstico Inicial (Kick-off)',
        descricao:
          'Mapeamento completo do passivo existente, conferência da validade dos laudos (PGR, PCMSO, LTCAT) e cronograma das visitas do ano.',
      },
      {
        etapa: 'Módulo 2 — Rotina de Vistorias e Monitoramento',
        descricao:
          'Execução das visitas presenciais quinzenais/mensais, com checklist padronizado LABORA e registro imediato de oportunidades de melhoria.',
      },
      {
        etapa: 'Módulo 3 — Suporte Consultivo Contínuo',
        descricao:
          'Plantão técnico para validação de ordens de serviço, integração de novos terceiros, permissões de trabalho (PT) e demandas urgentes.',
      },
      {
        etapa: 'Módulo 4 — Relatório Gerencial Trimestral (KPIs)',
        descricao:
          'Apresentação de indicadores de redução de riscos, percentual de atendimento aos itens de vistoria e índice de segurança do trabalho.',
      },
    ],
    itensNaoInclusos: [
      'Exames médicos clínicos ocupacionais e exames complementares laboratoriais/gráficos do PCMSO;',
      'Elaboração de programas de grande porte pontuais com medições químicas/ruído dosimetrado contínuo quando não expressamente inclusos na mensalidade;',
      'Honorários para atuação como Perito Assistente Técnico em processos judiciais trabalhistas (honorários periciais contratados à parte com desconto de parceiro).',
    ],
    prazoExecucao:
      'Contrato de prestação continuada com prazo mínimo de [XX MESES, ex.: 12 meses], prorrogável automaticamente por iguais períodos mediante acordo entre as partes.',
    itensInvestimento: [
      {
        item: '01',
        descricao:
          'Assessoria Mensal em SST (com até [X] visitas presenciais mensais de vistoria e suporte remoto contínuo)',
        unidade: 'mês',
        quantidade: '[Nº DE MESES, ex.: 12]',
        valorUnitario: 'R$ [MENSALIDADE, ex.: 1.850,00]',
        subtotal: 'R$ [VALOR ANUAL TOTAL, ex.: 22.200,00]',
      },
      {
        item: '02',
        descricao: 'Diagnóstico Inicial de Conformidade Legal e Alinhamento do Inventário de SST',
        unidade: 'serviço',
        quantidade: '01',
        valorUnitario: 'Bonificado na contratação anual',
        subtotal: 'R$ 0,00',
      },
    ],
    condicoesPagamento: [
      'Mensalidade no valor fixo de R$ [VALOR MENSAL, ex.: 1.850,00];',
      'Vencimento todo dia [DIA DO MÊS, ex.: dia 10] de cada mês subsequente ao serviço prestado;',
      'Pagamento por boleto bancário faturado ou débito programado via PIX;',
      'Reajuste anual pelo índice oficial IPCA/IBGE acumulado.',
    ],
    validadeProposta:
      'Condições válidas para fechamento em até [XX DIAS, ex.: 15 dias] da data desta apresentação.',
    obrigacoesPartes: {
      contratante: [
        'Efetuar pontualmente os pagamentos mensais acordados;',
        'Notificar a CONTRATADA com brevidade sobre quaisquer incidentes, fiscalizações ou acidentes na empresa;',
        'Implementar as medidas de proteção coletiva e recomendações preventivas apontadas pela assessoria.',
      ],
      contratada: [
        'Manter canal de comunicação ágil e prestar suporte técnico com presteza e embasamento nas normas;',
        'Cumprir com assiduidade o calendário de visitas e emitir os relatórios nos prazos acordados;',
        'Manter rigoroso sigilo quanto a dados industriais, cadastrais e de faturamento da CONTRATANTE.',
      ],
    },
    disposicoesGerais: [
      'O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio formal e por escrito de 30 (trinta) dias;',
      'Foro de eleição: Comarca de [CIDADE/UF DA CONTRATADA].',
    ],
  },
  {
    id: 'pgr-mais-treinamentos',
    nome: 'Proposta de Programa de Gerenciamento de Riscos (PGR) + Treinamentos',
    categoria: 'Programas Legais & Capacitação',
    descricaoCurta:
      'Elaboração completa do PGR (NR-01) com Inventário de Riscos Ocupacionais, Plano de Ação detalhado e pacote de treinamentos obrigatórios por NR.',
    iconeId: 'hard-hat',
    tempoEstimado: '30 dias úteis para entrega do PGR + cronograma de cursos',
    nrReferencia: 'NR-01 (Disposições Gerais e GRO/PGR), NR-05, NR-06, NR-10 e NR-35',
    identificacao: {
      contratada:
        'LABORA vistorias — Engenharia de Segurança e Medicina Ocupacional Integrada\nCNPJ: [CNPJ DA CONTRATADA] | Registro CREA: [Nº REGISTRO CREA]\nEndereço: [ENDEREÇO DA CONTRATADA] | Contato: [TELEFONE/E-MAIL]',
      contratante:
        'Razão Social: [NOME DO CLIENTE / RAZÃO SOCIAL]\nCNPJ: [CNPJ DO CLIENTE] | Grau de Risco: [GRAU DE RISCO] | Nº de Colaboradores: [Nº COLABORADORES, ex.: 45]\nEndereço da Unidade: [ENDEREÇO DA EMPRESA]\nInterlocutor: [NOME DO RESPONSÁVEL DO CLIENTE] — [CARGO / CONTATO]',
      objetoResumo:
        'Elaboração técnica do Programa de Gerenciamento de Riscos (PGR) em atendimento às diretrizes do Gerenciamento de Riscos Ocupacionais (GRO) da NR-01, acompanhado de pacote corporativo de treinamentos obrigatórios de segurança do trabalho para os colaboradores da CONTRATANTE.',
    },
    apresentacao:
      'A implantação do PGR não é apenas uma obrigação legal passível de autuação pela NR-28: é a espinha dorsal de toda a segurança do trabalho na sua empresa. Combinamos o desenvolvimento documental de alta qualidade técnica com a capacitação prática dos seus colaboradores, assegurando conformidade perante os órgãos de fiscalização e o eSocial.',
    escopo: [
      'Levantamento preliminar de perigos e visita técnica in loco para reconhecimento dos ambientes laborais;',
      'Avaliação dos riscos ocupacionais físicos, químicos, biológicos, ergonômicos e de acidentes por Grupo Homogêneo de Exposição (GHE);',
      'Estruturação da Matriz de Risco Ocupacional (Probabilidade × Severidade);',
      'Elaboração do Inventário de Riscos Ocupacionais conforme exigências explícitas da NR-01;',
      'Desenvolvimento do Plano de Ação anual estruturado com medidas preventivas, responsáveis e prazos de implementação;',
      'Adequação das informações para posterior envio dos eventos S-2240 (Condições Ambientais do Trabalho) ao eSocial;',
      'Realização de Treinamento de Integração em Segurança do Trabalho (NR-01) para os colaboradores;',
      'Realização de Treinamento e Instrução de Uso e Conservação de EPI (NR-06);',
      'Realização de Treinamento para Designado ou Membros da CIPA (NR-05) com emissão de certificados individuais.',
    ],
    metodologia: [
      {
        etapa: 'Etapa 1 — Vistoria Técnica e Mapeamento de GHEs',
        descricao:
          'Inspeção nos setores produtivos e administrativos para catalogação de tarefas, máquinas, ferramentas e agentes nocivos presentes.',
      },
      {
        etapa: 'Etapa 2 — Elaboração Documental do PGR',
        descricao:
          'Cálculo das matrizes de risco, redação técnica das medidas de controle existentes e propostas no Inventário e Plano de Ação.',
      },
      {
        etapa: 'Etapa 3 — Realização dos Módulos de Treinamento',
        descricao:
          'Ministração presencial (ou semipresencial autorizada) dos treinamentos normativos com material didático, lista de presença e avaliação de eficácia.',
      },
      {
        etapa: 'Etapa 4 — Emissão dos Certificados e Protocolo da ART',
        descricao:
          'Liberação do PGR assinado pelo Engenheiro de Segurança com ART quitada e certificados dos trabalhadores capacitados.',
      },
    ],
    itensNaoInclusos: [
      'Avaliações quantitativas de vibração de corpo inteiro/mãos e braços (VCI/VMB) e agentes químicos raros que demandem análise laboratorial cromatográfica externa;',
      'Treinamentos não discriminados na tabela de investimento desta proposta (ex.: NR-10 SEP, NR-33 Espaço Confinado e NR-35 Trabalho em Altura, passíveis de inclusão em aditivo);',
      'Fornecimento de lanches ou alimentação para os participantes dos treinamentos.',
    ],
    prazoExecucao:
      'Elaboração e entrega da via digital do PGR em até [XX DIAS ÚTEIS, ex.: 20 dias úteis] após a conclusão da vistoria de reconhecimento. Cronograma de treinamentos a ser alinhado com o RH da CONTRATANTE no decorrer de [XX DIAS].',
    itensInvestimento: [
      {
        item: '01',
        descricao:
          'Elaboração do Programa de Gerenciamento de Riscos — PGR (Inventário de Riscos + Plano de Ação NR-01) com ART',
        unidade: 'programa',
        quantidade: '01',
        valorUnitario: 'R$ [VALOR UNITÁRIO, ex.: 2.500,00]',
        subtotal: 'R$ [SUBTOTAL, ex.: 2.500,00]',
      },
      {
        item: '02',
        descricao:
          'Treinamento Normativo NR-01 (Disposições Gerais / Integração) e NR-06 (EPI) — até [X] participantes',
        unidade: 'turma',
        quantidade: '[Nº TURMAS, ex.: 02]',
        valorUnitario: 'R$ [VALOR UNITÁRIO, ex.: 650,00]',
        subtotal: 'R$ [SUBTOTAL, ex.: 1.300,00]',
      },
      {
        item: '03',
        descricao:
          'Treinamento para Designado / Membros da CIPA conforme NR-05 (Carga horária compatível com o grau de risco)',
        unidade: 'curso',
        quantidade: '01',
        valorUnitario: 'R$ [VALOR UNITÁRIO, ex.: 800,00]',
        subtotal: 'R$ [SUBTOTAL, ex.: 800,00]',
      },
      {
        item: '04',
        descricao: 'Emissão e Registro de ART no CREA referente à autoria do PGR',
        unidade: 'guia',
        quantidade: '01',
        valorUnitario: 'Incluso no pacote',
        subtotal: 'R$ 0,00',
      },
    ],
    condicoesPagamento: [
      'Investimento total do pacote (PGR + Treinamentos): R$ [VALOR TOTAL, ex.: 4.600,00];',
      'Condição de parcelamento: [X] parcelas de R$ [VALOR PARCELA, ex.: 2.300,00] (sendo 50% de sinal e 50% após a entrega dos certificados e laudo);',
      'Forma de pagamento: Boleto bancário ou PIX [CHAVE PIX DA CONTRATADA];',
      'Emissão das respectivas Notas Fiscais de Prestação de Serviços.',
    ],
    validadeProposta:
      'Proposta com condições comerciais válidas por [XX DIAS, ex.: 15 dias] da data de entrega.',
    obrigacoesPartes: {
      contratante: [
        'Disponibilizar sala ou espaço adequado com recursos audiovisuais para aplicação dos treinamentos teóricos;',
        'Garantir a liberação dos colaboradores convocados para cumprimento integral da carga horária normatizada;',
        'Fornecer relação atualizada com nome completo, CPF, cargo e função de todos os empregados.',
      ],
      contratada: [
        'Disponibilizar instrutor qualificado ou legalmente habilitado conforme preconiza a NR-01;',
        'Fornecer material de apoio, apostilas e certificados válidos em todo o território nacional;',
        'Responder tecnicamente perante o Ministério do Trabalho pelo conteúdo elaborado no PGR.',
      ],
    },
    disposicoesGerais: [
      'Turmas adicionais ou colaboradores que não comparecerem poderão realizar reposição mediante taxa adicional;',
      'Eleição do Foro da Comarca de [CIDADE/UF DA CONTRATADA] para quaisquer demandas oriundas desta proposta.',
    ],
  },
]
