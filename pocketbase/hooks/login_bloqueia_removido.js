// Quem foi removido de uma equipe (equipe_remover.js) fica sem organização e
// sem papel. Se essa pessoa pedir uma senha nova e tentar entrar, o login é
// recusado com uma mensagem clara, em vez de abrir um app vazio e com erros.
// Toda conta ativa tem papel e organização (o cadastro e o convite preenchem os
// dois; a migração 0087 acertou as antigas). Não dá para liberar quem é "dono
// de alguma organização": o convite antigo criava uma organização vazia para
// cada convidado, então todo removido seria dono de uma.
onRecordAuthWithPasswordRequest((e) => {
  const r = e.record
  // Este evento roda antes da conferência da senha. Só mostra a mensagem a
  // quem acertou a senha; senha errada segue o caminho normal ("Failed to
  // authenticate"), para não revelar que o e-mail tem conta.
  if (
    r &&
    !r.getString('papel') &&
    !r.getString('organizacao_id') &&
    r.validatePassword(String(e.password || ''))
  ) {
    throw new ForbiddenError(
      'Este acesso não está mais ligado a nenhuma equipe. Fale com quem administra a conta da sua empresa.',
    )
  }
  return e.next()
}, 'users')
