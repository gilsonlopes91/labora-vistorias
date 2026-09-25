// Quem foi removido de uma equipe (equipe_remover.js) fica sem organização e
// sem papel. Se essa pessoa pedir uma senha nova e tentar entrar, o login é
// recusado com uma mensagem clara, em vez de abrir um app vazio e com erros.
// Contas antigas sem papel, mas donas de uma organização, entram normalmente.
onRecordAuthWithPasswordRequest((e) => {
  let removido = false
  try {
    const r = e.record
    if (r && !r.getString('papel') && !r.getString('organizacao_id')) {
      let dono = false
      try {
        $app.findFirstRecordByFilter('organizacoes', 'dono_id = {:u}', { u: r.id })
        dono = true
      } catch (_) {
        dono = false
      }
      removido = !dono
    }
  } catch (_) {
    removido = false
  }
  if (removido) {
    throw new ForbiddenError(
      'Este acesso não está mais ligado a nenhuma equipe. Fale com quem administra a conta da sua empresa.',
    )
  }
  return e.next()
}, 'users')
