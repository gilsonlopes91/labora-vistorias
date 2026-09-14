// Valida regra de negócio ao finalizar vistoria:
// Só é possível transicionar o status para "concluida" se a vistoria tiver:
// - Pelo menos um checklist (tipo_vistoria_id ou checklists[] adicional)
// OU
// - Pelo menos um formulário de campo vinculado (formularios[]).
onRecordUpdate((e) => {
  const record = e.record
  if (record.getString('status') !== 'concluida') {
    e.next()
    return
  }

  // Verifica se a vistoria possui checklist principal
  const tipoVistoriaId = record.getString('tipo_vistoria_id')
  const temPrincipal = !!tipoVistoriaId

  // Verifica se possui checklists adicionais (relação multi)
  let temChecklistsMulti = false
  try {
    const chk = record.get('checklists')
    if (Array.isArray(chk) && chk.length > 0) {
      temChecklistsMulti = true
    }
  } catch (_) {
    temChecklistsMulti = false
  }

  // Verifica se possui formulários de campo (relação multi)
  let temFormularios = false
  try {
    const forms = record.get('formularios')
    if (Array.isArray(forms) && forms.length > 0) {
      temFormularios = true
    }
  } catch (_) {
    temFormularios = false
  }

  if (!temPrincipal && !temChecklistsMulti && !temFormularios) {
    throw new BadRequestError(
      'Não é possível finalizar a vistoria: é necessário ter ao menos um checklist ou um formulário de campo para finalizar.',
    )
  }

  e.next()
}, 'vistorias')
