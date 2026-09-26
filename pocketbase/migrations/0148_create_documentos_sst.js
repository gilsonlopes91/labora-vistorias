// Documento SST emitido (PGR, LTCAT, insalubridade, periculosidade).
// Documento com status "emitido" é imutável (a trava é feita em hook, como
// já acontece com vistoria concluída); revisão = novo registro apontando
// para documento_anterior_id.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const empresaId = app.findCollectionByNameOrId('empresas').id
    const matrizId = app.findCollectionByNameOrId('matrizes_risco').id
    const rtId = app.findCollectionByNameOrId('responsaveis_tecnicos').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    const regraGestor = regra + " && @request.auth.papel != 'executor'"

    const collection = new Collection({
      name: 'documentos_sst',
      type: 'base',
      listRule: regra,
      viewRule: regra,
      createRule: regraGestor,
      updateRule: regraGestor,
      deleteRule: regraGestor,
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
          name: 'empresa_id',
          type: 'relation',
          required: true,
          collectionId: empresaId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['pgr', 'ltcat', 'insalubridade', 'periculosidade'],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, max: 200 },
        { name: 'versao', type: 'number', min: 1, onlyInt: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'em_revisao', 'emitido', 'substituido'],
          maxSelect: 1,
        },
        { name: 'motivo_revisao', type: 'text', max: 1000 },
        {
          name: 'matriz_id',
          type: 'relation',
          required: false,
          collectionId: matrizId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        // Cópia congelada da matriz no momento da emissão (o PGR não muda
        // retroativamente se a matriz oficial for atualizada depois).
        { name: 'matriz_snapshot', type: 'json', maxSize: 50000 },
        {
          name: 'responsaveis_tecnicos_ids',
          type: 'relation',
          required: false,
          collectionId: rtId,
          cascadeDelete: false,
          maxSelect: 10,
        },
        { name: 'elaboradores', type: 'text', max: 500 },
        { name: 'data_avaliacao_campo', type: 'date' },
        { name: 'data_emissao', type: 'date' },
        { name: 'vigencia_ate', type: 'date' },
        { name: 'proxima_revisao', type: 'date' },
        // Seções: ordem, o que está ligado/desligado, textos editados por seção.
        { name: 'secoes', type: 'json', maxSize: 500000 },
        { name: 'abrangencia_ghe_ids', type: 'json', maxSize: 20000 }, // [] = todos os GHE
        { name: 'pdf', type: 'file', maxSelect: 1, maxSize: 20971520, protected: true },
        { name: 'pdf_hash_sha256', type: 'text', max: 100 },
        {
          name: 'dados_emissao',
          type: 'json',
          maxSize: 2000000,
        }, // cópia completa dos dados usados na emissão
        {
          name: 'emitido_por',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'link_publico_chave', type: 'text', max: 60 },
        { name: 'link_publico_ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_documentos_sst_organizacao ON documentos_sst (organizacao_id)',
        'CREATE INDEX idx_documentos_sst_empresa ON documentos_sst (empresa_id)',
        'CREATE INDEX idx_documentos_sst_tipo ON documentos_sst (tipo)',
        'CREATE UNIQUE INDEX idx_documentos_sst_link_publico ON documentos_sst (link_publico_chave)',
      ],
    })
    app.save(collection)

    // self-relation (documento_anterior_id): precisa do id já existente,
    // então o campo é acrescentado depois do primeiro save.
    const saved = app.findCollectionByNameOrId('documentos_sst')
    saved.fields.add(
      new RelationField({
        name: 'documento_anterior_id',
        collectionId: saved.id,
        cascadeDelete: false,
        maxSelect: 1,
        required: false,
      }),
    )
    app.save(saved)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('documentos_sst'))
  },
)
