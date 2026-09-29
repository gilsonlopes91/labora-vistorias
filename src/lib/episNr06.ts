/**
 * Catálogo e classificação de Equipamentos de Proteção Individual (EPI)
 * baseado na NR-06 (Anexo I — Lista de Equipamentos de Proteção Individual).
 *
 * Categorias oficiais A a I:
 * A – EPI PARA PROTEÇÃO DA CABEÇA
 * B – EPI PARA PROTEÇÃO DOS OLHOS E FACE
 * C – EPI PARA PROTEÇÃO AUDITIVA
 * D – EPI PARA PROTEÇÃO RESPIRATÓRIA
 * E – EPI PARA PROTEÇÃO DO TRONCO
 * F – EPI PARA PROTEÇÃO DOS MEMBROS SUPERIORES
 * G – EPI PARA PROTEÇÃO DOS MEMBROS INFERIORES
 * H – EPI PARA PROTEÇÃO DO CORPO INTEIRO
 * I – EPI PARA PROTEÇÃO CONTRA QUEDAS COM DIFERENÇA DE NÍVEL
 */

export interface ItemEpiNr06 {
  id: string
  nome: string
  descricao?: string
  palavrasChave?: string[]
}

export interface CategoriaEpiNr06 {
  codigo: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'
  titulo: string
  itens: ItemEpiNr06[]
}

