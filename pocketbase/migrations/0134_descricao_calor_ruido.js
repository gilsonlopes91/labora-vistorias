// Descrição dos modelos fixos de Calor e Ruído depois do cálculo automático (0133).
migrate(
  (app) => {
    const DESCRICOES = {
      'Avaliação de Calor':
        'Ficha de campo de calor (NR-09 Anexo III e NR-15 Anexo 3): situações dos 60 minutos mais críticos, com cálculo do IBUTG médio e da taxa metabólica média e comparação com o nível de ação e o limite de exposição.',
      'Dosimetria de Ruído':
        'Ficha de campo de dosimetria de ruído (NR-15 Anexo 1 ou NHO 01): dosímetro no colaborador, com cálculo da dose na jornada, do NE e do NEN.',
    }
    for (const nome of Object.keys(DESCRICOES)) {
      const achados = app.findRecordsByFilter(
        'modelos_formulario',
        "fixo = true && organizacao_id = '' && nome = {:n}",
        '',
        0,
        0,
        { n: nome },
      )
      for (const m of achados) {
        m.set('descricao', DESCRICOES[nome])
        app.save(m)
      }
    }
  },
  () => {},
)
