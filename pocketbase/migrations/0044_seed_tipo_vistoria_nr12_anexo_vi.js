migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_vistoria')
    const itensCol = app.findCollectionByNameOrId('itens_checklist')

    let tipoRec
    try {
      tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo VI (Máquinas para Panificação e Confeitaria)' && organizacao_id = ''",
      )
    } catch (_) {
      tipoRec = new Record(tiposCol)
      tipoRec.set('organizacao_id', '')
      tipoRec.set('nome', 'NR-12 — Anexo VI (Máquinas para Panificação e Confeitaria)')
      tipoRec.set('nr_referencia', 'NR-12')
      tipoRec.set(
        'descricao',
        'Checklist do Anexo VI da NR-12 (item/grau/tipo do Anexo II da NR-28; subitens/alíneas de mesmo ' +
          'grau/tipo e mesmo item foram agrupados numa linha). Multa pelo Anexo I da NR-28. Descrições ' +
          'redigidas a partir de conhecimento geral do anexo, sem confirmação linha a linha — revisão ' +
          'obrigatória antes de laudo real.',
      )
      tipoRec.set('ativo', true)
      app.save(tipoRec)
    }

    let jaTemItens = true
    try {
      app.findFirstRecordByFilter('itens_checklist', "tipo_vistoria_id = '" + tipoRec.id + "'")
    } catch (_) {
      jaTemItens = false
    }

    const REVISAR =
      'Descrição escrita a partir de conhecimento geral do Anexo correspondente da NR-12, sem confirmação linha a linha do texto vigente — revisar com a fonte oficial antes de usar em laudo real.'

    if (!jaTemItens) {
      const itens = [
        {
          item_ref: '2.2 a 2.5',
          codigo: '212392-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.2 a 2.5 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '2.6 a 2.7',
          codigo: '212396-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.6 a 2.7 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '2.8',
          codigo: '212398-3',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 2.8 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '2.9',
          codigo: '212399-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 2.9 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '3.2 a 3.4',
          codigo: '212400-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.2 a 3.4 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '3.5 a 3.7',
          codigo: '212403-3',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.5 a 3.7 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '3.8 a 3.9',
          codigo: '212406-8',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 3.8 a 3.9 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '3.10 a 3.11',
          codigo: '212408-4',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 3.10 a 3.11 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '3.12',
          codigo: '212410-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.12 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '3.13 a 3.15',
          codigo: '212411-4',
          grau: 2,
          tipo: 'S',
          descricao:
            'Item 3.13 a 3.15 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '3.16',
          codigo: '212414-9',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 3.16 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '4.2 a 4.7',
          codigo: '212415-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 4.2 a 4.7 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '4.8',
          codigo: '212422-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 4.8 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '5.2 a 5.2.1.2',
          codigo: '212423-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 5.2 a 5.2.1.2 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '5.2.1.3 a 5.2.1.4',
          codigo: '212427-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.2.1.3 a 5.2.1.4 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '5.3',
          codigo: '212429-7',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 5.3 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '5.4',
          codigo: '212430-0',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 5.4 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '6.2 a 6.2.1.2',
          codigo: '212431-9',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 6.2 a 6.2.1.2 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '6.2.1.3 a 6.2.1.4',
          codigo: '212435-1',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.2.1.3 a 6.2.1.4 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '6.3',
          codigo: '212437-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 6.3 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '6.4 a 6.5',
          codigo: '212438-6',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 6.4 a 6.5 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '7.2 a 7.3',
          codigo: '212440-8',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 7.2 a 7.3 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '7.4',
          codigo: '212446-7',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 7.4 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '8.2 a 8.3',
          codigo: '212447-5',
          grau: 4,
          tipo: 'S',
          descricao:
            'Item 8.2 a 8.3 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
        {
          item_ref: '8.4',
          codigo: '212454-8',
          grau: 3,
          tipo: 'S',
          descricao:
            'Item 8.4 do Anexo VI da NR-12 (Anexo II da NR-28). Requisitos de segurança para máquinas de padaria/confeitaria (masseiras, cilindros, divisoras, fornos): proteções em partes móveis, dispositivos de parada de emergência, sinalização de risco e procedimentos de limpeza/manutenção com a máquina desenergizada.',
        },
      ]
      itens.forEach((it, idx) => {
        const rec = new Record(itensCol)
        rec.set('tipo_vistoria_id', tipoRec.id)
        rec.set('ordem', idx)
        rec.set('secao', '')
        rec.set('item_ref', it.item_ref)
        rec.set('codigo', it.codigo)
        rec.set('grau', it.grau)
        rec.set('tipo', it.tipo)
        rec.set('descricao', it.descricao)
        rec.set('observacao', REVISAR)
        app.save(rec)
      })
    }
  },
  (app) => {
    try {
      const tipoRec = app.findFirstRecordByFilter(
        'tipos_vistoria',
        "nome = 'NR-12 — Anexo VI (Máquinas para Panificação e Confeitaria)' && organizacao_id = ''",
      )
      const itens = app.findRecordsByFilter(
        'itens_checklist',
        "tipo_vistoria_id = '" + tipoRec.id + "'",
        '',
        0,
        0,
      )
      for (const it of itens) {
        app.delete(it)
      }
      app.delete(tipoRec)
    } catch (_) {}
  },
)
