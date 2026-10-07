// Integridade entre empresa e organização. Nas coleções que guardam
// organizacao_id e empresa_id, o registro só pode apontar para uma empresa da
// mesma organização, e não pode ser movido para outra organização depois de
// criado. As regras de acesso conferem a organização de quem grava, mas não a
// da empresa informada; sem esta checagem, quem conhecesse o id de uma empresa
// de outra organização conseguiria gravar um registro apontando para ela.
// Só confere quando a empresa ou a organização mudam (ou no registro novo),
// então registros antigos continuam editáveis.
onRecordCreate(
  (e) => {
    const r = e.record
    const empresaId = r.getString('empresa_id')
    if (empresaId) {
      let empresa = null
      try {
        empresa = e.app.findRecordById('empresas', empresaId)
      } catch (_) {
        empresa = null
      }
      if (empresa && empresa.getString('organizacao_id') !== r.getString('organizacao_id')) {
        throw new BadRequestError('A empresa escolhida não pertence à sua organização.')
      }
    }
    return e.next()
  },
  'vistorias',
  'orcamentos',
  'formularios',
  'documentos_sst',
  'rotinas',
)

onRecordUpdate(
  (e) => {
    const r = e.record
    const antes = r.original()
    const orgAntes = antes.getString('organizacao_id')
    const orgDepois = r.getString('organizacao_id')
    if (orgDepois !== orgAntes) {
      throw new BadRequestError('Não é permitido mover o registro para outra organização.')
    }
    const empresaAntes = antes.getString('empresa_id')
    const empresaDepois = r.getString('empresa_id')
    if (empresaDepois && empresaDepois !== empresaAntes) {
      let empresa = null
      try {
        empresa = e.app.findRecordById('empresas', empresaDepois)
      } catch (_) {
        empresa = null
      }
      if (empresa && empresa.getString('organizacao_id') !== orgDepois) {
        throw new BadRequestError('A empresa escolhida não pertence à sua organização.')
      }
    }
    return e.next()
  },
  'vistorias',
  'orcamentos',
  'formularios',
  'documentos_sst',
  'rotinas',
)
