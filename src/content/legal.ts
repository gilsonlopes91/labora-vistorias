/* Termos de Uso e Política de Privacidade do Labora Vistorias.
   Texto elaborado com base na Lei nº 13.709/2018 (LGPD), na Lei nº 12.965/2014
   (Marco Civil da Internet), no Código de Defesa do Consumidor e no Guia de
   Elaboração de Termo de Uso e Política de Privacidade do Governo Federal.
   Ao alterar o texto, atualize a versão e a data abaixo: o aceite gravado no
   cadastro guarda a versão aceita. */

export const VERSAO_TERMOS = '1.0'
export const VIGENCIA_TERMOS = '23 de setembro de 2026'

export const CONTROLADOR = {
  razao: 'Labora Engenharia e SST Ltda',
  cnpj: '54.106.204/0001-30',
  endereco: 'Rua Riachuelo, 1457, Sala 02, Vermelha, Teresina (PI), CEP 64018-060',
  email: 'eng.amaury.sousa@gmail.com',
  telefone: '(86) 8127-4370',
}

export interface SecaoLegal {
  titulo: string
  paragrafos: string[]
}

const C = CONTROLADOR

export const TERMOS_DE_USO: SecaoLegal[] = [
  {
    titulo: '1. Quem somos e aceitação destes termos',
    paragrafos: [
      `O Labora Vistorias é um aplicativo de gestão de vistorias e inspeções de segurança e saúde no trabalho, mantido pela ${C.razao}, CNPJ ${C.cnpj}, com sede na ${C.endereco} ("Labora").`,
      'Estes Termos de Uso regulam o acesso ao site, à calculadora pública de multas e ao aplicativo. Ao criar uma conta, entrar na lista de espera ou usar o aplicativo, você declara que leu e concorda com estes termos e com a Política de Privacidade. Se não concordar, não utilize o serviço.',
      'Se você usa o aplicativo em nome de uma empresa, declara que tem autorização para aceitar estes termos por ela.',
    ],
  },
  {
    titulo: '2. O que o serviço oferece',
    paragrafos: [
      'O aplicativo permite cadastrar empresas clientes, agendar e executar vistorias com checklists das Normas Regulamentadoras (NR), registrar fotos e observações, preencher formulários de campo, calcular uma estimativa de multa com base no Anexo I da NR-28 e gerar o relatório da vistoria em PDF. A calculadora de multas do site pode ser usada sem cadastro.',
      'Os checklists reproduzem o texto das NR e os códigos de ementa do Anexo II da NR-28 a partir das publicações oficiais do Ministério do Trabalho e Emprego. As normas mudam com frequência. A Labora atualiza o catálogo quando toma conhecimento de uma alteração, mas pode haver intervalo entre a publicação oficial e a atualização no aplicativo. Em caso de divergência, prevalece o texto publicado no Diário Oficial da União.',
      'Algumas funções podem estar disponíveis apenas em planos pagos. Os recursos e limites de cada plano, inclusive do plano gratuito, são informados no próprio aplicativo e podem ser alterados mediante aviso prévio.',
    ],
  },
  {
    titulo: '3. Responsabilidade técnica',
    paragrafos: [
      'O aplicativo é uma ferramenta de apoio ao trabalho do profissional. Ele não emite laudos por conta própria e não substitui a avaliação técnica. A caracterização de conformidades e não conformidades, as conclusões do relatório e a assinatura dos documentos são de responsabilidade exclusiva do profissional legalmente habilitado que os elabora.',
      'O valor de multa exibido é uma estimativa calculada a partir do grau e do tipo da infração, do número de empregados informado e da tabela de gradação da NR-28. Ele não vincula a fiscalização do trabalho, que considera outros fatores, como reincidência, e não deve ser apresentado como valor definitivo.',
    ],
  },
  {
    titulo: '4. Conta e acesso',
    paragrafos: [
      'O aplicativo é destinado a profissionais e empresas maiores de 18 anos. Você deve informar dados verdadeiros no cadastro e mantê-los atualizados.',
      'Você é responsável pela guarda da sua senha e por todas as ações realizadas com a sua conta. Se perceber uso não autorizado, avise a Labora imediatamente pelo e-mail indicado ao final.',
      'O gestor de uma organização pode convidar membros para a sua equipe e definir o nível de acesso de cada um. Os dados de uma organização ficam visíveis apenas para os usuários vinculados a ela e para a equipe da Labora que presta suporte, quando necessário.',
    ],
  },
  {
    titulo: '5. Dados que você insere no aplicativo',
    paragrafos: [
      'Os dados das suas empresas clientes, dos trabalhadores e dos locais vistoriados, inclusive fotos, observações, localização e registros de formulários de campo, são inseridos por você. Em relação a esses dados, você (ou a sua empresa) atua como controlador, nos termos da LGPD, e a Labora atua como operadora, tratando-os somente para prestar o serviço e conforme as suas instruções.',
      'Cabe a você ter uma base legal para inserir esses dados, informar os titulares quando a lei exigir e evitar incluir informações pessoais que não sejam necessárias para a vistoria. Evite fotografar rostos, documentos ou telas com dados pessoais quando isso não for indispensável ao registro técnico.',
    ],
  },
  {
    titulo: '6. Condutas proibidas',
    paragrafos: [
      'Não é permitido usar o serviço para fins ilegais; inserir dados de terceiros sem base legal; tentar acessar dados de outras organizações; copiar, descompilar ou revender o aplicativo; sobrecarregar a infraestrutura com acessos automatizados; ou apresentar os relatórios gerados como documento oficial de órgão público.',
      'A Labora pode suspender contas que descumpram estes termos, com aviso ao titular sempre que possível.',
    ],
  },
  {
    titulo: '7. Propriedade intelectual',
    paragrafos: [
      'O software, a marca Labora, o layout e os textos próprios do aplicativo pertencem à Labora. O uso do serviço não transfere nenhum desses direitos a você.',
      'Os textos das Normas Regulamentadoras são atos oficiais e não estão protegidos por direito autoral (art. 8º, IV, da Lei nº 9.610/1998).',
      'O conteúdo que você cria, como vistorias, fotos, observações e relatórios, continua sendo seu. Você autoriza a Labora a armazená-lo e processá-lo apenas na medida necessária para prestar o serviço.',
    ],
  },
  {
    titulo: '8. Disponibilidade do serviço',
    paragrafos: [
      'A Labora busca manter o aplicativo disponível e seguro, mas não garante funcionamento sem interrupções. Podem ocorrer paradas para manutenção, atualizações ou por falhas de fornecedores de infraestrutura e de conexão.',
      'Recomendamos baixar e guardar os relatórios em PDF das vistorias concluídas.',
    ],
  },
  {
    titulo: '9. Limitação de responsabilidade',
    paragrafos: [
      'Nos limites permitidos pela legislação, a Labora não responde por decisões técnicas, autuações ou prejuízos decorrentes do uso dos relatórios e estimativas sem a análise do profissional responsável, nem por dados incorretos inseridos pelo usuário.',
      'Quando a relação for de consumo, aplicam-se as garantias do Código de Defesa do Consumidor, que não são afastadas por estes termos.',
    ],
  },
  {
    titulo: '10. Encerramento da conta',
    paragrafos: [
      'Você pode pedir o encerramento da sua conta a qualquer momento pelo e-mail indicado ao final. Antes de encerrar, baixe os relatórios que quiser manter.',
      'Após o encerramento, os dados são eliminados nos prazos descritos na Política de Privacidade, salvo quando a lei exigir a sua conservação.',
    ],
  },
  {
    titulo: '11. Alterações destes termos',
    paragrafos: [
      'A Labora pode atualizar estes termos. Mudanças relevantes serão avisadas no aplicativo ou por e-mail com pelo menos 15 dias de antecedência. Se você continuar usando o serviço depois da data de vigência, a nova versão passa a valer. Se não concordar, pode encerrar a conta.',
    ],
  },
  {
    titulo: '12. Lei aplicável, foro e contato',
    paragrafos: [
      'Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de Teresina (PI), ressalvado o direito do consumidor de propor ação no foro do seu domicílio.',
      `Dúvidas, pedidos e reclamações: ${C.email} ou ${C.telefone}.`,
    ],
  },
]

