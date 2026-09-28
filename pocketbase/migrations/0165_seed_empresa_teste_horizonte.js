// 0165: seed de teste ponta-a-ponta — organização fictícia "Horizonte
// Segurança do Trabalho Ltda" (consultoria) e empresa cliente fictícia
// "Cerâmica Vale do Poti Ltda", para o roteiro de teste completo do app (ver
// claude/labora-vistoria-roteiro-teste-empresa-ficticia-2026-09-28.md no
// Projeto APP SST). Dados fictícios; senha temporária conhecida para os
// quatro logins, porque o fluxo de "criar senha por e-mail" ainda não está
// confirmado em produção — cada um troca a senha no primeiro acesso.
//
// Ordem: usuários (Marina precisa existir antes da organização, para virar
// dono_id) -> organização -> vínculo dos usuários à organização -> registros
// profissionais -> empresa cliente -> setores -> GHEs (ghe_id é obrigatório
// em funcoes_sst, então os GHEs são criados antes das funções) -> funções ->
// acesso de portal do cliente (Carlos).
//
// Deliberadamente NÃO seedado: avaliacoes_risco (inventário de riscos). Essa
// coleção tem campos de severidade/probabilidade que fazem mais sentido
// preenchidos pela Marina na Fase B do roteiro de teste (é o próprio módulo
// que o teste deve validar). GHEs e funções ficam prontos como ponto de
// partida; os perigos por GHE listados no roteiro foram resumidos no campo
// descricao_atividades de cada GHE, como referência para quem for preencher
// o inventário manualmente.
migrate(
  (app) => {
    const SENHA_TEMP = 'Labora2026!'

    const usersCol = app.findCollectionByNameOrId('users')
    const orgCol = app.findCollectionByNameOrId('organizacoes')
    const empCol = app.findCollectionByNameOrId('empresas')
    const setorCol = app.findCollectionByNameOrId('setores')
    const gheCol = app.findCollectionByNameOrId('ghes')
    const funcaoCol = app.findCollectionByNameOrId('funcoes_sst')
    const rtCol = app.findCollectionByNameOrId('responsaveis_tecnicos')
    const acessoCol = app.findCollectionByNameOrId('acessos_cliente')

    const acharOuCriarUsuario = (email, nome) => {
      let u
      try {
        u = app.findAuthRecordByEmail('users', email)
      } catch (_) {
        u = new Record(usersCol)
        u.setEmail(email)
      }
      u.setPassword(SENHA_TEMP)
      u.setVerified(true)
      u.set('name', nome)
      u.set('trocar_senha', true)
      app.save(u)
      return u
    }

    // ---------- 1. Usuários da Horizonte ----------
    const marina = acharOuCriarUsuario('eng.gilsonlopes@gmail.com', 'Marina Castro')
    const rafael = acharOuCriarUsuario('eng.gilsonlopes+rafael@gmail.com', 'Rafael Lima')
    const julia = acharOuCriarUsuario('eng.gilsonlopes+julia@gmail.com', 'Júlia Mendes')

    // ---------- 2. Organização Horizonte (idempotente por nome) ----------
    let org
    try {
      org = app.findFirstRecordByData(
        'organizacoes',
        'nome',
        'Horizonte Segurança do Trabalho Ltda',
      )
    } catch (_) {
      org = new Record(orgCol)
      org.set('nome', 'Horizonte Segurança do Trabalho Ltda')
      org.set('dono_id', marina.id)
    }
    org.set('status', 'ativa')
    org.set('plano', 'equipe')
    org.set('limite_usuarios', 4) // dono + 3
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 30)
    org.set('vencimento', vencimento.toISOString())
    org.set(
      'modulos',
      JSON.stringify({
        auditoria: true,
        relatorios: true,
        formularios: true,
        ia: true,
        orcamentos: true,
        documentos: true,
      }),
    )
    app.save(org)

    // ---------- 3. Vínculo dos três usuários à organização ----------
    marina.set('organizacao_id', org.id)
    marina.set('papel', 'dono')
    app.save(marina)

    rafael.set('organizacao_id', org.id)
    rafael.set('papel', 'executor')
    app.save(rafael)

    julia.set('organizacao_id', org.id)
    julia.set('papel', 'administrativo')
    app.save(julia)

    // ---------- 4. Registros profissionais (Marina e Rafael; Júlia não tem) ----------
    const acharOuCriarRt = (usuarioId) => {
      try {
        return app.findFirstRecordByFilter(
          'responsaveis_tecnicos',
          'organizacao_id = {:o} && usuario_id = {:u}',
          { o: org.id, u: usuarioId },
        )
      } catch (_) {
        const rt = new Record(rtCol)
        rt.set('organizacao_id', org.id)
        rt.set('usuario_id', usuarioId)
        return rt
      }
    }

    const rtMarina = acharOuCriarRt(marina.id)
    rtMarina.set('nome', 'Marina Castro')
    rtMarina.set('tipo_registro', 'CREA')
    rtMarina.set('numero_registro', '1234567-8')
    rtMarina.set('uf', 'PI')
    rtMarina.set('padrao', true)
    app.save(rtMarina)

    const rtRafael = acharOuCriarRt(rafael.id)
    rtRafael.set('nome', 'Rafael Lima')
    rtRafael.set('tipo_registro', 'MTE')
    rtRafael.set('numero_registro', '0009876-PI')
    rtRafael.set('uf', 'PI')
    rtRafael.set('padrao', false)
    app.save(rtRafael)

    // ---------- 5. Empresa cliente: Cerâmica Vale do Poti Ltda ----------
    let empresa
    try {
      empresa = app.findFirstRecordByFilter(
        'empresas',
        "organizacao_id = {:o} && cnpj = '98.765.432/0001-10'",
        { o: org.id },
      )
    } catch (_) {
      empresa = new Record(empCol)
      empresa.set('organizacao_id', org.id)
    }
    empresa.set('razao_social', 'Cerâmica Vale do Poti Ltda')
    empresa.set('nome_fantasia', 'Cerâmica Vale do Poti')
    empresa.set('cnpj', '98.765.432/0001-10')
    empresa.set('cnae', '23.42-7')
    empresa.set(
      'cnae_descricao',
      'Fabricação de artefatos de cerâmica e barro cozido para uso na construção',
    )
    empresa.set('porte', 'Demais / Não se enquadra')
    empresa.set('grau_risco', 3)
    empresa.set('numero_funcionarios', 48)
    empresa.set('endereco', 'Distrito Industrial de Teresina, PI')
    empresa.set('cidade', 'Teresina')
    empresa.set('uf', 'PI')
    empresa.set('contato_nome', 'Carlos Rocha')
    empresa.set('contato_telefone', '(86) 99999-0000')
    empresa.set('contato_email', 'eng.gilsonlopes+carlos@gmail.com')
    app.save(empresa)

    // ---------- 6. Setores ----------
    const nomesSetores = [
      'Preparação de massa',
      'Extrusão/prensagem',
      'Fornos',
      'Expedição',
      'Manutenção',
      'Administrativo',
    ]
    const setorPorNome = {}
    for (const nome of nomesSetores) {
      let s
      try {
        s = app.findFirstRecordByFilter('setores', 'empresa_id = {:e} && nome = {:n}', {
          e: empresa.id,
          n: nome,
        })
      } catch (_) {
        s = new Record(setorCol)
        s.set('organizacao_id', org.id)
        s.set('empresa_id', empresa.id)
        s.set('nome', nome)
        app.save(s)
      }
      setorPorNome[nome] = s
    }

    // ---------- 7. GHEs (modo GHE) ----------
    // Perigos por GHE (roteiro, seção 1) resumidos em descricao_atividades,
    // como ponto de partida para o preenchimento manual do inventário.
    const ghesDef = [
      {
        codigo: 'GHE-01',
        nome: 'Preparação/Extrusão',
        setor: null, // agrupa dois setores (Preparação de massa + Extrusão/prensagem)
        criterio:
          'Funções da preparação de massa e da extrusão/prensagem, com exposição semelhante a ruído e poeira mineral.',
        descricao:
          'Ruído contínuo (dosimetria 87,5 dB(A) q=5; NEN 86 dB(A) q=3), sílica cristalina (poeira respirável 0,08 mg/m³, 3 amostras), partes móveis de máquinas (NR-12), postura em pé prolongada.',
      },
      {
        codigo: 'GHE-02',
        nome: 'Fornos',
        setor: 'Fornos',
        criterio: 'Função de forneiro, exposta a calor e GLP dos queimadores.',
        descricao:
          'Calor (IBUTG 29,8 °C, atividade moderada), ruído 84 dB(A), GLP nos queimadores (inflamáveis, NR-16 Anexo 2), superfície quente.',
      },
      {
        codigo: 'GHE-03',
        nome: 'Expedição',
        setor: 'Expedição',
        criterio:
          'Auxiliares de expedição, com movimentação manual de carga e uso de empilhadeira.',
        descricao: 'Levantamento manual de cargas, empilhadeira, ruído 81 dB(A).',
      },
      {
        codigo: 'GHE-04',
        nome: 'Manutenção',
        setor: 'Manutenção',
        criterio: 'Eletricistas e mecânicos de manutenção industrial.',
        descricao:
          'Eletricidade (NR-10, sistema elétrico de potência — NR-16 Anexo 4), altura (NR-35), compressor de ar (NR-13), óleos minerais (contato — NR-16 Anexo 13, qualitativo).',
      },
      {
        codigo: 'GHE-05',
        nome: 'Administrativo',
        setor: 'Administrativo',
        criterio: 'Funções administrativas e de gerência, sem exposição a agentes ambientais.',
        descricao:
          'Ergonômico (mobiliário, tela, iluminação). Sem agente ambiental — caso de referência para "ausência de agente nocivo" no LTCAT e para a ficha de iluminância.',
      },
      {
        codigo: 'GHE-06',
        nome: 'Motoristas',
        setor: 'Expedição',
        criterio: 'Motoristas de caminhão da expedição, agrupados à parte por risco de trânsito.',
        descricao:
          'Acidente de trânsito. Sem periculosidade (motorista de caminhão, não motociclista) — caso de referência para conclusão negativa de periculosidade.',
      },
      {
        codigo: 'GHE-07',
        nome: 'Vigilância',
        setor: null,
        criterio: 'Vigilantes responsáveis pela segurança patrimonial da planta.',
        descricao: 'Segurança patrimonial (NR-16 Anexo 3) — periculosidade devida.',
      },
    ]

    // número de expostos por código de GHE, calculado a partir das funções
    // definidas no bloco 8 (mantido em sincronia manualmente)
    const expostosPorGhe = {
      'GHE-01': 20, // operador de extrusora (8) + auxiliar de produção (12)
      'GHE-02': 6, // forneiro (6)
      'GHE-03': 8, // auxiliar de expedição (8)
      'GHE-04': 4, // eletricista (2) + mecânico (2)
      'GHE-05': 5, // assistente administrativo (4) + gerente (1)
      'GHE-06': 2, // motorista (2)
      'GHE-07': 3, // vigilante (3)
    }

    const ghePorCodigo = {}
    for (const def of ghesDef) {
      let g
      try {
        g = app.findFirstRecordByFilter('ghes', 'empresa_id = {:e} && codigo = {:c}', {
          e: empresa.id,
          c: def.codigo,
        })
      } catch (_) {
        g = new Record(gheCol)
        g.set('organizacao_id', org.id)
        g.set('empresa_id', empresa.id)
        g.set('codigo', def.codigo)
      }
      g.set('nome', def.nome)
      g.set('tipo_agrupamento', 'GHE')
      g.set('criterio_agrupamento', def.criterio)
      g.set('descricao_atividades', def.descricao)
      g.set('numero_expostos', expostosPorGhe[def.codigo])
      if (def.setor && setorPorNome[def.setor]) {
        g.set('setor_id', setorPorNome[def.setor].id)
      }
      app.save(g)
      ghePorCodigo[def.codigo] = g
    }

    // ---------- 8. Funções (com quantidade de trabalhadores) ----------
    const funcoesDef = [
      { nome: 'Operador de extrusora', setor: 'Extrusão/prensagem', ghe: 'GHE-01', qtd: 8 },
      { nome: 'Auxiliar de produção', setor: 'Preparação de massa', ghe: 'GHE-01', qtd: 12 },
      { nome: 'Forneiro', setor: 'Fornos', ghe: 'GHE-02', qtd: 6 },
      { nome: 'Auxiliar de expedição', setor: 'Expedição', ghe: 'GHE-03', qtd: 8 },
      { nome: 'Eletricista de manutenção', setor: 'Manutenção', ghe: 'GHE-04', qtd: 2 },
      { nome: 'Mecânico de manutenção', setor: 'Manutenção', ghe: 'GHE-04', qtd: 2 },
      { nome: 'Assistente administrativo', setor: 'Administrativo', ghe: 'GHE-05', qtd: 4 },
      { nome: 'Gerente', setor: 'Administrativo', ghe: 'GHE-05', qtd: 1 },
      { nome: 'Motorista', setor: 'Expedição', ghe: 'GHE-06', qtd: 2 },
      { nome: 'Vigilante', setor: 'Administrativo', ghe: 'GHE-07', qtd: 3 },
    ]

    for (const def of funcoesDef) {
      let f
      try {
        f = app.findFirstRecordByFilter('funcoes_sst', 'empresa_id = {:e} && nome = {:n}', {
          e: empresa.id,
          n: def.nome,
        })
      } catch (_) {
        f = new Record(funcaoCol)
        f.set('organizacao_id', org.id)
        f.set('empresa_id', empresa.id)
        f.set('nome', def.nome)
      }
      f.set('setor_id', setorPorNome[def.setor].id)
      f.set('ghe_id', ghePorCodigo[def.ghe].id)
      f.set('numero_empregados', def.qtd)
      app.save(f)
    }

    // ---------- 9. Portal do cliente: Carlos Rocha ----------
    const carlos = acharOuCriarUsuario('eng.gilsonlopes+carlos@gmail.com', 'Carlos Rocha')
    carlos.set('papel', 'cliente')
    app.save(carlos)

    let acesso
    try {
      acesso = app.findFirstRecordByFilter(
        'acessos_cliente',
        'usuario_id = {:u} && empresa_id = {:e}',
        { u: carlos.id, e: empresa.id },
      )
    } catch (_) {
      acesso = new Record(acessoCol)
      acesso.set('usuario_id', carlos.id)
      acesso.set('empresa_id', empresa.id)
    }
    acesso.set('organizacao_id', org.id)
    acesso.set('ativo', true)
    app.save(acesso)
  },
  (app) => {
    const apagarPorEmail = (email) => {
      try {
        app.delete(app.findAuthRecordByEmail('users', email))
      } catch (_) {}
    }

    try {
      const empresa = app.findFirstRecordByFilter('empresas', "cnpj = '98.765.432/0001-10'")
      if (empresa) {
        const setores = app.findRecordsByFilter('setores', 'empresa_id = {:e}', '', 0, 0, {
          e: empresa.id,
        })
        const ghes = app.findRecordsByFilter('ghes', 'empresa_id = {:e}', '', 0, 0, {
          e: empresa.id,
        })
        const funcoes = app.findRecordsByFilter('funcoes_sst', 'empresa_id = {:e}', '', 0, 0, {
          e: empresa.id,
        })
        const acessos = app.findRecordsByFilter('acessos_cliente', 'empresa_id = {:e}', '', 0, 0, {
          e: empresa.id,
        })
        for (const a of acessos) app.delete(a)
        for (const f of funcoes) app.delete(f)
        for (const g of ghes) app.delete(g)
        for (const s of setores) app.delete(s)
        app.delete(empresa)
      }
    } catch (_) {}

    try {
      const org = app.findFirstRecordByData(
        'organizacoes',
        'nome',
        'Horizonte Segurança do Trabalho Ltda',
      )
      if (org) {
        const rts = app.findRecordsByFilter(
          'responsaveis_tecnicos',
          'organizacao_id = {:o}',
          '',
          0,
          0,
          { o: org.id },
        )
        for (const rt of rts) app.delete(rt)
        app.delete(org)
      }
    } catch (_) {}

    apagarPorEmail('eng.gilsonlopes+carlos@gmail.com')
    apagarPorEmail('eng.gilsonlopes+julia@gmail.com')
    apagarPorEmail('eng.gilsonlopes+rafael@gmail.com')
    apagarPorEmail('eng.gilsonlopes@gmail.com')
  },
)
