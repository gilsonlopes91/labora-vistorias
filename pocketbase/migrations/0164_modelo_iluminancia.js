// A3 do plano de 28/09/2026: novo modelo fixo de formulário "Avaliação de
// Iluminância" (NHO-11 / NBR ISO/CIE 8995-1), no mesmo padrão do modelo de
// Calor/Ruído da migration 0133 — campo final tipo calculo_tecnico,
// calculo='iluminancia', que o app resolve em src/lib/higieneOcupacional.ts.
// Idempotente: se o modelo já existir (reexecução), só atualiza os campos.
migrate(
  (app) => {
    const CAMPOS = [
      { id: 'f1', tipo: 'secao', nome: 'Dados da avaliação' },
      { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
      { id: 'f3', tipo: 'texto', nome: 'Ambiente', obrigatorio: true },
      { id: 'f4', tipo: 'texto', nome: 'Atividade', obrigatorio: true },
      {
        id: 'f5',
        tipo: 'numero',
        nome: 'Iluminância mantida exigida (NHO-11 / NBR ISO/CIE 8995-1)',
        unidade: 'lux',
        obrigatorio: true,
      },
      { id: 'f6', tipo: 'secao', nome: 'Luxímetro' },
      { id: 'f7', tipo: 'texto', nome: 'Marca / modelo' },
      { id: 'f8', tipo: 'texto', nome: 'Certificado de calibração' },
      { id: 'f9', tipo: 'data', nome: 'Validade da calibração' },
      { id: 'f10', tipo: 'secao', nome: 'Pontos de medição' },
      {
        id: 'f11',
        tipo: 'repetivel',
        nome: 'Pontos de medição',
        subcampos: [
          { id: 's1', tipo: 'texto', nome: 'Ponto' },
          { id: 's2', tipo: 'numero', nome: 'Iluminância', unidade: 'lux' },
        ],
      },
      {
        id: 'f12',
        tipo: 'calculo_tecnico',
        calculo: 'iluminancia',
        nome: 'Resultado',
        origem: { pontos: 'f11', lux: 's2', exigida: 'f5' },
      },
      { id: 'f13', tipo: 'secao', nome: 'Registro' },
      { id: 'f14', tipo: 'texto_longo', nome: 'Observações' },
      { id: 'f15', tipo: 'foto', nome: 'Fotos (luxímetro, ambiente)' },
      { id: 'f16', tipo: 'assinatura', nome: 'Assinatura do técnico' },
    ]

    let modelo
    try {
      modelo = app.findFirstRecordByFilter(
        'modelos_formulario',
        "fixo = true && organizacao_id = '' && nome = {:n}",
        { n: 'Avaliação de Iluminância' },
      )
    } catch (_) {
      modelo = null
    }

    if (modelo) {
      modelo.set('campos', CAMPOS)
      app.save(modelo)
      return
    }

    const col = app.findCollectionByNameOrId('modelos_formulario')
    const novo = new Record(col)
    novo.set('organizacao_id', '')
    novo.set('nome', 'Avaliação de Iluminância')
    novo.set(
      'descricao',
      'Avaliação de iluminância de ambiente de trabalho pela NHO-11 (Fundacentro) e NBR ISO/CIE 8995-1: iluminância média, uniformidade e conformidade.',
    )
    novo.set('fixo', true)
    novo.set('ativo', true)
    novo.set('campos', CAMPOS)
    app.save(novo)
  },
  (app) => {
    try {
      const modelo = app.findFirstRecordByFilter(
        'modelos_formulario',
        "fixo = true && organizacao_id = '' && nome = {:n}",
        { n: 'Avaliação de Iluminância' },
      )
      app.delete(modelo)
    } catch (_) {
      // já não existe
    }
  },
)
