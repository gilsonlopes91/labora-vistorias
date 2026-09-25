/* Título da aba do navegador por página ("Agenda · Labora Vistorias").
   Antes todas as páginas tinham o mesmo título, o que atrapalha a busca no
   Google e o compartilhamento. O artigo do blog define o próprio título
   (com o nome do artigo) em ArtigoDetalhe. */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const MARCA = 'Labora Vistorias'

const DESCRICAO_PADRAO =
  'App de vistorias de segurança do trabalho: checklists das NRs, fotos com GPS, multa estimada pela NR-28 e relatório em PDF com plano de ação. Calculadora de multas grátis.'

const TITULOS: [RegExp, string][] = [
  [/^\/$/, 'App de vistorias de SST e calculadora de multas NR-28'],
  [/^\/calculadora/, 'Calculadora de multas NR-28'],
  [/^\/blog\/?$/, 'Blog de segurança do trabalho'],
  [/^\/em-breve/, 'Em breve'],
  [/^\/termos/, 'Termos de Uso'],
  [/^\/privacidade/, 'Política de Privacidade'],
  [/^\/login/, 'Entrar'],
  [/^\/esqueci-senha/, 'Esqueci minha senha'],
  [/^\/(redefinir-senha|reset-password)/, 'Criar nova senha'],
  [/^\/painel/, 'Painel'],
  [/^\/empresas\/?$/, 'Empresas'],
  [/^\/empresas\//, 'Empresa'],
  [/^\/vistorias\/?$/, 'Vistorias'],
  [/^\/vistorias\//, 'Vistoria'],
  [/^\/auditoria-formularios/, 'Auditoria de NRs e formulários'],
  [/^\/formularios/, 'Formulários'],
  [/^\/modelos/, 'Checklists'],
  [/^\/agenda/, 'Agenda'],
  [/^\/orcamentos\/modelos/, 'Modelos de proposta'],
  [/^\/orcamentos/, 'Orçamentos'],
  [/^\/configuracoes/, 'Configurações'],
  [/^\/equipe/, 'Equipe'],
  [/^\/trocar-senha/, 'Minha conta'],
  [/^\/admin\/normas/, 'Normas (admin)'],
  [/^\/admin/, 'Console (admin)'],
  [/^\/artigos/, 'Artigos (admin)'],
  [/^\/conteudo/, 'Conteúdo do site (admin)'],
]

/** Define o título da aba e, se informada, a descrição da página. */
export function definirTituloPagina(titulo?: string, descricao?: string) {
  document.title = titulo ? `${titulo} · ${MARCA}` : MARCA
  let meta = document.querySelector('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', descricao || DESCRICAO_PADRAO)
}

export default function TituloPorRota() {
  const { pathname } = useLocation()
  useEffect(() => {
    // o artigo do blog define o próprio título quando carrega
    if (/^\/blog\/.+/.test(pathname)) return
    const achado = TITULOS.find(([re]) => re.test(pathname))
    definirTituloPagina(achado ? achado[1] : undefined)
  }, [pathname])
  return null
}
