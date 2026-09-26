// Catálogo de agentes/perigos de SST. organizacao_id vazio = catálogo oficial
// global (mantido pelo admin_plataforma); preenchido = agente customizado da
// organização. Segue o padrão já usado em tipos_vistoria/itens_checklist.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id

    const regraLeitura =
      "@request.auth.id != '' && (organizacao_id = '' || organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id || @request.auth.papel = 'admin_plataforma')"
    // Só admin_plataforma mexe no catálogo global; organização só mexe no próprio.
    const regraEscrita =
      "@request.auth.id != '' && ((organizacao_id != '' && (organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) && @request.auth.papel != 'executor') || @request.auth.papel = 'admin_plataforma')"

    const collection = new Collection({
      name: 'agentes_catalogo',
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
        { name: 'nome', type: 'text', required: true, max: 200 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Físico', 'Químico', 'Biológico', 'Ergonômico', 'Acidente', 'Psicossocial'],
          maxSelect: 1,
        },
        { name: 'cas', type: 'text', max: 30 },
        { name: 'sinonimos', type: 'text', max: 500 },
        // eSocial (Tabela 24) — só para agentes de aposentadoria especial.
        { name: 'codigo_esocial', type: 'text', max: 20 },
        // Decreto 3.048/99, Anexo IV.
        { name: 'codigo_anexo_iv', type: 'text', max: 20 },
        {
          name: 'anos_aposentadoria_especial',
          type: 'select',
          values: ['15', '20', '25'],
          maxSelect: 1,
        },
        { name: 'grupo_linach', type: 'text', max: 10 }, // grupo 1, 2A, 2B (cancerígenos)
        // NR-15
        { name: 'anexo_nr15', type: 'text', max: 10 },
        {
          name: 'tipo_avaliacao_nr15',
          type: 'select',
          values: ['Quantitativa', 'Qualitativa', 'Não se aplica'],
          maxSelect: 1,
        },
        {
          name: 'grau_insalubridade_nr15',
          type: 'select',
          values: ['Não caracteriza', 'Mínimo (10%)', 'Médio (20%)', 'Máximo (40%)'],
          maxSelect: 1,
        },
        { name: 'limite_tolerancia_valor', type: 'number' },
        { name: 'limite_tolerancia_unidade', type: 'text', max: 120 },
        { name: 'valor_teto', type: 'number' },
        { name: 'fator_desvio', type: 'number' },
        { name: 'via_absorcao_pele', type: 'bool' },
        { name: 'nivel_acao_formula', type: 'text', max: 300 }, // texto: como calcular (ex.: "50% do LT"; "dose 50%")
        // Referência complementar quando a NR-15 não tem limite (NR-09, 9.6.1.1)
        { name: 'tlv_acgih_valor', type: 'number' },
        { name: 'tlv_acgih_unidade', type: 'text', max: 30 },
        { name: 'tlv_acgih_ano', type: 'number', onlyInt: true },
        // NR-16
        { name: 'anexo_nr16', type: 'text', max: 10 },
        { name: 'item_nr16', type: 'text', max: 200 },
        // Descrição geral
        { name: 'fonte_geradora_tipica', type: 'text', max: 1000 },
        { name: 'meio_propagacao', type: 'text', max: 300 },
        { name: 'danos_saude_tipicos', type: 'text', max: 2000 },
        {
          name: 'efeito_saude_aiha',
          type: 'select',
          values: ['0', '1', '2', '3', '4'],
          maxSelect: 1,
        },
        { name: 'medidas_controle_tipicas', type: 'text', max: 2000 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_agentes_catalogo_organizacao ON agentes_catalogo (organizacao_id)',
        'CREATE INDEX idx_agentes_catalogo_tipo ON agentes_catalogo (tipo)',
        'CREATE INDEX idx_agentes_catalogo_esocial ON agentes_catalogo (codigo_esocial)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('agentes_catalogo'))
  },
)
