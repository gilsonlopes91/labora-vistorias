// Consulta pública do Certificado de Aprovação (CA) de EPI em consultaca.com,
// pra pré-preencher fabricante/validade/descrição no cadastro do catálogo de
// EPIs. É um site de terceiros sem API oficial — a extração é feita por
// texto (sem parser de HTML), então é best-effort: se o layout do site
// mudar, algum campo pode não ser reconhecido, mas a rota nunca quebra por
// causa disso, só devolve o que conseguiu achar (encontrado: true/false).
routerAdd(
  'GET',
  '/backend/v1/epis/consultar-ca/{numero}',
  (e) => {
    const numero = (e.request.pathValue('numero') || '').replace(/\D/g, '')
    if (!numero) return e.badRequestError('Informe o número do CA')

    let html = ''
    try {
      const res = $http.send({
        url: 'https://consultaca.com/' + numero,
        method: 'GET',
        timeout: 15,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LaboraVistorias/1.0)' },
      })
      if (res.statusCode !== 200) {
        return e.json(200, {
          encontrado: false,
          motivo: 'A consulta não respondeu agora (HTTP ' + res.statusCode + ').',
          url_consulta: 'https://consultaca.com/' + numero,
        })
      }
      try {
        html = new TextDecoder().decode(new Uint8Array(res.body))
      } catch (_) {
        html = String(res.body)
      }
    } catch (err) {
      return e.json(200, {
        encontrado: false,
        motivo: 'Não foi possível consultar agora. Tente de novo em instantes.',
        url_consulta: 'https://consultaca.com/' + numero,
      })
    }

    // Texto puro (sem tags), pra casar os rótulos com tolerância a espaços/quebras.
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim()

    const casar = (regex) => {
      const m = texto.match(regex)
      return m ? m[1].trim() : ''
    }

    const situacao = casar(/Situa[cç][aã]o:?\s*(V[ÁA]LIDO|VENCIDO|CANCELADO|SUSPENSO)/i)
    const validade = casar(/Validade:?\s*(\d{2}\/\d{2}\/\d{4})/i)
    const fabricante = casar(
      /Raz[aã]o Social:?\s*([^.]{3,150}?)(?=\s+(?:CNPJ|Endere[cç]o|CNAE|Situa[cç][aã]o|Validade)\b|$)/i,
    )
    const descricao = casar(
      /Descri[cç][aã]o(?:\s+Completa)?:?\s*([\s\S]{10,600}?)(?=\s+(?:Norma|NBR|Laborat[oó]rio|Refer[eê]ncia|Categoria)\b|$)/i,
    )

    const encontrado = !!(situacao || validade || fabricante)
    if (!encontrado) {
      return e.json(200, {
        encontrado: false,
        motivo: 'CA não encontrado ou página em formato não reconhecido.',
        url_consulta: 'https://consultaca.com/' + numero,
      })
    }

    return e.json(200, {
      encontrado: true,
      numero_ca: numero,
      situacao: situacao || '',
      validade_ca: validade || '',
      fabricante: fabricante || '',
      descricao: descricao || '',
      url_consulta: 'https://consultaca.com/' + numero,
    })
  },
  $apis.requireAuth(),
)
