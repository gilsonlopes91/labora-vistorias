// Congelamento do item da norma na resposta da vistoria.
// Cada resposta guarda uma cópia do item (referência, código de ementa, grau,
// tipo, texto e seção) como estava no momento em que foi respondida. Quando a
// vistoria é concluída, a cópia é atualizada uma última vez e não muda mais,
// então uma atualização futura do catálogo de NRs não altera laudos emitidos.
// As respostas já existentes recebem a cópia do item como está hoje.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('respostas_vistoria')
    const add = (f) => {
      if (!col.fields.getByName(f.name)) col.fields.add(f)
    }
    add(new TextField({ name: 'item_ref_snapshot', max: 300 }))
    add(new TextField({ name: 'codigo_snapshot', max: 20 }))
    add(new NumberField({ name: 'grau_snapshot', onlyInt: true }))
    add(new TextField({ name: 'tipo_snapshot', max: 1 }))
    add(new TextField({ name: 'descricao_snapshot', max: 20000 }))
    add(new TextField({ name: 'secao_snapshot', max: 200 }))
    add(new DateField({ name: 'snapshot_em' }))
    app.save(col)

    app
      .db()
      .newQuery(
        `UPDATE respostas_vistoria SET
          item_ref_snapshot = (SELECT i.item_ref FROM itens_checklist i WHERE i.id = respostas_vistoria.item_checklist_id),
          codigo_snapshot = (SELECT i.codigo FROM itens_checklist i WHERE i.id = respostas_vistoria.item_checklist_id),
          grau_snapshot = (SELECT i.grau FROM itens_checklist i WHERE i.id = respostas_vistoria.item_checklist_id),
          tipo_snapshot = (SELECT i.tipo FROM itens_checklist i WHERE i.id = respostas_vistoria.item_checklist_id),
          descricao_snapshot = (SELECT i.descricao FROM itens_checklist i WHERE i.id = respostas_vistoria.item_checklist_id),
          secao_snapshot = (SELECT i.secao FROM itens_checklist i WHERE i.id = respostas_vistoria.item_checklist_id),
          snapshot_em = strftime('%Y-%m-%d %H:%M:%fZ', 'now')
        WHERE item_checklist_id != '' AND (descricao_snapshot = '' OR descricao_snapshot IS NULL)`,
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('respostas_vistoria')
    for (const n of [
      'item_ref_snapshot',
      'codigo_snapshot',
      'grau_snapshot',
      'tipo_snapshot',
      'descricao_snapshot',
      'secao_snapshot',
      'snapshot_em',
    ]) {
      const f = col.fields.getByName(n)
      if (f) col.fields.removeById(f.id)
    }
    app.save(col)
  },
)
