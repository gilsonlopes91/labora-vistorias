// Migração 0137: Cadastra empresas adicionais de mockup para a organização do Amaury
// (Metalúrgica Exemplo Ltda - id: hkhj5ngp5posn43).
// Variando setores (alimentício/laticínios, construção civil pesada, gráfica/editorial,
// hospitalar/saúde, agroindústria/grãos, transporte/logística frigorificada),
// portas, graus de risco (1 a 4) e municípios de diferentes estados brasileiros.
// Idempotente: confere se a empresa já existe por CNPJ na organização antes de inserir.

migrate(
  (app) => {
    const orgId = 'hkhj5ngp5posn43'

    // Garantir que a organização exista
    let org = null
    try {
      org = app.findFirstRecordByFilter('organizacoes', "id = '" + orgId + "'")
    } catch (_) {
      try {
        org = app.findFirstRecordByData('organizacoes', 'nome', 'Metalúrgica Exemplo Ltda')
      } catch (_) {
        org = null
      }
    }

    if (!org) {
      console.log('0137: Organização Metalúrgica Exemplo Ltda não encontrada, abortando seed.')
      return
    }

    const empCol = app.findCollectionByNameOrId('empresas')

    const novasEmpresas = [
      {
        razao_social: 'Laticínios Serra da Canastra Indústria e Comércio Ltda',
        nome_fantasia: 'Laticínios Canastra',
        cnpj: '15.932.481/0001-37',
        porte: 'EPP',
        grau_risco: 3,
        numero_funcionarios: 64,
        cnae: '10520',
        cnae_descricao: 'Fabricação de laticínios',
        cep: '37928-000',
        logradouro: 'Rodovia MG-050',
        numero_endereco: 'km 312',
        complemento: 'Galpão Industrial A',
        bairro: 'Distrito Agroindustrial',
        cidade: 'Passos',
        uf: 'MG',
        endereco:
          'Rodovia MG-050, km 312, Galpão Industrial A, Distrito Agroindustrial, Passos - MG, CEP 37928-000',
        contato_nome: 'Mariana Duarte Rezende (Coord. Qualidade & SST)',
        contato_telefone: '(35) 3521-4470',
        contato_email: 'sst@laticinioscanastra.com.br',
      },
      {
        razao_social: 'Pioneira Infraestrutura e Pavimentação Rodoviária S.A.',
        nome_fantasia: 'Pioneira Obras & Pavimentação',
        cnpj: '28.614.903/0001-11',
        porte: 'Demais / Não se enquadra',
        grau_risco: 4,
        numero_funcionarios: 340,
        cnae: '42111',
        cnae_descricao: 'Construção de rodovias e ferrovias',
        cep: '83015-000',
        logradouro: 'Avenida das Torres',
        numero_endereco: '4200',
        complemento: 'Módulo 3 - Canteiro Central',
        bairro: 'São Cristóvão',
        cidade: 'São José dos Pinhais',
        uf: 'PR',
        endereco:
          'Avenida das Torres, 4200, Módulo 3 - Canteiro Central, São Cristóvão, São José dos Pinhais - PR, CEP 83015-000',
        contato_nome: 'Eng. Roberto Mendonça (SESMT)',
        contato_telefone: '(41) 3381-9020',
        contato_email: 'sesmt@pioneirapavimentacao.com.br',
      },
      {
        razao_social: 'Complexo Hospitalar São Lucas e Maternidade Ltda',
        nome_fantasia: 'Hospital e Maternidade São Lucas',
        cnpj: '03.847.129/0001-09',
        porte: 'Demais / Não se enquadra',
        grau_risco: 3,
        numero_funcionarios: 520,
        cnae: '86101',
        cnae_descricao: 'Atividades de atendimento hospitalar',
        cep: '74080-010',
        logradouro: 'Avenida Universitária',
        numero_endereco: '1450',
        complemento: 'Ala Sul - Setor Médico',
        bairro: 'Setor Leste Universitário',
        cidade: 'Goiânia',
        uf: 'GO',
        endereco:
          'Avenida Universitária, 1450, Ala Sul - Setor Médico, Setor Leste Universitário, Goiânia - GO, CEP 74080-010',
        contato_nome: 'Dra. Beatriz Fontana (Médica do Trabalho / CIPA)',
        contato_telefone: '(62) 3216-8800',
        contato_email: 'segurancadotrabalho@saolucashospital.med.br',
      },
      {
        razao_social: 'Gráfica e Editora Aliança Brasileira Ltda',
        nome_fantasia: 'Aliança Impressões & Embalagens',
        cnpj: '19.782.345/0001-64',
        porte: 'ME',
        grau_risco: 3,
        numero_funcionarios: 22,
        cnae: '18130',
        cnae_descricao: 'Impressão de materiais para outros usos',
        cep: '90230-010',
        logradouro: 'Rua Voluntários da Pátria',
        numero_endereco: '3890',
        complemento: 'Pavilhão 02',
        bairro: 'São Geraldo',
        cidade: 'Porto Alegre',
        uf: 'RS',
        endereco:
          'Rua Voluntários da Pátria, 3890, Pavilhão 02, São Geraldo, Porto Alegre - RS, CEP 90230-010',
        contato_nome: 'Lucas Silveira (Técnico em Segurança do Trabalho)',
        contato_telefone: '(51) 3342-1850',
        contato_email: 'lucas.sst@aliancagrafica.com.br',
      },
      {
        razao_social: 'Agropecuária e Grãos Santa Cecília do Vale Ltda',
        nome_fantasia: 'Fazenda & Armazéns Santa Cecília (NR-31)',
        cnpj: '31.205.678/0001-72',
        porte: 'Demais / Não se enquadra',
        grau_risco: 3,
        numero_funcionarios: 110,
        cnae: '01113',
        cnae_descricao: 'Cultivo de cereais',
        cep: '78850-000',
        logradouro: 'Rodovia MT-130',
        numero_endereco: 'km 45',
        complemento: 'Silos e Escritório Central',
        bairro: 'Zona Rural',
        cidade: 'Primavera do Leste',
        uf: 'MT',
        endereco:
          'Rodovia MT-130, km 45, Silos e Escritório Central, Zona Rural, Primavera do Leste - MT, CEP 78850-000',
        contato_nome: 'Valdomiro Costa e Silva (CIPATR / Segurança Operacional)',
        contato_telefone: '(66) 3498-3310',
        contato_email: 'cipatr@santaceciliaagro.com.br',
      },
      {
        razao_social: 'TransCargas Express Transportes e Frigorificados Eireli',
        nome_fantasia: 'TransCargas Express Logística',
        cnpj: '14.536.892/0001-20',
        porte: 'EPP',
        grau_risco: 3,
        numero_funcionarios: 48,
        cnae: '49302',
        cnae_descricao: 'Transporte rodoviário de carga',
        cep: '13054-750',
        logradouro: 'Rua dos Transportadores',
        numero_endereco: '550',
        complemento: 'Galpão 04 - Pátio de Triagem',
        bairro: 'Jardim das Bandeiras',
        cidade: 'Campinas',
        uf: 'SP',
        endereco:
          'Rua dos Transportadores, 550, Galpão 04 - Pátio de Triagem, Jardim das Bandeiras, Campinas - SP, CEP 13054-750',
        contato_nome: 'Fernanda Albuquerque (Gestora de Frotas & SST)',
        contato_telefone: '(19) 3728-6600',
        contato_email: 'sst@transcargasexpress.com.br',
      },
    ]

    for (let i = 0; i < novasEmpresas.length; i++) {
      const dados = novasEmpresas[i]
      let registroEmpresa = null
      try {
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
      registroEmpresa.set('cnae', dados.cnae)
      registroEmpresa.set('cnae_descricao', dados.cnae_descricao)
      registroEmpresa.set('cep', dados.cep)
      registroEmpresa.set('logradouro', dados.logradouro)
      registroEmpresa.set('numero_endereco', dados.numero_endereco)
      registroEmpresa.set('complemento', dados.complemento)
      registroEmpresa.set('bairro', dados.bairro)
      registroEmpresa.set('cidade', dados.cidade)
      registroEmpresa.set('uf', dados.uf)
      registroEmpresa.set('endereco', dados.endereco)
      registroEmpresa.set('contato_nome', dados.contato_nome)
      registroEmpresa.set('contato_telefone', dados.contato_telefone)
      registroEmpresa.set('contato_email', dados.contato_email)

      app.save(registroEmpresa)
    }
  },
  (app) => {
    const orgId = 'hkhj5ngp5posn43'
    const cnpjs = [
      '15.932.481/0001-37',
      '28.614.903/0001-11',
      '03.847.129/0001-09',
      '19.782.345/0001-64',
      '31.205.678/0001-72',
      '14.536.892/0001-20',
    ]

    for (let i = 0; i < cnpjs.length; i++) {
      try {
        const emp = app.findFirstRecordByFilter(
          'empresas',
          "organizacao_id = '" + orgId + "' && cnpj = '" + cnpjs[i] + "'",
        )
        if (emp) {
          app.delete(emp)
        }
      } catch (_) {}
    }
  },
)
