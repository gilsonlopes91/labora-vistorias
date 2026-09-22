/* Tela de carregamento oficial com a marca LABORA vistorias.
   Utilizada no boot da aplicação, restauração de sessão de autenticação,
   fallbacks de tela cheia e transições de página inteira. */
import laboraLogoUrl from '@/assets/projeto-labora-engenharia-e-sst-07-83499.png'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  /** Mensagem opcional de contexto abaixo do indicador */
  mensagem?: string
  /** Se deve ocupar a tela inteira (fixed ou min-h-screen) ou a altura do contêiner */
  fullScreen?: boolean
  className?: string
  /** Formato do layout do logo: 'vertical' (destaque tipo splash) ou 'horizontal' */
  layout?: 'vertical' | 'horizontal'
  /** Tamanho do bloco */
  size?: 'md' | 'lg'
}

export function LoadingScreen({
  mensagem = 'Carregando...',
  fullScreen = true,
  className,
  layout = 'vertical',
  size = 'lg',
}: LoadingScreenProps) {
  const isVertical = layout === 'vertical'
  const isLg = size === 'lg'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={mensagem}
      className={cn(
        'flex flex-col items-center justify-center bg-background px-4 select-none',
        fullScreen ? 'fixed inset-0 z-50 min-h-screen w-screen' : 'min-h-[50vh] w-full py-16',
        className,
      )}
    >
      <div className="flex flex-col items-center text-center animate-fade-in">
        {/* Logo Labora com animação suave e sutil de pulso */}
        {isVertical ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'relative flex items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-subtle ring-1 ring-primary/25',
                isLg ? 'h-24 w-24 p-4' : 'h-18 w-18 p-3',
              )}
            >
              {/* Brilho pulsante sutil no fundo do ícone */}
              <div className="absolute inset-0 rounded-3xl bg-primary/10 animate-pulse pointer-events-none" />
              <img
                src={laboraLogoUrl}
                alt="LABORA vistorias"
                className="relative h-full w-full object-contain shrink-0 drop-shadow-xs transition-transform duration-700 ease-in-out"
                loading="eager"
              />
            </div>

            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'font-black tracking-tight text-foreground leading-none',
                  isLg ? 'text-2xl sm:text-3xl' : 'text-xl',
                )}
              >
                LABORA
              </span>
              <span
                className={cn(
                  'font-semibold tracking-[0.28em] uppercase text-primary/85 leading-tight mt-1.5',
                  isLg ? 'text-xs sm:text-sm' : 'text-[11px]',
                )}
              >
                vistorias
              </span>
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center gap-3.5">
            <div
              className={cn(
                'relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-xs ring-1 ring-primary/20',
                isLg ? 'h-14 w-14 p-2.5' : 'h-11 w-11 p-2',
              )}
            >
              <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse pointer-events-none" />
              <img
                src={laboraLogoUrl}
                alt="LABORA vistorias"
                className="relative h-full w-full object-contain shrink-0 drop-shadow-xs"
                loading="eager"
              />
            </div>
            <div className="flex flex-col justify-center text-left">
              <span
                className={cn(
                  'font-black tracking-tight text-foreground leading-none',
                  isLg ? 'text-2xl' : 'text-xl',
                )}
              >
                LABORA
              </span>
              <span
                className={cn(
                  'font-semibold tracking-[0.24em] uppercase text-primary/85 leading-tight mt-1',
                  isLg ? 'text-xs' : 'text-[11px]',
                )}
              >
                vistorias
              </span>
            </div>
          </div>
        )}

        {/* Indicador de carregamento discreto: barra com gradiente primário verde que desliza suavemente */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div
            className="relative h-1.5 w-36 sm:w-44 overflow-hidden rounded-full bg-primary/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-xs" />
            <div
              className="h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent"
              style={{
                animation: 'loading-progress 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              }}
            />
          </div>

          {mensagem && (
            <p className="text-xs font-medium tracking-wide text-muted-foreground animate-pulse">
              {mensagem}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
