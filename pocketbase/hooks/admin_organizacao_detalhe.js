// Console de contas — tudo o que a página de uma organização precisa, numa
// única chamada: dados, dono, módulos, contagens, membros, staff vinculado,
// uso por mês (vistorias e perguntas de IA nos últimos 6 meses) e histórico.
// GET /backend/v1/admin/organizacoes/{id}
routerAdd(
  'GET',
  '/backend/v1/admin/organizacoes/{id}',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papel = auth.getString('papel')
    const ehAdmin = papel === 'admin_plataforma'
    const ehStaffConsole = papel === 'staff_labora' && auth.getBool('acesso_console')
    if (!ehAdmin && !ehStaffConsole) return e.forbiddenError('acesso restrito')

    const id = e.request.pathValue('id')
    let org
    try {
      org = $app.findRecordById('organizacoes', id)
    } catch (_) {
      return e.notFoundError('organização não encontrada')
    }

    // Staff só abre organizações que atende.
    if (!ehAdmin && org.getStringSlice('staff_ids').indexOf(auth.id) < 0) {
      return e.forbiddenError('Esta organização não é atendida por você.')
    }

    // Módulos (JSON guardado como string).
    let modulos = {}
    try {
      const raw = org.get('modulos')
      const txt = raw ? toString(raw) : ''
      let lido = txt ? JSON.parse(txt) : {}
      if (typeof lido === 'string') lido = JSON.parse(lido)
      if (lido && typeof lido === 'object') modulos = lido
    } catch (_) {
      modulos = {}
    }

    // Dono.
    let dono = null
    try {
      const d = $app.findRecordById('users', org.getString('dono_id'))
      dono = { id: d.id, name: d.getString('name'), email: d.getString('email') }
    } catch (_) {
      dono = null
    }

    // Contagens.
    let temIa = false
    try {
      $app.findCollectionByNameOrId('ai_conversations')
      temIa = true
    } catch (_) {
      temIa = false
    }
    const c = new DynamicModel({
      usuarios: 0,
      empresas: 0,
      vistorias: 0,
      vistorias_concluidas: 0,
      perguntas_ia: 0,
      documentos: 0,
      orcamentos: 0,
    })
    let temDocs = false
    let temOrc = false
    try {
      $app.findCollectionByNameOrId('documentos_sst')
      temDocs = true
    } catch (_) {
      temDocs = false
    }
    try {
      $app.findCollectionByNameOrId('orcamentos')
      temOrc = true
    } catch (_) {
      temOrc = false
    }
    $app
      .db()
      .newQuery(
        'SELECT ' +
          '(SELECT COUNT(*) FROM users u WHERE u.organizacao_id = {:org} OR u.id = {:dono}) AS usuarios, ' +
          '(SELECT COUNT(*) FROM empresas em WHERE em.organizacao_id = {:org}) AS empresas, ' +
          '(SELECT COUNT(*) FROM vistorias v WHERE v.organizacao_id = {:org}) AS vistorias, ' +
          "(SELECT COUNT(*) FROM vistorias v WHERE v.organizacao_id = {:org} AND v.status = 'concluida') AS vistorias_concluidas, " +
          (temIa
            ? '(SELECT COUNT(*) FROM ai_conversations ac JOIN users u2 ON u2.id = ac.user_id WHERE u2.organizacao_id = {:org})'
            : '0') +
          ' AS perguntas_ia, ' +
          (temDocs
            ? '(SELECT COUNT(*) FROM documentos_sst ds WHERE ds.organizacao_id = {:org})'
            : '0') +
          ' AS documentos, ' +
          (temOrc ? '(SELECT COUNT(*) FROM orcamentos oc WHERE oc.organizacao_id = {:org})' : '0') +
          ' AS orcamentos',
      )
      .bind({ org: org.id, dono: org.getString('dono_id') || '__nenhum__' })
      .one(c)

    // Uso por mês (últimos 6 meses).
    const usoVistorias = arrayOf(new DynamicModel({ mes: '', total: 0 }))
    $app
      .db()
      .newQuery(
        "SELECT strftime('%Y-%m', created) AS mes, COUNT(*) AS total FROM vistorias " +
          "WHERE organizacao_id = {:org} AND created >= date('now','-6 months') GROUP BY mes ORDER BY mes",
      )
      .bind({ org: org.id })
      .all(usoVistorias)
    const usoIa = arrayOf(new DynamicModel({ mes: '', total: 0 }))
    if (temIa) {
      $app
        .db()
        .newQuery(
          "SELECT strftime('%Y-%m', ac.created) AS mes, COUNT(*) AS total FROM ai_conversations ac " +
            'JOIN users u2 ON u2.id = ac.user_id ' +
            "WHERE u2.organizacao_id = {:org} AND ac.created >= date('now','-6 months') GROUP BY mes ORDER BY mes",
        )
        .bind({ org: org.id })
        .all(usoIa)
    }
    const uso = {}
    for (let i = 0; i < usoVistorias.length; i++) {
      uso[usoVistorias[i].mes] = {
        mes: usoVistorias[i].mes,
        vistorias: usoVistorias[i].total,
        perguntas_ia: 0,
      }
    }
    for (let i = 0; i < usoIa.length; i++) {
      const m = usoIa[i].mes
      if (!uso[m]) uso[m] = { mes: m, vistorias: 0, perguntas_ia: 0 }
      uso[m].perguntas_ia = usoIa[i].total
    }
    const usoMensal = Object.keys(uso)
      .sort()
      .map((k) => uso[k])

    // Membros da organização.
    const membros = []
    try {
      const regs = $app.findRecordsByFilter(
        'users',
        'organizacao_id = {:org} || id = {:dono}',
        'name',
        200,
        0,
        { org: org.id, dono: org.getString('dono_id') || '__nenhum__' },
      )
      for (const u of regs) {
        membros.push({
          id: u.id,
          name: u.getString('name'),
          email: u.getString('email'),
          papel: u.getString('papel'),
          nivel_acesso: u.getString('nivel_acesso'),
          created: u.getString('created'),
          eh_dono: u.id === org.getString('dono_id'),
        })
      }
    } catch (_) {
      // sem membros
    }

    // Staff Labora vinculado.
    const staff = []
    const staffIds = org.getStringSlice('staff_ids')
    for (let i = 0; i < staffIds.length; i++) {
      try {
        const s = $app.findRecordById('users', staffIds[i])
        staff.push({ id: s.id, name: s.getString('name'), email: s.getString('email') })
      } catch (_) {
        // usuário removido
      }
    }

    // Histórico de ações do console nesta organização.
    const atividades = []
    try {
      const regs = $app.findRecordsByFilter(
        'admin_atividades',
        'organizacao_id = {:org}',
        '-created',
        50,
        0,
        { org: org.id },
      )
      for (const a of regs) {
        atividades.push({
          id: a.id,
          usuario_nome: a.getString('usuario_nome'),
          acao: a.getString('acao'),
          descricao: a.getString('descricao'),
          detalhes: a.get('detalhes'),
          created: a.getString('created'),
        })
      }
    } catch (_) {
      // coleção ainda não migrada
    }

    return e.json(200, {
      id: org.id,
      nome: org.getString('nome'),
      status: org.getString('status') || 'ativa',
      created: org.getString('created'),
      plano: org.getString('plano'),
      limite_usuarios: org.getInt('limite_usuarios'),
      vencimento: org.getString('vencimento'),
      logo: org.getString('logo'),
      dono: dono,
      modulos: modulos,
      contagens: {
        usuarios: c.usuarios,
        empresas: c.empresas,
        vistorias: c.vistorias,
        vistorias_concluidas: c.vistorias_concluidas,
        perguntas_ia: c.perguntas_ia,
        documentos: c.documentos,
        orcamentos: c.orcamentos,
      },
      uso_mensal: usoMensal,
      membros: membros,
      staff: staff,
      atividades: atividades,
      pode_editar: ehAdmin,
    })
  },
  $apis.requireAuth(),
)
