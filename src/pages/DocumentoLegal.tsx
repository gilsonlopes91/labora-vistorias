/* Páginas públicas /termos e /privacidade — texto em src/content/legal.ts. */
import { Link } from 'react-router-dom'
import {
  POLITICA_PRIVACIDADE,
  TERMOS_DE_USO,
  VERSAO_TERMOS,
  VIGENCIA_TERMOS,
  type SecaoLegal,
} from '@/content/legal'

export default function DocumentoLegal({ tipo }: { tipo: 'termos' | 'privacidade' }) {
  const titulo = tipo === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'
  const secoes: SecaoLegal[] = tipo === 'termos' ? TERMOS_DE_USO : POLITICA_PRIVACIDADE
  const outro =
    tipo === 'termos'
      ? { to: '/privacidade', label: 'Política de Privacidade' }
      : { to: '/termos', label: 'Termos de Uso' }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Labora Vistorias · versão {VERSAO_TERMOS} · vigente a partir de {VIGENCIA_TERMOS}
      </p>
      <div className="mt-8 space-y-8">
        {secoes.map((s) => (
          <section key={s.titulo}>
            <h2 className="mb-2 text-lg font-bold">{s.titulo}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
              {s.paragrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        Veja também a{' '}
        <Link to={outro.to} className="text-primary underline underline-offset-2">
          {outro.label}
        </Link>
        .
      </p>
    </div>
  )
}
