// Fase A — Equipe: papéis (dono/gerente/executor) + membros da organização.
// - users.papel: define o que a pessoa pode fazer dentro da organização.
// - organizacoes.membros: usuários vinculados à organização (além do dono).
// - responsaveis_tecnicos.usuario_id: liga o RT ao login (para o executor
//   editar somente vistorias atribuídas a ele).
// Regras: membro vê tudo da organização; executor não gerencia (empresas,
// modelos, rotinas, equipe) e só edita as próprias vistorias/respostas.
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')
    if (!usersCol.fields.getByName('papel')) {
      usersCol.fields.add(
        new SelectField({
          name: 'papel',
          values: ['dono', 'gerente', 'executor'],
          maxSelect: 1,
        }),
      )
    }
    app.save(usersCol)

    const orgCol = app.findCollectionByNameOrId('organizacoes')
    if (!orgCol.fields.getByName('membros')) {
      orgCol.fields.add(
        new RelationField({
          name: 'membros',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 200,
          required: false,
        }),
      )
    }
    orgCol.listRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || membros ?= @request.auth.id)"
    orgCol.viewRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || membros ?= @request.auth.id)"
    orgCol.updateRule = "@request.auth.id != '' && dono_id = @request.auth.id"
    app.save(orgCol)

    // Expressões reutilizáveis.
    const MEMBRO =
      '(organizacao_id.dono_id = @request.auth.id || organizacao_id.membros ?= @request.auth.id)'
    const AUTENTICADO = "@request.auth.id != ''"
    const GESTOR = "@request.auth.papel != 'executor'"

    // responsaveis_tecnicos: campo usuario_id PRECISA existir antes das
    // regras de vistorias/respostas o referenciarem.
    const rtCol = app.findCollectionByNameOrId('responsaveis_tecnicos')
    if (!rtCol.fields.getByName('usuario_id')) {
      rtCol.fields.add(
        new RelationField({
          name: 'usuario_id',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    rtCol.listRule = AUTENTICADO + ' && ' + MEMBRO
    rtCol.viewRule = AUTENTICADO + ' && ' + MEMBRO
    rtCol.createRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    rtCol.updateRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    rtCol.deleteRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    app.save(rtCol)
    // Empresas: todos veem; só dono/gerente gerenciam.
    const empCol = app.findCollectionByNameOrId('empresas')
    empCol.listRule = AUTENTICADO + ' && ' + MEMBRO
    empCol.viewRule = AUTENTICADO + ' && ' + MEMBRO
    empCol.createRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    empCol.updateRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    empCol.deleteRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    app.save(empCol)

    // Tipos de vistoria: catálogo global visível a todos; modelos próprios
    // gerenciados por dono/gerente.
    const tipoCol = app.findCollectionByNameOrId('tipos_vistoria')
    tipoCol.listRule = AUTENTICADO + " && (organizacao_id = '' || " + MEMBRO + ')'
    tipoCol.viewRule = AUTENTICADO + " && (organizacao_id = '' || " + MEMBRO + ')'
    tipoCol.createRule = AUTENTICADO + " && organizacao_id != '' && " + MEMBRO + ' && ' + GESTOR
    tipoCol.updateRule = AUTENTICADO + " && organizacao_id != '' && " + MEMBRO + ' && ' + GESTOR
    tipoCol.deleteRule = AUTENTICADO + " && organizacao_id != '' && " + MEMBRO + ' && ' + GESTOR
    app.save(tipoCol)

    // Itens de checklist: seguem o tipo de vistoria.
    const itemCol = app.findCollectionByNameOrId('itens_checklist')
    itemCol.listRule =
      AUTENTICADO +
      " && (tipo_vistoria_id.organizacao_id = '' || tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id || tipo_vistoria_id.organizacao_id.membros ?= @request.auth.id)"
    itemCol.viewRule =
      AUTENTICADO +
      " && (tipo_vistoria_id.organizacao_id = '' || tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id || tipo_vistoria_id.organizacao_id.membros ?= @request.auth.id)"
    itemCol.createRule =
      AUTENTICADO +
      " && tipo_vistoria_id.organizacao_id != '' && (tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id || tipo_vistoria_id.organizacao_id.membros ?= @request.auth.id) && " +
      GESTOR
    itemCol.updateRule = itemCol.createRule
    itemCol.deleteRule = itemCol.createRule
    app.save(itemCol)

    // Vistorias: todos veem; executor só cria/edita as atribuídas a ele.
    const vistCol = app.findCollectionByNameOrId('vistorias')
    vistCol.listRule = AUTENTICADO + ' && ' + MEMBRO
    vistCol.viewRule = AUTENTICADO + ' && ' + MEMBRO
    vistCol.createRule =
      AUTENTICADO +
      ' && ' +
      MEMBRO +
      " && (@request.auth.papel != 'executor' || responsavel_tecnico_id.usuario_id = @request.auth.id)"
    vistCol.updateRule = vistCol.createRule
    vistCol.deleteRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    app.save(vistCol)

    // Respostas de vistoria: executor só preenche as da própria vistoria.
    const respCol = app.findCollectionByNameOrId('respostas_vistoria')
    respCol.listRule =
      AUTENTICADO + ' && ' + MEMBRO.replace('organizacao_id', 'vistoria_id.organizacao_id')
    respCol.viewRule = respCol.listRule
    respCol.createRule =
      AUTENTICADO +
      ' && ' +
      MEMBRO.replace('organizacao_id', 'vistoria_id.organizacao_id') +
      " && (@request.auth.papel != 'executor' || vistoria_id.responsavel_tecnico_id.usuario_id = @request.auth.id)"
    respCol.updateRule = respCol.createRule
    respCol.deleteRule =
      AUTENTICADO +
      ' && ' +
      MEMBRO.replace('organizacao_id', 'vistoria_id.organizacao_id') +
      ' && ' +
      GESTOR
    app.save(respCol)

    // Rotinas: gestão é de dono/gerente; executor só consulta.
    const rotCol = app.findCollectionByNameOrId('rotinas')
    rotCol.listRule = AUTENTICADO + ' && ' + MEMBRO
    rotCol.viewRule = AUTENTICADO + ' && ' + MEMBRO
    rotCol.createRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    rotCol.updateRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    rotCol.deleteRule = AUTENTICADO + ' && ' + MEMBRO + ' && ' + GESTOR
    app.save(rotCol)
  },
  (app) => {
    // Down: restaura as regras originais (só dono) e remove os campos novos.
    const restaura = (nome, regra) => {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = regra
      col.viewRule = regra
      col.createRule = regra
      col.updateRule = regra
      col.deleteRule = regra
      app.save(col)
    }
    const ORIGINAL = "@request.auth.id != '' && organizacao_id.dono_id = @request.auth.id"
    restaura('empresas', ORIGINAL)
    restaura('vistorias', ORIGINAL)
    restaura('rotinas', ORIGINAL)
    restaura(
      'respostas_vistoria',
      "@request.auth.id != '' && vistoria_id.organizacao_id.dono_id = @request.auth.id",
    )
    restaura(
      'responsaveis_tecnicos',
      "@request.auth.id != '' && organizacao_id.dono_id = @request.auth.id",
    )
    restaura(
      'tipos_vistoria',
      "@request.auth.id != '' && (organizacao_id = '' || organizacao_id.dono_id = @request.auth.id)",
    )
    restaura(
      'itens_checklist',
      "@request.auth.id != '' && (tipo_vistoria_id.organizacao_id = '' || tipo_vistoria_id.organizacao_id.dono_id = @request.auth.id)",
    )

    const rtCol = app.findCollectionByNameOrId('responsaveis_tecnicos')
    rtCol.fields.removeByName('usuario_id')
    app.save(rtCol)

    const orgCol = app.findCollectionByNameOrId('organizacoes')
    orgCol.fields.removeByName('membros')
    orgCol.listRule = "@request.auth.id != '' && dono_id = @request.auth.id"
    orgCol.viewRule = orgCol.listRule
    orgCol.updateRule = orgCol.listRule
    app.save(orgCol)

    const usersCol = app.findCollectionByNameOrId('users')
    usersCol.fields.removeByName('papel')
    app.save(usersCol)
  },
)
