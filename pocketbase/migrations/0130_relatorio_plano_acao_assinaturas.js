// Migração 0130: campos do relatório da vistoria (item 22 da lista de melhorias).
// - respostas_vistoria.recomendacao / prazo_adequacao: plano de ação de cada
//   item não conforme (o que fazer e até quando).
// - vistorias.acompanhante_nome / acompanhante_cargo: quem acompanhou a
//   vistoria pela empresa (assina o relatório junto com o RT).
// - vistorias.art_numero: nº da ART do serviço, quando houver.
// - vistorias.rt_assinante_id: responsável técnico que assinou ao finalizar
//   (usado para achar a assinatura dele ao gerar o PDF de novo).
// - responsaveis_tecnicos.assinatura: imagem da assinatura do RT. Arquivo
//   protegido: só abre para quem está logado.
// - organizacoes.dados_documentos: razão social, CNPJ, contato, endereço e
//   dados bancários da organização, usados nas propostas e no relatório
//   (item 36). O modelo de proposta pode sobrescrever cada campo.
migrate(
  (app) => {
    const org = app.findCollectionByNameOrId('organizacoes')
    if (!org.fields.getByName('dados_documentos')) {
      org.fields.add(new JSONField({ name: 'dados_documentos', maxSize: 20000 }))
      app.save(org)
    }

    const r = app.findCollectionByNameOrId('respostas_vistoria')
    if (!r.fields.getByName('recomendacao'))
      r.fields.add(new TextField({ name: 'recomendacao', max: 2000 }))
    if (!r.fields.getByName('prazo_adequacao'))
      r.fields.add(new DateField({ name: 'prazo_adequacao' }))
    app.save(r)

    const rts = app.findCollectionByNameOrId('responsaveis_tecnicos')
    if (!rts.fields.getByName('assinatura')) {
      rts.fields.add(
        new FileField({
          name: 'assinatura',
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          protected: true,
        }),
      )
      app.save(rts)
    }

    const v = app.findCollectionByNameOrId('vistorias')
    const add = (f) => {
      if (!v.fields.getByName(f.name)) v.fields.add(f)
    }
    add(new TextField({ name: 'acompanhante_nome', max: 150 }))
    add(new TextField({ name: 'acompanhante_cargo', max: 100 }))
    add(new TextField({ name: 'art_numero', max: 60 }))
    add(
      new RelationField({
        name: 'rt_assinante_id',
        collectionId: rts.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(v)
  },
  (app) => {
    const tirar = (nome, campos) => {
      const c = app.findCollectionByNameOrId(nome)
      for (const n of campos) {
        const f = c.fields.getByName(n)
        if (f) c.fields.removeById(f.id)
      }
      app.save(c)
    }
    tirar('organizacoes', ['dados_documentos'])
    tirar('respostas_vistoria', ['recomendacao', 'prazo_adequacao'])
    tirar('responsaveis_tecnicos', ['assinatura'])
    tirar('vistorias', ['acompanhante_nome', 'acompanhante_cargo', 'art_numero', 'rt_assinante_id'])
  },
)
