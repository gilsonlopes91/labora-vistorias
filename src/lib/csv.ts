// Parser de CSV simples, tolerante a aspas e a vírgula ou ponto-e-vírgula como
// delimitador (planilhas em pt-BR costumam exportar com ';'). Não depende de
// nenhuma lib externa.

export interface CsvParseResult {
  headers: string[]
  rows: Record<string, string>[]
}

function detectarDelimitador(primeiraLinha: string): ',' | ';' {
  const virgulas = (primeiraLinha.match(/,/g) || []).length
  const pontoVirgulas = (primeiraLinha.match(/;/g) || []).length
  return pontoVirgulas > virgulas ? ';' : ','
}

// Faz o parse de uma linha CSV respeitando aspas (campo com delimitador ou
// aspas dentro dele) e aspas duplicadas ("") como escape de aspas.
function parseLinha(linha: string, delimitador: string): string[] {
  const campos: string[] = []
  let atual = ''
  let dentroDeAspas = false

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i]

    if (dentroDeAspas) {
      if (char === '"') {
        if (linha[i + 1] === '"') {
          atual += '"'
          i++
        } else {
          dentroDeAspas = false
        }
      } else {
        atual += char
      }
      continue
    }

    if (char === '"') {
      dentroDeAspas = true
      continue
    }

    if (char === delimitador) {
      campos.push(atual)
      atual = ''
      continue
    }

    atual += char
  }

  campos.push(atual)
  return campos
}

// Divide o texto em linhas respeitando quebras de linha dentro de campos
// entre aspas.
function dividirLinhas(texto: string): string[] {
  const linhas: string[] = []
  let atual = ''
  let dentroDeAspas = false

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i]
    if (char === '"') dentroDeAspas = !dentroDeAspas
    if ((char === '\n' || char === '\r') && !dentroDeAspas) {
      if (char === '\r' && texto[i + 1] === '\n') i++
      linhas.push(atual)
      atual = ''
      continue
    }
    atual += char
  }
  if (atual.trim().length > 0) linhas.push(atual)
  return linhas
}

function normalizarCabecalho(campo: string): string {
  return campo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function parseCsv(texto: string): CsvParseResult {
  const semBom = texto.replace(/^﻿/, '')
  const linhasBrutas = dividirLinhas(semBom).filter((l) => l.trim().length > 0)
  if (linhasBrutas.length === 0) return { headers: [], rows: [] }

  const delimitador = detectarDelimitador(linhasBrutas[0])
  const cabecalhos = parseLinha(linhasBrutas[0], delimitador).map(normalizarCabecalho)

  const rows = linhasBrutas.slice(1).map((linha) => {
    const campos = parseLinha(linha, delimitador)
    const row: Record<string, string> = {}
    cabecalhos.forEach((h, idx) => {
      row[h] = (campos[idx] ?? '').trim()
    })
    return row
  })

  return { headers: cabecalhos, rows }
}
