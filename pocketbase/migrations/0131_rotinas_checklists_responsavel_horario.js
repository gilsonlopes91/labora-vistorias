// Migração 0131: rotina recorrente com os mesmos dados de uma vistoria avulsa
// (item 46 da lista de melhorias).
// - checklists: checklists além do principal (tipo_vistoria_id), como na vistoria.
// - formularios: formulários de campo que entram em toda visita.
// - responsavel_tecnico_id: quem faz as vistorias da rotina.
// - hora_inicio / duracao_min: horário das visitas (vazio = dia inteiro).
// O hook rotina_recorrencia.js copia esses campos para cada vistoria nova.
migrate(
  (app) => {
    const rotinas = app.findCollectionByNameOrId('rotinas')
    const tipos = app.findCollectionByNameOrId('tipos_vistoria')
    const modelos = app.findCollectionByNameOrId('modelos_formulario')
    const rts = app.findCollectionByNameOrId('responsaveis_tecnicos')
    const add = (f) => {
      if (!rotinas.fields.getByName(f.name)) rotinas.fields.add(f)
    }
    add(
      new RelationField({
        name: 'checklists',
        collectionId: tipos.id,
        maxSelect: 20,
        cascadeDelete: false,
      }),
    )
    add(
      new RelationField({
        name: 'formularios',
        collectionId: modelos.id,
        maxSelect: 20,
        cascadeDelete: false,
      }),
    )
    add(
      new RelationField({
        name: 'responsavel_tecnico_id',
        collectionId: rts.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    add(
      new TextField({
        name: 'hora_inicio',
        max: 5,
        pattern: '^$|^([01]\\d|2[0-3]):[0-5]\\d$',
      }),
    )
    add(new NumberField({ name: 'duracao_min', min: 0, max: 1440, onlyInt: true }))
    app.save(rotinas)
  },
  (app) => {
    const rotinas = app.findCollectionByNameOrId('rotinas')
    for (const n of [
      'checklists',
      'formularios',
      'responsavel_tecnico_id',
      'hora_inicio',
      'duracao_min',
    ]) {
      const f = rotinas.fields.getByName(n)
      if (f) rotinas.fields.removeById(f.id)
    }
    app.save(rotinas)
  },
)
