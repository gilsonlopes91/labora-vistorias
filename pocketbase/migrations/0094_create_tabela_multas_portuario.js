// Anexo I-A da NR-28 — gradação de multas do TRABALHO PORTUÁRIO (NR-29),
// inserido pela Portaria SIT nº 319, de 15/05/2012.
//
// Diferença essencial para o Anexo I: esta tabela NÃO é expressa em UFIR. Os
// valores já vêm fixados em reais na própria norma, então não se aplica o fator
// de conversão de 1,0641. Usar a grade UFIR para itens da NR-29 superestima a
// multa (ex.: grau 1 / 01 a 10 empregados / segurança = R$ 670,38 pelo Anexo I
// contra R$ 575,00 corretos pelo Anexo I-A).
//
// A estrutura é a mesma: 8 faixas de nº de empregados x 4 graus x 2 tipos
// (S = segurança, M = medicina do trabalho) = 64 células com mínimo e máximo.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'tabela_multas_portuario',
      type: 'base',
      // Referência oficial (Anexo I-A da NR-28) — pública, gerenciada só via migration.
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'faixa_funcionarios',
          type: 'select',
          required: true,
          values: [
            '01 a 10',
            '11 a 25',
            '26 a 50',
            '51 a 100',
            '101 a 250',
            '251 a 500',
            '501 a 1000',
            'Mais de 1000',
          ],
          maxSelect: 1,
        },
        // Sem "required": number com min 0 é tratado como vazio quando o valor
        // é exatamente 0 (primeira faixa) — mesmo cuidado da tabela_multas_nr28.
        { name: 'faixa_ordem', type: 'number', min: 0, max: 7, onlyInt: true },
        { name: 'grau', type: 'number', required: true, min: 1, max: 4, onlyInt: true },
        { name: 'tipo', type: 'select', required: true, values: ['S', 'M'], maxSelect: 1 },
        { name: 'valor_min_reais', type: 'number', required: true },
        { name: 'valor_max_reais', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_tabela_multas_portuario_lookup ON tabela_multas_portuario (faixa_ordem, grau, tipo)',
      ],
    })
    app.save(collection)

    if (app.countRecords('tabela_multas_portuario') === 0) {
      // Cada faixa: [rótulo, [S grau1..grau4], [M grau1..grau4]], cada grau [mín, máx].
      // Conferido contra o texto do Anexo I-A em duas fontes independentes.
      // Ressalva: o mínimo de 251 a 500 / grau 2 / medicina (1353,53) rompe a
      // progressão da tabela — pelo padrão das demais células seria 1356,27.
      // Mantido como publicado na norma; revisar contra o PDF oficial.
      const FAIXAS = [
        [
          '01 a 10',
          [
            [575.0, 665.36],
            [1030.44, 1271.39],
            [1543.38, 1908.46],
            [2055.4, 2548.27],
          ],
          [
            [345.0, 390.63],
            [616.98, 765.75],
            [926.39, 1144.52],
            [1232.15, 1533.33],
          ],
        ],
        [
          '11 a 25',
          [
            [666.27, 757.54],
            [1272.31, 1518.73],
            [1909.38, 2277.19],
            [2549.18, 3042.95],
          ],
          [
            [391.55, 454.52],
            [766.66, 914.52],
            [1145.44, 1369.05],
            [1534.24, 1823.57],
          ],
        ],
        [
          '26 a 50',
          [
            [758.46, 878.93],
            [1519.65, 1766.08],
            [2278.1, 2645.01],
            [3043.86, 3537.63],
          ],
          [
            [455.44, 529.37],
            [915.43, 1064.21],
            [1369.96, 1593.57],
            [1824.49, 2117.46],
          ],
        ],
        [
          '51 a 100',
          [
            [879.84, 1007.63],
            [1766.99, 2007.95],
            [2645.93, 3013.75],
            [3538.55, 4032.32],
          ],
          [
            [530.28, 604.2],
            [1065.11, 1208.41],
            [1594.48, 1812.62],
            [2118.38, 2416.83],
          ],
        ],
        [
          '101 a 250',
          [
            [1008.54, 1132.67],
            [2008.85, 2255.29],
            [3014.65, 3393.42],
            [4033.23, 4516.05],
          ],
          [
            [605.12, 679.05],
            [1209.32, 1355.36],
            [1813.53, 2030.75],
            [2417.74, 2716.19],
          ],
        ],
        [
          '251 a 500',
          [
            [1133.57, 1254.05],
            [2256.2, 2508.11],
            [3394.34, 3761.25],
            [4516.96, 5010.74],
          ],
          [
            [679.96, 753.89],
            [1353.53, 1502.3],
            [2031.67, 2255.28],
            [2717.11, 3009.17],
          ],
        ],
        [
          '501 a 1000',
          [
            [1254.97, 1375.44],
            [2509.02, 2756.36],
            [3762.16, 4129.98],
            [5011.65, 5506.34],
          ],
          [
            [754.8, 826.9],
            [1503.21, 1651.98],
            [2256.19, 2479.8],
            [3010.08, 3302.14],
          ],
        ],
        [
          'Mais de 1000',
          [
            [1376.35, 1502.31],
            [2757.28, 2997.31],
            [4130.89, 4498.71],
            [5507.25, 5750.0],
          ],
          [
            [827.82, 903.57],
            [1652.9, 1800.75],
            [2480.71, 2698.84],
            [3303.06, 3450.0],
          ],
        ],
      ]

      FAIXAS.forEach((faixa, ordem) => {
        const rotulo = faixa[0]
        const porTipo = { S: faixa[1], M: faixa[2] }
        for (const tipo of ['S', 'M']) {
          porTipo[tipo].forEach((valores, idx) => {
            const rec = new Record(collection)
            rec.set('faixa_funcionarios', rotulo)
            rec.set('faixa_ordem', ordem)
            rec.set('grau', idx + 1)
            rec.set('tipo', tipo)
            rec.set('valor_min_reais', valores[0])
            rec.set('valor_max_reais', valores[1])
            app.save(rec)
          })
        }
      })
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('tabela_multas_portuario'))
  },
)
