// Simplificação dos modelos fixos de formulário de campo (Ruído, Calor,
// Vibração, Químicos) e preservação dos registros já feitos.
// 1) formularios.campos_snapshot: cópia dos campos do modelo no momento do
//    registro. Os registros existentes recebem os campos atuais (antigos), para
//    continuarem abrindo iguais depois da mudança dos modelos.
// 2) Novos campos dos modelos: sem matrícula, patrimônio e fabricante; modelo
//    e nº de série juntos; função e GHE juntos; Vibração com 3 perguntas do
//    equipamento; Calor só com a assinatura do técnico; Químicos com 9
//    subcampos por ponto; Ruído com resultado opcional (dose e NEN).
//    Os ids dos campos mantidos não mudam.
migrate(
  (app) => {
    const colForm = app.findCollectionByNameOrId('formularios')
    if (!colForm.fields.getByName('campos_snapshot'))
      colForm.fields.add(new JSONField({ name: 'campos_snapshot', maxSize: 200000 }))
    app.save(colForm)

    // snapshot dos registros existentes com os campos atuais do modelo
    const cache = {}
    const regs = app.findRecordsByFilter('formularios', "id != ''", '', 0, 0)
    for (const r of regs) {
      const snap = r.get('campos_snapshot')
      if (snap && String(snap) !== 'null' && String(snap) !== '') continue
      const mid = r.getString('modelo_formulario_id')
      if (!mid) continue
      if (!(mid in cache)) {
        try {
          cache[mid] = app.findRecordById('modelos_formulario', mid).get('campos')
        } catch (_) {
          cache[mid] = null
        }
      }
      if (cache[mid] === null) continue
      r.set('campos_snapshot', cache[mid])
      app.saveNoValidate(r)
    }

    const NOVOS = {
      'Dosimetria de Ruído': [
        { id: 'f1', tipo: 'secao', nome: 'Dados da amostragem' },
        { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
        { id: 'f3', tipo: 'hora', nome: 'Horário de início', obrigatorio: true },
        { id: 'f4', tipo: 'hora', nome: 'Horário de término', obrigatorio: true },
        {
          id: 'f5',
          tipo: 'selecao',
          nome: 'Turno',
          opcoes: ['1º turno', '2º turno', '3º turno', 'Administrativo'],
        },
        { id: 'f6', tipo: 'secao', nome: 'Colaborador amostrado' },
        { id: 'f7', tipo: 'texto', nome: 'Nome do colaborador', obrigatorio: true },
        { id: 'f9', tipo: 'texto', nome: 'Função / GHE', obrigatorio: true },
        { id: 'f11', tipo: 'texto', nome: 'Setor' },
        { id: 'f12', tipo: 'secao', nome: 'Equipamento' },
        { id: 'f13', tipo: 'texto', nome: 'Dosímetro', obrigatorio: true },
        { id: 'f14', tipo: 'texto', nome: 'Modelo / nº de série' },
        { id: 'f18', tipo: 'secao', nome: 'Atividades e resultado' },
        { id: 'f19', tipo: 'texto_longo', nome: 'Atividades executadas durante a avaliação' },
        { id: 'f23', tipo: 'numero', nome: 'Dose', unidade: '%' },
        { id: 'f24', tipo: 'numero', nome: 'NEN', unidade: 'dB(A)' },
        { id: 'f20', tipo: 'foto', nome: 'Fotos (calibração, dosímetro no colaborador)' },
        { id: 'f21', tipo: 'assinatura', nome: 'Assinatura do colaborador' },
        { id: 'f22', tipo: 'assinatura', nome: 'Assinatura do técnico' },
      ],
      'Avaliação de Calor': [
        { id: 'f1', tipo: 'secao', nome: 'Dados da amostragem' },
        { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
        { id: 'f3', tipo: 'hora', nome: 'Horário de início', obrigatorio: true },
        { id: 'f4', tipo: 'hora', nome: 'Horário de término', obrigatorio: true },
        { id: 'f5', tipo: 'secao', nome: 'Colaborador amostrado' },
        { id: 'f6', tipo: 'texto', nome: 'Nome do colaborador', obrigatorio: true },
        { id: 'f8', tipo: 'texto', nome: 'Função / GHE', obrigatorio: true },
        { id: 'f10', tipo: 'texto', nome: 'Setor' },
        { id: 'f11', tipo: 'secao', nome: 'Equipamento' },
        { id: 'f12', tipo: 'texto', nome: 'Medidor de IBUTG', obrigatorio: true },
        { id: 'f13', tipo: 'texto', nome: 'Modelo / nº de série' },
        { id: 'f17', tipo: 'secao', nome: 'Medições' },
        {
          id: 'f18',
          tipo: 'repetivel',
          nome: 'Pontos de medição',
          subcampos: [
            { id: 's1', tipo: 'texto', nome: 'Ponto' },
            { id: 's2', tipo: 'texto', nome: 'Atividade' },
            { id: 's3', tipo: 'texto', nome: 'Tempo' },
            { id: 's4', tipo: 'numero', nome: 'Bulbo úmido', unidade: '°C' },
            { id: 's5', tipo: 'numero', nome: 'Bulbo seco', unidade: '°C' },
            { id: 's6', tipo: 'numero', nome: 'Globo', unidade: '°C' },
            { id: 's7', tipo: 'numero', nome: 'IBUTG interno', unidade: '°C' },
            { id: 's8', tipo: 'numero', nome: 'IBUTG externo', unidade: '°C' },
          ],
        },
        { id: 'f19', tipo: 'texto_longo', nome: 'Atividades executadas durante a avaliação' },
        { id: 'f20', tipo: 'foto', nome: 'Fotos da medição' },
        { id: 'f23', tipo: 'assinatura', nome: 'Assinatura do técnico' },
      ],
      'Avaliação de Vibração': [
        { id: 'f1', tipo: 'secao', nome: 'Dados da amostragem' },
        { id: 'f2', tipo: 'data', nome: 'Data', obrigatorio: true },
        { id: 'f3', tipo: 'hora', nome: 'Horário de início', obrigatorio: true },
        { id: 'f4', tipo: 'hora', nome: 'Horário de término', obrigatorio: true },
        { id: 'f5', tipo: 'secao', nome: 'Colaborador amostrado' },
        { id: 'f6', tipo: 'texto', nome: 'Nome do colaborador', obrigatorio: true },
        { id: 'f8', tipo: 'texto', nome: 'Função / GHE', obrigatorio: true },
        { id: 'f10', tipo: 'texto', nome: 'Setor' },
        { id: 'f11', tipo: 'secao', nome: 'Equipamento de medição' },
        { id: 'f12', tipo: 'texto', nome: 'Medidor de vibração', obrigatorio: true },
        { id: 'f13', tipo: 'texto', nome: 'Modelo / nº de série' },
        { id: 'f17', tipo: 'secao', nome: 'Equipamento avaliado' },
        { id: 'f18', tipo: 'texto', nome: 'Máquina / veículo / ferramenta', obrigatorio: true },
        { id: 'f25', tipo: 'texto', nome: 'Tempo efetivo de exposição diária' },
        {
          id: 'f21',
          tipo: 'sim_nao',
          nome: 'Há queixas dos colaboradores relacionadas à vibração?',
        },
        {
          id: 'f22',
          tipo: 'texto',
          nome: 'Quais?',
          condicaoCampoId: 'f21',
          condicaoValor: 'Sim',
        },
        { id: 'f26', tipo: 'secao', nome: 'Atividades' },
        { id: 'f27', tipo: 'texto_longo', nome: 'Atividades executadas durante a avaliação' },
        { id: 'f28', tipo: 'foto', nome: 'Fotos' },
        { id: 'f29', tipo: 'assinatura', nome: 'Assinatura do colaborador' },
        { id: 'f30', tipo: 'assinatura', nome: 'Assinatura do técnico' },
      ],
      Químicos: [
        { id: 'f1', tipo: 'secao', nome: 'Dados da campanha' },
        { id: 'f2', tipo: 'texto', nome: 'Empresa / cliente', obrigatorio: true },
        { id: 'f4', tipo: 'texto', nome: 'Unidade / setor' },
        { id: 'f6', tipo: 'data', nome: 'Data', obrigatorio: true },
        { id: 'f7', tipo: 'texto', nome: 'Técnico', obrigatorio: true },
        { id: 'f8', tipo: 'secao', nome: 'Pontos de amostragem' },
        {
          id: 'f9',
          tipo: 'repetivel',
          nome: 'Pontos de amostragem',
          subcampos: [
            { id: 's1', tipo: 'texto', nome: 'Ponto' },
            { id: 's2', tipo: 'texto', nome: 'Função / GHE' },
            { id: 's5', tipo: 'texto', nome: 'Agente(s)' },
            { id: 's6', tipo: 'texto', nome: 'Meio de coleta / método' },
            { id: 's8', tipo: 'texto', nome: 'Bomba (nº de série)' },
            { id: 's9', tipo: 'numero', nome: 'Vazão inicial', unidade: 'L/min' },
            { id: 's10', tipo: 'numero', nome: 'Vazão final', unidade: 'L/min' },
            { id: 's11', tipo: 'texto', nome: 'Horário (início e término)' },
            { id: 's17', tipo: 'texto', nome: 'Observações' },
          ],
        },
        { id: 'f10', tipo: 'secao', nome: 'Fotos e assinatura' },
        { id: 'f11', tipo: 'foto', nome: 'Fotos (calibração, bomba, amostrador no colaborador)' },
        { id: 'f12', tipo: 'assinatura', nome: 'Assinatura do técnico' },
      ],
    }

    for (const nome of Object.keys(NOVOS)) {
      const achados = app.findRecordsByFilter(
        'modelos_formulario',
        "fixo = true && organizacao_id = '' && nome = {:n}",
        '',
        0,
        0,
        { n: nome },
      )
      for (const m of achados) {
        m.set('campos', NOVOS[nome])
        app.save(m)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('formularios')
    const f = col.fields.getByName('campos_snapshot')
    if (f) col.fields.removeById(f.id)
    app.save(col)
  },
)
