export type CategoriaRisco =
  | 'fisico'
  | 'quimico'
  | 'biologico'
  | 'ergonomico'
  | 'acidente'
  | 'psicossocial'
  | 'outro'

/** Cores do mapa de riscos (NR-5, Anexo IV). Psicossocial e "outro" não têm cor na norma. */
export const CATEGORIAS: Record<CategoriaRisco, { rotulo: string; cor: string }> = {
  fisico: { rotulo: 'Físico', cor: '#2E9E4F' },
  quimico: { rotulo: 'Químico', cor: '#D7262C' },
  biologico: { rotulo: 'Biológico', cor: '#7A4A1E' },
  ergonomico: { rotulo: 'Ergonômico', cor: '#F2C318' },
  acidente: { rotulo: 'Acidente', cor: '#1F5FBF' },
  psicossocial: { rotulo: 'Psicossocial', cor: '#8A8F86' },
  outro: { rotulo: 'Outro', cor: '#8A8F86' },
}

const semAcento = (texto?: string) =>
  (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

export function categoriaDoRisco(entrada: {
  tipoAgente?: string
  trilha?: string
}): CategoriaRisco {
  const tipo = semAcento(entrada.tipoAgente)
  if (tipo.startsWith('fisic')) return 'fisico'
  if (tipo.startsWith('quimic')) return 'quimico'
  if (tipo.startsWith('biolog')) return 'biologico'
  if (tipo.startsWith('ergonom')) return 'ergonomico'
  if (tipo.startsWith('psicossocial')) return 'psicossocial'
  if (tipo.startsWith('acidente')) return 'acidente'
  const trilha = semAcento(entrada.trilha)
  if (trilha.startsWith('acidente')) return 'acidente'
  if (trilha.startsWith('ergonom')) return 'ergonomico'
  if (trilha.startsWith('psicossocial')) return 'psicossocial'
  return 'outro'
}
