// Valida regra de negócio ao finalizar vistoria:
// Só é possível transicionar o status para "concluida" (ou "aguardando_revisao",
// que segue a mesma regra) se a vistoria tiver:
// - Pelo menos um checklist (tipo_vistoria_id ou checklists[] adicional)
// OU
// - Pelo menos um formulário de campo vinculado (formularios[]).
//
// Revisão obrigatória: se a organização exige (organizacoes.
// revisao_obrigatoria_tecnico) e quem está concluindo é o técnico, a vistoria
// não vai direto para "concluida" — vai para "aguardando_revisao", até o
// gestor aprovar pela rota /backend/v1/vistorias/{id}/revisar.
onRecordUpdateRequest((e) => {
  const record = e.record
  const eraConcluida = record.original().getString('status') === 'concluida'

  if (record.getString('status') === 'concluida' && !eraConcluida) {
    try {
      const papel = e.auth ? e.auth.getString('papel') : ''
      if (papel === 'executor') {
        const org = e.app.findRecordById('organizacoes', record.getString('organizacao_id'))
        if (org.getBool('revisao_obrigatoria_tecnico')) {
          record.set('status', 'aguardando_revisao')
        }
      }
    } catch (_) {
      // se não der para checar a organização, segue concluindo direto
    }
  }

  const statusFinal = record.getString('status')
  if (statusFinal !== 'concluida' && statusFinal !== 'aguardando_revisao') {
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
