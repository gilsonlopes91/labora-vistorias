// Rota admin: sincroniza UMA seção oficial (NR ou Anexo) do catálogo global com o
// Anexo II da NR-28 vigente + texto literal da norma. Chamada pelo painel Admin,
// uma seção por requisição, a partir do arquivo catalogo_oficial.json.
//
// Regras:
// - chave do item = código de ementa, dentro do tipo de vistoria da seção;
// - código já existente -> atualiza item_ref, grau, tipo, texto (mantém o id,
//   então respostas de vistorias antigas continuam ligadas);
// - código novo -> cria o item;
// - item do tipo cujo código não está no Anexo II vigente -> revogado = true
//   (não é apagado, para não quebrar vistorias já feitas);
// - se o tipo de vistoria não existir, é criado (catálogo global).
// Com `simular: true` nada é gravado; só devolve o que seria feito.
routerAdd(
  'POST',
  '/backend/v1/admin/sync-catalogo',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('papel') !== 'admin_plataforma') {
      return e.forbiddenError('acesso restrito ao admin da plataforma')
    }
    const body = e.requestInfo().body || {}
    const secao = body.secao || {}
    const simular = !!body.simular
    const secaoOficial = String(secao.secao_oficial || '').trim()
    const nrRef = String(secao.nr_referencia || '').trim()
    const itensIn = Array.isArray(secao.itens) ? secao.itens : []
    if (!secaoOficial || !nrRef || itensIn.length === 0) {
      return e.badRequestError('secao_oficial, nr_referencia e itens são obrigatórios')
    }

    const OBS_REVOGADO =
      'Código de ementa não consta no Anexo II da NR-28 vigente. Item mantido só para vistorias antigas.'

    const resultado = {
      secao_oficial: secaoOficial,
      tipo_vistoria_id: '',
      tipo_criado: false,
      atualizados: 0,
      criados: 0,
      inativados: 0,
      sem_mudanca: 0,
      erros: [],
    }

    const executar = (app) => {
      // 1) localizar o tipo de vistoria
      let tipo = null
      const tipoId = String(secao.tipo_vistoria_id || '')
      if (tipoId) {
        try {
          tipo = app.findRecordById('tipos_vistoria', tipoId)
        } catch (_) {
          tipo = null
        }
      }
      if (!tipo) {
        const achados = app.findRecordsByFilter(
          'tipos_vistoria',
          "organizacao_id = '' && secao_oficial = {:s}",
          '',
          1,
          0,
          { s: secaoOficial },
        )
        if (achados.length) tipo = achados[0]
      }
      if (!tipo) {
        resultado.tipo_criado = true
        const col = app.findCollectionByNameOrId('tipos_vistoria')
        tipo = new Record(col)
        tipo.set('organizacao_id', '')
        tipo.set('nome', String(secao.nome || secaoOficial).slice(0, 150))
        tipo.set('nr_referencia', nrRef)
        tipo.set('descricao', String(secao.descricao_tipo || '').slice(0, 500))
        tipo.set('ativo', true)
        // regime de multa: copia de outro tipo da mesma NR, senão Anexo I da NR-28
        let regime = String(secao.regime_multa || '')
        if (!regime) {
          const irmaos = app.findRecordsByFilter(
            'tipos_vistoria',
            "organizacao_id = '' && nr_referencia = {:n} && regime_multa != ''",
            '',
            1,
            0,
            { n: nrRef },
          )
          regime = irmaos.length ? irmaos[0].getString('regime_multa') : 'anexo_i'
        }
        tipo.set('regime_multa', regime)
      }
      tipo.set('secao_oficial', secaoOficial)
      if (secao.nome && !resultado.tipo_criado && secao.renomear) {
        tipo.set('nome', String(secao.nome).slice(0, 150))
      }
      if (!simular) app.save(tipo)
      resultado.tipo_vistoria_id = tipo.id || '(novo)'

      // 2) itens existentes por código
      const existentes = tipo.id
        ? app.findRecordsByFilter('itens_checklist', 'tipo_vistoria_id = {:t}', 'ordem', 0, 0, {
            t: tipo.id,
          })
        : []
      const porCodigo = {}
      for (const it of existentes) {
        const c = it.getString('codigo').trim()
        if (!porCodigo[c]) porCodigo[c] = []
        porCodigo[c].push(it)
      }

      const colItens = app.findCollectionByNameOrId('itens_checklist')
      const vistos = {}
      for (let i = 0; i < itensIn.length; i++) {
        const src = itensIn[i] || {}
        const codigo = String(src.codigo || '').trim()
        const texto = String(src.descricao || '').trim()
        if (!codigo || !texto) {
          resultado.erros.push({ linha: i, codigo: codigo, erro: 'código ou texto vazio' })
          continue
        }
        const grau = src.grau ? Number(src.grau) : null
        const tipoInf = src.tipo === 'S' || src.tipo === 'M' ? src.tipo : ''
        const lista = porCodigo[codigo] || []
        const alvo = lista.length ? lista[0] : null
        vistos[codigo] = true
        const rec = alvo || new Record(colItens)
        const antes = alvo
          ? [
              rec.getString('item_ref'),
              rec.getInt('grau'),
              rec.getString('tipo'),
              rec.getString('descricao'),
              rec.getInt('ordem'),
              rec.getString('secao'),
              rec.getBool('revogado'),
              rec.getString('observacao'),
            ].join('|')
          : ''
        if (!alvo) rec.set('tipo_vistoria_id', tipo.id)
        rec.set('codigo', codigo)
        rec.set('item_ref', String(src.item_ref || '').slice(0, 300))
        rec.set('grau', grau)
        rec.set('tipo', tipoInf)
        rec.set('descricao', texto.slice(0, 20000))
        rec.set('ordem', Number(src.ordem || i))
        rec.set('secao', String(src.secao || '').slice(0, 200))
        rec.set('observacao', String(src.observacao || '').slice(0, 1000))
        rec.set('revogado', false)
        const depois = [
          rec.getString('item_ref'),
          rec.getInt('grau'),
          rec.getString('tipo'),
          rec.getString('descricao'),
          rec.getInt('ordem'),
          rec.getString('secao'),
          rec.getBool('revogado'),
          rec.getString('observacao'),
        ].join('|')
        if (alvo && antes === depois) {
          resultado.sem_mudanca++
          continue
        }
        if (!simular) {
          if (!tipo.id) throw new Error('tipo sem id')
          app.save(rec)
        }
        if (alvo) resultado.atualizados++
        else resultado.criados++
        // duplicatas do mesmo código no tipo: as extras ficam revogadas
        for (let k = 1; k < lista.length; k++) {
          if (lista[k].getBool('revogado')) continue
          lista[k].set('revogado', true)
          lista[k].set('observacao', 'Duplicata do código ' + codigo + '.')
          if (!simular) app.save(lista[k])
          resultado.inativados++
        }
      }

      // 3) itens cujo código não está no Anexo II vigente -> revogados
      for (const it of existentes) {
        const c = it.getString('codigo').trim()
        if (vistos[c]) continue
        if (it.getBool('revogado')) continue
        it.set('revogado', true)
        it.set('observacao', OBS_REVOGADO)
        if (!simular) app.save(it)
        resultado.inativados++
      }
    }

    try {
      if (simular) executar($app)
      else $app.runInTransaction((tx) => executar(tx))
    } catch (err) {
      return e.json(500, { ok: false, erro: String(err), resultado: resultado })
    }
    return e.json(200, { ok: true, simulado: simular, resultado: resultado })
  },
  $apis.requireAuth(),
)
