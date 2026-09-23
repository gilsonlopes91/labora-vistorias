// Aba "Normas" do Admin (etapa 2 da atualização de NRs sem IA):
// - tipos_vistoria.norma_versao: portaria da última alteração da NR (texto);
// - tipos_vistoria.norma_versao_dou: data de publicação dessa portaria no DOU;
// - tipos_vistoria.catalogo_sincronizado_em: quando o checklist foi conferido
//   com o texto oficial pela última vez;
// - itens_checklist.pendente_revisao: item cujo texto literal ainda precisa de
//   revisão manual (não foi localizado automaticamente no PDF oficial).
// Valores iniciais: portarias lidas do cabeçalho dos PDFs oficiais da pasta
// NRS ATUALIZADAS (23/09/2026).
migrate(
  (app) => {
    const tipos = app.findCollectionByNameOrId('tipos_vistoria')
    if (!tipos.fields.getByName('norma_versao'))
      tipos.fields.add(new TextField({ name: 'norma_versao', max: 300 }))
    if (!tipos.fields.getByName('norma_versao_dou'))
      tipos.fields.add(new DateField({ name: 'norma_versao_dou' }))
    if (!tipos.fields.getByName('catalogo_sincronizado_em'))
      tipos.fields.add(new DateField({ name: 'catalogo_sincronizado_em' }))
    app.save(tipos)

    const itens = app.findCollectionByNameOrId('itens_checklist')
    if (!itens.fields.getByName('pendente_revisao'))
      itens.fields.add(new BoolField({ name: 'pendente_revisao' }))
    app.save(itens)

    app
      .db()
      .newQuery(
        "UPDATE itens_checklist SET pendente_revisao = 1 WHERE observacao LIKE 'Texto literal ainda não localizado%' OR observacao LIKE 'Parte dos subitens citados%'",
      )
      .execute()

    const VERSOES = {
      'NR-01': { p: 'Portaria MTE nº 765, de 15 de maio de 2025', d: '2025-05-16 12:00:00.000Z' },
      'NR-03': {
        p: 'Portaria SEPRT n.º 1.068, de 23 de setembro de 2019',
        d: '2019-09-24 12:00:00.000Z',
      },
      'NR-04': {
        p: 'Portaria MTP nº 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-05': {
        p: 'Portaria MTP n.º 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-06': { p: 'Portaria MTE nº 57, de 16 de janeiro de 2025', d: '2025-01-17 12:00:00.000Z' },
      'NR-07': { p: 'Portaria MTP n.º 567, de 10 março de 2022', d: '2022-04-01 12:00:00.000Z' },
      'NR-08': {
        p: 'Portaria MTP n.º 2.188, de 28 de julho de 2022',
        d: '2022-08-05 12:00:00.000Z',
      },
      'NR-09': {
        p: 'Portaria MTE nº 105, de 29 de janeiro de 2026',
        d: '2026-01-30 12:00:00.000Z',
      },
      'NR-10': {
        p: 'Portaria SEPRT n.º 915, de 30 de julho de 2019',
        d: '2019-07-31 12:00:00.000Z',
      },
      'NR-11': {
        p: 'Portaria MTPS n.º 505, de 29 de abril de 2016',
        d: '2016-05-02 12:00:00.000Z',
      },
      'NR-12': { p: 'Portaria MTE n.º 344, de 21 de março de 2024', d: '2024-03-22 12:00:00.000Z' },
      'NR-13': {
        p: 'Portaria MTP nº 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-14': {
        p: 'Portaria MTP n.º 2.189, de 28 de julho de 2022',
        d: '2022-08-05 12:00:00.000Z',
      },
      'NR-15': {
        p: 'Portaria MTE nº 2.021, de 03 de dezembro de 2025',
        d: '2025-12-04 12:00:00.000Z',
      },
      'NR-16': {
        p: 'Portaria MTE nº 2.021, de 03 de dezembro de 2025',
        d: '2025-12-04 12:00:00.000Z',
      },
      'NR-17': {
        p: 'Portaria MTP n.º 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-18': { p: 'Portaria MTE nº 836, de 13 de maio de 2026', d: '2026-05-15 12:00:00.000Z' },
      'NR-19': {
        p: 'Portaria MTP n.º 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-20': { p: 'Portaria MTE nº 60, de 21 de janeiro de 2025', d: '2025-01-22 12:00:00.000Z' },
      'NR-21': {
        p: 'Portaria MTE n.º 2.037, de 15 de dezembro de 1999',
        d: '1999-12-20 12:00:00.000Z',
      },
      'NR-22': {
        p: 'Portaria MTE nº 261, de 12 de fevereiro de 2026',
        d: '2026-02-13 12:00:00.000Z',
      },
      'NR-23': {
        p: 'Portaria MTP nº 2.769, de 05 de setembro de 2022',
        d: '2022-09-06 12:00:00.000Z',
      },
      'NR-24': {
        p: 'Portaria MTP nº 2.772, de 05 de setembro de 2022',
        d: '2022-09-06 12:00:00.000Z',
      },
      'NR-25': {
        p: 'Portaria SIT n.o 3.994, de 05 de dezembro de 2022',
        d: '2022-12-07 12:00:00.000Z',
      },
      'NR-26': {
        p: 'Portaria MTP nº 2.770, de 05 de setembro de 2022',
        d: '2022-09-06 12:00:00.000Z',
      },
      'NR-28': {
        p: 'Portaria MTE nº 104, de 29 de janeiro de 2026',
        d: '2026-01-30 12:00:00.000Z',
      },
      'NR-29': {
        p: 'Portaria MTP n.º 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-30': {
        p: 'Portaria MTP n.º 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-31': { p: 'Portaria MTE n.º 342, de 21 de março de 2024', d: '2024-03-22 12:00:00.000Z' },
      'NR-32': {
        p: 'Portaria MTP nº 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-33': {
        p: 'Portaria SEPRT n.º 1.690, de 15 de junho de 2022',
        d: '2022-06-24 12:00:00.000Z',
      },
      'NR-34': {
        p: 'Portaria MTP nº 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-35': {
        p: 'Portaria MTE nº 1.259, de 15 de julho de 2026',
        d: '2026-07-16 12:00:00.000Z',
      },
      'NR-36': {
        p: 'Portaria MTE nº 1.065, de 1º de julho de 2024',
        d: '2024-07-02 12:00:00.000Z',
      },
      'NR-37': {
        p: 'Portaria MTP n.º 4.219, de 20 de dezembro de 2022',
        d: '2022-12-22 12:00:00.000Z',
      },
      'NR-38': { p: 'Portaria MTE nº 817, de 08 de maio de 2026', d: '2026-05-11 12:00:00.000Z' },
    }
    const globais = app.findRecordsByFilter('tipos_vistoria', "organizacao_id = ''", '', 0, 0)
    for (const t of globais) {
      const v = VERSOES[t.getString('nr_referencia')]
      if (v) {
        t.set('norma_versao', v.p)
        t.set('norma_versao_dou', v.d)
      }
      if (t.getString('secao_oficial'))
        t.set('catalogo_sincronizado_em', '2026-09-23 18:00:00.000Z')
      app.saveNoValidate(t)
    }
  },
  (app) => {
    const tipos = app.findCollectionByNameOrId('tipos_vistoria')
    for (const n of ['norma_versao', 'norma_versao_dou', 'catalogo_sincronizado_em']) {
      const f = tipos.fields.getByName(n)
      if (f) tipos.fields.removeById(f.id)
    }
    app.save(tipos)
    const itens = app.findCollectionByNameOrId('itens_checklist')
    const f = itens.fields.getByName('pendente_revisao')
    if (f) itens.fields.removeById(f.id)
    app.save(itens)
  },
)
