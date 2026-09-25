/* Telas do app desenhadas para a home pública. São componentes (não
   capturas de tela), com dados inventados, para não expor dados de clientes
   e continuar nítidas em qualquer tamanho. Seguem o visual real do app. */
import { Camera, CheckCircle2, ChevronRight, Clock, MapPin } from 'lucide-react'

function Moldura({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
        <span className="ml-2 truncate text-[11px] text-muted-foreground">{titulo}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/** Item do checklist em campo: C / N/C / N/A, foto e multa estimada. */
export function TelaVistoria() {
  return (
    <Moldura titulo="Vistoria · Metalúrgica Exemplo · NR-12">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Seção 12.5 · Sistemas de segurança</span>
        <span>18 de 42</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[43%] rounded-full bg-primary" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground">12.5.1</p>
      <p className="mt-1 text-sm leading-snug">
        As zonas de perigo das máquinas e equipamentos devem possuir sistemas de segurança,
        caracterizados por proteções fixas, proteções móveis e dispositivos de segurança
        interligados, que resguardem proteção à saúde e à integridade física dos trabalhadores.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border py-2 text-center text-sm font-semibold text-muted-foreground">
          C
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 py-2 text-center text-sm font-semibold text-destructive">
          N/C
        </div>
        <div className="rounded-lg border py-2 text-center text-sm font-semibold text-muted-foreground">
          N/A
        </div>
      </div>
      <div className="mt-3 rounded-lg border bg-muted/30 p-2.5 text-xs">
        <p className="text-muted-foreground">Observação</p>
        <p className="mt-0.5">Prensa excêntrica sem proteção na zona de prensagem.</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Camera className="h-3.5 w-3.5" /> 2 fotos · com GPS
        </span>
        <span className="text-right font-semibold">
          Multa estimada (60 empregados): R$ 4.125,52 a R$ 4.701,19
        </span>
      </div>
    </Moldura>
  )
}

/** Agenda da semana com as vistorias e rotinas. */
export function TelaAgenda() {
  const itens = [
    {
      dia: 'Seg 06',
      hora: '08:30',
      empresa: 'Metalúrgica Exemplo',
      nr: 'NR-12 · NR-10',
      feito: true,
    },
    {
      dia: 'Qua 08',
      hora: '14:00',
      empresa: 'Cerâmica Modelo',
      nr: 'NR-15 Anexo 3 · calor',
      feito: false,
    },
    {
      dia: 'Sex 10',
      hora: '09:00',
      empresa: 'Distribuidora Teste',
      nr: 'NR-23 · rotina mensal',
      feito: false,
    },
  ]
  return (
    <Moldura titulo="Agenda · semana">
      <div className="space-y-2">
        {itens.map((i) => (
          <div key={i.dia} className="flex items-center gap-3 rounded-xl border p-2.5">
            <div className="w-12 shrink-0 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">{i.dia.split(' ')[0]}</p>
              <p className="text-lg font-bold leading-none">{i.dia.split(' ')[1]}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.empresa}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {i.hora} · {i.nr}
              </p>
            </div>
            {i.feito ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> Também no Google Agenda e no Outlook
      </p>
    </Moldura>
  )
}

/** Trecho do relatório em PDF: plano de ação e assinaturas. */
export function TelaRelatorio() {
  const linhas = [
    ['12.5.1', 'Prensa sem proteção na zona de prensagem', 'Imediato'],
    ['10.2.8.2', 'Quadro elétrico sem sinalização de risco', '30 dias'],
    ['23.1.1', 'Extintor com carga vencida no almoxarifado', '30 dias'],
  ]
  return (
    <Moldura titulo="relatorio-metalurgica-exemplo.pdf">
      <p className="text-center text-[11px] font-bold uppercase tracking-wide">
        Relatório de Vistoria de Segurança e Saúde no Trabalho
      </p>
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        42 itens avaliados · 3 não conformidades
      </p>
      <p className="mt-3 text-[11px] font-semibold">Plano de ação</p>
      <div className="mt-1 overflow-hidden rounded-md border text-[10px]">
        <div className="grid grid-cols-[52px_1fr_52px] bg-muted/50 px-2 py-1 font-semibold">
          <span>Item</span>
          <span>Situação encontrada</span>
          <span className="text-right">Prazo</span>
        </div>
        {linhas.map(([item, sit, prazo]) => (
          <div key={item} className="grid grid-cols-[52px_1fr_52px] border-t px-2 py-1">
            <span>{item}</span>
            <span className="truncate pr-2">{sit}</span>
            <span className="text-right">{prazo}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] font-semibold">Conclusão</p>
      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
        Foram avaliados 42 itens das NR-10, NR-12 e NR-23. As 3 não conformidades estão no plano de
        ação acima; a primeira tem prazo imediato.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 text-center text-[10px] text-muted-foreground">
        <div className="border-t pt-1">Responsável técnico · ART</div>
        <div className="border-t pt-1">Representante da empresa</div>
      </div>
    </Moldura>
  )
}
