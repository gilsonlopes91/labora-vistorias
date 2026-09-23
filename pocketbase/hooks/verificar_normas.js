// Etapa 4 da atualização de NRs: verificação no gov.br.
// - Rotina semanal (segunda-feira, 8h de Brasília = 11h UTC), com e-mail aos
//   admins da plataforma quando aparece mudança nova.
// - Rota POST /backend/v1/admin/verificar-normas para o botão "Verificar agora"
//   (body opcional { nrs: ["NR-12"] } para verificar uma NR por vez; sem e-mail).
// Para cada NR do catálogo, lê a página oficial e compara o PDF publicado e a
// portaria mais recente com a versão cadastrada. Se houver mudança, marca a NR
// como "mudou" (selo no menu e faixa na aba Normas).
// A lógica está repetida nos dois callbacks porque o PocketBase não deixa um
// callback enxergar funções declaradas fora dele.

cronAdd('verificar_normas_govbr', '0 11 * * 1', () => {
  // ---- verificação das NRs no gov.br (mesma lógica na rotina e no botão) ----
  const verificarNormas = (app, apenas, enviarEmail) => {
    const BASE =
      'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes'
    const MESES = {
      janeiro: 1,
      fevereiro: 2,
      marco: 3,
      março: 3,
      abril: 4,
      maio: 5,
      junho: 6,
      julho: 7,
      agosto: 8,
      setembro: 9,
      outubro: 10,
      novembro: 11,
      dezembro: 12,
    }
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    const nrPad = (n) => 'NR-' + pad(n)
    const agora = new Date().toISOString().replace('T', ' ')

    const baixar = (url) => {
      const res = $http.send({
        url: url,
        method: 'GET',
        timeout: 25,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LaboraVistorias/1.0)' },
      })
      if (res.statusCode !== 200) throw new Error('HTTP ' + res.statusCode)
      let txt = ''
      try {
        txt = new TextDecoder().decode(new Uint8Array(res.body))
      } catch (_) {
        txt = toString(res.body)
      }
      return txt
    }
    const semTags = (html) =>
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&#160;/g, ' ')
        .replace(/&ordm;|&#186;/g, 'º')
        .replace(/&deg;|&#176;/g, '°')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&atilde;/g, 'ã')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
    const absoluta = (href) => {
      if (/^https?:/i.test(href)) return href
      if (href.indexOf('/') === 0) return 'https://www.gov.br' + href
      return BASE + '/' + href
    }

    // NRs do catálogo e a versão cadastrada de cada uma
    const tipos = app.findRecordsByFilter(
      'tipos_vistoria',
      "organizacao_id = '' && secao_oficial != ''",
      '',
      0,
      0,
    )
    const catalogo = {}
    for (const t of tipos) {
      const nr = t.getString('nr_referencia')
      if (!nr) continue
      if (!catalogo[nr]) catalogo[nr] = { versao: '', dou: '' }
      if (!catalogo[nr].versao && t.getString('norma_versao')) {
        catalogo[nr].versao = t.getString('norma_versao')
        catalogo[nr].dou = t.getString('norma_versao_dou')
      }
    }

    // páginas de cada NR a partir da lista oficial
    const urls = {}
    try {
      const lista = baixar(BASE)
      const re = /href="([^"]+)"/g
      let m
      while ((m = re.exec(lista))) {
        const href = m[1]
        if (/\.pdf$/i.test(href)) continue
        const a =
          /norma-regulamentadora-no-(\d+)-nr-\d+\/?$/i.exec(href) || /\/nr-(\d+)\/?$/i.exec(href)
        if (a) urls[nrPad(Number(a[1]))] = absoluta(href.replace(/\/$/, ''))
      }
    } catch (err) {
      app.logger().warn('verificar-normas: lista oficial indisponível', 'erro', String(err))
    }

    const resumo = { verificadas: 0, mudou: [], novos_avisos: [], erros: [] }
    const col = app.findCollectionByNameOrId('normas_monitor')

    const alvo = Object.keys(catalogo)
      .sort()
      .filter((nr) => !apenas || !apenas.length || apenas.indexOf(nr) >= 0)
    for (const nr of alvo) {
      const n = Number(nr.replace(/\D/g, ''))
      let rec = null
      try {
        rec = app.findFirstRecordByFilter('normas_monitor', 'nr = {:nr}', { nr: nr })
      } catch (_) {
        rec = null
      }
      const novo = !rec
      if (!rec) {
        rec = new Record(col)
        rec.set('nr', nr)
        rec.set('status', 'em_dia')
      }
      const url =
        urls[nr] ||
        rec.getString('url') ||
        (n === 1 ? BASE + '/nr-1' : BASE + '/norma-regulamentadora-no-' + n + '-nr-' + n)
      rec.set('url', url)
      rec.set('verificado_em', agora)
      try {
        const html = baixar(url)
        const texto = semTags(html)

        // "Atualizado em"
        const at = /Atualizado em\s*(\d{2}\/\d{2}\/\d{4}(?:\s*\d{1,2}h\d{2})?)/i.exec(texto)
        const atualizado = at ? at[1] : ''

        // PDF da NR atualizada
        let pdf = ''
        const reNum = new RegExp('nr[-_ ]?0*' + n + '(?![0-9])', 'i')
        const rePdf = /href="([^"]+\.pdf)"/gi
        let p
        while ((p = rePdf.exec(html))) {
          const arq = p[1].split('/').pop()
          if (reNum.test(arq) && !/anexo|glossario|manual|nota/i.test(arq)) {
            pdf = absoluta(p[1])
            break
          }
        }

        // portaria mais recente citada na página
        let melhor = null
        const rePort =
          /Portaria\s+(?:[A-ZÁÉÍÓÚ\/]+\s+){0,3}n\.?\s*[º°o]?\.?\s*([\d.]+)\s*,?\s*de\s+(\d{1,2})º?\s+de\s+([a-zç]+)\s+de\s+(\d{4})/gi
        let q
        while ((q = rePort.exec(texto))) {
          const mes = MESES[q[3].toLowerCase()]
          if (!mes) continue
          const data = q[4] + '-' + pad(mes) + '-' + pad(Number(q[2]))
          if (!melhor || data > melhor.data)
            melhor = { texto: q[0].replace(/\s+/g, ' '), data: data }
        }
        const rePort2 =
          /Portaria\s+(?:[A-ZÁÉÍÓÚ\/]+\s+){0,3}n\.?\s*[º°o]?\.?\s*([\d.]+)[^0-9]{1,12}(\d{2})\/(\d{2})\/(\d{4})/gi
        while ((q = rePort2.exec(texto))) {
          const data = q[4] + '-' + q[3] + '-' + q[2]
          if (!melhor || data > melhor.data)
            melhor = {
              texto:
                q[0].replace(/\s+/g, ' ').replace(/[^0-9]+\d{2}\/\d{2}\/\d{4}$/, '') +
                ' (' +
                q[2] +
                '/' +
                q[3] +
                '/' +
                q[4] +
                ')',
              data: data,
            }
        }

        // o que mudou
        const avisos = []
        const pdfAntes = rec.getString('pdf_url')
        if (!novo && pdf && pdfAntes && pdf !== pdfAntes) {
          avisos.push(
            'PDF novo no gov.br: ' +
              pdf.split('/').pop() +
              ' (antes: ' +
              pdfAntes.split('/').pop() +
              ').',
          )
        }
        const douCat = (catalogo[nr].dou || '').slice(0, 10)
        if (
          melhor &&
          douCat &&
          melhor.data > douCat &&
          melhor.texto !== rec.getString('portaria_ignorada')
        ) {
          avisos.push(
            'Portaria mais nova na página: ' +
              melhor.texto +
              '. Versão no catálogo: ' +
              (catalogo[nr].versao || '—') +
              '.',
          )
        }
        const antesAt = rec.getString('pagina_atualizada')
        if (avisos.length && antesAt && atualizado && antesAt !== atualizado) {
          avisos.push('Página atualizada em ' + atualizado + ' (antes: ' + antesAt + ').')
        }

        rec.set('pagina_atualizada', atualizado)
        if (pdf) rec.set('pdf_url', pdf)
        if (melhor) {
          rec.set('portaria_site', melhor.texto.slice(0, 300))
          rec.set('portaria_site_data', melhor.data + ' 12:00:00.000Z')
        }
        rec.set('erro', '')
        if (avisos.length) {
          if (rec.getString('status') !== 'mudou') {
            rec.set('detectado_em', agora)
            rec.set('avisado', false)
          }
          rec.set('status', 'mudou')
          rec.set('mudancas', avisos.join(' ').slice(0, 2000))
        } else if (rec.getString('status') !== 'mudou') {
          rec.set('status', 'em_dia')
        }
      } catch (err) {
        rec.set('erro', String(err).slice(0, 500))
        if (rec.getString('status') !== 'mudou') rec.set('status', 'erro')
        resumo.erros.push(nr)
      }
      if (rec.getString('status') === 'mudou') {
        resumo.mudou.push(nr)
        if (!rec.getBool('avisado'))
          resumo.novos_avisos.push({
            nr: nr,
            texto: rec.getString('mudancas'),
            url: rec.getString('url'),
          })
      }
      app.save(rec)
      resumo.verificadas++
    }

    // e-mail para os admins da plataforma quando há mudança nova
    if (enviarEmail && resumo.novos_avisos.length) {
      let enviado = false
      try {
        const admins = app.findRecordsByFilter('users', "papel = 'admin_plataforma'", '', 0, 0)
        const to = admins.map((u) => ({ address: u.getString('email') })).filter((x) => x.address)
        if (to.length) {
          const linhas = resumo.novos_avisos
            .map(
              (a) =>
                '<li><b>' +
                a.nr +
                '</b>: ' +
                a.texto +
                ' <a href="' +
                a.url +
                '">Página no gov.br</a></li>',
            )
            .join('')
          const site = (app.settings().meta.appURL || '').replace(/\/$/, '')
          const html =
            '<p>A verificação semanal encontrou mudança nas normas abaixo:</p><ul>' +
            linhas +
            '</ul><p>Abra Admin &gt; Normas no Labora Vistorias, baixe o PDF oficial e use o botão Atualizar para conferir e aplicar.' +
            (site ? ' <a href="' + site + '/admin/normas">Abrir a aba Normas</a>.' : '') +
            '</p>'
          const msg = new MailerMessage({
            from: {
              address: app.settings().meta.senderAddress || 'noreply@mail.goskip.dev',
              name: app.settings().meta.senderName || 'Labora Vistorias',
            },
            to: to,
            subject:
              'Labora Vistorias: ' +
              resumo.novos_avisos.map((a) => a.nr).join(', ') +
              ' com possível atualização',
            html: html,
          })
          app.newMailClient().send(msg)
          enviado = true
        }
      } catch (err) {
        app.logger().error('verificar-normas: falha no e-mail', 'erro', String(err))
      }
      if (enviado) {
        for (const a of resumo.novos_avisos) {
          try {
            const r = app.findFirstRecordByFilter('normas_monitor', 'nr = {:nr}', { nr: a.nr })
            r.set('avisado', true)
            app.save(r)
          } catch (_) {
            // segue
          }
        }
      }
      resumo.email_enviado = enviado
    }
    return resumo
  }

  try {
    const r = verificarNormas($app, null, true)
    $app
      .logger()
      .info(
        'verificar-normas',
        'verificadas',
        r.verificadas,
        'mudou',
        r.mudou.join(','),
        'erros',
        r.erros.join(','),
      )
  } catch (err) {
    $app.logger().error('verificar-normas: falha geral', 'erro', String(err))
  }
})

