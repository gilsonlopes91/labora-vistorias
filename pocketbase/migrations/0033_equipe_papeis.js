// Fase A — Equipe: papéis (dono/gerente/executor) + vínculo usuário→organização.
// users.papel: o que a pessoa pode fazer. users.organizacao_id: a qual
// organização pertence (o dono também é marcado — simplifica TODAS as regras:
// basta comparar organizacao_id = @request.auth.organizacao_id).
// Regras: membro vê tudo da organização; executor não gerencia (empresas,
// modelos, rotinas, equipe) e só edita as próprias vistorias/respostas.
migrate(
  (app) => {
    const orgColId = app.findCollectionByNameOrId('organizacoes').id

    // 1) users: papel + organizacao_id.
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
    if (!usersCol.fields.getByName('organizacao_id')) {
      usersCol.fields.add(
        new RelationField({
          name: 'organizacao_id',
          collectionId: orgColId,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(usersCol)

    // 2) Backfill: dono de cada organização recebe organizacao_id e papel 'dono'.
    const orgs = app.findRecordsByFilter('organizacoes', 'id != ""', '-created', 0, 0)
    orgs.forEach((org) => {
      const donoId = org.getString('dono_id')
      if (!donoId) return
      try {
        const dono = app.findRecordById('users', donoId)
        if (!dono.getString('organizacao_id')) {
          dono.set('organizacao_id', org.id)
        }
        if (!dono.getString('papel')) {
          dono.set('papel', 'dono')
        }
        app.save(dono)
      } catch (_) {
        // dono removido — ignora
      }
    })

    // 3) organizacoes: membros veem; só o dono edita.
    orgCol.listRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.organizacao_id = id)"
    orgCol.viewRule =
      "@request.auth.id != '' && (dono_id = @request.auth.id || @request.auth.organizacao_id = id)"
    orgCol.updateRule = "@request.auth.id != '' && dono_id = @request.auth.id"
    app.save(orgCol)

    // 4) Regras das coleções operacionais.
    const AUTENTICADO = "@request.auth.id != ''"
    const MESMA_ORG = 'organizacao_id = @request.auth.organizacao_id'
    const GESTOR = "@request.auth.papel != 'executor'"

    // responsaveis_tecnicos: campo usuario_id ANTES das regras que o referenciam.
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
    rtCol.listRule = AUTENTICADO + ' && ' + MESMA_ORG
    rtCol.viewRule = AUTENTICADO + ' && ' + MESMA_ORG
    rtCol.createRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    rtCol.updateRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    rtCol.deleteRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    app.save(rtCol)

    // Empresas: todos veem; dono/gerente gerenciam.
    const empCol = app.findCollectionByNameOrId('empresas')
    empCol.listRule = AUTENTICADO + ' && ' + MESMA_ORG
    empCol.viewRule = AUTENTICADO + ' && ' + MESMA_ORG
    empCol.createRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    empCol.updateRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    empCol.deleteRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    app.save(empCol)

    // Tipos de vistoria: catálogo global visível; modelos próprios p/ gestor.
    const tipoCol = app.findCollectionByNameOrId('tipos_vistoria')
    tipoCol.listRule = AUTENTICADO + " && (organizacao_id = '' || " + MESMA_ORG + ')'
    tipoCol.viewRule = AUTENTICADO + " && (organizacao_id = '' || " + MESMA_ORG + ')'
    tipoCol.createRule = AUTENTICADO + " && organizacao_id != '' && " + MESMA_ORG + ' && ' + GESTOR
    tipoCol.updateRule = AUTENTICADO + " && organizacao_id != '' && " + MESMA_ORG + ' && ' + GESTOR
    tipoCol.deleteRule = AUTENTICADO + " && organizacao_id != '' && " + MESMA_ORG + ' && ' + GESTOR
    app.save(tipoCol)

    // Itens de checklist: seguem o tipo de vistoria.
    const itemCol = app.findCollectionByNameOrId('itens_checklist')
    const ITEM_ORG =
      "(tipo_vistoria_id.organizacao_id = '' || tipo_vistoria_id.organizacao_id = @request.auth.organizacao_id)"
    itemCol.listRule = AUTENTICADO + ' && ' + ITEM_ORG
    itemCol.viewRule = AUTENTICADO + ' && ' + ITEM_ORG
    itemCol.createRule =
      AUTENTICADO +
      " && tipo_vistoria_id.organizacao_id != '' && tipo_vistoria_id.organizacao_id = @request.auth.organizacao_id && " +
      GESTOR
    itemCol.updateRule = itemCol.createRule
    itemCol.deleteRule = itemCol.createRule
    app.save(itemCol)

    // Vistorias: todos veem; executor só cria/edita as atribuídas a ele.
    const vistCol = app.findCollectionByNameOrId('vistorias')
    vistCol.listRule = AUTENTICADO + ' && ' + MESMA_ORG
    vistCol.viewRule = AUTENTICADO + ' && ' + MESMA_ORG
    vistCol.createRule =
      AUTENTICADO +
      ' && ' +
      MESMA_ORG +
      " && (@request.auth.papel != 'executor' || responsavel_tecnico_id.usuario_id = @request.auth.id)"
    vistCol.updateRule = vistCol.createRule
    vistCol.deleteRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    app.save(vistCol)

    // Respostas: executor só preenche as da própria vistoria.
    const respCol = app.findCollectionByNameOrId('respostas_vistoria')
    const RESP_ORG = 'vistoria_id.organizacao_id = @request.auth.organizacao_id'
    respCol.listRule = AUTENTICADO + ' && ' + RESP_ORG
    respCol.viewRule = AUTENTICADO + ' && ' + RESP_ORG
    respCol.createRule =
      AUTENTICADO +
      ' && ' +
      RESP_ORG +
      " && (@request.auth.papel != 'executor' || vistoria_id.responsavel_tecnico_id.usuario_id = @request.auth.id)"
    respCol.updateRule = respCol.createRule
    respCol.deleteRule = AUTENTICADO + ' && ' + RESP_ORG + ' && ' + GESTOR
    app.save(respCol)

    // Rotinas: gestão de dono/gerente; executor consulta.
    const rotCol = app.findCollectionByNameOrId('rotinas')
    rotCol.listRule = AUTENTICADO + ' && ' + MESMA_ORG
    rotCol.viewRule = AUTENTICADO + ' && ' + MESMA_ORG
    rotCol.createRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    rotCol.updateRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    rotCol.deleteRule = AUTENTICADO + ' && ' + MESMA_ORG + ' && ' + GESTOR
    app.save(rotCol)
  },
  (app) => {
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
    orgCol.listRule = "@request.auth.id != '' && dono_id = @request.auth.id"
    orgCol.viewRule = orgCol.listRule
    orgCol.updateRule = orgCol.listRule
    app.save(orgCol)

    const usersCol = app.findCollectionByNameOrId('users')
    usersCol.fields.removeByName('papel')
    usersCol.fields.removeByName('organizacao_id')
    app.save(usersCol)
  },
)
