// Migração 0129: acertos pontuais no catálogo global, conferidos um a um no
// banco em 25/09/2026 (varredura dos 5.016 itens vigentes e dos 81 checklists).
// Cada registro só é alterado se ainda estiver exatamente como foi conferido.
//
// 1) Nomes: o corpo da norma deixa de ter "Corpo da Norma (...)" ou
//    "(corpo da norma)" no nome. A lista já mostra o corpo primeiro e os
//    anexos como "NR-xx — Anexo ...", então o nome fica só com o título.
//
// 2) Itens duplicados (NR-12): dois itens ficaram com a referência de várias
//    alíneas e o texto de todas, por erro de leitura do Anexo II da NR-28,
//    enquanto as outras alíneas existem como itens próprios, com código
//    próprio. Cada um fica só com a alínea "a", que é a do seu código.
//    A varredura não achou outro caso: as demais referências múltiplas são
//    linhas do próprio Anexo II, com um código só.
migrate(
  (app) => {
    const nomes = [
      [
        '1ezfynjmrxs2dan',
        'NR-09 — Corpo da Norma (Avaliação e Controle das Exposições Ocupacionais)',
        'NR-09 — Avaliação e Controle das Exposições Ocupacionais',
      ],
      [
        'fng6ewv46dbkg81',
        'NR-10 — Corpo da Norma (Segurança em Instalações e Serviços em Eletricidade)',
        'NR-10 — Segurança em Instalações e Serviços em Eletricidade',
      ],
      [
        'kvk654rbf54peqe',
        'NR-12 — Segurança no Trabalho em Máquinas e Equipamentos (corpo da norma)',
        'NR-12 — Segurança no Trabalho em Máquinas e Equipamentos',
      ],
      [
        '5zzjn3lx9b8jm3x',
        'NR-15 — Corpo da Norma (Adicional de Insalubridade)',
        'NR-15 — Atividades e Operações Insalubres',
      ],
      ['lbd231m6uy7esvv', 'NR-17 — Ergonomia (corpo da norma)', 'NR-17 — Ergonomia'],
    ]
    let renomeados = 0
    for (const [id, antes, depois] of nomes) {
      try {
        const t = app.findRecordById('tipos_vistoria', id)
        if (t.getString('nome') !== antes) continue
        t.set('nome', depois)
        app.save(t)
        renomeados++
      } catch (_) {
        // registro não existe mais: nada a fazer
      }
    }

    const itens = [
      {
        id: '1d17s80b245br2v',
        codigo: '312390-1',
        ref: '12.6.3, alínea "a"',
        texto:
          '12.6.3 Os dispositivos de parada de emergência devem:\n' +
          'a) ser selecionados, montados e interconectados de forma a suportar as condições de operação previstas, bem como as influências do meio;',
      },
      {
        id: '102y7adr0dix1fs',
        codigo: '312326-0',
        ref: '12.3.5, alínea "a"',
        texto:
          '12.3.5 Os quadros ou painéis de comando e potência das máquinas e equipamentos devem atender aos seguintes requisitos mínimos de segurança:\n' +
          'a) possuir porta de acesso mantida permanentemente fechada, exceto nas situações de manutenção, pesquisa de defeitos e outras intervenções, devendo ser observadas as condições previstas nas normas técnicas oficiais ou nas normas internacionais aplicáveis;',
      },
    ]
    let corrigidos = 0
    for (const it of itens) {
      try {
        const r = app.findRecordById('itens_checklist', it.id)
        // só mexe se ainda for o item combinado conferido
        if (r.getString('codigo') !== it.codigo) continue
        if (r.getString('item_ref').indexOf('alínea "b"') < 0) continue
        r.set('item_ref', it.ref)
        r.set('descricao', it.texto)
        app.save(r)
        corrigidos++
      } catch (_) {
        // registro não existe mais: nada a fazer
      }
    }
    console.log('0129: nomes=' + renomeados + ' itens=' + corrigidos)
  },
  () => {
    // Sem volta automática: os valores antigos estão no comentário acima e no
    // histórico do catálogo.
  },
)
