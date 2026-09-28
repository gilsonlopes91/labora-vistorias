// Console de contas — indicadores globais numa única consulta.
// GET /backend/v1/admin/resumo
routerAdd(
  'GET',
  '/backend/v1/admin/resumo',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papel = auth.getString('papel')
    const ehAdmin = papel === 'admin_plataforma'
    const ehStaffConsole = papel === 'staff_labora' && auth.getBool('acesso_console')
    if (!ehAdmin && !ehStaffConsole) return e.forbiddenError('acesso restrito')

    let temIa = false
    try {
      $app.findCollectionByNameOrId('ai_conversations')
      temIa = true
    } catch (_) {
      temIa = false
    }

    const r = new DynamicModel({
      organizacoes: 0,
      ativas: 0,
      bloqueadas: 0,
      vencidas: 0,
      trial: 0,
      vencem_30_dias: 0,
      usuarios: 0,
      empresas: 0,
      vistorias: 0,
      perguntas_ia: 0,
      lista_espera: 0,
    })

    let temListaEspera = false
    try {
      $app.findCollectionByNameOrId('lista_espera')
      temListaEspera = true
    } catch (_) {
      temListaEspera = false
    }

    $app
      .db()
      .newQuery(
        'SELECT ' +
          '(SELECT COUNT(*) FROM organizacoes) AS organizacoes, ' +
          "(SELECT COUNT(*) FROM organizacoes WHERE COALESCE(NULLIF(status,''),'ativa') = 'ativa') AS ativas, " +
          "(SELECT COUNT(*) FROM organizacoes WHERE status = 'bloqueada') AS bloqueadas, " +
          "(SELECT COUNT(*) FROM organizacoes WHERE status = 'vencida') AS vencidas, " +
          "(SELECT COUNT(*) FROM organizacoes WHERE status = 'trial') AS trial, " +
          "(SELECT COUNT(*) FROM organizacoes WHERE vencimento != '' AND vencimento IS NOT NULL AND date(vencimento) >= date('now') AND date(vencimento) <= date('now','+30 days')) AS vencem_30_dias, " +
          "(SELECT COUNT(*) FROM users WHERE papel NOT IN ('admin_plataforma','staff_labora','cliente')) AS usuarios, " +
          '(SELECT COUNT(*) FROM empresas) AS empresas, ' +
          '(SELECT COUNT(*) FROM vistorias) AS vistorias, ' +
          (temIa ? '(SELECT COUNT(*) FROM ai_conversations)' : '0') +
          ' AS perguntas_ia, ' +
          (temListaEspera ? '(SELECT COUNT(*) FROM lista_espera)' : '0') +
          ' AS lista_espera',
      )
      .one(r)

    // Últimas ações do console (para a visão geral).
    const atividades = []
    try {
      const regs = $app.findRecordsByFilter('admin_atividades', "id != ''", '-created', 15, 0)
      for (const a of regs) {
        let orgNome = ''
        try {
          const org = $app.findRecordById('organizacoes', a.getString('organizacao_id'))
          orgNome = org.getString('nome')
        } catch (_) {
          orgNome = ''
        }
        atividades.push({
          id: a.id,
          organizacao_id: a.getString('organizacao_id'),
          organizacao_nome: orgNome,
          usuario_nome: a.getString('usuario_nome'),
          acao: a.getString('acao'),
          descricao: a.getString('descricao'),
          created: a.getString('created'),
        })
      }
    } catch (_) {
      // coleção ainda não migrada — segue sem histórico
    }

    return e.json(200, {
      organizacoes: r.organizacoes,
      ativas: r.ativas,
      bloqueadas: r.bloqueadas,
      vencidas: r.vencidas,
      trial: r.trial,
      vencem_30_dias: r.vencem_30_dias,
      usuarios: r.usuarios,
      empresas: r.empresas,
      vistorias: r.vistorias,
      perguntas_ia: r.perguntas_ia,
      lista_espera: r.lista_espera,
      atividades: atividades,
    })
  },
  $apis.requireAuth(),
)
