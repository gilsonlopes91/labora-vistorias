// 0157: relatório de vistoria salvo no servidor com assinatura eletrônica
// (etapa 3d) — mesmo padrão de documentos_sst (migration 0148/0156): PDF
// protegido, hash SHA-256, confirmação por senha e link público de
// verificação. A trava de vistoria concluída (trava_vistoria_concluida.js)
// já bloqueia edição a partir do status "concluida" olhando o status
// ORIGINAL do registro — então enviar o PDF junto com a mudança de status
// (numa única requisição) não precisa de exceção nova nesse hook.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    const add = (f) => {
      if (!col.fields.getByName(f.name)) col.fields.add(f)
    }
    add(new FileField({ name: 'pdf', maxSelect: 1, maxSize: 20971520, protected: true }))
    add(new TextField({ name: 'pdf_hash_sha256', max: 100 }))
    add(new DateField({ name: 'assinatura_confirmada_em', required: false }))
    add(new TextField({ name: 'link_publico_chave', max: 60 }))
    add(new BoolField({ name: 'link_publico_ativo', required: false }))
    app.save(col)

    col.addIndex(
      'idx_vistorias_link_publico',
      true,
      'link_publico_chave',
      "link_publico_chave != ''",
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vistorias')
    col.removeIndex('idx_vistorias_link_publico')
    for (const nome of [
      'pdf',
      'pdf_hash_sha256',
      'assinatura_confirmada_em',
      'link_publico_chave',
      'link_publico_ativo',
    ]) {
      if (col.fields.getByName(nome)) col.fields.removeByName(nome)
    }
    app.save(col)
  },
)