export const CATEGORIAS_EPI_NR06: CategoriaEpiNr06[] = [
  {
    codigo: 'A',
    titulo: 'A – EPI PARA PROTEÇÃO DA CABEÇA',
    itens: [
      {
        id: 'a1_capacete_impacto',
        nome: 'Capacete para proteção contra impactos de objetos sobre o crânio',
        descricao: 'A.1 — Capacete de segurança classe A',
        palavrasChave: ['capacete', 'impacto', 'queda de objetos', 'crânio', 'obra'],
      },
      {
        id: 'a1_capacete_eletrico',
        nome: 'Capacete para proteção contra choques elétricos',
        descricao: 'A.1 — Capacete de segurança classe B dielétrico',
        palavrasChave: ['capacete', 'choque elétrico', 'eletricista', 'alta tensão', 'classe b'],
      },
      {
        id: 'a1_capacete_termico',
        nome: 'Capacete para proteção contra agentes térmicos',
        descricao: 'A.1 — Capacete para altas ou baixas temperaturas / calor radiante',
        palavrasChave: ['capacete', 'calor', 'fogo', 'agentes térmicos', 'fundição'],
      },
      {
        id: 'a2_capuz_termico',
        nome: 'Capuz ou balaclava contra agentes térmicos',
        descricao: 'A.2 — Capuz térmico para proteção do crânio e pescoço',
        palavrasChave: ['capuz', 'balaclava', 'calor', 'frio', 'soldador'],
      },
      {
        id: 'a2_capuz_quimico',
        nome: 'Capuz contra agentes químicos',
        descricao: 'A.2 — Capuz impermeável para proteção do crânio, face e pescoço',
        palavrasChave: ['capuz', 'químico', 'respingo', 'defensivo agrícola', 'ácido'],
      },
      {
        id: 'a2_capuz_abrasivo',
        nome: 'Capuz contra agentes abrasivos e escoriantes',
        descricao: 'A.2 — Capuz para jateamento e projeção de partículas',
        palavrasChave: ['capuz', 'jateamento', 'abrasivo', 'escoriante'],
      },
      {
        id: 'a2_capuz_umidade',
        nome: 'Capuz contra umidade proveniente de operações com água',
        descricao: 'A.2 — Capuz impermeável para lavagens e ambientes úmidos',
        palavrasChave: ['capuz', 'impermeável', 'umidade', 'água', 'lavagem'],
      },
    ],
  },
  {
    codigo: 'B',
    titulo: 'B – EPI PARA PROTEÇÃO DOS OLHOS E FACE',
    itens: [
      {
        id: 'b1_oculos_impacto',
        nome: 'Óculos de segurança contra impactos de partículas volantes',
        descricao: 'B.1 — Lentes incolores ou cinza contra impacto frontal e lateral',
        palavrasChave: ['óculos', 'lente', 'impacto', 'partículas volantes', 'esmeril'],
      },
      {
        id: 'b1_oculos_luminosidade',
        nome: 'Óculos de proteção contra luminosidade intensa',
        descricao: 'B.1 — Lentes escuras contra radiação solar ou claridade artificial intensa',
        palavrasChave: ['óculos', 'sol', 'luminosidade', 'lente escura', 'céu aberto'],
      },
      {
        id: 'b1_oculos_radiacao_uv_ir',
        nome: 'Óculos contra radiação ultravioleta (UV) e infravermelha (IR)',
        descricao: 'B.1 — Lentes com filtro para maçarico, oxicorte ou fornos',
        palavrasChave: ['óculos', 'uv', 'infravermelho', 'radiação', 'maçarico', 'solda'],
      },
      {
        id: 'b1_oculos_tela',
        nome: 'Óculos de tela para impactos de partículas volantes',
        descricao: 'B.1 — Óculos telado para atividades florestais ou cortes',
        palavrasChave: ['óculos', 'tela', 'florestal', 'motosserra'],
      },
      {
        id: 'b2_protetor_facial_impacto',
        nome: 'Protetor facial contra impactos de partículas volantes',
        descricao: 'B.2 — Visor de policarbonato para proteção total da face',
        palavrasChave: ['protetor facial', 'escudo', 'visor', 'policarbonato', 'face'],
      },
      {
        id: 'b2_protetor_facial_radiacao_termico',
        nome: 'Protetor facial contra radiação infravermelha e agentes térmicos',
        descricao: 'B.2 — Visor aluminizado ou verde escuro para fornos e fundição',
        palavrasChave: ['protetor facial', 'forno', 'fundição', 'térmico', 'aluminizado'],
      },
      {
        id: 'b2_protetor_facial_quimico',
        nome: 'Protetor facial contra respingos de produtos químicos',
        descricao: 'B.2 — Visor de ampla cobertura contra líquidos e soluções corrosivas',
        palavrasChave: ['protetor facial', 'químico', 'ácido', 'respingos', 'líquidos'],
      },
      {
        id: 'b3_mascara_solda',
        nome: 'Máscara de solda (passiva ou com escurecimento automático)',
        descricao: 'B.3 — Proteção dos olhos e face contra radiação, faíscas e calor de soldagem',
        palavrasChave: ['máscara de solda', 'escurecimento automático', 'eletrodo', 'mig', 'tig'],
      },
    ],
  },
  {
    codigo: 'C',
    titulo: 'C – EPI PARA PROTEÇÃO AUDITIVA',
    itens: [
      {
        id: 'c1_protetor_auricular_insercao',
        nome: 'Protetor auditivo de inserção (plug de silicone, espuma moldável ou copolímero)',
        descricao: 'C.1 — Plug pré-moldado ou moldável contra níveis de pressão sonora elevados',
        palavrasChave: ['protetor auricular', 'plug', 'inserção', 'silicone', 'espuma', 'ruído'],
      },
      {
        id: 'c1_protetor_auricular_concha',
        nome: 'Protetor auditivo circum-auricular (tipo concha / abafador)',
        descricao: 'C.1 — Abafador concha com almofadas externas para atenuação de ruído',
        palavrasChave: ['protetor auditivo', 'concha', 'abafador', 'circum-auricular', 'ruído'],
      },
      {
        id: 'c1_protetor_auricular_semiauricular',
        nome: 'Protetor auditivo semiauricular (com arco)',
        descricao: 'C.1 — Plug acoplado em arco plástico para colocação e retirada rápida',
        palavrasChave: ['protetor auditivo', 'arco', 'semiauricular', 'ruído'],
      },
      {
        id: 'c1_protetor_acoplavel_capacete',
        nome: 'Protetor auditivo tipo concha acoplável a capacete',
        descricao: 'C.1 — Conchas auditivas montadas nas fendas laterais do capacete',
        palavrasChave: ['abafador de capacete', 'concha acoplada', 'capacete', 'ruído'],
      },
    ],
  },
  {
    codigo: 'D',
    titulo: 'D – EPI PARA PROTEÇÃO RESPIRATÓRIA',
    itens: [
      {
        id: 'd1_respirador_pff1',
        nome: 'Peça semifacial filtrante PFF1 (poeiras e névoas)',
        descricao: 'D.1 — Máscara descartável PFF1 para poeiras incômodas e névoas',
        palavrasChave: ['respirador', 'máscara', 'pff1', 'poeira', 'névoa'],
      },
      {
        id: 'd1_respirador_pff2_n95',
        nome: 'Peça semifacial filtrante PFF2 / N95 (poeiras, névoas e fumos metálicos)',
        descricao:
          'D.1 — Respirador PFF2 / N95 contra fumos de solda, agentes biológicos e poeiras tóxicas',
        palavrasChave: ['respirador', 'pff2', 'n95', 'fumos metálicos', 'solda', 'biológico'],
      },
      {
        id: 'd1_respirador_pff3',
        nome: 'Peça semifacial filtrante PFF3 (alta eficiência: poeiras, fumos e radionuclídeos)',
        descricao:
          'D.1 — Respirador descartável de máxima retenção para particulados finos e asbestos',
        palavrasChave: ['respirador', 'pff3', 'sílica', 'asbesto', 'radionuclídeos'],
      },
      {
        id: 'd1_respirador_semifacial_cartuchos',
        nome: 'Respirador purificador semifacial com filtros trocáveis (químicos/combinados)',
        descricao:
          'D.1 — Peça semifacial elastomérica com cartuchos para vapores orgânicos, gases ácidos e partículas',
        palavrasChave: [
          'respirador semifacial',
          'cartucho',
          'vapores orgânicos',
          'gases ácidos',
          'filtro',
        ],
      },
      {
        id: 'd1_respirador_facial_inteira',
        nome: 'Respirador purificador facial inteira (full face) com filtros químicos ou combinados',
        descricao:
          'D.1 — Máscara facial inteira com visor acoplado e filtros para alta concentração',
        palavrasChave: ['facial inteira', 'full face', 'filtro químico', 'amônia', 'cloro'],
      },
      {
        id: 'd2_respirador_motorizado',
        nome: 'Respirador purificador de ar motorizado (PAPR)',
        descricao: 'D.2 — Sistema com motor insuflador e filtros para ambientes de alta carga',
        palavrasChave: ['respirador motorizado', 'papr', 'ar forçado', 'bateria'],
      },
      {
        id: 'd3_linha_ar_comprimido',
        nome: 'Respirador de adução de ar tipo linha de ar comprimido',
        descricao:
          'D.3 — Fornecimento de ar respirável contínuo por mangueira para jateamento ou pintura',
        palavrasChave: ['linha de ar', 'ar comprimido', 'jateamento', 'pintura em cabine'],
      },
      {
        id: 'd4_mascara_autonoma',
        nome: 'Respirador autônomo de circuito aberto (máscara autônoma / SCBA)',
        descricao: 'D.4 — Cilindro de ar comprimido para espaços confinados e atmosferas IPVS',
        palavrasChave: [
          'máscara autônoma',
          'scba',
          'cilindro',
          'espaço confinado',
          'ipvs',
          'bombeiro',
        ],
      },
      {
        id: 'd5_respirador_fuga',
        nome: 'Respirador de fuga (purificador ou autônomo)',
        descricao: 'D.5 — Equipamento compacto exclusivo para escape rápido em emergências',
        palavrasChave: ['respirador de fuga', 'escape', 'emergência', 'evacuação'],
      },
    ],
  },
  {
    codigo: 'E',
    titulo: 'E – EPI PARA PROTEÇÃO DO TRONCO',
    itens: [
      {
        id: 'e1_avental_raspa',
        nome: 'Avental de raspa de couro ou vaqueta (proteção contra agentes térmicos e fagulhas)',
        descricao: 'E.1 — Avental para soldador, corte a quente e caldeiraria',
        palavrasChave: ['avental', 'raspa', 'vaqueta', 'solda', 'fagulha', 'calor'],
      },
      {
        id: 'e1_avental_pvc_impermeavel',
        nome: 'Avental impermeável (PVC, silicone ou borracha) contra respingos químicos e água',
        descricao: 'E.1 — Avental para manipulação de produtos químicos, lavagem e frigoríficos',
        palavrasChave: ['avental pvc', 'impermeável', 'químico', 'água', 'lavagem'],
      },
      {
        id: 'e1_jaqueta_vestimenta_termica_frio',
        nome: 'Jaqueta / vestimenta térmica contra baixas temperaturas (câmara fria)',
        descricao:
          'E.1 — Blusão térmico com forro isolante para frigorífico e armazenamento refrigerado',
        palavrasChave: ['jaqueta térmica', 'câmara fria', 'frio', 'frigorífico', 'isolante'],
      },
      {
        id: 'e1_vestimenta_chama_arco_eletrico',
        nome: 'Vestimenta de proteção contra fogo repentino e arco elétrico (NR-10)',
        descricao: 'E.1 — Camisa/calça antichama com classificação de ATPV (cal/cm²)',
        palavrasChave: [
          'antichama',
          'arco elétrico',
          'nr-10',
          'fogo repentino',
          'eletricista',
          'atpv',
        ],
      },
      {
        id: 'e1_colete_refletivo',
        nome: 'Colete refletivo de alta visibilidade',
        descricao: 'E.1 — Colete com faixas retrorrefletivas para vias públicas, tráfego e pátios',
        palavrasChave: [
          'colete refletivo',
          'alta visibilidade',
          'faixa refletiva',
          'sinalização',
          'trânsito',
        ],
      },
      {
        id: 'e1_capa_chuva',
        nome: 'Capa de chuva / vestimenta contra umidade de precipitação pluviométrica',
        descricao: 'E.1 — Capa impermeável com capuz para trabalho em intempéries',
        palavrasChave: ['capa de chuva', 'impermeável', 'chuva', 'intempérie'],
      },
      {
        id: 'e1_vestimenta_radiacao_chumbo',
        nome: 'Avental plumbífero / vestimenta contra radiação ionizante (chumbo)',
        descricao: 'E.1 — Avental com proteção de chumbo para raio-X e radiografia',
        palavrasChave: ['avental chumbo', 'plumbífero', 'radiação ionizante', 'raio x'],
      },
      {
        id: 'e2_colete_balas',
        nome: 'Colete à prova de balas',
        descricao: 'E.2 — Proteção balística do tronco para vigilantes armados e escolta',
        palavrasChave: ['colete balístico', 'bala', 'tiro', 'vigilante', 'segurança'],
      },
    ],
  },
  {
    codigo: 'F',
    titulo: 'F – EPI PARA PROTEÇÃO DOS MEMBROS SUPERIORES',
    itens: [
      {
        id: 'f1_luva_raspa_vaqueta',
        nome: 'Luva de raspa ou vaqueta (agentes abrasivos, escoriantes e corte leve)',
        descricao: 'F.1 — Luva de couro para serviços pesados, carpintaria, carga e descarga',
        palavrasChave: ['luva de raspa', 'vaqueta', 'abrasivo', 'carga', 'mecânico'],
      },
      {
        id: 'f1_luva_nitrilica_neoprene_latex',
        nome: 'Luva impermeável (nitrílica, neoprene ou látex) contra agentes químicos e biológicos',
        descricao:
          'F.1 — Luva para solventes, tintas, óleos, produtos de limpeza e contato biológico',
        palavrasChave: ['luva nitrílica', 'látex', 'neoprene', 'químico', 'solvente', 'óleo'],
      },
      {
        id: 'f1_luva_anti_corte',
        nome: 'Luva de malha de aço ou fios resistentes a corte (Kevlar/HPPE)',
        descricao:
          'F.1 — Luva anticorte para desossa, manuseio de chapas metálicas, vidros e lâminas',
        palavrasChave: ['luva anticorte', 'malha de aço', 'kevlar', 'vidro', 'chapa', 'faca'],
      },
      {
        id: 'f1_luva_isolante_eletrica',
        nome: 'Luva de borracha isolante para alta/baixa tensão com luva de cobertura (NR-10)',
        descricao:
          'F.1 — Luvas classe 00 a 4 para intervenções em instalações elétricas energizadas',
        palavrasChave: [
          'luva isolante',
          'borracha',
          'alta tensão',
          'nr-10',
          'eletricista',
          'choque',
        ],
      },
      {
        id: 'f1_luva_termica_calor_frio',
        nome: 'Luva para agentes térmicos (altas temperaturas ou frio extremo)',
        descricao:
          'F.1 — Luva para forno, fundição, solda ou luva térmica para câmaras frigoríficas',
        palavrasChave: ['luva térmica', 'calor', 'forno', 'frio', 'câmara frigorífica', 'solda'],
      },
      {
        id: 'f1_luva_antivibracao',
        nome: 'Luva antivibração para ferramentas manuais rotativas/percussivas',
        descricao: 'F.1 — Luva com absorção de impacto para marteletes, lixadeiras e compactadores',
        palavrasChave: ['luva antivibração', 'vibração', 'martelete', 'lixadeira'],
      },
      {
        id: 'f2_creme_protetor',
        nome: 'Creme protetor de segurança para a pele (grupo 1, 2 ou 3)',
        descricao: 'F.2 — Creme barreira química contra água, óleo, graxa, solventes e resinas',
        palavrasChave: ['creme protetor', 'creme barreira', 'pele', 'químico', 'graxa'],
      },
      {
        id: 'f3_manga_protecao',
        nome: 'Manga de proteção (raspa, tecido resistente, isolante ou impermeável)',
        descricao:
          'F.3 — Manga para antebraço e braço contra corte, calor, solda, agentes químicos ou choque',
        palavrasChave: ['manga de proteção', 'mangote', 'solda', 'antebraço', 'corte'],
      },
      {
        id: 'f4_bracadeira_dedeira',
        nome: 'Braçadeira ou dedeira de proteção',
        descricao: 'F.4 e F.5 — Proteção pontual contra cortes e agentes escoriantes',
        palavrasChave: ['braçadeira', 'dedeira', 'corte', 'escoriante'],
      },
    ],
  },
  {
    codigo: 'G',
    titulo: 'G – EPI PARA PROTEÇÃO DOS MEMBROS INFERIORES',
    itens: [
      {
        id: 'g1_botina_biqueira_aco_composite',
        nome: 'Calçado de segurança com biqueira de aço ou composite (botina de amarrar ou elástico)',
        descricao:
          'G.1 — Calçado com solado bidensidade contra impactos sobre os artelhos e perfuração',
        palavrasChave: [
          'botina',
          'calçado de segurança',
          'biqueira de aço',
          'composite',
          'artelhos',
        ],
      },
      {
        id: 'g1_bota_pvc_borracha',
        nome: 'Bota impermeável de PVC ou borracha (com ou sem biqueira)',
        descricao:
          'G.1 — Bota cano longo para concreto, umidade, lavagem, frigorífico e produtos químicos',
        palavrasChave: ['bota de pvc', 'galocha', 'borracha', 'água', 'umidade', 'concreto'],
      },
      {
        id: 'g1_calcado_dieletrico',
        nome: 'Calçado isolante / dielétrico para eletricistas (sem componentes metálicos)',
        descricao: 'G.1 — Botina livre de metais contra choques elétricos e passagem de corrente',
        palavrasChave: ['calçado dielétrico', 'botina eletricista', 'isolante', 'choque elétrico'],
      },
      {
        id: 'g1_calcado_palmilha_antiperfuracao',
        nome: 'Calçado de segurança com palmilha de aço ou tecido antiperfuração',
        descricao:
          'G.1 — Proteção da planta do pé contra pregos e objetos perfurantes em canteiros',
        palavrasChave: ['palmilha antiperfuração', 'prego', 'obra', 'canteiro'],
      },
      {
        id: 'g2_meia_termica',
        nome: 'Meia térmica contra baixas temperaturas',
        descricao: 'G.2 — Meia de lã / fibras térmicas para câmaras frias e ambientes congelados',
        palavrasChave: ['meia térmica', 'frio', 'câmara fria', 'congelado'],
      },
      {
        id: 'g3_perneira_seguranca',
        nome: 'Perneira de segurança (couro, bidim ou material sintético)',
        descricao:
          'G.3 — Perneira contra picadas de animais peçonhentos, cortes, solda e respingos',
        palavrasChave: ['perneira', 'animal peçonhento', 'cobra', 'solda', 'roçadeira'],
      },
      {
        id: 'g4_calca_seguranca_motosserra',
        nome: 'Calça de segurança para operador de motosserra (com proteção anticorte)',
        descricao: 'G.4 — Calça com tramas de fibras que travam a corrente da motosserra',
        palavrasChave: ['calça motosserra', 'anticorte', 'florestal', 'motosserra'],
      },
      {
        id: 'g4_calca_impermeavel_quimica',
        nome: 'Calça impermeável contra agentes químicos, líquidos e umidade',
        descricao:
          'G.4 — Calça de PVC ou laminado químico para aplicação de defensivos ou jateamento',
        palavrasChave: ['calça impermeável', 'pvc', 'químico', 'defensivo', 'umidade'],
      },
    ],
  },
  {
    codigo: 'H',
    titulo: 'H – EPI PARA PROTEÇÃO DO CORPO INTEIRO',
    itens: [
      {
        id: 'h1_macacao_quimico_tipo_3_4_5_6',
        nome: 'Macacão de proteção contra agentes químicos e partículas secas (Tyvek / microporoso)',
        descricao:
          'H.1 e H.2 — Macacão com capuz contra pós tóxicos, respingos, pintura e defensivos',
        palavrasChave: [
          'macacão químico',
          'tyvek',
          'microporoso',
          'partículas',
          'pintura',
          'pesticida',
        ],
      },
      {
        id: 'h1_macacao_aluminizado_forno',
        nome: 'Macacão ou conjunto aluminizado contra calor radiante extremo e projeção de metais fundidos',
        descricao: 'H.1 — Proteção corporal para fornos, coqueria e aciaria',
        palavrasChave: [
          'macacão aluminizado',
          'metal fundido',
          'fundição',
          'calor radiante',
          'forno',
        ],
      },
      {
        id: 'h1_macacao_termico_camara_fria',
        nome: 'Conjunto / macacão térmico para câmara frigorífica de congelados',
        descricao: 'H.1 — Vestimenta completa acolchoada para temperaturas negativas até -35°C',
        palavrasChave: ['macacão térmico', 'câmara fria', 'frio extremo', 'congelados'],
      },
      {
        id: 'h2_vestimenta_encapsulada_nivel_a',
        nome: 'Vestimenta de proteção química nível A (totalmente encapsulada e estanque a gases)',
        descricao:
          'H.2 — Vestimenta hermética usada com máscara autônoma para emergências com vazamentos',
        palavrasChave: [
          'vestimenta encapsulada',
          'nível a',
          'hazmat',
          'gás tóxico',
          'emergência química',
        ],
      },
      {
        id: 'h2_vestimenta_condutiva',
        nome: 'Vestimenta condutiva para trabalho ao potencial em linhas de transmissão',
        descricao:
          'H.2 — Roupa condutiva para equalização de campo elétrico em subestações de alta tensão',
        palavrasChave: [
          'vestimenta condutiva',
          'ao potencial',
          'linha de transmissão',
          'alta tensão',
        ],
      },
    ],
  },
  {
    codigo: 'I',
    titulo: 'I – EPI PARA PROTEÇÃO CONTRA QUEDAS COM DIFERENÇA DE NÍVEL',
    itens: [
      {
        id: 'i1_cinturao_paraquedista',
        nome: 'Cinturão de segurança tipo paraquedista (com pontos dorsal e peitoral)',
        descricao: 'I.1 — Cinturão para retenção de quedas com anéis de ancoragem homologados',
        palavrasChave: ['cinturão paraquedista', 'cinto de segurança', 'altura', 'nr-35', 'queda'],
      },
      {
        id: 'i1_cinturao_posicionamento',
        nome: 'Cinturão tipo paraquedista com pontos laterais para posicionamento e suspensão',
        descricao: 'I.1 — Cinturão ergonômico para acesso por corda, postes e torres',
        palavrasChave: [
          'cinturão posicionamento',
          'acesso por corda',
          'poste',
          'torre',
          'trabalho em altura',
        ],
      },
      {
        id: 'i1_dispositivo_travaqueda_corda',
        nome: 'Dispositivo trava-queda guiado para corda sintética ou cabo de aço flexível',
        descricao: 'I.1 — Trava-queda acoplável em linha de vida vertical fixa ou temporária',
        palavrasChave: ['trava-queda', 'corda', 'linha de vida', 'cabo de aço', 'vertical'],
      },
      {
        id: 'i1_dispositivo_travaqueda_retratil',
        nome: 'Dispositivo trava-queda retrátil (fita ou cabo de aço)',
        descricao:
          'I.1 — Trava-queda retrátil com bloqueio automático de queda para içamento e telhados',
        palavrasChave: ['trava-queda retrátil', 'linha retrátil', 'bloqueio automático', 'telhado'],
      },
      {
        id: 'i2_talabarte_duplo_com_absorvedor',
        nome: 'Talabarte de segurança duplo (em Y) com absorvedor de impacto (ABS)',
        descricao: 'I.2 — Talabarte de retenção para progressão contínua em estruturas e andaimes',
        palavrasChave: [
          'talabarte duplo',
          'talabarte em y',
          'absorvedor de impacto',
          'abs',
          'andaime',
        ],
      },
      {
        id: 'i2_talabarte_posicionamento_regulavel',
        nome: 'Talabarte de segurança simples ou de posicionamento regulável',
        descricao: 'I.2 — Talabarte regulável para manter as mãos livres em postes e estruturas',
        palavrasChave: ['talabarte simples', 'posicionamento', 'regulável', 'poste', 'torre'],
      },
    ],
  },
]

