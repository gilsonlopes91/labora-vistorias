// Migração 0093: Coleção artigos (Blog/CMS da Labora)
// Campos:
// - titulo (text, required)
// - slug (text, required, unique)
// - resumo (text, required)
// - conteudo (editor/html, required)
// - capa (file, imagem opcional)
// - status (select: 'rascunho' | 'publicado', default 'rascunho')
// - autor_id (relation para _pb_users_auth_, opcional/preenchido com criador)
// - created / updated (autodate)
//
// Regras de acesso:
// listRule / viewRule: status = 'publicado' || @request.auth.id != ''
// createRule / updateRule / deleteRule: @request.auth.id != ''

migrate(
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('artigos')
    } catch (_) {
      col = null
    }

    if (!col) {
      col = new Collection({
        name: 'artigos',
        type: 'base',
        listRule: "status = 'publicado' || @request.auth.id != ''",
        viewRule: "status = 'publicado' || @request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'titulo', type: 'text', required: true, min: 3, max: 250 },
          { name: 'slug', type: 'text', required: true, min: 3, max: 250 },
          { name: 'resumo', type: 'text', required: true, min: 5, max: 800 },
          { name: 'conteudo', type: 'editor', required: true },
          {
            name: 'capa',
            type: 'file',
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['rascunho', 'publicado'],
            maxSelect: 1,
          },
          {
            name: 'autor_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_artigos_slug ON artigos (slug)'],
      })
      app.save(col)

      // Seed inicial de artigos técnicos práticos sobre SST
      try {
        const seedArtigos = [
          {
            titulo: 'Como evitar multas da NR-28 em fiscalizações de surpresa',
            slug: 'como-evitar-multas-da-nr-28-em-fiscalizacoes-de-surpresa',
            resumo:
              'A NR-28 define as gradações e valores de multas aplicadas pelos Auditores-Fiscais do Trabalho. Entenda como manter os registros em dia e mitigar autuações recorrentes.',
            conteudo: `<h2>A fiscalização do trabalho e o impacto financeiro da NR-28</h2>
<p>As autuações aplicadas pelo Ministério do Trabalho e Emprego (MTE) com base na <strong>Norma Regulamentadora nº 28 (NR-28)</strong> não são aleatórias: elas seguem uma tabela rígida com graus de infração (1 a 4) e faixas pelo número de empregados no estabelecimento.</p>
<h3>1. Os três erros mais frequentes identificados em vistorias</h3>
<ul>
  <li><strong>PGR e PCMSO desatualizados ou sem correlação:</strong> riscos identificados em campo que não constam no inventário de riscos da NR-01.</li>
  <li><strong>Falta de comprovação de entrega e higienização de EPIs:</strong> ausência de fichas assinadas ou com Certificado de Aprovação (CA) vencido na data do fornecimento.</li>
  <li><strong>Ausência de treinamentos obrigatórios com lista de presença e conteúdo programático:</strong> NR-10, NR-35 e NR-12 encabeçam as maiores autuações.</li>
</ul>
<blockquote>A prevenção não custa caro quando comparada à interdição de uma máquina ou às multas que podem ultrapassar dezenas de milhares de reais por item irregular.</blockquote>
<h3>2. Dicas práticas para organizar suas vistorias</h3>
<p>Utilize roteiros digitais e padronizados com registro fotográfico e geolocalização. Isso garante rastreabilidade e prova pré-constituída de conformidade técnica.</p>`,
            status: 'publicado',
          },
          {
            titulo: 'Guia definitivo de Vistoria de NR-12 em máquinas e equipamentos',
            slug: 'guia-definitivo-de-vistoria-de-nr-12-em-maquinas-e-equipamentos',
            resumo:
              'Dispositivos de parada de emergência, proteções fixas e móveis, e sinalização: veja um checklist prático para auditar o parque fabril com segurança.',
            conteudo: `<h2>Segurança no trabalho em máquinas e equipamentos</h2>
<p>A <strong>NR-12</strong> exige medidas preventivas rigorosas para garantir a saúde e a integridade física dos trabalhadores. Durante a vistoria técnica, alguns pontos críticos devem ser inspecionados sistematicamente.</p>
<h3>Checklist essencial de campo</h3>
<ol>
  <li><strong>Proteções físicas:</strong> grades, enclausuramentos e barreiras não podem ser burladas facilmente.</li>
  <li><strong>Botões de emergência:</strong> devem possuir rearme manual e estar instalados em locais visíveis e de fácil alcance.</li>
  <li><strong>Procedimentos de bloqueio e etiquetagem (LOTO):</strong> garantia de energia zero em intervenções para limpeza e manutenção.</li>
</ol>
<p>Mantenha sempre o inventário de máquinas e o manual de instruções atualizado e em língua portuguesa.</p>`,
            status: 'publicado',
          },
        ]

        let adminUser = null
        try {
          adminUser = app.findFirstRecordByData('users', 'papel', 'dono')
        } catch (_) {}

        for (const art of seedArtigos) {
          const rec = new Record(col)
          rec.set('titulo', art.titulo)
          rec.set('slug', art.slug)
          rec.set('resumo', art.resumo)
          rec.set('conteudo', art.conteudo)
          rec.set('status', art.status)
          if (adminUser) {
            rec.set('autor_id', adminUser.id)
          }
          app.save(rec)
        }
      } catch (err) {
        console.log('Erro ao criar seed de artigos:', err)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('artigos')
      app.delete(col)
    } catch (_) {}
  },
)
