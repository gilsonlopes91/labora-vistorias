/* Formulário da home no editor do site: uma seção por bloco da página. */
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ICONES_SITE } from '@/components/site/icones'
import CampoImagem from '@/components/admin/site/CampoImagem'
import type { HomeConteudo, RecursoSite } from '@/lib/siteConteudo'

interface Props {
  valor: HomeConteudo
  onChange: (v: HomeConteudo) => void
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: ReactNode
}) {
  return (
    <Card className="space-y-4 rounded-2xl border-none p-5 shadow-subtle">
      <div>
        <h2 className="text-lg font-bold">{titulo}</h2>
        {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </Card>
  )
}

function Texto({
  rotulo,
  valor,
  onChange,
  linhas,
  ajuda,
}: {
  rotulo: string
  valor: string
  onChange: (v: string) => void
  linhas?: number
  ajuda?: string
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</Label>
      {linhas ? (
        <Textarea
          value={valor}
          rows={linhas}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5"
        />
      ) : (
        <Input value={valor} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
      )}
      {ajuda && <p className="mt-1 text-[11px] text-muted-foreground">{ajuda}</p>}
    </div>
  )
}

export default function FormHome({ valor, onChange }: Props) {
  const setAbertura = (p: Partial<HomeConteudo['abertura']>) =>
    onChange({ ...valor, abertura: { ...valor.abertura, ...p } })
  const setAntes = (p: Partial<HomeConteudo['antes']>) =>
    onChange({ ...valor, antes: { ...valor.antes, ...p } })
  const setDepois = (p: Partial<HomeConteudo['depois']>) =>
    onChange({ ...valor, depois: { ...valor.depois, ...p } })
  const setCalc = (p: Partial<HomeConteudo['calculadora']>) =>
    onChange({ ...valor, calculadora: { ...valor.calculadora, ...p } })
  const setLista = (p: Partial<HomeConteudo['lista_espera']>) =>
    onChange({ ...valor, lista_espera: { ...valor.lista_espera, ...p } })

  const itens = valor.recursos.itens
  const setItens = (novos: RecursoSite[]) =>
    onChange({ ...valor, recursos: { ...valor.recursos, itens: novos } })
  const setItem = (i: number, p: Partial<RecursoSite>) =>
    setItens(itens.map((it, j) => (j === i ? { ...it, ...p } : it)))
  const mover = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= itens.length) return
    const c = [...itens]
    ;[c[i], c[j]] = [c[j], c[i]]
    setItens(c)
  }

  return (
    <div className="space-y-5">
      <Secao
        titulo="Abertura"
        descricao="A primeira dobra da página: título, texto, botões e a imagem ao lado."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo="Rótulo (caixa alta)"
            valor={valor.abertura.selo}
            onChange={(v) => setAbertura({ selo: v })}
          />
          <div />
          <Texto
            rotulo="Título"
            valor={valor.abertura.titulo}
            onChange={(v) => setAbertura({ titulo: v })}
          />
          <Texto
            rotulo="Final do título em destaque (verde)"
            valor={valor.abertura.destaque}
            onChange={(v) => setAbertura({ destaque: v })}
          />
        </div>
        <Texto
          rotulo="Texto"
          valor={valor.abertura.texto}
          linhas={3}
          onChange={(v) => setAbertura({ texto: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo="Botão principal (leva à lista de espera)"
            valor={valor.abertura.botao_principal}
            onChange={(v) => setAbertura({ botao_principal: v })}
            ajuda="Deixe vazio para esconder o botão."
          />
          <Texto
            rotulo="Botão secundário (leva à calculadora)"
            valor={valor.abertura.botao_secundario}
            onChange={(v) => setAbertura({ botao_secundario: v })}
            ajuda="Deixe vazio para esconder o botão."
          />
        </div>
        <Texto
          rotulo="Nota abaixo dos botões"
          valor={valor.abertura.nota}
          linhas={2}
          onChange={(v) => setAbertura({ nota: v })}
        />
        <CampoImagem
          valor={valor.abertura.imagem}
          onChange={(imagem) => setAbertura({ imagem })}
          textoVazio="mostra a tela desenhada da vistoria."
        />
      </Secao>

      <Secao titulo="Antes da visita">
        <Texto
          rotulo="Título"
          valor={valor.antes.titulo}
          onChange={(v) => setAntes({ titulo: v })}
        />
        <Texto
          rotulo="Texto"
          valor={valor.antes.paragrafos.join('\n\n')}
          linhas={8}
          onChange={(v) => setAntes({ paragrafos: v.split(/\n\s*\n/) })}
          ajuda="Deixe uma linha em branco entre um parágrafo e outro."
        />
        <CampoImagem
          valor={valor.antes.imagem}
          onChange={(imagem) => setAntes({ imagem })}
          textoVazio="mostra a tela desenhada da agenda."
        />
      </Secao>

      <Secao titulo="Depois da visita">
        <Texto
          rotulo="Título"
          valor={valor.depois.titulo}
          onChange={(v) => setDepois({ titulo: v })}
        />
        <Texto
          rotulo="Texto"
          valor={valor.depois.paragrafos.join('\n\n')}
          linhas={8}
          onChange={(v) => setDepois({ paragrafos: v.split(/\n\s*\n/) })}
          ajuda="Deixe uma linha em branco entre um parágrafo e outro."
        />
        <CampoImagem
          valor={valor.depois.imagem}
          onChange={(imagem) => setDepois({ imagem })}
          textoVazio="mostra a tela desenhada do relatório."
        />
      </Secao>

      <Secao
        titulo="Recursos"
        descricao="A grade de itens com ícone. Use as setas para mudar a ordem."
      >
        <Texto
          rotulo="Título da seção"
          valor={valor.recursos.titulo}
          onChange={(v) => onChange({ ...valor, recursos: { ...valor.recursos, titulo: v } })}
        />
        <div className="space-y-3">
          {itens.map((it, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Recurso {i + 1}</span>
                <select
                  aria-label="Ícone"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={it.icone}
                  onChange={(e) => setItem(i, { icone: e.target.value })}
                >
                  {Object.entries(ICONES_SITE).map(([chave, { label }]) => (
                    <option key={chave} value={chave}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="ml-auto flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Descer"
                    disabled={i === itens.length - 1}
                    onClick={() => mover(i, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    aria-label="Remover recurso"
                    onClick={() => setItens(itens.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                aria-label="Título do recurso"
                value={it.titulo}
                onChange={(e) => setItem(i, { titulo: e.target.value })}
                placeholder="Título"
              />
              <Textarea
                aria-label="Texto do recurso"
                value={it.texto}
                rows={2}
                onChange={(e) => setItem(i, { texto: e.target.value })}
                placeholder="Texto"
              />
            </div>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => setItens([...itens, { icone: 'checklist', titulo: '', texto: '' }])}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Adicionar recurso
        </Button>
      </Secao>

      <Secao titulo="Calculadora de multas">
        <Texto
          rotulo="Título"
          valor={valor.calculadora.titulo}
          onChange={(v) => setCalc({ titulo: v })}
        />
        <Texto
          rotulo="Texto"
          valor={valor.calculadora.texto}
          linhas={3}
          onChange={(v) => setCalc({ texto: v })}
        />
        <Texto
          rotulo="Botão"
          valor={valor.calculadora.botao}
          onChange={(v) => setCalc({ botao: v })}
          ajuda="Deixe vazio para esconder o botão."
        />
      </Secao>

      <Secao titulo="Chamada final (lista de espera)">
        <Texto
          rotulo="Título"
          valor={valor.lista_espera.titulo}
          onChange={(v) => setLista({ titulo: v })}
        />
        <Texto
          rotulo="Texto"
          valor={valor.lista_espera.texto}
          linhas={2}
          onChange={(v) => setLista({ texto: v })}
        />
        <Texto
          rotulo="Botão"
          valor={valor.lista_espera.botao}
          onChange={(v) => setLista({ botao: v })}
          ajuda="Deixe vazio para esconder o botão."
        />
      </Secao>
    </div>
  )
}
