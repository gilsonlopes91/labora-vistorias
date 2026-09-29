// Ponto 1 do plano "Empresa → Ambiente → Cargo (GHE opcional)"
// (claude/labora-vistoria-plano-fluxo-cargos-ghe-os-epi-2026-09-28.md).
//
// Desde a migração 0168, ghe_id e funcao_id em avaliacoes_risco são ambos
// opcionais no schema (para permitir risco direto do cargo OU risco de GHE
// ambiental). Mas uma avaliação sem nenhum dos dois vínculos fica "solta" -
// não aparece em nenhum inventário, não entra em nenhuma conclusão por
// função, não sai em nenhum documento. Este hook garante que toda avaliação
// tenha pelo menos um dos dois vínculos.
onRecordCreateRequest((e) => {
  const record = e.record
  const gheId = record.getString('ghe_id')
  const funcaoId = record.getString('funcao_id')

  if (!gheId && !funcaoId) {
    throw new BadRequestError(
      'Selecione um GHE ou uma Função para vincular esta avaliação de risco.',
    )
  }

  e.next()
}, 'avaliacoes_risco')

onRecordUpdateRequest((e) => {
  const record = e.record
  const gheId = record.getString('ghe_id')
  const funcaoId = record.getString('funcao_id')

  if (!gheId && !funcaoId) {
    throw new BadRequestError(
      'Selecione um GHE ou uma Função para vincular esta avaliação de risco.',
    )
  }

  e.next()
}, 'avaliacoes_risco')
