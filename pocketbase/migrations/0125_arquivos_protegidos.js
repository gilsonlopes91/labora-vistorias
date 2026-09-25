// Migração 0125: fotos das vistorias e anexos dos formulários de campo passam
// a ser arquivos protegidos. Antes abriam por link direto, sem login. Agora o
// arquivo só é entregue com um token temporário de quem pode ver o registro
// (mesma regra de acesso da coleção). Logos, capas do blog e imagens do
// manual continuam públicos.
migrate(
  (app) => {
    const respostas = app.findCollectionByNameOrId('respostas_vistoria')
    const foto = respostas.fields.getByName('foto')
    if (foto) {
      foto.protected = true
      app.save(respostas)
    }
    const formularios = app.findCollectionByNameOrId('formularios')
    const anexos = formularios.fields.getByName('anexos')
    if (anexos) {
      anexos.protected = true
      app.save(formularios)
    }
  },
  (app) => {
    const respostas = app.findCollectionByNameOrId('respostas_vistoria')
    const foto = respostas.fields.getByName('foto')
    if (foto) {
      foto.protected = false
      app.save(respostas)
    }
    const formularios = app.findCollectionByNameOrId('formularios')
    const anexos = formularios.fields.getByName('anexos')
    if (anexos) {
      anexos.protected = false
      app.save(formularios)
    }
  },
)
