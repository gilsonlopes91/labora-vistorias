// Formulário preenchido dentro de uma vistoria herda a empresa da vistoria
// quando chega sem empresa. Assim nenhum registro fica solto na organização e
// todos aparecem na página da empresa.
onRecordCreate((e) => {
  const r = e.record
  const vistoriaId = r.getString('vistoria_id')
  if (!r.getString('empresa_id') && vistoriaId) {
    try {
      const v = e.app.findRecordById('vistorias', vistoriaId)
      const empresaId = v.getString('empresa_id')
      if (empresaId && v.getString('organizacao_id') === r.getString('organizacao_id')) {
        r.set('empresa_id', empresaId)
      }
    } catch (_) {
      // vistoria não encontrada: segue sem empresa
    }
  }
  return e.next()
}, 'formularios')
