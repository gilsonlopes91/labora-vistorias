// Migração 0132 (lote 6 da lista de melhorias).
// - empresas: CNAE principal (itens 25) e endereço em partes (item 26). O campo
//   "endereco" continua existindo com o endereço completo numa linha, montado
//   pelo app a partir das partes, porque relatório, agenda e vistoria usam ele.
// - orcamentos: link público da proposta (item 38). O cliente abre pelo link,
//   sem login; o PDF fica num arquivo protegido e só sai pela rota do servidor
//   que confere a chave. Guarda também quantas vezes o link foi aberto.
// - vistorias: conclusão e metodologia do relatório (item 22).
migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId('empresas')
    const addE = (f) => {
      if (!empresas.fields.getByName(f.name)) empresas.fields.add(f)
    }
    addE(new TextField({ name: 'cnae', max: 12 }))
    addE(new TextField({ name: 'cnae_descricao', max: 300 }))
    addE(new TextField({ name: 'cep', max: 9 }))
    addE(new TextField({ name: 'logradouro', max: 200 }))
    addE(new TextField({ name: 'numero_endereco', max: 20 }))
    addE(new TextField({ name: 'complemento', max: 100 }))
    addE(new TextField({ name: 'bairro', max: 100 }))
    addE(new TextField({ name: 'cidade', max: 100 }))
    addE(new TextField({ name: 'uf', max: 2 }))
    app.save(empresas)

    const orc = app.findCollectionByNameOrId('orcamentos')
    const addO = (f) => {
      if (!orc.fields.getByName(f.name)) orc.fields.add(f)
    }
    addO(new TextField({ name: 'link_token', max: 64 }))
    addO(
      new FileField({
        name: 'link_pdf',
        maxSelect: 1,
        maxSize: 15728640,
        mimeTypes: ['application/pdf'],
        protected: true,
      }),
    )
    addO(new DateField({ name: 'link_gerado_em' }))
    addO(new NumberField({ name: 'link_visualizacoes', min: 0, onlyInt: true }))
    addO(new DateField({ name: 'link_primeira_visualizacao' }))
    addO(new DateField({ name: 'link_ultima_visualizacao' }))
    app.save(orc)
    // Índice único da chave (só entre as preenchidas). O campo já foi salvo
    // acima; addIndex é idempotente.
    const orc2 = app.findCollectionByNameOrId('orcamentos')
    orc2.addIndex('idx_orcamentos_link_token', true, 'link_token', "link_token != ''")
    app.save(orc2)

    const v = app.findCollectionByNameOrId('vistorias')
    const addV = (f) => {
      if (!v.fields.getByName(f.name)) v.fields.add(f)
    }
    addV(new TextField({ name: 'conclusao', max: 5000 }))
    addV(new TextField({ name: 'metodologia', max: 5000 }))
    app.save(v)
  },
  (app) => {
    const tirar = (nome, campos) => {
      const c = app.findCollectionByNameOrId(nome)
      for (const n of campos) {
        const f = c.fields.getByName(n)
        if (f) c.fields.removeById(f.id)
      }
      return c
    }
    app.save(
      tirar('empresas', [
        'cnae',
        'cnae_descricao',
        'cep',
        'logradouro',
        'numero_endereco',
        'complemento',
        'bairro',
        'cidade',
        'uf',
      ]),
    )
    const orc = tirar('orcamentos', [
      'link_token',
      'link_pdf',
      'link_gerado_em',
      'link_visualizacoes',
      'link_primeira_visualizacao',
      'link_ultima_visualizacao',
    ])
    orc.removeIndex('idx_orcamentos_link_token')
    app.save(orc)
    app.save(tirar('vistorias', ['conclusao', 'metodologia']))
  },
)
