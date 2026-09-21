// Migração 0100: Cria usuário cliente (não-admin) e organização de exemplo
// Usuário cliente: cliente@empresaexemplo.com.br / labora123
// Papel: 'executor' (papel não-gestor reconhecido no schema e em isGestor)
// Organização de exemplo: "Metalúrgica Exemplo Ltda"
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const orgCol = app.findCollectionByNameOrId('organizacoes')
    const empCol = app.findCollectionByNameOrId('empresas')

    const emailCliente = 'cliente@empresaexemplo.com.br'

    // 1. Usuário cliente (não-admin) criado primeiro para obter o id se necessário
    let user = null
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', emailCliente)
    } catch (_) {
      user = null
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

    // 2. Organização de exemplo (idempotente) com dono_id preenchido
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
    }

    // Vincula o usuário à organização
    if (user.getString('organizacao_id') !== org.id) {
      user.set('organizacao_id', org.id)
      app.save(user)
    }

    // 3. Empresa cadastrada dentro da organização para visualização operacional
    let emp = null
    try {
      emp = app.findFirstRecordByFilter(
        'empresas',
        "organizacao_id = '" + org.id + "' && cnpj = '12.345.678/0001-90'",
      )
    } catch (_) {
      emp = null
    }

    if (!emp) {
      emp = new Record(empCol)
      emp.set('organizacao_id', org.id)
      emp.set('razao_social', 'Metalúrgica Exemplo Indústria e Comércio Ltda')
      emp.set('nome_fantasia', 'Metalúrgica Exemplo')
      emp.set('cnpj', '12.345.678/0001-90')
      emp.set('porte', 'Demais / Não se enquadra')
      emp.set('grau_risco', 3)
      emp.set('numero_funcionarios', 120)
      emp.set('endereco', 'Av. das Indústrias, 1500 — Distrito Industrial')
      emp.set('contato_nome', 'Carlos Alberto')
      emp.set('contato_telefone', '(11) 98765-4321')
      emp.set('contato_email', emailCliente)
      app.save(emp)
    }

    // 4. Responsável técnico vinculado ao usuário executor (para vistorias)
    try {
      const rtCol = app.findCollectionByNameOrId('responsaveis_tecnicos')
      let rt = null
      try {
        rt = app.findFirstRecordByFilter(
          'responsaveis_tecnicos',
          "organizacao_id = '" + org.id + "' && usuario_id = '" + user.id + "'",
        )
      } catch (_) {
        rt = null
      }
      if (!rt) {
        rt = new Record(rtCol)
        rt.set('organizacao_id', org.id)
        rt.set('nome', 'Carlos Alberto (Técnico SST)')
        rt.set('tipo_registro', 'MTE')
        rt.set('numero_registro', 'SP/012345')
        rt.set('uf', 'SP')
        rt.set('padrao', true)
        rt.set('usuario_id', user.id)
        app.save(rt)
      }
    } catch (e) {
      console.log('Aviso ao criar responsável técnico:', e && e.message ? e.message : String(e))
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'cliente@empresaexemplo.com.br')
      app.delete(user)
    } catch (_) {}
    try {
      const org = app.findFirstRecordByData('organizacoes', 'nome', 'Metalúrgica Exemplo Ltda')
      // Deleta empresas da org
      const empresas = app.findRecordsByFilter(
        'empresas',
        "organizacao_id = '" + org.id + "'",
        '',
        100,
        0,
      )
      empresas.forEach((item) => app.delete(item))
      app.delete(org)
    } catch (_) {}
  },
)
