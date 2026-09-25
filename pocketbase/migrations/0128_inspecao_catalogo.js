// Migração 0128: só leitura. Levanta o estado do catálogo global para o lote 3
// (nomes e ordem das normas, itens duplicados). Não altera nenhum registro;
// o resultado vai para o log do servidor (nível warn, prefixo "INSPECAO").
migrate(
  (app) => {
    const saida = []
    const log = (txt) => saida.push(txt)

    const tipos = app.findRecordsByFilter('tipos_vistoria', "organizacao_id = ''", 'nome', 0, 0)
    for (const t of tipos) {
      const itens = app.findRecordsByFilter(
        'itens_checklist',
        'tipo_vistoria_id = {:t} && revogado = false',
        'ordem',
        0,
        0,
        { t: t.id },
      )
      log(
        'T|' +
          t.id +
          '|' +
          (t.getBool('ativo') ? 1 : 0) +
          '|' +
          t.getString('nr_referencia') +
          '|' +
          t.getString('secao_oficial') +
          '|' +
          itens.length +
          '|' +
          t.getString('nome'),
      )

      // mesmo código de ementa repetido no mesmo tipo
      const porCodigo = {}
      for (const it of itens) {
        const c = it.getString('codigo').trim()
        porCodigo[c] = (porCodigo[c] || 0) + 1
      }
      for (const c of Object.keys(porCodigo)) {
        if (porCodigo[c] > 1)
          log('DUPCOD|' + t.getString('nome').slice(0, 40) + '|' + c + '|' + porCodigo[c])
      }

      // item com várias referências cujas partes também existem como itens próprios
      const chaves = (ref) => {
        const out = []
        const re = /(\d{1,2}(?:\.\d{1,3})+)(?:\s*,\s*al[íi]nea\s*["“]?([a-z])["”]?)?/g
        let m
        while ((m = re.exec(ref))) out.push(m[1] + (m[2] ? '|' + m[2] : ''))
        return out
      }
      const mapa = itens.map((it) => ({ it: it, k: chaves(it.getString('item_ref')) }))
      for (const a of mapa) {
        if (a.k.length < 2) continue
        const sobrepostos = mapa.filter(
          (b) => b !== a && b.k.length > 0 && b.k.every((x) => a.k.indexOf(x) >= 0),
        )
        if (sobrepostos.length) {
          log(
            'COMB|' +
              t.getString('nome').slice(0, 40) +
              '|' +
              a.it.id +
              '|' +
              a.it.getString('codigo') +
              '|' +
              a.it.getString('item_ref').slice(0, 160) +
              '|| ' +
              sobrepostos
                .map(
                  (b) => b.it.getString('codigo') + '=' + b.it.getString('item_ref').slice(0, 40),
                )
                .join(' ; '),
          )
        }
      }
    }

    // o log é fatiado para caber em mensagens curtas
    let bloco = ''
    let n = 0
    const enviar = () => {
      if (!bloco) return
      n++
      app.logger().warn('INSPECAO ' + n + '\n' + bloco)
      console.log('INSPECAO ' + n + '\n' + bloco)
      bloco = ''
    }
    for (const linha of saida) {
      if (bloco.length + linha.length > 1800) enviar()
      bloco += linha + '\n'
    }
    enviar()
  },
  () => {},
)
