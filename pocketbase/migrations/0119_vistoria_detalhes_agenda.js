// Detalhes do agendamento que vão para a descrição do evento no Google Agenda
// (e Outlook/iPhone). Todos opcionais.
// - hora_inicio: "HH:MM". Sem hora, o evento continua como "dia inteiro".
// - duracao_min: duração prevista em minutos (padrão 2h quando há hora).
// - local_vistoria: endereço/unidade da visita, quando difere do cadastro.
// - contato_local_nome / contato_local_telefone: quem recebe a equipe.
// - equipe_apoio: outros técnicos que vão junto.
// - equipamentos: instrumentos e EPIs a levar.
// - orientacoes_equipe: recados para a equipe (portaria, crachá, ASO...).
//   Separado de observacoes_gerais, que é usado no relatório da vistoria.
// users.agenda_app_url: endereço do app, para o link "Abrir no app" no evento.
migrate(
  (app) => {
    const v = app.findCollectionByNameOrId('vistorias')
    const add = (f) => {
      if (!v.fields.getByName(f.name)) v.fields.add(f)
    }
    add(new TextField({ name: 'hora_inicio', max: 5, pattern: '^$|^([01]\\d|2[0-3]):[0-5]\\d$' }))
    add(new NumberField({ name: 'duracao_min', min: 0, max: 1440, onlyInt: true }))
    add(new TextField({ name: 'local_vistoria', max: 300 }))
    add(new TextField({ name: 'contato_local_nome', max: 120 }))
    add(new TextField({ name: 'contato_local_telefone', max: 40 }))
    add(new TextField({ name: 'equipe_apoio', max: 300 }))
    add(new TextField({ name: 'equipamentos', max: 500 }))
    add(new TextField({ name: 'orientacoes_equipe', max: 1000 }))
    app.save(v)

    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('agenda_app_url'))
      users.fields.add(new TextField({ name: 'agenda_app_url', max: 200 }))
    app.save(users)
  },
  (app) => {
    const v = app.findCollectionByNameOrId('vistorias')
    for (const n of [
      'hora_inicio',
      'duracao_min',
      'local_vistoria',
      'contato_local_nome',
      'contato_local_telefone',
      'equipe_apoio',
      'equipamentos',
      'orientacoes_equipe',
    ]) {
      const f = v.fields.getByName(n)
      if (f) v.fields.removeById(f.id)
    }
    app.save(v)
    const users = app.findCollectionByNameOrId('users')
    const f = users.fields.getByName('agenda_app_url')
    if (f) users.fields.removeById(f.id)
    app.save(users)
  },
)
