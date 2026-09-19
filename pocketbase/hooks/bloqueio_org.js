// Bloqueio real de login: usuário de organização com status 'bloqueada'
// não consegue entrar. Admin_plataforma e staff_labora nunca são bloqueados.
// REGRA CRÍTICA (guia de hooks §3.2): sempre `return e.next()` no caminho
// permitido — um return sem e.next() quebra TODOS os logins da instância.
onRecordAuthWithPasswordRequest((e) => {
  const rec = e.record
  if (rec) {
    const papel = rec.getString('papel')
    const orgId = rec.getString('organizacao_id')
    if (papel !== 'admin_plataforma' && papel !== 'staff_labora' && orgId) {
      let bloqueada = false
      try {
        const org = $app.findRecordById('organizacoes', orgId)
        bloqueada = org.getString('status') === 'bloqueada'
      } catch (_) {
        // org não encontrada — deixa o login seguir
      }
      if (bloqueada) {
        throw new BadRequestError('Organização bloqueada. Entre em contato com a Labora.')
      }
    }
  }
  return e.next()
}, 'users')
