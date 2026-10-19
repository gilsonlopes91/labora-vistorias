import { describe, it, expect } from 'vitest'
import { renderToBuffer } from '@react-pdf/renderer'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { DocumentoPdf } from './DocumentoPdf'
import { FONTES_GOOGLE, fontesDaPasta, registrarFontes } from './fontes'
import { documentoLavajato } from '../fixtures/lavajato'

// Usa as fontes de public/fonts/poppins quando existirem (roda sem internet); senão, as do Google.
const pastaFontes = path.resolve(import.meta.dirname, '../../../../public/fonts/poppins')
registrarFontes(existsSync(pastaFontes) ? fontesDaPasta(pastaFontes) : FONTES_GOOGLE)

async function gerar(doc = documentoLavajato) {
  return renderToBuffer(<DocumentoPdf doc={doc} />)
}

describe('DocumentoPdf', () => {
  it('gera um PDF válido com a fixture', async () => {
    const buf = await gerar()
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(5000)
    if (process.env.SALVAR_PDF) {
      mkdirSync('tmp', { recursive: true })
      writeFileSync('tmp/galeria.pdf', buf)
    }
  })

  it('card maior que uma página quebra sem erro e sem cortar o documento', async () => {
    const longo = 'texto longo de teste '.repeat(400)
    const doc = JSON.parse(JSON.stringify(documentoLavajato))
    const inv = doc.capitulos[1].blocos.find((b: { tipo: string }) => b.tipo === 'inventario')
    inv.fichas[0].riscos = [
      {
        ...inv.fichas[0].riscos[0],
        fonte: longo,
        danos: longo,
        leitura: longo,
        medidas: Array.from({ length: 40 }, (_, i) => ({
          tipo: 'EPI',
          texto: `Protetor ${i}, CA 1234, válido até 03/2028`,
        })),
      },
    ]
    const buf = await gerar(doc)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(5000)
  })

  it('matriz 3x3 e risco sem medição geram PDF', async () => {
    const doc = JSON.parse(JSON.stringify(documentoLavajato))
    const inv = doc.capitulos[1].blocos.find((b: { tipo: string }) => b.tipo === 'inventario')
    const risco = inv.fichas[0].riscos[1]
    risco.avaliacao.matriz = {
      dimensao: 3,
      niveis: [
        [3, 4, 5],
        [2, 3, 4],
        [1, 2, 3],
      ],
      p: 2,
      s: 3,
      pontos: 6,
    }
    delete inv.fichas[0].riscos[0].medicao
    const buf = await gerar(doc)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('gera a lista de conclusões por função dos laudos', async () => {
    const doc = JSON.parse(JSON.stringify(documentoLavajato))
    doc.tipo = 'insalubridade'
    doc.capitulos[1].blocos.push({
      tipo: 'conclusoes',
      linhas: [
        {
          funcao: 'Lavador (alta pressão)',
          ghe: 'GHE 01 – Lavagem e acabamento',
          agente: 'Ruído contínuo ou intermitente',
          enquadramento: 'NR-15, Anexo 1',
          conclusao: 'Insalubre, grau médio (20%)',
          justificativa:
            'Nível de 91,3 dB(A), acima do limite de 85 dB(A), sem neutralização pelo EPI.',
        },
        {
          funcao: 'Atendente',
          agente: 'Nenhum agente da NR-15 identificado',
          conclusao: 'Não caracterizada',
        },
      ],
    })
    const buf = await gerar(doc)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
    if (process.env.SALVAR_PDF) writeFileSync('tmp/conclusoes.pdf', buf)
  })

  it('gera a capa sem logos e sem detalhe do cliente', async () => {
    const doc = {
      ...documentoLavajato,
      capa: { ...documentoLavajato.capa, clienteDetalhe: undefined, subtitulo: undefined },
    }
    const buf = await gerar(doc)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
  })
})