routerAdd(
  'POST',
  '/backend/v1/admin/verificar-normas',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('papel') !== 'admin_plataforma') {
      return e.forbiddenError('acesso restrito ao admin da plataforma')
    }
    const body = e.requestInfo().body || {}
    const apenas = Array.isArray(body.nrs) ? body.nrs.map((x) => String(x)) : null

    // ---- verificação das NRs no gov.br (mesma lógica na rotina e no botão) ----
    const verificarNormas = (app, apenas, enviarEmail) => {
      const BASE =
        'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes'
      const MESES = {
        janeiro: 1,
        fevereiro: 2,
        marco: 3,
        março: 3,
        abril: 4,
        maio: 5,
        junho: 6,
        julho: 7,
        agosto: 8,
        setembro: 9,
        outubro: 10,
        novembro: 11,
        dezembro: 12,
      }
      const pad = (n) => (n < 10 ? '0' + n : '' + n)
      const nrPad = (n) => 'NR-' + pad(n)
      const agora = new Date().toISOString().replace('T', ' ')

      const baixar = (url) => {
        const res = $http.send({
          url: url,
          method: 'GET',
          timeout: 25,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LaboraVistorias/1.0)' },
        })
        if (res.statusCode !== 200) throw new Error('HTTP ' + res.statusCode)
        let txt = ''
        try {
          txt = new TextDecoder().decode(new Uint8Array(res.body))
        } catch (_) {
          txt = toString(res.body)
        }
        return txt
      }
      const semTags = (html) =>
        html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;|&#160;/g, ' ')
          .replace(/&ordm;|&#186;/g, 'º')
          .replace(/&deg;|&#176;/g, '°')
          .replace(/&ccedil;/g, 'ç')
          .replace(/&atilde;/g, 'ã')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
      const absoluta = (href) => {
        if (/^https?:/i.test(href)) return href
        if (href.indexOf('/') === 0) return 'https://www.gov.br' + href
        return BASE + '/' + href
      }

      // NRs do catálogo e a versão cadastrada de cada uma
      const tipos = app.findRecordsByFilter(
        'tipos_vistoria',
        "organizacao_id = '' && secao_oficial != ''",
        '',
        0,
        0,
      )
      const catalogo = {}
      for (const t of tipos) {
        const nr = t.getString('nr_referencia')
        if (!nr) continue
        if (!catalogo[nr]) catalogo[nr] = { versao: '', dou: '' }
        if (!catalogo[nr].versao && t.getString('norma_versao')) {
          catalogo[nr].versao = t.getString('norma_versao')
          catalogo[nr].dou = t.getString('norma_versao_dou')
        }
      }

      // páginas de cada NR a partir da lista oficial
      const urls = {}
      try {
        const lista = baixar(BASE)
        const re = /href="([^"]+)"/g
        let m
        while ((m = re.exec(lista))) {
          const href = m[1]
          if (/\.pdf$/i.test(href)) continue
          const a =
            /norma-regulamentadora-no-(\d+)-nr-\d+\/?$/i.exec(href) || /\/nr-(\d+)\/?$/i.exec(href)
          if (a) urls[nrPad(Number(a[1]))] = absoluta(href.replace(/\/$/, ''))
        }
      } catch (err) {
        app.logger().warn('verificar-normas: lista oficial indisponível', 'erro', String(err))
      }

      const resumo = { verificadas: 0, mudou: [], novos_avisos: [], erros: [] }
      const col = app.findCollectionByNameOrId('normas_monitor')

      const alvo = Object.keys(catalogo)
        .sort()
        .filter((nr) => !apenas || !apenas.length || apenas.indexOf(nr) >= 0)
      for (const nr of alvo) {
        const n = Number(nr.replace(/\D/g, ''))
        let rec = null
        try {
          rec = app.findFirstRecordByFilter('normas_monitor', 'nr = {:nr}', { nr: nr })
        } catch (_) {
          rec = null
        }
        const novo = !rec
        if (!rec) {
          rec = new Record(col)
          rec.set('nr', nr)
          rec.set('status', 'em_dia')
        }
        const url =
          urls[nr] ||
          rec.getString('url') ||
          (n === 1 ? BASE + '/nr-1' : BASE + '/norma-regulamentadora-no-' + n + '-nr-' + n)
        rec.set('url', url)
        rec.set('verificado_em', agora)
        try {
          const html = baixar(url)
          const texto = semTags(html)

          // "Atualizado em"
          const at = /Atualizado em\s*(\d{2}\/\d{2}\/\d{4}(?:\s*\d{1,2}h\d{2})?)/i.exec(texto)
          const atualizado = at ? at[1] : ''

          // PDF da NR atualizada
          let pdf = ''
          const reNum = new RegExp('nr[-_ ]?0*' + n + '(?![0-9])', 'i')
          const rePdf = /href="([^"]+\.pdf)"/gi
          let p
          while ((p = rePdf.exec(html))) {
            const arq = p[1].split('/').pop()
            if (reNum.test(arq) && !/anexo|glossario|manual|nota/i.test(arq)) {
              pdf = absoluta(p[1])
              break
            }
          }

          // portaria mais recente citada na página
          let melhor = null
          const rePort =
            /Portaria\s+(?:[A-ZÁÉÍÓÚ\/]+\s+){0,3}n\.?\s*[º°o]?\.?\s*([\d.]+)\s*,?\s*de\s+(\d{1,2})º?\s+de\s+([a-zç]+)\s+de\s+(\d{4})/gi
          let q
          while ((q = rePort.exec(texto))) {
            const mes = MESES[q[3].toLowerCase()]
            if (!mes) continue
            const data = q[4] + '-' + pad(mes) + '-' + pad(Number(q[2]))
            if (!melhor || data > melhor.data)
              melhor = { texto: q[0].replace(/\s+/g, ' '), data: data }
          }
          const rePort2 =
            /Portaria\s+(?:[A-ZÁÉÍÓÚ\/]+\s+){0,3}n\.?\s*[º°o]?\.?\s*([\d.]+)[^0-9]{1,12}(\d{2})\/(\d{2})\/(\d{4})/gi
          while ((q = rePort2.exec(texto))) {
            const data = q[4] + '-' + q[3] + '-' + q[2]
            if (!melhor || data > melhor.data)
              melhor = {
                texto:
                  q[0].replace(/\s+/g, ' ').replace(/[^0-9]+\d{2}\/\d{2}\/\d{4}$/, '') +
                  ' (' +
                  q[2] +
                  '/' +
                  q[3] +
                  '/' +
                  q[4] +
                  ')',
                data: data,
              }
          }

          // o que mudou
          const avisos = []
          const pdfAntes = rec.getString('pdf_url')
          if (!novo && pdf && pdfAntes && pdf !== pdfAntes) {
            avisos.push(
              'PDF novo no gov.br: ' +
                pdf.split('/').pop() +
                ' (antes: ' +
                pdfAntes.split('/').pop() +
                ').',
            )
          }
          const douCat = (catalogo[nr].dou || '').slice(0, 10)
          if (
            melhor &&
            douCat &&
            melhor.data > douCat &&
            melhor.texto !== rec.getString('portaria_ignorada')
          ) {
            avisos.push(
              'Portaria mais nova na página: ' +
                melhor.texto +
                '. Versão no catálogo: ' +
                (catalogo[nr].versao || '—') +
                '.',
            )
          }
          const antesAt = rec.getString('pagina_atualizada')
          if (avisos.length && antesAt && atualizado && antesAt !== atualizado) {
            avisos.push('Página atualizada em ' + atualizado + ' (antes: ' + antesAt + ').')
          }

          rec.set('pagina_atualizada', atualizado)
          if (pdf) rec.set('pdf_url', pdf)
          if (melhor) {
            rec.set('portaria_site', melhor.texto.slice(0, 300))
            rec.set('portaria_site_data', melhor.data + ' 12:00:00.000Z')
          }
          rec.set('erro', '')
          if (avisos.length) {
            if (rec.getString('status') !== 'mudou') {
              rec.set('detectado_em', agora)
              rec.set('avisado', false)
            }
            rec.set('status', 'mudou')
            rec.set('mudancas', avisos.join(' ').slice(0, 2000))
          } else if (rec.getString('status') !== 'mudou') {
            rec.set('status', 'em_dia')
          }
        } catch (err) {
          rec.set('erro', String(err).slice(0, 500))
          if (rec.getString('status') !== 'mudou') rec.set('status', 'erro')
          resumo.erros.push(nr)
        }
        if (rec.getString('status') === 'mudou') {
          resumo.mudou.push(nr)
          if (!rec.getBool('avisado'))
            resumo.novos_avisos.push({
              nr: nr,
              texto: rec.getString('mudancas'),
              url: rec.getString('url'),
            })
        }
        app.save(rec)
        resumo.verificadas++
      }

      // (no botão "Verificar agora" não há e-mail: o admin já está vendo a tela)
      if (enviarEmail && resumo.novos_avisos.length) {
        resumo.email_enviado = false
      }
      return resumo
    }

    try {
      return e.json(200, { ok: true, resultado: verificarNormas($app, apenas, false) })
    } catch (err) {
      return e.json(500, { ok: false, erro: String(err) })
    }
  },
  $apis.requireAuth(),
)
