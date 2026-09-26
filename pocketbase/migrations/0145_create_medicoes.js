// Amostras/leituras de campo ligadas a uma avaliação de risco.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const avaliacaoId = app.findCollectionByNameOrId('avaliacoes_risco').id
    const formularioId = app.findCollectionByNameOrId('formularios').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"

    const collection = new Collection({
      name: 'medicoes',
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
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'avaliacao_id',
          type: 'relation',
          required: true,
          collectionId: avaliacaoId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'formulario_id',
          type: 'relation',
          required: false,
          collectionId: formularioId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'trabalhador_ou_ponto', type: 'text', max: 200 },
        { name: 'funcao_avaliada', type: 'text', max: 200 },
        {
          name: 'metodologia',
          type: 'select',
          values: [
            'NHO 01 (ruído)',
            'NHO 02 (vapores orgânicos)',
            'NHO 03 (gravimetria)',
            'NHO 04 (fibras)',
            'NHO 06 (calor)',
            'NHO 08 (coleta de particulado)',
            'NHO 09 (vibração corpo inteiro)',
            'NHO 10 (vibração mãos e braços)',
            'NR-15 (critério trabalhista)',
            'Outra',
          ],
          maxSelect: 1,
        },
        { name: 'equipamento', type: 'text', max: 200 },
        { name: 'numero_serie', type: 'text', max: 100 },
        { name: 'certificado_calibracao', type: 'text', max: 200 },
        { name: 'calibracao_validade', type: 'date' },
        { name: 'calibracao_leitura_inicial', type: 'number' },
        { name: 'calibracao_leitura_final', type: 'number' },
        { name: 'tempo_amostragem_min', type: 'number', min: 0 },
        { name: 'jornada_min', type: 'number', min: 0 },
        { name: 'resultado_valor', type: 'number' },
        { name: 'resultado_unidade', type: 'text', max: 30 },
        // Ruído: os dois critérios podem coexistir na mesma leitura.
        { name: 'ruido_dose_nr15_pct', type: 'number' },
        { name: 'ruido_nen_nr15_dba', type: 'number' },
        { name: 'ruido_nen_nho01_dba', type: 'number' },
        {
          name: 'laudo_laboratorio',
          type: 'file',
          maxSelect: 5,
          maxSize: 10485760,
          protected: true,
        },
        { name: 'observacoes', type: 'text', max: 2000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_medicoes_organizacao ON medicoes (organizacao_id)',
        'CREATE INDEX idx_medicoes_avaliacao ON medicoes (avaliacao_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('medicoes'))
  },
)
