// Diariamente, organização ativa com vencimento passado vira 'vencida'
// (somente-leitura — ver bloqueio_vencida.js). Não mexe em 'trial' nem
// 'bloqueada'; sem vencimento preenchido, a organização nunca vence sozinha.
cronAdd('marcar_organizacoes_vencidas', '0 3 * * *', () => {
  const hoje = new Date().toISOString().slice(0, 10)
  const vencidas = $app.findRecordsByFilter(
    'organizacoes',
    "status = 'ativa' && vencimento != '' && vencimento < {:hoje}",
    '',
    0,
    0,
    { hoje: hoje },
  )
  for (const org of vencidas) {
    org.set('status', 'vencida')
    $app.save(org)
  }
})
