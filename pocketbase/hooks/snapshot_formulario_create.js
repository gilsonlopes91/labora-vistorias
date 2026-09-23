// Ao criar um registro de formulário, guarda a cópia dos campos do modelo
// (campos_snapshot). Assim, se o modelo mudar depois, o registro continua
// abrindo com os campos que tinha quando foi preenchido.
onRecordCreate((e) => {
  const r = e.record
  const atual = r.get('campos_snapshot')
  if (!atual || String(atual) === 'null' || String(atual) === '') {
    const mid = r.getString('modelo_formulario_id')
    if (mid) {
      try {
        const m = e.app.findRecordById('modelos_formulario', mid)
        r.set('campos_snapshot', m.get('campos'))
      } catch (_) {
        // modelo não encontrado: segue sem cópia
      }
    }
  }
  e.next()
}, 'formularios')
