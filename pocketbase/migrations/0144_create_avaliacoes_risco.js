// Uma linha do inventário de riscos: um GHE x um perigo/agente.
// Guarda o dado bruto (trilha da probabilidade, controles, exposição) e as
// SUGESTÕES calculadas + as decisões FINAIS do responsável técnico para cada
// um dos 4 documentos (PGR, insalubridade, periculosidade, LTCAT).
// Observação: não existe ainda um catálogo de EPI dedicado no Labora
// Vistorias (diferente do Labora SST) — por ora "epis_utilizados" é texto
// livre; criar uma coleção "epis" fica para quando o módulo de EPI entrar.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id
    const gheId = app.findCollectionByNameOrId('ghes').id
    const agenteId = app.findCollectionByNameOrId('agentes_catalogo').id
    const formularioId = app.findCollectionByNameOrId('formularios').id
    const respostaId = app.findCollectionByNameOrId('respostas_vistoria').id

    const regra =
      "@request.auth.id != '' && ((organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id) || @request.auth.papel = 'admin_plataforma')"
    const regraGestor = regra + " && @request.auth.papel != 'executor'"

    const collection = new Collection({
      name: 'avaliacoes_risco',
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
          name: 'ghe_id',
          type: 'relation',
          required: true,
          collectionId: gheId,
          cascadeDelete: true,
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
        // Quando não há agente do catálogo (perigo de acidente específico etc.)
        { name: 'perigo_descricao', type: 'text', max: 500 },
        { name: 'fonte_geradora', type: 'text', max: 1000 },
        { name: 'atividades_relacionadas', type: 'text', max: 1000 },
        { name: 'meio_propagacao', type: 'text', max: 300 },
        { name: 'via_absorcao', type: 'text', max: 200 },
        {
          name: 'frequencia_exposicao',
          type: 'select',
          values: [
            'Habitual e permanente',
            'Habitual e intermitente',
            'Eventual/ocasional',
            'Não se aplica',
          ],
          maxSelect: 1,
        },
        { name: 'tempo_exposicao_min_jornada', type: 'number', min: 0 },
        { name: 'numero_expostos', type: 'number', min: 0, onlyInt: true },
        { name: 'danos_possiveis', type: 'text', max: 1000 },
        {
          name: 'efeito_saude_aiha',
          type: 'select',
          values: ['0', '1', '2', '3', '4'],
          maxSelect: 1,
        },
        {
          name: 'trilha_probabilidade',
          type: 'select',
          required: true,
          values: [
            'Quantitativa (medição)',
            'Qualitativa (controle)',
            'Acidente/mecânico',
            'Ergonômica (AEP/AET)',
            'Psicossocial',
          ],
          maxSelect: 1,
        },
        { name: 'controle_descricao', type: 'text', max: 2000 },
        {
          name: 'controle_nivel',
          type: 'select',
          values: [
            'Excelente / melhor prática',
            'Conforme, com manutenção garantida',
            'Adequado, com pequenas deficiências',
            'Deficiente ou incompleto',
            'Inexistente ou inadequado',
          ],
          maxSelect: 1,
        },
        {
          name: 'resultado_aep_aet',
          type: 'select',
          values: ['Baixo', 'Médio', 'Alto', 'Não avaliado'],
          maxSelect: 1,
        },
        { name: 'observacoes_aep_aet', type: 'text', max: 2000 },
        {
          name: 'categoria_aiha_exposicao',
          type: 'select',
          values: ['0', '1', '2', '3', '4'],
          maxSelect: 1,
        },
        { name: 'incerteza', type: 'select', values: ['0', '1', '2', '3'], maxSelect: 1 },
        { name: 'epc_lista', type: 'text', max: 1000 },
        { name: 'epc_eficaz', type: 'bool' },
        { name: 'epc_plano_manutencao', type: 'bool' },
        { name: 'medidas_administrativas', type: 'text', max: 1000 },
        { name: 'epis_utilizados', type: 'text', max: 1000 },
        { name: 'epi_condicao_funcionamento', type: 'bool' },
        { name: 'epi_uso_ininterrupto', type: 'bool' },
        { name: 'epi_validade_ca_ok', type: 'bool' },
        { name: 'epi_periodicidade_troca_ok', type: 'bool' },
        { name: 'epi_higienizacao_ok', type: 'bool' },
        { name: 'probabilidade_sugerida', type: 'number', min: 1, max: 5, onlyInt: true },
        { name: 'probabilidade_final', type: 'number', min: 1, max: 5, onlyInt: true },
        { name: 'severidade_sugerida', type: 'number', min: 1, max: 5, onlyInt: true },
        { name: 'severidade_final', type: 'number', min: 1, max: 5, onlyInt: true },
        { name: 'justificativa_ajuste', type: 'text', max: 1000 },
        {
          name: 'insalubridade_sugerida',
          type: 'select',
          values: ['Não caracteriza', 'Mínimo (10%)', 'Médio (20%)', 'Máximo (40%)'],
          maxSelect: 1,
        },
        {
          name: 'insalubridade_final',
          type: 'select',
          values: ['Não caracteriza', 'Mínimo (10%)', 'Médio (20%)', 'Máximo (40%)'],
          maxSelect: 1,
        },
        { name: 'insalubridade_justificativa', type: 'text', max: 1000 },
        { name: 'periculosidade_sugerida', type: 'bool' },
        { name: 'periculosidade_final', type: 'bool' },
        { name: 'periculosidade_anexo', type: 'text', max: 10 },
        { name: 'periculosidade_justificativa', type: 'text', max: 1000 },
        {
          name: 'ltcat_enquadra_sugerido',
          type: 'select',
          values: ['Não', 'Sim - 15 anos', 'Sim - 20 anos', 'Sim - 25 anos'],
          maxSelect: 1,
        },
        {
          name: 'ltcat_enquadra_final',
          type: 'select',
          values: ['Não', 'Sim - 15 anos', 'Sim - 20 anos', 'Sim - 25 anos'],
          maxSelect: 1,
        },
        { name: 'ltcat_justificativa', type: 'text', max: 1000 },
        {
          name: 'origem',
          type: 'select',
          values: ['Manual', 'Formulário de campo', 'Item N/C de vistoria'],
          maxSelect: 1,
        },
        {
          name: 'formulario_origem_id',
          type: 'relation',
          required: false,
          collectionId: formularioId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'resposta_vistoria_origem_id',
          type: 'relation',
          required: false,
          collectionId: respostaId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_avaliacoes_risco_organizacao ON avaliacoes_risco (organizacao_id)',
        'CREATE INDEX idx_avaliacoes_risco_ghe ON avaliacoes_risco (ghe_id)',
        'CREATE INDEX idx_avaliacoes_risco_agente ON avaliacoes_risco (agente_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('avaliacoes_risco'))
  },
)
