/* Rodapé público a partir do conteúdo (padrão + publicado). Usado pelo
   PublicLayout e pela prévia do editor. */
import { Link } from 'react-router-dom'
import { abrirPreferenciasCookies } from '@/lib/analytics'
import type { RodapeConteudo } from '@/lib/siteConteudo'

export default function RodapePublico({ conteudo }: { conteudo: RodapeConteudo }) {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="font-bold text-foreground">{conteudo.nome}</span>
          <span>{conteudo.descricao}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/calculadora" className="hover:text-foreground">
            Calculadora
          </Link>
          <Link to="/blog" className="hover:text-foreground">
            Blog
          </Link>
          <Link to="/login" className="hover:text-foreground">
            Entrar
          </Link>
          <Link to="/termos" className="hover:text-foreground">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <button
            type="button"
            className="hover:text-foreground"
            onClick={abrirPreferenciasCookies}
          >
            Cookies
          </button>
          {conteudo.email_contato && (
            <a href={`mailto:${conteudo.email_contato}`} className="hover:text-foreground">
              Contato
            </a>
          )}
        </div>
        <div>
          © {new Date().getFullYear()} {conteudo.assinatura}
        </div>
      </div>
    </footer>
  )
}
