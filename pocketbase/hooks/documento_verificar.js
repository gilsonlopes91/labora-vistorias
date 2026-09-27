// Página pública de verificação de assinatura eletrônica (etapa 3 do plano de
// perfis/assinatura). Sem login. Devolve só o que confirma a autenticidade —
// nunca o nome da empresa nem o arquivo. Procura primeiro em documentos_sst
// (PGR/LTCAT/laudos) e, se não achar, em vistorias (relatório assinado).
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

  if (doc) {
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
  }

  // Não achou em documentos_sst — procura em vistorias (relatório assinado).
  let vistoria = null
  try {
    vistoria = $app.findFirstRecordByFilter(
      'vistorias',
      'link_publico_chave = {:c} && link_publico_ativo = true && status = "concluida"',
      { c: chave },
    )
  } catch (_) {
    vistoria = null
  }
  if (!vistoria) return e.notFoundError('Documento não localizado')

  let orgVistoria = null
  try {
    orgVistoria = $app.findRecordById('organizacoes', vistoria.getString('organizacao_id'))
  } catch (_) {
    orgVistoria = null
  }

  let tituloVistoria = 'Relatório de vistoria'
  try {
    const tipoVistoria = $app.findRecordById(
      'tipos_vistoria',
      vistoria.getString('tipo_vistoria_id'),
    )
    if (tipoVistoria.getString('nome')) {
      tituloVistoria = `Relatório de vistoria — ${tipoVistoria.getString('nome')}`
    }
  } catch (_) {
    // segue com o título genérico
  }

  return e.json(200, {
    tipo: 'Relatório de vistoria',
    titulo: tituloVistoria,
    versao: 1,
    data_emissao: vistoria.getString('data_realizada') || vistoria.getString('created'),
    assinatura_confirmada_em: vistoria.getString('assinatura_confirmada_em'),
    profissional: vistoria.getString('responsavel_tecnico_nome'),
    registro: vistoria.getString('responsavel_tecnico_registro'),
    organizacao: (orgVistoria && orgVistoria.getString('nome')) || '',
    pdf_hash_sha256: vistoria.getString('pdf_hash_sha256'),
  })
})
