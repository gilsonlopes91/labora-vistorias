// 0156: assinatura eletrônica nível 1 nos documentos SST (PGR primeiro).
// Reautenticação por senha no momento de emitir; grava quando foi confirmada.
// link_publico_chave/link_publico_ativo já existem desde a 0148 (sem uso
// ainda) — passam a ser preenchidos na emissão, para o carimbo do PDF linkar
// para a página pública de verificação (etapa seguinte).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_sst')
    if (!col.fields.getByName('assinatura_confirmada_em')) {
      col.fields.add(new DateField({ name: 'assinatura_confirmada_em', required: false }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_sst')
    if (col.fields.getByName('assinatura_confirmada_em')) {
      col.fields.removeByName('assinatura_confirmada_em')
    }
    app.save(col)
  },
)
