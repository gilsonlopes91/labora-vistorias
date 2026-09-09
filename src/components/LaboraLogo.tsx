/* Marca da Labora — logotipo oficial com símbolo octogonal verde e faixas diagonais. */
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'

interface LaboraLogoProps {
  className?: string
  alt?: string
}

export function LaboraLogo({ className = 'h-9 w-9', alt = 'Labora Vistoria' }: LaboraLogoProps) {
  return (
    <img
      src={laboraLogoUrl}
      alt={alt}
      className={`shrink-0 object-contain select-none scale-110 ${className}`}
      loading="eager"
    />
  )
}

/** Logo completo — marca oficial + nome + subtítulo, para telas de destaque como o login. */
export function LaboraLogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 p-1.5 shadow-sm">
        <LaboraLogo className="h-14 w-14" />
      </div>
      <div className="text-center">
        <div className="text-xl font-bold uppercase tracking-wide text-foreground">Labora</div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Engenharia e SST
        </div>
      </div>
    </div>
  )
}
