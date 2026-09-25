// Migração 0127: modelos de proposta.
// 1) O modelo de cinco páginas foi criado para todas as organizações com o
//    nome "Labora completo". Para os clientes, o nome passa a ser "Completo".
// 2) Algumas organizações ficaram com dois modelos marcados como favorito
//    (padrão). Fica só um: na organização da Labora (a do admin da
//    plataforma), o de cinco páginas; nas demais, o Clássico (ou o mais antigo
//    que não seja o de cinco páginas).
migrate(
  (app) => {
    const renomeados = app.findRecordsByFilter(
      'modelos_proposta',
      "nome = 'Labora completo'",
      '',
      0,
      0,
    )
    for (const m of renomeados) {
      m.set('nome', 'Completo')
      app.save(m)
    }

    let orgLabora = ''
    try {
      const admin = app.findFirstRecordByFilter('users', "papel = 'admin_plataforma'")
      orgLabora = admin.getString('organizacao_id')
    } catch (_) {
      orgLabora = ''
    }

    const favoritos = app.findRecordsByFilter('modelos_proposta', 'padrao = true', 'created', 0, 0)
    const porOrg = {}
    for (const m of favoritos) {
      const org = m.getString('organizacao_id')
      if (!porOrg[org]) porOrg[org] = []
      porOrg[org].push(m)
    }

    let ajustadas = 0
    for (const org of Object.keys(porOrg)) {
      const lista = porOrg[org]
      if (lista.length < 2) continue
      let manter = null
      if (org === orgLabora) {
        manter = lista.find((m) => m.getString('layout') === 'labora') || lista[0]
      } else {
        manter =
          lista.find((m) => m.getString('layout') === 'classico') ||
          lista.find((m) => m.getString('layout') !== 'labora') ||
          lista[0]
      }
      for (const m of lista) {
        if (m.id === manter.id) continue
        m.set('padrao', false)
        app.save(m)
      }
      ajustadas++
    }
    console.log('0127: renomeados=' + renomeados.length + ' organizacoes ajustadas=' + ajustadas)
  },
  () => {
    // Sem volta automática: favorito e nome podem ser trocados na tela.
  },
)
