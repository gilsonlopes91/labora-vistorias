/* Home pública desenhada a partir do conteúdo (padrão + publicado). É o mesmo
   componente que o editor usa na prévia, então o que aparece lá é o que vai
   para o ar. */
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TelaAgenda, TelaRelatorio, TelaVistoria } from '@/components/TelasHome'
import { iconeSite } from '@/components/site/icones'
import { urlImagem, type HomeConteudo, type ImagemSite } from '@/lib/siteConteudo'

const LISTA_ESPERA = '/login?aba=lista'

function ImagemBloco({ img }: { img: ImagemSite }) {
  return (
    <img
      src={urlImagem(img)}
      alt={img.alt}
      loading="lazy"
      className="w-full rounded-2xl border object-cover shadow-sm"
    />
  )
}

function Paragrafos({ lista }: { lista: string[] }) {
  return (
    <>
      {lista
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="mt-3 whitespace-pre-line text-muted-foreground">
            {p}
          </p>
        ))}
    </>
  )
}

export default function HomeView({ conteudo }: { conteudo: HomeConteudo }) {
  const { abertura, antes, depois, recursos, calculadora, lista_espera } = conteudo

  return (
    <div>
      {/* Abertura */}
      <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="text-center lg:text-left">
            {abertura.selo && (
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                {abertura.selo}
              </p>
            )}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              {abertura.titulo}{' '}
              {abertura.destaque && <span className="text-primary">{abertura.destaque}</span>}
            </h1>
            <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-lg text-muted-foreground lg:mx-0">
              {abertura.texto}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {abertura.botao_principal && (
                <Button asChild size="lg" className="rounded-full px-8 text-base">
                  <Link to={LISTA_ESPERA}>
                    {abertura.botao_principal} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {abertura.botao_secundario && (
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 text-base">
                  <Link to="/calculadora">{abertura.botao_secundario}</Link>
                </Button>
              )}
            </div>
            {abertura.nota && (
              <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground lg:mx-0">
                {abertura.nota}
              </p>
            )}
          </div>
          <div className="mx-auto w-full max-w-md">
            {abertura.imagem ? <ImagemBloco img={abertura.imagem} /> : <TelaVistoria />}
          </div>
        </div>
      </section>

      {/* Antes da visita */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div className="order-2 mx-auto w-full max-w-md lg:order-1">
          {antes.imagem ? <ImagemBloco img={antes.imagem} /> : <TelaAgenda />}
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-3xl font-extrabold tracking-tight">{antes.titulo}</h2>
          <Paragrafos lista={antes.paragrafos} />
        </div>
      </section>

      {/* Depois da visita */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{depois.titulo}</h2>
            <Paragrafos lista={depois.paragrafos} />
          </div>
          <div className="mx-auto w-full max-w-md">
            {depois.imagem ? <ImagemBloco img={depois.imagem} /> : <TelaRelatorio />}
          </div>
        </div>
      </section>

      {/* Recursos */}
      {recursos.itens.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">{recursos.titulo}</h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {recursos.itens.map((r, i) => {
              const Icone = iconeSite(r.icone)
              return (
                <div key={i}>
                  <Icone className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-bold">{r.titulo}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.texto}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Calculadora */}
      <section className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight">{calculadora.titulo}</h2>
            <p className="mt-2 text-muted-foreground">{calculadora.texto}</p>
          </div>
          {calculadora.botao && (
            <Button asChild size="lg" variant="outline" className="shrink-0 rounded-full px-8">
              <Link to="/calculadora">
                {calculadora.botao} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Lista de espera */}
      <section className="bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight">
            {lista_espera.titulo}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{lista_espera.texto}</p>
          {lista_espera.botao && (
            <Button asChild size="lg" className="mt-8 rounded-full px-10 text-base">
              <Link to={LISTA_ESPERA}>
                {lista_espera.botao} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