/**
 * Retorna todos os itens do Anexo I da NR-06 linearizados com a referência da categoria.
 */
export function listarTodosItensNr06(): Array<
  ItemEpiNr06 & { categoriaCodigo: CategoriaEpiNr06['codigo']; categoriaTitulo: string }
> {
  const todos: Array<
    ItemEpiNr06 & { categoriaCodigo: CategoriaEpiNr06['codigo']; categoriaTitulo: string }
  > = []

  for (const cat of CATEGORIAS_EPI_NR06) {
    for (const item of cat.itens) {
      todos.push({
        ...item,
        categoriaCodigo: cat.codigo,
        categoriaTitulo: cat.titulo,
      })
    }
  }

  return todos
}

/**
 * Busca itens pelo nome, descrição ou palavras-chave (case-insensitive e tolerante a acentos).
 */
export function normalizarTextoBusca(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function buscarItensNr06(termo: string): CategoriaEpiNr06[] {
  const normalizado = normalizarTextoBusca(termo)
  if (!normalizado) return CATEGORIAS_EPI_NR06

  const termos = normalizado.split(/\s+/).filter(Boolean)

  return CATEGORIAS_EPI_NR06.map((cat) => {
    const itensFiltrados = cat.itens.filter((item) => {
      const corpus = normalizarTextoBusca(
        [item.nome, item.descricao || '', cat.titulo, ...(item.palavrasChave || [])].join(' '),
      )
      return termos.every((t) => corpus.includes(t))
    })

    return {
      ...cat,
      itens: itensFiltrados,
    }
  }).filter((cat) => cat.itens.length > 0)
}
