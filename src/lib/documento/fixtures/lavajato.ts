import type { CardRisco, Documento } from '../modelo'

const MATRIZ_5 = [
  [3, 4, 5, 5, 5],
  [2, 3, 4, 5, 5],
  [2, 2, 3, 4, 5],
  [1, 2, 3, 3, 4],
  [1, 1, 2, 2, 3],
]

const ruido: CardRisco = {
  categoria: 'fisico',
  nome: 'Ruído contínuo ou intermitente',
  referencias: ['NR-15, Anexo 1', 'eSocial 02.01.001'],
  expostos: '1 (Acabador de lavagem, GHE 01)',
  via: 'aérea',
  nivel: { rotulo: 'Tolerável', pontos: 6 },
  medicao: {
    valor: '73,1 dB(A)',
    detalhe: 'dose de 25 %',
    limiteTexto: '85 dB(A)',
    fracao: 0.72,
    marcas: [
      { rotulo: 'NA 80', fracao: 0.78 },
      { rotulo: 'LT 85', fracao: 0.83 },
    ],
  },
  exposicao: { titulo: 'Habitual e intermitente', detalhe: '300 min/jornada' },
  avaliadoPor: {
    titulo: 'Dosimetria, NHO-01',
    detalhe: '1 amostra, 02/10/2026, Instrutherm DOS-600, calibração até 03/2027',
  },
  fonte:
    'O aspirador industrial e a politriz geram ruído durante o acabamento. A lavadora de alta pressão, operada no mesmo galpão, contribui como ruído de fundo.',
  danos:
    'Perda auditiva induzida por ruído, zumbido, dor de cabeça e irritabilidade. A perda auditiva se instala devagar e não regride.',
  medidas: [
    { tipo: 'EPC', texto: 'Lavadora de alta pressão em baia separada por parede de alvenaria' },
    { tipo: 'ADM', texto: 'Rodízio com a função de lavador a cada 2 horas' },
    {
      tipo: 'EPI',
      texto: 'Protetor auricular de inserção em silicone, CA 5745, válido até 03/2028',
    },
  ],
  avaliacao: {
    probabilidade: {
      nivel: 3,
      nome: 'Possível',
      texto: 'Exposição habitual, medida abaixo do nível de ação, controles existentes e eficazes.',
    },
    severidade: {
      nivel: 2,
      nome: 'Baixa',
      texto: 'No nível medido, o dano esperado é desconforto, sem lesão permanente.',
    },
    pontos: 6,
    categoria: 'Tolerável',
    acao: 'Manter as medidas e monitorar',
    prazoDias: null,
    matriz: { dimensao: 5, niveis: MATRIZ_5, p: 3, s: 2, pontos: 6 },
  },
  leitura:
    'O nível medido está abaixo do nível de ação. As medidas atuais são suficientes. A recomendação é repetir a medição em 12 meses e manter o rodízio.',
}

const postura: CardRisco = {
  categoria: 'ergonomico',
  nome: 'Postura em pé por longos períodos',
  referencias: ['NR-17', 'eSocial 05.01.009'],
  expostos: '1 (Acabador de lavagem, GHE 01)',
  nivel: { rotulo: 'Moderado', pontos: 9 },
  exposicao: { titulo: 'Contínua e permanente', detalhe: 'toda a jornada, sem assento disponível' },
  avaliadoPor: {
    titulo: 'Análise ergonômica preliminar (AEP)',
    detalhe: 'NR-17, item 17.3; observação e entrevista',
  },
  aet: { titulo: 'Não exigida nesta data', detalhe: 'reavaliar se houver queixa ou afastamento' },
  fonte:
    'O acabamento é feito de pé ao redor do veículo, com inclinação do tronco para limpar o interior e as rodas.',
  danos:
    'Dor lombar, fadiga muscular, varizes e desconforto nas articulações dos joelhos e tornozelos.',
  medidas: [
    { tipo: 'ADM', texto: 'Pausas de 10 minutos a cada 2 horas' },
    { tipo: 'FALTA', texto: 'Banco semi-sentado; tapete antifadiga' },
  ],
  avaliacao: {
    probabilidade: {
      nivel: 3,
      nome: 'Possível',
      texto: 'Exposição contínua, com pausa como única medida.',
    },
    severidade: {
      nivel: 3,
      nome: 'Moderada',
      texto: 'Dor lombar e varizes podem gerar afastamento, com recuperação.',
    },
    pontos: 9,
    categoria: 'Moderado',
    acao: 'Reduzir o risco em até 180 dias',
    prazoDias: 180,
    matriz: { dimensao: 5, niveis: MATRIZ_5, p: 3, s: 3, pontos: 9 },
  },
  leitura:
    'A pausa existente reduz o problema, mas não o resolve. A ação correspondente está no plano de ação.',
}

