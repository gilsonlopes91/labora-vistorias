// Console de contas — lista paginada de organizações com as contagens já
// calculadas em SQL (uma consulta para a página inteira, em vez de várias
// requisições por organização feitas pelo navegador).
// GET /backend/v1/admin/organizacoes?pagina=1&por_pagina=20&busca=&status=&plano=
// Acesso: admin_plataforma OU staff_labora com acesso_console.
routerAdd(
  'GET',
  '/backend/v1/admin/organizacoes',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papel = auth.getString('papel')
    const ehAdmin = papel === 'admin_plataforma'
    const ehStaffConsole = papel === 'staff_labora' && auth.getBool('acesso_console')
    if (!ehAdmin && !ehStaffConsole) return e.forbiddenError('acesso restrito')

    const q = e.request.url.query()
    const pagina = Math.max(1, parseInt(q.get('pagina') || '1', 10) || 1)
    const porPagina = Math.min(100, Math.max(5, parseInt(q.get('por_pagina') || '20', 10) || 20))
    const busca = String(q.get('busca') || '')
      .trim()
      .toLowerCase()
    const status = String(q.get('status') || '').trim()
    const plano = String(q.get('plano') || '').trim()

    // Filtros dinâmicos com parâmetros nomeados (sem concatenar valores).
    const condicoes = []
    const params = {}
    if (busca) {
      condicoes.push(
        "(LOWER(o.nome) LIKE {:busca} OR LOWER(COALESCE(d.name,'')) LIKE {:busca} OR LOWER(COALESCE(d.email,'')) LIKE {:busca})",
      )
      params.busca = '%' + busca + '%'
    }
    if (status) {
      condicoes.push("COALESCE(NULLIF(o.status,''),'ativa') = {:status}")
      params.status = status
    }
    if (plano) {
      condicoes.push('o.plano = {:plano}')
      params.plano = plano
    }
    const where = condicoes.length ? ' WHERE ' + condicoes.join(' AND ') : ''

    // A coleção ai_conversations pode não existir; a subconsulta de IA entra
    // só se ela existir, para não derrubar a listagem inteira.
    let temIa = false
    try {
      $app.findCollectionByNameOrId('ai_conversations')
      temIa = true
    } catch (_) {
      temIa = false
    }
    const subIa = temIa
      ? '(SELECT COUNT(*) FROM ai_conversations c JOIN users u2 ON u2.id = c.user_id WHERE u2.organizacao_id = o.id)'
      : '0'

    const total = new DynamicModel({ total: 0 })
    $app
      .db()
      .newQuery(
        'SELECT COUNT(*) AS total FROM organizacoes o LEFT JOIN users d ON d.id = o.dono_id' +
          where,
      )
      .bind(params)
      .one(total)

    const linhas = arrayOf(
      new DynamicModel({
        id: '',
        nome: '',
        status: '',
        created: '',
        dono_id: '',
        dono_nome: '',
        dono_email: '',
        plano: '',
        limite_usuarios: 0,
        vencimento: '',
        usuarios: 0,
        empresas: 0,
        vistorias: 0,
        perguntas_ia: 0,
      }),
    )
    $app
      .db()
      .newQuery(
        'SELECT o.id, o.nome, ' +
          "COALESCE(NULLIF(o.status,''),'ativa') AS status, " +
          'o.created, o.dono_id, ' +
          "COALESCE(d.name,'') AS dono_nome, COALESCE(d.email,'') AS dono_email, " +
          "COALESCE(o.plano,'') AS plano, COALESCE(o.limite_usuarios,0) AS limite_usuarios, " +
          "COALESCE(o.vencimento,'') AS vencimento, " +
          '(SELECT COUNT(*) FROM users u WHERE u.organizacao_id = o.id OR u.id = o.dono_id) AS usuarios, ' +
          '(SELECT COUNT(*) FROM empresas em WHERE em.organizacao_id = o.id) AS empresas, ' +
          '(SELECT COUNT(*) FROM vistorias v WHERE v.organizacao_id = o.id) AS vistorias, ' +
          subIa +
          ' AS perguntas_ia ' +
          'FROM organizacoes o LEFT JOIN users d ON d.id = o.dono_id' +
          where +
          ' ORDER BY o.created DESC LIMIT {:limite} OFFSET {:offset}',
      )
      .bind(Object.assign({}, params, { limite: porPagina, offset: (pagina - 1) * porPagina }))
      .all(linhas)

    const itens = []
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i]
      itens.push({
        id: l.id,
        nome: l.nome,
        status: l.status,
        created: l.created,
        dono_id: l.dono_id,
        dono_nome: l.dono_nome,
        dono_email: l.dono_email,
        plano: l.plano,
        limite_usuarios: l.limite_usuarios,
        vencimento: l.vencimento,
        usuarios: l.usuarios,
        empresas: l.empresas,
        vistorias: l.vistorias,
        perguntas_ia: l.perguntas_ia,
      })
    }

    return e.json(200, {
      pagina: pagina,
      por_pagina: porPagina,
      total: total.total,
      total_paginas: Math.max(1, Math.ceil(total.total / porPagina)),
      itens: itens,
    })
  },
  $apis.requireAuth(),
)
