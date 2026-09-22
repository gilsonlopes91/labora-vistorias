// Migração 0103: Garante o acesso do usuário cliente (cliente@empresaexemplo.com.br / labora123)
// e adiciona empresas fictícias brasileiras de SST vinculadas à sua organização (Metalúrgica Exemplo Ltda).
// Idempotente: se o usuário ou empresas já existirem, atualiza os vínculos e não duplica registros.

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const orgCol = app.findCollectionByNameOrId('organizacoes')
    const empCol = app.findCollectionByNameOrId('empresas')

    const emailCliente = 'cliente@empresaexemplo.com.br'

    // 1. Garantir conta do usuário cliente existente, ativa e com senha 'labora123'
    let user = null
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', emailCliente)
    } catch (_) {
      try {
        user = app.findAuthRecordByEmail('users', emailCliente)
      } catch (_) {
        user = null
      }
    }

    if (!user) {
      user = new Record(usersCol)
      user.setEmail(emailCliente)
    }

    user.setPassword('labora123')
    user.setVerified(true)
    user.set('name', 'Carlos Alberto (Metalúrgica Exemplo)')
    user.set('papel', 'executor')
    user.set('trocar_senha', false)
    user.set('acesso_console', false)
    app.save(user)

    // 2. Garantir organização de exemplo (Metalúrgica Exemplo Ltda) ativa e vinculada
    let org = null
    try {
      org = app.findFirstRecordByData('organizacoes', 'nome', 'Metalúrgica Exemplo Ltda')
    } catch (_) {
      org = null
    }

    if (!org) {
      org = new Record(orgCol)
      org.set('nome', 'Metalúrgica Exemplo Ltda')
      org.set('dono_id', user.id)
      org.set('status', 'ativa')
      org.set(
        'modulos',
        JSON.stringify({
          auditoria: true,
          relatorios: true,
          formularios: true,
          orcamentos: true,
        }),
      )
      app.save(org)
    } else {
      // Garantir status ativa e dono_id coerente
      if (org.getString('status') !== 'ativa') {
        org.set('status', 'ativa')
        app.save(org)
      }
    }

    // Vincula o usuário à organização
    if (user.getString('organizacao_id') !== org.id) {
      user.set('organizacao_id', org.id)
      app.save(user)
    }

    // 3. Empresas fictícias brasileiras de SST vinculadas à organização do cliente
    // Cada empresa possui CNPJ formatado no padrão brasileiro (00.000.000/0000-00),
    // telefone mascarado, endereço completo com cidade/UF, porte e grau de risco.
    const empresasExemplo = [
      {
        razao_social: 'Indústria Metalúrgica São Jorge Ltda',
        nome_fantasia: 'São Jorge Metalurgia',
        cnpj: '18.452.910/0001-44',
        porte: 'Demais / Não se enquadra',
        grau_risco: 3,
        numero_funcionarios: 145,
        endereco: 'Rodovia Anhanguera, km 104 — Parque Industrial, Campinas - SP',
        contato_nome: 'Marcos Vinicius de Souza',
        contato_telefone: '(19) 3241-8890',
        contato_email: 'seguranca@saojorgemetal.com.br',
      },
      {
        razao_social: 'Construtora Horizonte Ltda',
        nome_fantasia: 'Horizonte Engenharia e Obras',
        cnpj: '24.118.732/0001-85',
        porte: 'Demais / Não se enquadra',
        grau_risco: 4,
        numero_funcionarios: 280,
        endereco: 'Av. Paulista, 1754, Conj. 82 — Bela Vista, São Paulo - SP',
        contato_nome: 'Engª Camila Prado (SESMT)',
        contato_telefone: '(11) 3145-6200',
        contato_email: 'sst@construtorahorizonte.com.br',
      },
      {
        razao_social: 'Transportes Vale Verde Ltda',
        nome_fantasia: 'Vale Verde Logística Integrada',
        cnpj: '33.901.447/0001-19',
        porte: 'Demais / Não se enquadra',
        grau_risco: 3,
        numero_funcionarios: 95,
        endereco: 'Rua das Oliveiras, 450 — Bairro Betânia, Belo Horizonte - MG',
        contato_nome: 'Rodrigo Antunes',
        contato_telefone: '(31) 3389-1120',
        contato_email: 'operacoes@valeverdelog.com.br',
      },
      {
        razao_social: 'Frigorífico Sul Brasil Alimentos S.A.',
        nome_fantasia: 'Sul Brasil Carnes (NR-36)',
        cnpj: '07.654.321/0001-08',
        porte: 'Demais / Não se enquadra',
        grau_risco: 3,
        numero_funcionarios: 420,
        endereco: 'Estrada do Boqueirão, s/n — Zona Rural, Passo Fundo - RS',
        contato_nome: 'Juliana Fagundes (Téc. SST)',
        contato_telefone: '(54) 3312-7400',
        contato_email: 'sst@sulbrasilalimentos.com.br',
      },
      {
        razao_social: 'Química Paulista Derivados e Tintas Ltda',
        nome_fantasia: 'Paulista Tintas & Revestimentos',
        cnpj: '45.123.890/0001-52',
        porte: 'EPP',
        grau_risco: 3,
        numero_funcionarios: 38,
        endereco: 'Av. Industrial Santo André, 910 — Tamanduateí, Santo André - SP',
        contato_nome: 'Fábio Nogueira',
        contato_telefone: '(11) 4438-9922',
        contato_email: 'fabio.nogueira@paulistatintas.com.br',
      },
    ]

    empresasExemplo.forEach((dados) => {
      let registroEmpresa = null
      try {
        // Busca idempotente: por CNPJ dentro da organização ou por Razão Social
        registroEmpresa = app.findFirstRecordByFilter(
          'empresas',
          "organizacao_id = '" +
            org.id +
            "' && (cnpj = '" +
            dados.cnpj +
            "' || razao_social = '" +
            dados.razao_social +
            "')",
        )
      } catch (_) {
        registroEmpresa = null
      }

      if (!registroEmpresa) {
        registroEmpresa = new Record(empCol)
        registroEmpresa.set('organizacao_id', org.id)
      }

      registroEmpresa.set('razao_social', dados.razao_social)
      registroEmpresa.set('nome_fantasia', dados.nome_fantasia)
      registroEmpresa.set('cnpj', dados.cnpj)
      registroEmpresa.set('porte', dados.porte)
      registroEmpresa.set('grau_risco', dados.grau_risco)
      registroEmpresa.set('numero_funcionarios', dados.numero_funcionarios)
      registroEmpresa.set('endereco', dados.endereco)
      registroEmpresa.set('contato_nome', dados.contato_nome)
      registroEmpresa.set('contato_telefone', dados.contato_telefone)
      registroEmpresa.set('contato_email', dados.contato_email)

      app.save(registroEmpresa)
    })
  },
  (app) => {
    // Down migration: remove apenas as empresas criadas pelo seed nesta migração
    try {
      const org = app.findFirstRecordByData('organizacoes', 'nome', 'Metalúrgica Exemplo Ltda')
      if (org) {
        const cnpjs = [
          '18.452.910/0001-44',
          '24.118.732/0001-85',
          '33.901.447/0001-19',
          '07.654.321/0001-08',
          '45.123.890/0001-52',
        ]
        cnpjs.forEach((cnpj) => {
          try {
            const emp = app.findFirstRecordByFilter(
              'empresas',
              "organizacao_id = '" + org.id + "' && cnpj = '" + cnpj + "'",
            )
            if (emp) app.delete(emp)
          } catch (_) {}
        })
      }
    } catch (_) {}
  },
)