export const POLITICA_PRIVACIDADE: SecaoLegal[] = [
  {
    titulo: '1. Sobre esta política',
    paragrafos: [
      'Esta política explica quais dados pessoais o Labora Vistorias trata, para quê, com quem compartilha, por quanto tempo guarda e como você pode exercer os seus direitos, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018, LGPD).',
      `A controladora dos dados é a ${C.razao}, CNPJ ${C.cnpj}, com sede na ${C.endereco}.`,
    ],
  },
  {
    titulo: '2. Dois papéis diferentes: controladora e operadora',
    paragrafos: [
      'A Labora é controladora dos dados da sua conta: nome, e-mail, senha, organização, logotipo, dados dos responsáveis técnicos cadastrados, dados de uso e registros de acesso. É a Labora quem decide como esses dados são tratados.',
      'Nas vistorias, o usuário cadastra dados das suas empresas clientes e, às vezes, de trabalhadores e de terceiros que aparecem em fotos, observações ou formulários de campo. Para esses dados, o controlador é o usuário ou a empresa dele, e a Labora atua como operadora: armazena e processa as informações apenas para prestar o serviço, conforme as instruções do cliente. Pedidos de titulares sobre esses dados devem ser feitos ao profissional ou à empresa que realizou a vistoria. Se a Labora receber um pedido assim, encaminhará ao cliente responsável.',
    ],
  },
  {
    titulo: '3. Quais dados tratamos e para quê',
    paragrafos: [
      'Lista de espera: nome e e-mail, para avisar quando o acesso for liberado. Base legal: procedimentos preliminares a um contrato, a pedido do titular (art. 7º, V).',
      'Cadastro e conta: nome, e-mail, senha (guardada de forma cifrada, sem que a Labora conheça a senha), papel na equipe, organização e logotipo. Finalidade: criar e manter o acesso, identificar quem fez cada registro e personalizar os relatórios. Base legal: execução de contrato (art. 7º, V).',
      'Responsáveis técnicos: nome, conselho profissional, UF e número de registro, para constarem na assinatura dos relatórios. Base legal: execução de contrato (art. 7º, V).',
      'Conteúdo das vistorias e formulários: empresas clientes (razão social, CNPJ, endereço, contato, número de empregados), respostas dos checklists, observações, fotos, localização das fotos quando o georreferenciamento está ligado, e dados de medições de campo. Finalidade: prestar o serviço e gerar os relatórios. A Labora trata esses dados como operadora, em nome do cliente.',
      'Assistente de IA, quando disponível no plano: as perguntas digitadas e as respostas geradas, para responder ao usuário. Não digite no assistente dados pessoais de trabalhadores ou de terceiros.',
      'Registros de acesso: endereço IP, data e hora de acesso ao aplicativo. Finalidade: segurança e cumprimento do Marco Civil da Internet. Base legal: cumprimento de obrigação legal (art. 7º, II) e legítimo interesse na prevenção de fraudes (art. 7º, IX).',
      'Comunicações sobre o serviço, como avisos de atualização das NR, mudanças nos termos e alertas de segurança. Base legal: execução de contrato e legítimo interesse (art. 7º, V e IX). Você pode deixar de receber comunicações que não sejam essenciais ao serviço.',
      'A calculadora pública de multas não pede cadastro e não coleta dados pessoais: ela usa apenas o item da norma e o número de empregados informados.',
    ],
  },
  {
    titulo: '4. Dados sensíveis',
    paragrafos: [
      'O aplicativo não pede dados pessoais sensíveis. Alguns formulários de campo, porém, registram informações ligadas à saúde ocupacional, como a exposição de um trabalhador a ruído ou a agentes químicos. Quando o usuário registra esse tipo de informação vinculada a uma pessoa identificada, ele é o controlador e deve ter base legal para isso, como o cumprimento de obrigação legal ou regulatória prevista nas NR (art. 11, II, "a"). Sempre que possível, identifique o trabalhador pela função ou por um código, e não pelo nome.',
    ],
  },
  {
    titulo: '5. Com quem compartilhamos',
    paragrafos: [
      'A Labora não vende nem aluga dados pessoais.',
      'Os dados são compartilhados apenas com fornecedores necessários para o funcionamento do serviço: a plataforma de hospedagem, banco de dados e armazenamento de arquivos em nuvem; o provedor do modelo de inteligência artificial usado pelo assistente, quando o recurso estiver ativo; e o serviço de envio de e-mails. Esses fornecedores tratam os dados em nome da Labora e só para essas finalidades.',
      'Os dados também podem ser fornecidos a autoridades públicas quando houver obrigação legal ou ordem judicial.',
    ],
  },
  {
    titulo: '6. Transferência internacional',
    paragrafos: [
      'Alguns fornecedores de nuvem e de inteligência artificial podem armazenar ou processar dados em servidores localizados fora do Brasil. Nesses casos, a Labora adota fornecedores que oferecem garantias de proteção compatíveis com a LGPD, conforme o art. 33 da lei e a regulamentação da Autoridade Nacional de Proteção de Dados (ANPD).',
    ],
  },
  {
    titulo: '7. Por quanto tempo guardamos',
    paragrafos: [
      'Dados da conta e conteúdo das vistorias: enquanto a conta estiver ativa. Depois do encerramento, os dados são eliminados em até 90 dias, exceto os que a lei obrigar a manter.',
      'Lista de espera: até a liberação do acesso ou até você pedir a exclusão.',
      'Registros de acesso: 6 meses, conforme o art. 15 do Marco Civil da Internet.',
      'Cópias de segurança são sobrescritas periodicamente e seguem os mesmos prazos.',
    ],
  },
  {
    titulo: '8. Segurança',
    paragrafos: [
      'A comunicação com o aplicativo é criptografada (HTTPS). As senhas são armazenadas de forma cifrada. Cada organização só acessa os seus próprios dados, e as permissões dentro da equipe são controladas por nível de acesso.',
      'Nenhum sistema é totalmente imune a falhas. Se houver incidente de segurança que possa causar risco ou dano relevante aos titulares, a Labora comunicará a ANPD e os titulares afetados, conforme o art. 48 da LGPD.',
    ],
  },
  {
    titulo: '9. Cookies e armazenamento no navegador',
    paragrafos: [
      'O aplicativo guarda no seu navegador apenas o necessário para manter você conectado (o token de sessão) e algumas preferências de uso. No momento, o Labora Vistorias não usa cookies de publicidade nem de rastreamento de terceiros. Se isso mudar, esta política será atualizada antes.',
    ],
  },
  {
    titulo: '10. Seus direitos',
    paragrafos: [
      'Como titular, você pode pedir à Labora, a qualquer momento: confirmação de que tratamos seus dados; acesso aos dados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei; portabilidade; eliminação de dados tratados com base no consentimento; informação sobre com quem compartilhamos; e revisão de decisões tomadas apenas por meio automatizado (arts. 18 e 20 da LGPD).',
      'Para exercer esses direitos, escreva para o canal indicado abaixo. Podemos pedir informações para confirmar a sua identidade antes de atender. A resposta completa será enviada em até 15 dias, prazo do art. 19 da LGPD.',
      'Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.',
    ],
  },
  {
    titulo: '11. Canal de atendimento ao titular',
    paragrafos: [
      `Pedidos sobre dados pessoais, dúvidas sobre esta política e comunicações da ANPD: ${C.email}, telefone ${C.telefone}, ou por correspondência para ${C.razao}, ${C.endereco}.`,
    ],
  },
  {
    titulo: '12. Menores de idade',
    paragrafos: [
      'O serviço é destinado a profissionais e empresas e não é direcionado a menores de 18 anos.',
    ],
  },
  {
    titulo: '13. Alterações desta política',
    paragrafos: [
      'Esta política pode ser atualizada para refletir mudanças no serviço ou na legislação. A versão e a data de vigência aparecem no início do documento. Mudanças relevantes serão avisadas no aplicativo ou por e-mail.',
    ],
  },
]
