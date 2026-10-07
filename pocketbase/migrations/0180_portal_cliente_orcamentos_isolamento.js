// 0180: fechamento das falhas de isolamento achadas na auditoria de 07/10/2026
// (claude/labora-vistoria-auditoria-isolamento-empresa-2026-10-07.md).
//
// 1) orcamentos: o cliente do portal deixa de ler a coleção direto (via API ele
//    alcançava rascunhos, motivo de recusa, follow-up e financeiro). O portal
//    passa a usar GET /backend/v1/cliente/empresa/{empresa}/orcamentos, que
//    devolve só as propostas enviadas e só os campos próprios do cliente.
// 2) acessos_cliente: apaga os acessos já revogados (ativo = false). As regras
//    de leitura do portal olham todos os acessos da empresa, então um acesso
//    inativo parado ali tirava o acesso dos outros usuários da mesma empresa.
//    A partir de agora a revogação apaga o registro (cliente_revogar.js).
migrate(
  (app) => {
    const regra = "@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id"

    const orcamentos = app.findCollectionByNameOrId('orcamentos')
    orcamentos.listRule = regra
    orcamentos.viewRule = regra
    app.save(orcamentos)

    let revogados = []
    try {
      revogados = app.findRecordsByFilter('acessos_cliente', 'ativo = false', '', 0, 0)
    } catch (_) {
      revogados = []
    }
    for (const acesso of revogados) {
      app.delete(acesso)
    }
  },
  (app) => {
    // Volta a regra anterior de leitura dos orçamentos. Os acessos revogados
    // apagados não voltam (eram só registros inativos).
    const regraAnterior =
      "(@request.auth.id != '' && organizacao_id = @request.auth.organizacao_id) || (empresa_id.acessos_cliente_via_empresa_id.usuario_id ?= @request.auth.id && empresa_id.acessos_cliente_via_empresa_id.ativo = true)"
    const orcamentos = app.findCollectionByNameOrId('orcamentos')
    orcamentos.listRule = regraAnterior
    orcamentos.viewRule = regraAnterior
    app.save(orcamentos)
  },
)
