// Modelos de certificado de treinamento. organizacao_id vazio = modelo base da
// plataforma (os seis iniciais: NR 01, 06, 12, 17, 18 e 23), visível a todos e
// editável só pela administração. Preenchido = modelo da organização, criado
// e editado por quem é gestor dela.
migrate(
  (app) => {
    const orgId = app.findCollectionByNameOrId('organizacoes').id

    const regraLeitura =
      "@request.auth.id != '' && (organizacao_id = '' || organizacao_id = @request.auth.organizacao_id || @request.auth.papel = 'admin_plataforma')"
    const regraEscrita =
      "@request.auth.id != '' && ((organizacao_id != '' && organizacao_id = @request.auth.organizacao_id && (@request.auth.papel = 'dono' || @request.auth.papel = 'gerente' || @request.auth.papel = 'gestor' || @request.auth.papel = '')) || @request.auth.papel = 'admin_plataforma')"

    const collection = new Collection({
      name: 'modelos_certificado',
      type: 'base',
      listRule: regraLeitura,
      viewRule: regraLeitura,
      createRule: regraEscrita,
      updateRule: regraEscrita,
      deleteRule: regraEscrita,
      fields: [
        {
          name: 'organizacao_id',
          type: 'relation',
          required: false,
          collectionId: orgId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true, max: 200 },
        { name: 'selo', type: 'text', max: 40 },
        { name: 'texto', type: 'text', required: true, max: 5000 },
        { name: 'carga_horaria', type: 'text', max: 20 },
        { name: 'campo_extra_rotulo', type: 'text', max: 120 },
        { name: 'campo_extra_exemplo', type: 'text', max: 200 },
        { name: 'conteudo', type: 'text', required: true, max: 20000 },
        { name: 'rascunho', type: 'bool' },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_modelos_certificado_organizacao ON modelos_certificado (organizacao_id)',
      ],
    })
    app.save(collection)

    const base = [
      {
        nome: 'NR 01 – Curso Básico em Segurança do Trabalho',
        selo: 'NR 01',
        texto:
          'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório o curso de NR 01 – Curso Básico em Segurança do Trabalho, promovido nas dependências da empresa {EMPRESA} no dia {DATA}, conforme exigências da Norma Regulamentadora – NR 01, com carga horária de {CARGA}.',
        carga_horaria: '',
        campo_extra_rotulo: '',
        campo_extra_exemplo: '',
        conteudo:
          'Conceitos básicos de segurança do trabalho.\nImportância da prevenção de acidentes e doenças ocupacionais.\nResponsabilidades do empregador e do empregado.\nVisão geral das leis trabalhistas e das Normas Regulamentadoras.\nCIPA e SESMT: objetivos, atribuições, eleição e funcionamento.\nIdentificação e avaliação de riscos no ambiente de trabalho.\nMedidas de prevenção e controle de acidentes.\nEquipamentos de proteção individual (EPI) e coletiva (EPC).\nNoções básicas sobre prevenção e combate a incêndios.\nProcedimentos de evacuação e utilização de extintores.\nPrincípios de primeiros socorros e atendimento a emergências.\nRegistro e análise de acidentes e doenças do trabalho.',
        rascunho: false,
        ordem: 1,
      },
      {
        nome: 'NR 06 – Uso e guarda de EPI',
        selo: 'NR 06',
        texto:
          'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório o Curso sobre uso e guarda de EPI, promovido nas dependências da empresa {EMPRESA} no dia {DATA}, conforme exigências da Norma Regulamentadora – NR 06, com carga horária de {CARGA}.',
        carga_horaria: '',
        campo_extra_rotulo: '',
        campo_extra_exemplo: '',
        conteudo:
          'Descrição do equipamento e seus componentes;\nRisco ocupacional contra o qual o EPI oferece proteção;\nConhecimento dos riscos presentes no ambiente de trabalho e como os EPIs protegem contra esses riscos;\nRestrições e limitações de proteção;\nForma adequada de uso e ajuste;\nProcedimentos de inspeção antes do uso dos EPIs;\nIdentificação de danos, desgastes e validade dos EPIs;\nManutenção, limpeza e substituição;\nEstímulo à conscientização e atitude próativa em relação à segurança pessoal;\nDiscussão de casos práticos e situações específicas relacionadas ao uso de EPIs.',
        rascunho: false,
        ordem: 2,
      },
      {
        nome: 'NR 12 – Operador de máquina',
        selo: 'NR 12',
        texto:
          'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório o Curso para operador de {EXTRA}, promovido nas dependências da empresa {EMPRESA} no dia {DATA}, conforme exigências da Norma Regulamentadora – NR 12, com carga horária de {CARGA}.',
        carga_horaria: '',
        campo_extra_rotulo: 'Máquina / equipamento',
        campo_extra_exemplo: 'Ex.: serra circular de bancada',
        conteudo:
          '~ A capacitação para operação segura de máquinas deve abranger as etapas teórica e prática, a fim de proporcionar a competência adequada do operador para trabalho seguro.\na) descrição e identificação dos riscos associados com cada máquina e equipamento e as proteções específicas contra cada um deles;\nb) funcionamento das proteções; como e por que devem ser usadas;\nc) como e em que circunstâncias uma proteção pode ser removida, e por quem, sendo na maioria dos casos, somente o pessoal de inspeção ou manutenção;\nd) o que fazer, por exemplo, contatar o supervisor, se uma proteção foi danificada ou se perdeu sua função, deixando de garantir uma segurança adequada;\ne) os princípios de segurança na utilização da máquina ou equipamento;\nf) segurança para riscos mecânicos, elétricos e outros relevantes;\ng) método de trabalho seguro;\nh) permissão de trabalho; e\ni) sistema de bloqueio de funcionamento da máquina e equipamento durante operações de inspeção, limpeza, lubrificação e manutenção.',
        rascunho: false,
        ordem: 3,
      },
      {
        nome: 'NR 17 – Ergonomia',
        selo: 'NR 17',
        texto:
          'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório o curso de NR 17 – Ergonomia, promovido nas dependências da empresa {EMPRESA} no dia {DATA}, conforme exigências da Norma Regulamentadora – NR 17, com carga horária de {CARGA}.',
        carga_horaria: '',
        campo_extra_rotulo: '',
        campo_extra_exemplo: '',
        conteudo:
          'Conceito de ergonomia e objetivo da NR 17.\nResponsabilidades do empregador e dos trabalhadores.\nRelação entre o trabalhador, a tarefa e as condições de trabalho.\nOrganização do trabalho: ritmo, pausas, jornada e conteúdo das tarefas.\nAvaliação ergonômica preliminar (AEP) e análise ergonômica do trabalho (AET).\nLevantamento, transporte e descarga individual de cargas.\nMobiliário e postos de trabalho: posturas sentada e em pé, regulagens e ajustes.\nTrabalho com computadores e equipamentos de escritório.\nCondições ambientais de trabalho: ruído, iluminação, temperatura e umidade.\nFatores de risco ergonômico e distúrbios osteomusculares relacionados ao trabalho.\nMedidas de prevenção: pausas, alongamentos e boas práticas posturais.\nOrientações práticas para ajuste do posto de trabalho.',
        rascunho: true,
        ordem: 4,
      },
      {
        nome: 'NR 18 – Curso Básico (construção civil)',
        selo: 'NR 18',
        texto:
          'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório o curso de NR 18 – Segurança e Saúde no Trabalho na Indústria da Construção (Curso Básico), promovido nas dependências da empresa {EMPRESA} no dia {DATA}, conforme exigências da Norma Regulamentadora – NR 18, com carga horária de {CARGA}.',
        carga_horaria: '04',
        campo_extra_rotulo: '',
        campo_extra_exemplo: '',
        conteudo:
          'I. as condições e meio ambiente de trabalho;\nII. os riscos inerentes às atividades desenvolvidas;\nIII. os equipamentos e proteção coletiva existentes no canteiro de obras;\nIV. o uso adequado dos equipamentos de proteção individual;\nV. o PGR do canteiro de obras.',
        rascunho: false,
        ordem: 5,
      },
      {
        nome: 'NR 23 – Proteção Contra Incêndios',
        selo: 'NR 23',
        texto:
          'Certificamos que {NOME}, portador do CPF {CPF}, concluiu com aproveitamento satisfatório o curso de NR 23 – Proteção Contra Incêndios, promovido nas dependências da empresa {EMPRESA} no dia {DATA}, conforme exigências da Norma Regulamentadora – NR 23, com carga horária de {CARGA}.',
        carga_horaria: '',
        campo_extra_rotulo: '',
        campo_extra_exemplo: '',
        conteudo:
          'Conceitos de fogo: triângulo e tetraedro do fogo.\nCausas dos incêndios e formas de propagação do calor.\nClasses de incêndio e métodos de extinção.\nAgentes extintores e tipos de extintores portáteis.\nEscolha, localização, sinalização e inspeção de extintores.\nTécnica de utilização de extintores (prática).\nPrevenção de incêndios no ambiente de trabalho: materiais inflamáveis, armazenamento e instalações elétricas.\nSaídas de emergência, rotas de fuga e sinalização.\nSistemas de alarme, detecção e combate a incêndio.\nPlano de emergência e procedimentos de abandono.\nResponsabilidades dos trabalhadores e noções sobre brigada de incêndio.',
        rascunho: true,
        ordem: 6,
      },
    ]
    const col = app.findCollectionByNameOrId('modelos_certificado')
    for (const m of base) {
      const r = new Record(col)
      for (const k in m) r.set(k, m[k])
      app.save(r)
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('modelos_certificado'))
  },
)
