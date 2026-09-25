// Vistoria concluída tem relatório assinado pelo responsável técnico. A partir
// da conclusão, nada que vá para o relatório pode ser alterado pela API:
// - a própria vistoria (status, datas, RT, opções);
// - as respostas do checklist (situação, observação, fotos);
// - os registros de formulário de campo vinculados a ela.
// Para corrigir, dono ou gerente usam a rota de reabertura
// (/backend/v1/vistorias/{id}/reabrir), que registra quem reabriu, quando e
// por quê. Excluir vistoria concluída fica bloqueado (só a administração da
// plataforma pode, em caso excepcional).
//
// Obs.: hooks do Skip Cloud não compartilham funções de nível de arquivo entre
// callbacks — por isso a verificação se repete em cada um.

onRecordUpdateRequest((e) => {
  if (e.record.original().getString('status') === 'concluida') {
    throw new BadRequestError(
      'Esta vistoria está concluída e não pode ser alterada. Para corrigir, use "Reabrir vistoria".',
    )
  }
  e.next()
}, 'vistorias')

onRecordDeleteRequest((e) => {
  if (e.record.getString('status') === 'concluida') {
    const papel = e.auth ? e.auth.getString('papel') : ''
    if (papel !== 'admin_plataforma') {
      throw new BadRequestError(
        'Vistoria concluída não pode ser excluída, porque o relatório já foi assinado.',
      )
    }
  }
  e.next()
}, 'vistorias')

onRecordCreateRequest((e) => {
  let concluida = false
  try {
    const v = $app.findRecordById('vistorias', e.record.getString('vistoria_id'))
    concluida = v.getString('status') === 'concluida'
  } catch (_) {
    concluida = false
  }
  if (concluida) {
    throw new BadRequestError(
      'Esta vistoria está concluída e não pode ser alterada. Para corrigir, use "Reabrir vistoria".',
    )
  }
  e.next()
}, 'respostas_vistoria')

onRecordUpdateRequest((e) => {
  let concluida = false
  try {
    const v = $app.findRecordById('vistorias', e.record.original().getString('vistoria_id'))
    concluida = v.getString('status') === 'concluida'
  } catch (_) {
    concluida = false
  }
  if (concluida) {
    throw new BadRequestError(
      'Esta vistoria está concluída e não pode ser alterada. Para corrigir, use "Reabrir vistoria".',
    )
  }
  e.next()
}, 'respostas_vistoria')

onRecordDeleteRequest((e) => {
  let concluida = false
  try {
    const v = $app.findRecordById('vistorias', e.record.getString('vistoria_id'))
    concluida = v.getString('status') === 'concluida'
  } catch (_) {
    concluida = false
  }
  if (concluida) {
    throw new BadRequestError(
      'Esta vistoria está concluída e não pode ser alterada. Para corrigir, use "Reabrir vistoria".',
    )
  }
  e.next()
}, 'respostas_vistoria')

onRecordCreateRequest((e) => {
  const vid = e.record.getString('vistoria_id')
  let concluida = false
  if (vid) {
    try {
      const v = $app.findRecordById('vistorias', vid)
      concluida = v.getString('status') === 'concluida'
    } catch (_) {
      concluida = false
    }
  }
  if (concluida) {
    throw new BadRequestError(
      'Esta vistoria está concluída e não pode ser alterada. Para corrigir, use "Reabrir vistoria".',
    )
  }
  e.next()
}, 'formularios')

onRecordUpdateRequest((e) => {
  const vid = e.record.original().getString('vistoria_id')
  let concluida = false
  if (vid) {
    try {
      const v = $app.findRecordById('vistorias', vid)
      concluida = v.getString('status') === 'concluida'
    } catch (_) {
      concluida = false
    }
  }
  if (concluida) {
    throw new BadRequestError(
      'Este formulário faz parte de uma vistoria concluída e não pode ser alterado. Para corrigir, reabra a vistoria.',
    )
  }
  e.next()
}, 'formularios')

onRecordDeleteRequest((e) => {
  const vid = e.record.getString('vistoria_id')
  let concluida = false
  if (vid) {
    try {
      const v = $app.findRecordById('vistorias', vid)
      concluida = v.getString('status') === 'concluida'
    } catch (_) {
      concluida = false
    }
  }
  if (concluida) {
    throw new BadRequestError(
      'Este formulário faz parte de uma vistoria concluída e não pode ser excluído.',
    )
  }
  e.next()
}, 'formularios')
