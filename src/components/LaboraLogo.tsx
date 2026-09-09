/* Marca da Labora — escudo octogonal verde com faixas diagonais, igual à identidade visual oficial. */
interface LaboraLogoProps {
  className?: string
  /** Cor das faixas diagonais internas — por padrão acompanha o fundo onde o logo está sendo usado. */
  cutColor?: string
}

export function LaboraLogo({
  className = 'h-7 w-7',
  cutColor = 'hsl(var(--sidebar-background))',
}: LaboraLogoProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="labora-octagon-clip">
          <path d="M30 4H70L96 30V70L70 96H30L4 70V30L30 4Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#labora-octagon-clip)">
        <rect width="100" height="100" fill="hsl(var(--primary))" />
        <rect
          x="-20"
          y="26"
          width="140"
          height="15"
          transform="rotate(-45 50 50)"
          fill={cutColor}
        />
        <rect
          x="-20"
          y="59"
          width="140"
          height="15"
          transform="rotate(-45 50 50)"
          fill={cutColor}
        />
      </g>
    </svg>
  )
}

/** Logo completo — escudo + nome + subtítulo, para telas de destaque como o login. */
export function LaboraLogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <LaboraLogo className="h-16 w-16" cutColor="hsl(var(--background))" />
      <div className="text-center">
        <div className="text-xl font-bold uppercase tracking-wide text-foreground">Labora</div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Engenharia e SST
        </div>
      </div>
    </div>
  )
}
