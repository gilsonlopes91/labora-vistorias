// Biblioteca de textos-padrão por documento/seção/agente, com variáveis
// ({{empresa.razao_social}}, {{ghe.nome}}, {{agente.limite_tolerancia_valor}}
// etc.), lidas e substituídas pelo motor de geração de documentos (Fase 4).
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const agenteId = app.findCollectionByNameOrId('agentes_catalogo').id

    const regraLeitura =
      "@request.auth.id != '' && (organizacao_id = '' || organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma')"
    const regraEscrita =
      "@request.auth.id != '' && ((organizacao_id != '' && (organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) && @request.auth.papel != 'executor') || @request.auth.papel = 'admin_plataforma')"

    const collection = new Collection({
      name: 'blocos_texto',
      type: 'base',
      listRule: regraLeitura,
      viewRule: regraLeitura,
      createRule: regraEscrita,
      updateRule: regraEscrita,
      deleteRule: regraEscrita,
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: false,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo_documento',
          type: 'select',
          required: true,
          values: ['pgr', 'insalubridade', 'periculosidade', 'ltcat', 'geral'],
          maxSelect: 1,
        },
        {
          name: 'secao',
          type: 'select',
          required: true,
          values: [
            'objetivo',
            'base_legal',
            'metodologia',
            'agente',
            'conclusao',
            'recomendacoes',
            'outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'agente_id',
          type: 'relation',
          required: false,
          collectionId: agenteId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, max: 200 },
        { name: 'texto', type: 'text', required: true, max: 10000 },
        { name: 'norma_referencia', type: 'text', max: 200 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_blocos_texto_organizacao ON blocos_texto (organizacao_id)',
        'CREATE INDEX idx_blocos_texto_tipo ON blocos_texto (tipo_documento)',
        'CREATE INDEX idx_blocos_texto_agente ON blocos_texto (agente_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('blocos_texto'))
  },
)
