// Lista a equipe da organização do usuário logado (dono e gerente).
// A regra da coleção users só deixa cada pessoa ver o próprio registro, por
// isso a tela Equipe mostrava "Membros (0)". Esta rota devolve só nome,
// e-mail e papel de quem é da mesma organização (sem tokens nem outros campos).
routerAdd(
  'GET',
  '/backend/v1/equipe/membros',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('auth required')
    const papel = auth.getString('papel') || 'dono'
    if (papel === 'executor') {
      return e.json(403, { error: 'Só o dono e o gestor veem a equipe.' })
    }
    const orgId = auth.getString('organizacao_id')
    if (!orgId) return e.json(200, { membros: [] })

    let donoId = ''
    try {
      donoId = $app.findRecordById('organizacoes', orgId).getString('dono_id')
    } catch (_) {
      donoId = ''
    }

    const usuarios = $app.findRecordsByFilter(
      'users',
      'organizacao_id = {:o} || id = {:d}',
      'name',
      0,
      0,
      { o: orgId, d: donoId || '___' },
    )
    const membros = usuarios.map((u) => ({
      id: u.id,
      name: u.getString('name') || u.getString('email'),
      email: u.getString('email'),
      papel: u.getString('papel') || 'dono',
    }))
    return e.json(200, { membros: membros })
  },
  $apis.requireAuth(),
)
