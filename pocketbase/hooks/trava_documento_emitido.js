// Documento SST emitido é assinado: a partir da emissão o conteúdo não muda
// pela API. Para alterar, cria-se uma nova revisão (rascunho novo ligado ao
// anterior). Depois de emitido só passam duas mudanças: o status ir para
// "substituido" (quando a revisão seguinte é emitida) e ligar/desligar o link
// público de conferência.
// Excluir documento emitido, ou empresa que tenha documento emitido ou
// vistoria concluída, fica bloqueado (a exclusão da empresa apagaria os
// documentos em cascata). Só a administração da plataforma pode, em caso
// excepcional.
//
// Obs.: hooks do Skip Cloud não compartilham funções de nível de arquivo entre
// callbacks — por isso cada callback traz a lógica inteira.

onRecordUpdateRequest((e) => {
  const antes = e.record.original()
  const statusAntes = antes.getString('status')
  if (statusAntes === 'emitido' || statusAntes === 'substituido') {
    const statusDepois = e.record.getString('status')
    const statusOk =
      statusDepois === statusAntes || (statusAntes === 'emitido' && statusDepois === 'substituido')
    const CAMPOS = [
      'organizacao_id',
      'empresa_id',
      'tipo',
      'titulo',
      'versao',
      'secoes',
      'pdf',
      'pdf_hash_sha256',
      'dados_emissao',
      'data_emissao',
      'emitido_por',
      'assinatura_confirmada_em',
      'link_publico_chave',
      'matriz_snapshot',
      'campos_manuais',
      'alternativas',
      'blocos_config',
      'autor_rt_id',
      'coordenador_rt_id',
      'numero_art',
      'data_levantamento',
      'cidade_emissao',
      'elaboradores',
    ]
    let mudou = false
    for (let i = 0; i < CAMPOS.length; i++) {
      if (antes.getString(CAMPOS[i]) !== e.record.getString(CAMPOS[i])) {
        mudou = true
        break
      }
    }
    if (!statusOk || mudou) {
      throw new BadRequestError(
        'Este documento já foi emitido e não pode ser alterado. Para mudar, crie uma nova revisão.',
      )
    }
  }
  e.next()
}, 'documentos_sst')

onRecordDeleteRequest((e) => {
  const status = e.record.getString('status')
  if (status === 'emitido' || status === 'substituido') {
    const papel = e.auth ? e.auth.getString('papel') : ''
    if (papel !== 'admin_plataforma') {
      throw new BadRequestError('Documento emitido não pode ser excluído, porque já foi assinado.')
    }
  }
  e.next()
}, 'documentos_sst')

onRecordDeleteRequest((e) => {
  const papel = e.auth ? e.auth.getString('papel') : ''
  if (papel !== 'admin_plataforma') {
    if (papel === 'executor' || papel === 'administrativo' || papel === 'cliente') {
      throw new ForbiddenError('Só o dono ou o gerente da organização pode excluir uma empresa.')
    }
    let temDocumento = false
    let temVistoria = false
    try {
      temDocumento =
        $app.findRecordsByFilter(
          'documentos_sst',
          "empresa_id = {:e} && (status = 'emitido' || status = 'substituido')",
          '',
          1,
          0,
          { e: e.record.id },
        ).length > 0
    } catch (_) {
      temDocumento = false
    }
    try {
      temVistoria =
        $app.findRecordsByFilter(
          'vistorias',
          "empresa_id = {:e} && status = 'concluida'",
          '',
          1,
          0,
          { e: e.record.id },
        ).length > 0
    } catch (_) {
      temVistoria = false
    }
    if (temDocumento || temVistoria) {
      throw new BadRequestError(
        'Esta empresa tem documento emitido ou vistoria concluída e não pode ser excluída, porque os documentos assinados seriam apagados junto.',
      )
    }
  }
  e.next()
}, 'empresas')