export const documentoLavajato: Documento = {
  tipo: 'pgr',
  sigla: 'PGR',
  titulo: 'PGR',
  versao: 1,
  marca: {
    organizacaoNome: 'Labora',
    razaoSocial: 'Labora Engenharia e SST',
    cnpj: '54.106.204/0001-30',
    corPrimaria: '#6C8845',
    corSecundaria: '#202720',
  },
  capa: {
    sigla: 'PGR',
    titulo: 'Programa de Gerenciamento de Riscos',
    subtitulo: 'Gerenciamento de Riscos Ocupacionais · NR-1, capítulo 1.5',
    clienteNome: 'Lava-Jato Horizonte LTDA',
    clienteDetalhe: 'CNPJ 12.345.678/0001-90 · Teresina-PI',
    cartoes: [
      { rotulo: 'Versão', valor: '1' },
      { rotulo: 'Vigência', valor: '19/10/2026' },
      { rotulo: 'Revisar até', valor: '19/10/2028' },
      { rotulo: 'Trabalhadores', valor: '38' },
    ],
  },
  identificacao: [
    { rotulo: 'Empregador', valor: 'Lava-Jato Horizonte LTDA (grau de risco 2)' },
    { rotulo: 'CNPJ', valor: '12.345.678/0001-90' },
    { rotulo: 'Endereço', valor: 'Av. Exemplo, 100, Teresina-PI' },
    { rotulo: 'Autor', valor: 'Gilson Lopes · CREA-PI 1234567' },
  ],
  capitulos: [
    {
      id: 'c1',
      numero: '1',
      titulo: 'Introdução e escopo',
      blocos: [
        {
          tipo: 'paragrafo',
          runs: [
            { texto: 'Este Programa de Gerenciamento de Riscos da empresa ' },
            { texto: 'Lava-Jato Horizonte LTDA', negrito: true },
            { texto: ' integra o Gerenciamento de Riscos Ocupacionais exigido pela NR-1.' },
          ],
        },
        {
          tipo: 'lista',
          itens: [
            [{ texto: 'eliminar os perigos quando possível;' }],
            [{ texto: 'manter o inventário e o plano de ação atualizados.' }],
          ],
        },
      ],
    },
    {
      id: 'c20',
      numero: '20',
      titulo: 'Ambientes, funções e inventário de riscos',
      blocos: [
        { tipo: 'titulo', nivel: 3, texto: '20.1 Ambientes de trabalho' },
        {
          tipo: 'ambientes',
          itens: [
            {
              nome: 'Galpão de lavagem',
              subtitulo: 'Ambiente 01',
              processo:
                'Recepção, lavagem externa com alta pressão, lavagem de motor e chassi, secagem e acabamento. Em média 22 veículos por dia.',
              metricas: [
                { rotulo: 'Área', valor: '240 m²' },
                { rotulo: 'Pé-direito', valor: '5,5 m' },
                { rotulo: 'Trabalhadores', valor: '9' },
                { rotulo: 'Funções', valor: '3' },
              ],
              construcao:
                'cobertura: telha metálica sem forro; piso: concreto com caneletas de drenagem',
              iluminacaoVentilacao:
                'iluminação: natural pelas laterais e LED à noite; ventilação: natural cruzada, sem exaustão mecânica',
              equipamentos:
                'Duas lavadoras de alta pressão, aspirador industrial, duas politrizes, compressor de 20 pés',
              funcoes: 'Lavador (alta pressão), Acabador de lavagem, Auxiliar de pátio',
              fontesPerigo:
                'Ruído das lavadoras e do compressor; névoa de desengraxante alcalino; piso molhado; movimentação de veículos',
            },
            {
              nome: 'Sala administrativa',
              subtitulo: 'Ambiente 02',
              processo: 'Atendimento ao cliente, caixa, agendamento e controle financeiro.',
              metricas: [
                { rotulo: 'Área', valor: '28 m²' },
                { rotulo: 'Pé-direito', valor: '2,8 m' },
                { rotulo: 'Trabalhadores', valor: '2' },
                { rotulo: 'Funções', valor: '2' },
              ],
              construcao: 'forro de PVC; piso: cerâmico',
              equipamentos: 'Dois computadores, impressora, terminal de cartão',
              funcoes: 'Atendente, Auxiliar administrativo',
              fontesPerigo: 'Postura sentada prolongada; atendimento a público',
            },
          ],
        },
        { tipo: 'titulo', nivel: 3, texto: '20.2 Funções e grupos de exposição' },
        {
          tipo: 'funcoes',
          grupos: [
            {
              titulo: 'GHE 01 – Lavagem e acabamento',
              detalhe:
                'Galpão de lavagem · 7 trabalhadores · critério: mesma área, mesmas máquinas e mesmas fontes de ruído e de produtos químicos',
              funcoes: [
                {
                  nome: 'Lavador (alta pressão)',
                  cbo: '5199-35',
                  expostos: '4',
                  jornada: '44 h/semana, 8 h/dia',
                  ambiente: 'Galpão de lavagem',
                  atividades:
                    'Recebe o veículo no pátio, aplica desengraxante alcalino diluído com pulverizador e lava a carroceria, as rodas e o chassi com lavadora de alta pressão. Passa cerca de seis horas da jornada com a lavadora em funcionamento.',
                },
                {
                  nome: 'Acabador de lavagem',
                  cbo: '5199-35',
                  expostos: '1',
                  jornada: '44 h/semana, 8 h/dia',
                  ambiente: 'Galpão de lavagem',
                  atividades:
                    'Finaliza e detalha o veículo depois da lavagem. Aspira estofados e carpetes, limpa painéis e vidros internos com produtos de limpeza, seca a carroceria e aplica cera com politriz manual. Trabalha em pé durante toda a jornada.',
                },
              ],
            },
            {
              titulo: 'GHE 02 – Administrativo',
              detalhe:
                'Sala administrativa · 2 trabalhadores · critério: mesma sala e mesmas tarefas',
              funcoes: [
                {
                  nome: 'Atendente',
                  cbo: '4221-05',
                  expostos: '1',
                  jornada: '44 h/semana, 8 h/dia',
                  ambiente: 'Sala administrativa',
                  atividades:
                    'Recebe os clientes, registra o serviço no sistema, recebe pagamentos e agenda serviços por telefone.',
                },
              ],
            },
          ],
        },
        { tipo: 'titulo', nivel: 3, texto: '20.4 Inventário por função' },
        {
          tipo: 'inventario',
          fichas: [
            {
              nome: 'Acabador de lavagem',
              cbo: '5199-35',
              ghe: 'GHE 01 – Lavagem e acabamento',
              ambiente: 'Galpão de lavagem',
              levantamento: 'Levantamento em 02/10/2026 por Gilson Lopes, CREA-PI 1234567',
              expostos: '1 homem',
              jornada: '44 h/semana, 8 h/dia',
              atividades:
                'Finaliza e detalha o veículo depois da lavagem. Aspira estofados e carpetes, limpa painéis e vidros internos, seca a carroceria e aplica cera com politriz manual. Trabalha em pé durante toda a jornada.',
              comMedicao: 1,
              riscos: [ruido, postura],
            },
            {
              nome: 'Auxiliar administrativo',
              cbo: '4110-10',
              ghe: 'GHE 02 – Administrativo',
              ambiente: 'Sala administrativa',
              expostos: '1 mulher',
              comMedicao: 0,
              riscos: [],
            },
          ],
        },
      ],
    },
    {
      id: 'c12',
      numero: '12',
      titulo: 'Plano de ação',
      blocos: [
        {
          tipo: 'paragrafo',
          runs: [
            {
              texto:
                'O plano reúne as medidas de prevenção que ainda precisam ser adotadas, em ordem de prazo. Cada ação indica o risco e a função que a motivaram, o responsável e a situação (NR-1, item 1.5.5.2).',
            },
          ],
        },
        {
          tipo: 'plano',
          acoes: [
            {
              numero: '01',
              medida:
                'Instalar proteção fixa com intertravamento na zona de prensagem da prensa excêntrica.',
              detalhe:
                'Fornecedor homologado, com laudo de adequação à NR-12. Custo estimado: R$ 4.800,00',
              risco: 'Prensa sem proteção',
              funcao: 'Operador de prensa',
              nivel: 'Intolerável',
              responsavel: 'J. Lima',
              prazo: '26/10/2026',
              prazoRotulo: 'imediato',
              situacao: 'Em andamento',
            },
            {
              numero: '02',
              medida:
                'Proibir o uso da politriz e da lavadora sem protetor auricular, com ordem de serviço e supervisão diária.',
              risco: 'Ruído de 91,3 dB(A)',
              funcao: 'Lavador',
              nivel: 'Substancial',
              responsavel: 'A. Costa',
              prazo: '26/10/2026',
              prazoRotulo: 'imediato',
              situacao: 'Concluída',
            },
            {
              numero: '03',
              medida:
                'Fornecer tapete antifadiga e banco semi-sentado na área de acabamento e orientar o uso.',
              detalhe: 'Custo estimado: R$ 900,00',
              risco: 'Postura em pé',
              funcao: 'Acabador de lavagem',
              nivel: 'Moderado',
              responsavel: 'R. Melo',
              prazo: '02/04/2027',
              prazoRotulo: '180 dias',
              situacao: 'Pendente',
            },
          ],
        },
      ],
    },
  ],
  anexos: [
    {
      id: 'anexo-consolidado',
      numero: '',
      titulo: 'Tabela consolidada do inventário',
      blocos: [
        {
          tipo: 'tabela',
          cabecalho: [
            'Função',
            'Risco',
            'Categoria',
            'Exposição',
            'Resultado e limite',
            'P',
            'S',
            'Nível',
          ],
          linhas: [
            [
              'Acabador de lavagem (GHE 01 – Lavagem e acabamento)',
              'Ruído contínuo ou intermitente · eSocial 02.01.001',
              'Físico',
              'Habitual e intermitente',
              '73,1 dB(A) (limite 85 dB(A))',
              '3',
              '2',
              'Tolerável',
            ],
            [
              'Acabador de lavagem (GHE 01 – Lavagem e acabamento)',
              'Postura em pé por longos períodos · eSocial 05.01.009',
              'Ergonômico',
              'Contínua e permanente',
              '',
              '3',
              '3',
              'Moderado',
            ],
          ],
        },
      ],
    },
  ],
  assinatura: {
    nome: 'Gilson Lopes',
    registro: 'CREA-PI 1234567',
    confirmadaEm: '19/10/2026 14:32',
    link: 'https://labora-vistoria-efe63.goskip.app/verificar/8f2a1c3e',
    responsavelPlano: { nome: 'Maria Souza', cargo: 'gerente operacional' },
  },
  pendencias: [],
  rodapeOrganizacao: 'Labora Engenharia e SST · CNPJ 54.106.204/0001-30',
}
