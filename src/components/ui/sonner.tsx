/* Toaster Component - A component that displays a toaster - from shadcn/ui (exposes Toaster) */
import './sonner.css'
import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error:
            '!bg-red-800 !text-white !border-red-900 shadow-xl [&_[data-title]]:!text-white [&_[data-description]]:!text-red-100 [&_[data-icon]]:!text-white',
          success:
            '!bg-green-700 !text-white !border-green-800 shadow-xl [&_[data-title]]:!text-white [&_[data-description]]:!text-green-100 [&_[data-icon]]:!text-white',
          warning:
            '!bg-amber-700 !text-white !border-amber-800 shadow-xl [&_[data-title]]:!text-white [&_[data-description]]:!text-amber-100 [&_[data-icon]]:!text-white',
          info: '!bg-blue-700 !text-white !border-blue-800 shadow-xl [&_[data-title]]:!text-white [&_[data-description]]:!text-blue-100 [&_[data-icon]]:!text-white',
        },
      }}
      icons={{
        error: (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-sm ring-2 ring-white/30">
            <AlertCircle className="h-4 w-4 fill-white text-red-800 stroke-[2.5]" />
          </div>
        ),
        success: (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-sm ring-2 ring-white/30">
            <CheckCircle2 className="h-4 w-4 fill-white text-green-700 stroke-[2.5]" />
          </div>
        ),
        warning: (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-sm ring-2 ring-white/30">
            <AlertTriangle className="h-4 w-4 fill-white text-amber-700 stroke-[2.5]" />
          </div>
        ),
        info: (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-sm ring-2 ring-white/30">
            <Info className="h-4 w-4 text-white stroke-[2.5]" />
          </div>
        ),
        loading: <Loader2 className="h-4 w-4 animate-spin text-current" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
