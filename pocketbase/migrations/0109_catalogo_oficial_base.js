// Base para a correção do catálogo oficial de NRs (auditoria de 23/09/2026):
// - descricao passa a guardar o texto literal da norma (até 20.000 caracteres);
// - campo `revogado` nos itens (padrão false): itens cujo código de ementa não
//   consta no Anexo II da NR-28 vigente ficam revogados — somem de novas
//   vistorias e da calculadora, mas vistorias antigas continuam abrindo;
// - campo `secao_oficial` nos tipos de vistoria (ex.: "NR-12 - ANEXO VIII"),
//   usado como chave pela sincronização com o Anexo II da NR-28;
// - itens e tipos do catálogo global (sem organização) só podem ser criados,
//   editados ou apagados por admin_plataforma.
migrate(
  (app) => {
    const itens = app.findCollectionByNameOrId('itens_checklist')
    itens.fields.getByName('descricao').max = 20000
    if (!itens.fields.getByName('revogado')) {
      itens.fields.add(new BoolField({ name: 'revogado' }))
    }
    const regraEscrita =
      "@request.auth.id != '' && ((tipo_vistoria_id.organizacao_id != '' && (tipo_vistoria_id.organizacao_id = @request.auth.organizacao_id || tipo_vistoria_id.organizacao_id.staff_ids.id ?= @request.auth.id)) || @request.auth.papel = 'admin_plataforma')"
    itens.createRule = regraEscrita
    itens.updateRule = regraEscrita
    itens.deleteRule = regraEscrita
    app.save(itens)

    const tipos = app.findCollectionByNameOrId('tipos_vistoria')
    if (!tipos.fields.getByName('secao_oficial')) {
      tipos.fields.add(new TextField({ name: 'secao_oficial', max: 60 }))
    }
    const tiposEscrita =
      "@request.auth.id != '' && ((organizacao_id != '' && (organizacao_id = @request.auth.organizacao_id || organizacao_id.staff_ids.id ?= @request.auth.id)) || @request.auth.papel = 'admin_plataforma')"
    tipos.createRule = tiposEscrita
    tipos.updateRule = tiposEscrita
    tipos.deleteRule = tiposEscrita
    app.save(tipos)
  },
  (app) => {
    const itens = app.findCollectionByNameOrId('itens_checklist')
    itens.fields.getByName('descricao').max = 2000
    const f = itens.fields.getByName('revogado')
    if (f) itens.fields.removeById(f.id)
    app.save(itens)
    const tipos = app.findCollectionByNameOrId('tipos_vistoria')
    const s = tipos.fields.getByName('secao_oficial')
    if (s) tipos.fields.removeById(s.id)
    app.save(tipos)
  },
)
