// Modelos de proposta e catálogo de normas de referência.
//
// Cada organização recebe três modelos prontos, que mudam o desenho do PDF:
//   classico     → capa com faixa, tipografia sóbria, tabela com bordas
//   moderno      → capa colorida inteira, blocos na cor da marca, tabela zebrada
//   minimalista  → sem capa, muito espaço em branco, tabela sem linhas
//
// Em cada modelo dá para trocar a logo, as duas cores e escolher quais seções
// entram no documento (o campo "secoes"). Os textos de apresentação e
// encerramento também ficam editáveis.
//
// O catálogo de normas alimenta a lista de múltipla escolha do orçamento.
// organizacao_id vazio = norma do catálogo oficial, visível a todos; preenchido
// = norma criada pela própria organização.
migrate(
  (app) => {
    const orgCol = app.findCollectionByNameOrId('organizacoes')
    const orcCol = app.findCollectionByNameOrId('orcamentos')

    const regra =
      "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id && @request.auth.papel != 'executor'"

    const modelos = new Collection({
      name: 'modelos_proposta',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regra,
      updateRule: regra,
      deleteRule: regra,
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: true,
          collectionId: orgCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true, max: 120 },
        {
          name: 'layout',
          type: 'select',
          required: true,
          values: ['classico', 'moderno', 'minimalista'],
          maxSelect: 1,
        },
        { name: 'cor_primaria', type: 'text', max: 9 },
        { name: 'cor_secundaria', type: 'text', max: 9 },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'imagem_capa',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        // Quais seções entram no PDF. Chaves em src/services/modelosProposta.ts.
        { name: 'secoes', type: 'json', maxSize: 20000 },
        { name: 'texto_apresentacao', type: 'text', max: 4000 },
        { name: 'texto_encerramento', type: 'text', max: 4000 },
        { name: 'padrao', type: 'bool' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_modelos_proposta_org ON modelos_proposta (organizacao_id)'],
    })
    app.save(modelos)

    // Catálogo de normas: leitura liberada para qualquer usuário logado (o
    // catálogo oficial é comum a todos); escrita só na própria organização.
    const normas = new Collection({
      name: 'normas_referencia',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (organizacao_id = '' || organizacao_id = @request.auth.organizacao_id)",
      viewRule:
        "@request.auth.id != '' && (organizacao_id = '' || organizacao_id = @request.auth.organizacao_id)",
      createRule: "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id",
      updateRule: "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id",
      deleteRule: "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id",
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: false,
          collectionId: orgCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true, max: 200 },
        { name: 'ordem', type: 'number', min: 0, onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_normas_referencia_org ON normas_referencia (organizacao_id)'],
    })
    app.save(normas)

    // Orçamento aponta para o modelo usado na geração do PDF.
    if (!orcCol.fields.getByName('modelo_proposta_id')) {
      orcCol.fields.add(
        new RelationField({
          name: 'modelo_proposta_id',
          collectionId: modelos.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(orcCol)
    }

    // Catálogo oficial de normas mais usadas em proposta de SST.
    const CATALOGO = [
      'NR-01 - Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
      'NR-04 - Serviços Especializados em Segurança e Medicina do Trabalho',
      'NR-05 - Comissão Interna de Prevenção de Acidentes e de Assédio',
      'NR-06 - Equipamento de Proteção Individual',
      'NR-07 - Programa de Controle Médico de Saúde Ocupacional',
      'NR-09 - Avaliação e Controle das Exposições Ocupacionais',
      'NR-10 - Segurança em Instalações e Serviços em Eletricidade',
      'NR-11 - Transporte, Movimentação, Armazenagem e Manuseio de Materiais',
      'NR-12 - Segurança no Trabalho em Máquinas e Equipamentos',
      'NR-13 - Caldeiras, Vasos de Pressão e Tubulações',
      'NR-15 - Atividades e Operações Insalubres',
      'NR-16 - Atividades e Operações Perigosas',
      'NR-17 - Ergonomia',
      'NR-18 - Segurança e Saúde no Trabalho na Indústria da Construção',
      'NR-20 - Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis',
      'NR-23 - Proteção Contra Incêndios',
      'NR-26 - Sinalização de Segurança',
      'NR-33 - Segurança e Saúde nos Trabalhos em Espaços Confinados',
      'NR-35 - Trabalho em Altura',
      'NHO-01 - Avaliação da Exposição Ocupacional ao Ruído',
      'NHO-06 - Avaliação da Exposição Ocupacional ao Calor',
      'NHO-09 - Avaliação da Exposição Ocupacional a Vibração',
      'ABNT NBR ISO 45001 - Sistema de Gestão de Saúde e Segurança Ocupacional',
      'Lei nº 6.514/1977 - Segurança e Medicina do Trabalho',
      'Decreto nº 3.048/1999 - Regulamento da Previdência Social',
    ]
    CATALOGO.forEach((nome, idx) => {
      const rec = new Record(normas)
      rec.set('organizacao_id', '')
      rec.set('nome', nome)
      rec.set('ordem', idx)
      app.save(rec)
    })

    // Três modelos prontos para cada organização já existente.
    const SECOES_COMPLETAS = {
      capa: true,
      apresentacao: true,
      objeto: true,
      normas_referencia: true,
      itens_inclusos: true,
      itens_exclusos: true,
      tabela_valores: true,
      condicoes_pagamento: true,
      prazo_entrega: true,
      validade: true,
      responsavel_tecnico: true,
      encerramento: true,
      assinatura: true,
    }

    const SECOES_ENXUTAS = {
      capa: false,
      apresentacao: false,
      objeto: true,
      normas_referencia: true,
      itens_inclusos: true,
      itens_exclusos: false,
      tabela_valores: true,
      condicoes_pagamento: true,
      prazo_entrega: true,
      validade: true,
      responsavel_tecnico: true,
      encerramento: false,
      assinatura: true,
    }

    const APRESENTACAO =
      'Agradecemos a oportunidade de apresentar esta proposta. Atuamos em segurança e saúde no ' +
      'trabalho com foco em conformidade legal e redução de risco, atendendo empresas de portes e ' +
      'setores variados. Os serviços descritos a seguir são executados por profissionais ' +
      'habilitados, com emissão da respectiva anotação de responsabilidade técnica.'

    const ENCERRAMENTO =
      'Permanecemos à disposição para esclarecer qualquer ponto desta proposta e para ajustar o ' +
      'escopo ao que a empresa precisa. A aprovação pode ser formalizada pela assinatura deste ' +
      'documento ou por confirmação por escrito.'

    const MODELOS = [
      {
        nome: 'Clássico',
        layout: 'classico',
        cor_primaria: '#6C8845',
        cor_secundaria: '#202720',
        secoes: SECOES_COMPLETAS,
        padrao: true,
      },
      {
        nome: 'Moderno',
        layout: 'moderno',
        cor_primaria: '#6C8845',
        cor_secundaria: '#3B4A2C',
        secoes: SECOES_COMPLETAS,
        padrao: false,
      },
      {
        nome: 'Minimalista',
        layout: 'minimalista',
        cor_primaria: '#202720',
        cor_secundaria: '#6C8845',
        secoes: SECOES_ENXUTAS,
        padrao: false,
      },
    ]

    try {
      const orgs = app.findRecordsByFilter('organizacoes', "id != ''", '', 0, 0)
      for (const org of orgs) {
        for (const modelo of MODELOS) {
          const rec = new Record(modelos)
          rec.set('organizacao_id', org.id)
          rec.set('nome', modelo.nome)
          rec.set('layout', modelo.layout)
          rec.set('cor_primaria', modelo.cor_primaria)
          rec.set('cor_secundaria', modelo.cor_secundaria)
          rec.set('secoes', modelo.secoes)
          rec.set('texto_apresentacao', APRESENTACAO)
          rec.set('texto_encerramento', ENCERRAMENTO)
          rec.set('padrao', modelo.padrao)
          rec.set('ativo', true)
          app.save(rec)
        }
      }
    } catch (_) {}
  },
  (app) => {
    const orcCol = app.findCollectionByNameOrId('orcamentos')
    orcCol.fields.removeByName('modelo_proposta_id')
    app.save(orcCol)
    try {
      app.delete(app.findCollectionByNameOrId('modelos_proposta'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('normas_referencia'))
    } catch (_) {}
  },
)
