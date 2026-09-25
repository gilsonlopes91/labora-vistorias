// Migração 0126: descrições do catálogo de NRs.
// 25 checklists do catálogo global ainda mostravam ao cliente notas internas
// da época do primeiro cadastro ("descrições redigidas a partir de
// conhecimento geral... revisão obrigatória", "Anexos V-XII ficam para
// cadastro futuro" etc.). Desde a 0109 os itens trazem o texto literal da
// norma e nenhum está marcado como pendente de revisão, então essas notas não
// valem mais. Também preenche as 26 descrições que estavam vazias.
// Descrições boas (resumo da norma, sem nota interna) ficam como estão.
migrate(
  (app) => {
    const NOTA_INTERNA =
      /conhecimento geral|REVISAR|revis[aã]o obrigat|n[aã]o bateu|cadastro futuro|sem confirma|revisar com/i

    const tipos = app.findRecordsByFilter('tipos_vistoria', "organizacao_id = ''", '', 0, 0)
    let alterados = 0
    for (const t of tipos) {
      const atual = t.getString('descricao')
      if (atual.trim() && !NOTA_INTERNA.test(atual)) continue

      const nome = t.getString('nome') || t.getString('nr_referencia') || 'norma'
      const regime = t.getString('regime_multa')
      let multa = 'A multa é estimada pela tabela do Anexo I da NR-28.'
      if (regime === 'anexo_ia_portuario') {
        multa = 'A multa é estimada pelo Anexo I-A da NR-28, próprio do trabalho portuário.'
      } else if (regime === 'rural_art18') {
        multa =
          'A multa segue o art. 18 da Lei 5.889/1973, por empregado em situação irregular (item 28.3.2 da NR-28).'
      }
      t.set(
        'descricao',
        'Itens da ' +
          nome +
          ' com o texto da norma vigente e a classificação de cada infração (I1 a I4, segurança ou medicina) do Anexo II da NR-28. ' +
          multa,
      )
      app.save(t)
      alterados++
    }
    console.log('0126: descrições atualizadas = ' + alterados)
  },
  () => {
    // Sem volta: as notas antigas eram internas e estavam desatualizadas.
  },
)
