// Página pública de verificação de assinatura eletrônica (etapa 3 do plano de
// perfis/assinatura). Sem login. Devolve só o que confirma a autenticidade —
// nunca o nome da empresa nem o arquivo. Por enquanto só documentos_sst
// (PGR); quando a vistoria também passar a ter PDF assinado (etapa 3d), esta
// mesma rota passa a procurar nas duas coleções.
routerAdd('GET', '/backend/v1/verificar/{chave}', (e) => {
  const chave = String(e.request.pathValue('chave') || '')
  if (!chave) return e.notFoundError('Documento não localizado')

  let doc = null
  try {
    doc = $app.findFirstRecordByFilter(
      'documentos_sst',
      'link_publico_chave = {:c} && link_publico_ativo = true && status = "emitido"',
      { c: chave },
    )
  } catch (_) {
    doc = null
  }
  if (!doc) return e.notFoundError('Documento não localizado')

  let org = null
  try {
    org = $app.findRecordById('organizacoes', doc.getString('organizacao_id'))
  } catch (_) {
    org = null
  }

  // Nome e registro de quem emitiu: procura o responsável técnico ligado a
  // esse usuário na mesma organização; sem isso, cai no nome de usuário.
  let nomeProfissional = ''
  let registroProfissional = ''
  const emissorId = doc.getString('emitido_por')
  if (emissorId) {
    try {
      const rt = $app.findFirstRecordByFilter(
        'responsaveis_tecnicos',
        'organizacao_id = {:o} && usuario_id = {:u}',
        { o: doc.getString('organizacao_id'), u: emissorId },
      )
      nomeProfissional = rt.getString('nome')
      const tipo = rt.getString('tipo_registro')
      const uf = rt.getString('uf')
      const numero = rt.getString('numero_registro')
      registroProfissional = `${tipo}${uf ? '-' + uf : ''} nº ${numero}`
    } catch (_) {
      try {
        const usuario = $app.findRecordById('users', emissorId)
        nomeProfissional = usuario.getString('name')
      } catch (__) {
        nomeProfissional = ''
      }
    }
  }

  const TIPO_LABEL = {
    pgr: 'PGR — Programa de Gerenciamento de Riscos',
    ltcat: 'LTCAT',
    insalubridade: 'Laudo de insalubridade',
    periculosidade: 'Laudo de periculosidade',
  }

  return e.json(200, {
    tipo: TIPO_LABEL[doc.getString('tipo')] || doc.getString('tipo'),
    titulo: doc.getString('titulo'),
    versao: doc.getInt('versao'),
    data_emissao: doc.getString('data_emissao'),
    assinatura_confirmada_em: doc.getString('assinatura_confirmada_em'),
    profissional: nomeProfissional,
    registro: registroProfissional,
    organizacao: (org && org.getString('nome')) || '',
    pdf_hash_sha256: doc.getString('pdf_hash_sha256'),
  })
})
