// Rota pública (sem login): lista o catálogo fixo de NRs (organizacao_id vazio)
// para a calculadora pública. Somente leitura, dados públicos.
// Ordem: número da NR; dentro dela, o corpo primeiro e os anexos em ordem
// numérica (I, II, ..., IX, X; 1, 2, ..., 13, 13-A). A NR-28 fica de fora:
// ela é a tabela de multas, não tem itens para calcular.
routerAdd('GET', '/backend/v1/public/nrs', (e) => {
  const nrs = $app.findRecordsByFilter(
    'tipos_vistoria',
    "organizacao_id = '' && ativo = true",
    'nome',
    0,
    0,
  )

  const romano = (s) => {
    const v = { I: 1, V: 5, X: 10, L: 50, C: 100 }
    let total = 0
    for (let i = 0; i < s.length; i++) {
      const a = v[s[i]] || 0
      const b = v[s[i + 1]] || 0
      total += a < b ? -a : a
    }
    return total
  }
  const chave = (nr) => {
    const fontes = [
      nr.getString('nr_referencia'),
      nr.getString('secao_oficial'),
      nr.getString('nome'),
    ]
    let numero = 999
    for (const f of fontes) {
      const m = /NR[\s-]*0*(\d{1,2})\b/i.exec(f || '')
      if (m) {
        numero = Number(m[1])
        break
      }
    }
    const base = nr.getString('secao_oficial') || nr.getString('nome')
    let anexo = 0
    if (/\banexo\s+[úu]nico\b/i.test(base)) anexo = 1
    else {
      const m = /\banexo\s+(?:n[º°o]\.?\s*)?([IVXLC]+|\d+)(?:\s*-\s*([A-Z])\b)?/i.exec(base)
      if (m) {
        const n = /^\d+$/.test(m[1]) ? Number(m[1]) : romano(m[1].toUpperCase())
        anexo = n + (m[2] ? (m[2].toUpperCase().charCodeAt(0) - 64) / 100 : 0)
      }
    }
    return { numero: numero, anexo: anexo, nome: nr.getString('nome') }
  }

  const lista = nrs
    .map((nr) => ({ nr: nr, k: chave(nr) }))
    .filter((x) => x.k.numero !== 28)
    .sort((a, b) => {
      if (a.k.numero !== b.k.numero) return a.k.numero - b.k.numero
      if (a.k.anexo !== b.k.anexo) return a.k.anexo - b.k.anexo
      return a.k.nome < b.k.nome ? -1 : a.k.nome > b.k.nome ? 1 : 0
    })
    .map((x) => ({
      id: x.nr.id,
      nome: x.nr.getString('nome'),
      nr_referencia: x.nr.getString('nr_referencia'),
    }))
  return e.json(200, { nrs: lista })
})
