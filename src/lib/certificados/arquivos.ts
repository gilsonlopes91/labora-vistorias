/* Download dos certificados: um PDF direto ou vários num .zip.
   O .zip é montado aqui mesmo, sem compressão (o PDF já é comprimido), para
   não depender de mais uma biblioteca só para empacotar arquivos. */

export interface ArquivoGerado {
  nome: string
  blob: Blob
}

/** Remove caracteres inválidos para nome de arquivo e troca espaços por underline. */
export function sanitizarNomeArquivo(nome: string): string {
  return nome
    .trim()
    .replace(/[/\\?%*:|"<>]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/** Abre o PDF em outra aba; se o navegador bloquear, baixa o arquivo. */
export function abrirPdfEmNovaAba(blob: Blob, nomeSeBloqueado: string) {
  const url = URL.createObjectURL(blob)
  const aba = window.open(url, '_blank')
  if (!aba || aba.closed || typeof aba.closed === 'undefined') baixarBlob(blob, nomeSeBloqueado)
  setTimeout(() => URL.revokeObjectURL(url), 120000)
}

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[n] = c >>> 0
  }
  return tabela
})()

function crc32(dados: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < dados.length; i++) c = TABELA_CRC[(c ^ dados[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Dois colaboradores com o mesmo nome não podem virar o mesmo arquivo dentro do .zip. */
function nomeUnico(nome: string, usados: Set<string>): string {
  const ponto = nome.lastIndexOf('.')
  const base = ponto === -1 ? nome : nome.slice(0, ponto)
  const ext = ponto === -1 ? '' : nome.slice(ponto)
  let candidato = nome
  for (let n = 1; usados.has(candidato); n++) candidato = `${base}_${n}${ext}`
  usados.add(candidato)
  return candidato
}

export async function montarZip(arquivos: ArquivoGerado[]): Promise<Blob> {
  const agora = new Date()
  const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1)
  const dia = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate()
  const texto = new TextEncoder()
  const usados = new Set<string>()
  const partes: BlobPart[] = []
  const indice: BlobPart[] = []
  let posicao = 0
  let tamanhoIndice = 0

  for (const arquivo of arquivos) {
    const nome = texto.encode(nomeUnico(arquivo.nome, usados))
    const dados = new Uint8Array(await arquivo.blob.arrayBuffer())

    // Campos comuns ao cabeçalho do arquivo e à entrada do índice.
    const comum = new DataView(new ArrayBuffer(26))
    comum.setUint16(0, 20, true) // versão mínima para extrair
    comum.setUint16(2, 0x0800, true) // nome em UTF-8
    comum.setUint16(4, 0, true) // sem compressão
    comum.setUint16(6, hora, true)
    comum.setUint16(8, dia, true)
    comum.setUint32(10, crc32(dados), true)
    comum.setUint32(14, dados.length, true)
    comum.setUint32(18, dados.length, true)
    comum.setUint16(22, nome.length, true)
    comum.setUint16(24, 0, true)

    const local = new DataView(new ArrayBuffer(4))
    local.setUint32(0, 0x04034b50, true)
    partes.push(local.buffer, comum.buffer, nome, dados)

    const entrada = new DataView(new ArrayBuffer(6))
    entrada.setUint32(0, 0x02014b50, true)
    entrada.setUint16(4, 20, true)
    const fim = new DataView(new ArrayBuffer(14))
    fim.setUint32(10, posicao, true) // onde o arquivo começa dentro do .zip
    indice.push(entrada.buffer, comum.buffer, fim.buffer, nome)

    posicao += 30 + nome.length + dados.length
    tamanhoIndice += 46 + nome.length
  }

  const rodape = new DataView(new ArrayBuffer(22))
  rodape.setUint32(0, 0x06054b50, true)
  rodape.setUint16(8, arquivos.length, true)
  rodape.setUint16(10, arquivos.length, true)
  rodape.setUint32(12, tamanhoIndice, true)
  rodape.setUint32(16, posicao, true)

  return new Blob([...partes, ...indice, rodape.buffer], { type: 'application/zip' })
}
