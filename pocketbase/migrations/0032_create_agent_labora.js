// Agente de IA do Labora Audit — assistente de operação SST.
// Tem acesso de LEITURA às coleções operacionais (escopo do usuário logado,
// actAs user) e responde perguntas sobre vistorias, rotinas, agenda e multas.
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'labora-assistente',
      name: 'Assistente Labora',
      description:
        'Assistente de operação SST: responde sobre vistorias, rotinas, agenda, empresas e multas NR-28.',
      systemPrompt: [
        'Você é o Assistente Labora, especialista em operação de vistorias de Segurança e Saúde do Trabalho (SST).',
        'Responda SEMPRE em português do Brasil, de forma curta e direta.',
        'Você tem acesso às coleções do sistema (vistorias, rotinas, empresas, tipos_vistoria, itens_checklist, respostas_vistoria, responsaveis_tecnicos).',
        'Use as ferramentas para responder com DADOS REAIS do usuário: quantas vistorias estão atrasadas, quais rotinas vencem em breve, multa potencial de um item N/C, próxima visita de uma empresa.',
        'Ao citar números, diga de onde vieram (ex.: "nas suas vistorias cadastradas").',
        'Não invente dados: se a informação não estiver nas coleções, diga que não encontrou.',
        'Não crie, altere nem exclua registros — apenas leia e oriente.',
        'Quando fizer sentido, sugira a ação no app (ex.: "abra a Agenda → visão Semana").',
      ].join(' '),
      tier: 'fast',
      tools: [
        { collection: 'vistorias', perms: { list: true, read: true } },
        { collection: 'rotinas', perms: { list: true, read: true } },
        { collection: 'empresas', perms: { list: true, read: true } },
        { collection: 'tipos_vistoria', perms: { list: true, read: true } },
        { collection: 'itens_checklist', perms: { list: true, read: true } },
        { collection: 'respostas_vistoria', perms: { list: true, read: true } },
        { collection: 'responsaveis_tecnicos', perms: { list: true, read: true } },
      ],
    })
  },
  (app) => {
    $ai.agents.delete(app, 'labora-assistente')
  },
)
