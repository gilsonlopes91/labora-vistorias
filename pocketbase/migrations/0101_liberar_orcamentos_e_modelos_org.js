// Migração 0101: Libera acesso de orçamentos para todos os perfis (incluindo clientes/executores)
// na mesma organização, e garante que criação de modelos_formulario próprios da organização
// seja permitida para os usuários da organização.
migrate(
  (app) => {
    const AUTENTICADO = "@request.auth.id != ''"
    const MESMA_ORG = 'organizacao_id = @request.auth.organizacao_id'

    // 1. Atualiza regras da coleção orcamentos para permitir acesso a todos os perfis da organização
    try {
      const orcamentosCol = app.findCollectionByNameOrId('orcamentos')
      const regraOrcamentos = AUTENTICADO + ' && ' + MESMA_ORG
      orcamentosCol.listRule = regraOrcamentos
      orcamentosCol.viewRule = regraOrcamentos
      orcamentosCol.createRule = regraOrcamentos
      orcamentosCol.updateRule = regraOrcamentos
      orcamentosCol.deleteRule = regraOrcamentos
      app.save(orcamentosCol)
    } catch (e) {
      console.log(
        'Aviso ao atualizar regras de orcamentos:',
        e && e.message ? e.message : String(e),
      )
    }

    // 2. Atualiza regras da coleção modelos_formulario para permitir que usuários da organização
    // criem formulários próprios da sua organização (isolados por organizacao_id)
    try {
      const modelosCol = app.findCollectionByNameOrId('modelos_formulario')
      // Visualização: modelos globais (organizacao_id = '') ou da própria organização
      modelosCol.listRule = AUTENTICADO + " && (organizacao_id = '' || " + MESMA_ORG + ')'
      modelosCol.viewRule = AUTENTICADO + " && (organizacao_id = '' || " + MESMA_ORG + ')'
      // Criação/edição/exclusão: permite para membros da própria organização onde organizacao_id != ''
      const regraModelosProprios = AUTENTICADO + " && organizacao_id != '' && " + MESMA_ORG
      modelosCol.createRule = regraModelosProprios
      modelosCol.updateRule = regraModelosProprios
      modelosCol.deleteRule = regraModelosProprios
      app.save(modelosCol)
    } catch (e) {
      console.log(
        'Aviso ao atualizar regras de modelos_formulario:',
        e && e.message ? e.message : String(e),
      )
    }
  },
  (app) => {
    try {
      const orcamentosCol = app.findCollectionByNameOrId('orcamentos')
      const regraGestor =
        "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id && @request.auth.papel != 'executor'"
      orcamentosCol.listRule = regraGestor
      orcamentosCol.viewRule = regraGestor
      orcamentosCol.createRule = regraGestor
      orcamentosCol.updateRule = regraGestor
      orcamentosCol.deleteRule = regraGestor
      app.save(orcamentosCol)
    } catch (_) {}
  },
)
