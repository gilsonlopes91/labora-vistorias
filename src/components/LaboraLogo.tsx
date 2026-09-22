/* Marca da Labora — logotipo oficial com símbolo octogonal verde e faixas diagonais. */
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'

interface LaboraLogoProps {
  className?: string
  alt?: string
}

export function LaboraLogo({ className = 'h-9 w-9', alt = 'LABORA vistorias' }: LaboraLogoProps) {
  return (
    <img
      src={laboraLogoUrl}
      alt={alt}
      className={`shrink-0 object-contain select-none ${className}`}
      loading="eager"
    />
  )
}

interface LaboraLogoFullProps {
  className?: string
  layout?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
}

/** Logo completo — marca oficial com símbolo à esquerda e nome tipográfico ("LABORA vistorias") ao lado. */
export function LaboraLogoFull({
  className = '',
  layout = 'horizontal',
  size = 'md',
}: LaboraLogoFullProps) {
  if (layout === 'vertical') {
    return (
      <div
        className={`group inline-flex flex-col items-center gap-2 py-1 select-none transition-transform duration-200 ${className}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 p-2.5 shadow-xs ring-1 ring-primary/20 transition-all duration-200 group-hover:scale-105 group-hover:shadow-sm group-hover:ring-primary/30">
          <LaboraLogo className="h-full w-full drop-shadow-xs" />
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-xl font-extrabold tracking-tight text-foreground leading-none">
            LABORA
          </span>
          <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-primary/80 leading-tight mt-1">
            vistorias
          </span>
        </div>
      </div>
    )
  }

  // Layout HORIZONTAL (padrão solicitado para header público e login)
  const sizeStyles = {
    sm: {
      box: 'h-9 w-9 rounded-xl p-1.5',
      logo: 'h-full w-full',
      labora: 'text-base font-extrabold tracking-tight leading-none',
      vistorias:
        'text-[9.5px] tracking-[0.2em] font-semibold text-primary/80 uppercase leading-none mt-0.5',
      gap: 'gap-2.5',
    },
    md: {
      box: 'h-11 w-11 rounded-2xl p-2',
      logo: 'h-full w-full',
      labora: 'text-xl font-extrabold tracking-tight leading-none text-foreground',
      vistorias:
        'text-[11px] tracking-[0.24em] font-semibold text-primary/80 uppercase leading-none mt-1',
      gap: 'gap-3',
    },
    lg: {
      box: 'h-13 w-13 rounded-2xl p-2.5',
      logo: 'h-full w-full',
      labora: 'text-2xl font-black tracking-tight leading-none text-foreground',
      vistorias:
        'text-xs tracking-[0.25em] font-bold text-primary/85 uppercase leading-none mt-1.5',
      gap: 'gap-3.5',
    },
  }[size]

  return (
    <div
      className={`group inline-flex items-center ${sizeStyles.gap} select-none transition-transform duration-200 hover:opacity-95 ${className}`}
    >
      <div
        className={`flex ${sizeStyles.box} shrink-0 items-center justify-center bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-xs ring-1 ring-primary/20 transition-all duration-200 group-hover:scale-105 group-hover:shadow-sm group-hover:ring-primary/35`}
      >
        <LaboraLogo
          className={`${sizeStyles.logo} drop-shadow-xs transition-transform duration-200`}
        />
      </div>
      <div className="flex flex-col justify-center text-left">
        <span className={sizeStyles.labora}>LABORA</span>
        <span className={sizeStyles.vistorias}>vistorias</span>
      </div>
    </div>
  )
}
