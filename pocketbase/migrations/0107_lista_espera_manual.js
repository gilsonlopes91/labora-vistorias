// Migração 0107 — fase "em breve" do site.
// 1) lista_espera: quem clica em "Criar conta" deixa só nome + e-mail.
//    Qualquer visitante pode inserir; só o admin da plataforma lê/apaga.
// 2) manual_imagens: capturas de tela usadas na página /em-breve (manual).
//    Leitura pública. Criação liberada temporariamente para usuário logado
//    (para carregar as capturas); a 0108 fecha a criação para admin.
// 3) users.createRule: cadastro público desligado. Só o admin da plataforma
//    (ou staff com acesso ao console) cria usuários pelo app; convites de
//    equipe continuam pelo hook /backend/v1/equipe/convidar.
migrate(
  (app) => {
    const ADMIN = "@request.auth.papel = 'admin_plataforma'"

    let espera = null
    try {
      espera = app.findCollectionByNameOrId('lista_espera')
    } catch (_) {
      espera = null
    }
    if (!espera) {
      espera = new Collection({
        name: 'lista_espera',
        type: 'base',
        listRule: ADMIN,
        viewRule: ADMIN,
        createRule: '',
        updateRule: ADMIN,
        deleteRule: ADMIN,
        fields: [
          { name: 'nome', type: 'text', required: true, min: 1, max: 200 },
          { name: 'email', type: 'email', required: true },
          { name: 'origem', type: 'text', max: 100 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_lista_espera_email ON lista_espera (email)'],
      })
      app.save(espera)
    }

    let imgs = null
    try {
      imgs = app.findCollectionByNameOrId('manual_imagens')
    } catch (_) {
      imgs = null
    }
    if (!imgs) {
      imgs = new Collection({
        name: 'manual_imagens',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: ADMIN,
        deleteRule: ADMIN,
        fields: [
          { name: 'chave', type: 'text', required: true, max: 100 },
          {
            name: 'imagem',
            type: 'file',
            maxSelect: 1,
            maxSize: 8388608,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(imgs)
    }

    const users = app.findCollectionByNameOrId('users')
    users.createRule =
      ADMIN + " || (@request.auth.papel = 'staff_labora' && @request.auth.acesso_console = true)"
    app.save(users)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('lista_espera'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('manual_imagens'))
    } catch (_) {}
    try {
      const users = app.findCollectionByNameOrId('users')
      users.createRule = ''
      app.save(users)
    } catch (_) {}
  },
)
