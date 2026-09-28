/* Campo de imagem do editor do site: envia para a coleção site_imagens
   (reduz fotos grandes antes), mostra a imagem atual, texto alternativo e
   permite remover (volta ao padrão do bloco). */
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Trash2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { urlImagem, type ImagemSite } from '@/lib/siteConteudo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LARGURA_MAX = 1600
const TAMANHO_SEM_REDUZIR = 2 * 1024 * 1024

async function reduzirImagem(file: File): Promise<File> {
  if (file.type === 'image/gif') return file
  try {
    const bmp = await createImageBitmap(file)
    if (bmp.width <= LARGURA_MAX && file.size <= TAMANHO_SEM_REDUZIR) {
      bmp.close()
      return file
    }
    const escala = Math.min(1, LARGURA_MAX / bmp.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * escala)
    canvas.height = Math.round(bmp.height * escala)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bmp.close()
      return file
    }
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.9),
    )
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

interface Props {
  valor: ImagemSite | null
  onChange: (img: ImagemSite | null) => void
  /** O que aparece no site quando não há imagem. */
  textoVazio: string
}

export default function CampoImagem({ valor, onChange, textoVazio }: Props) {
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const escolher = async (file?: File) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      toast.error('Use uma imagem JPG, PNG, WebP ou GIF')
      return
    }
    setEnviando(true)
    try {
      const pronto = await reduzirImagem(file)
      const form = new FormData()
      form.append('arquivo', pronto)
      form.append('nome', file.name)
      const rec = await pb.collection('site_imagens').create(form)
      onChange({ id: rec.id, arquivo: rec.arquivo as string, alt: valor?.alt || '' })
      toast.success('Imagem enviada')
    } catch (error) {
      toast.error('Não foi possível enviar a imagem', { description: getErrorMessage(error) })
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Imagem</Label>
      {valor ? (
        <img
          src={urlImagem(valor)}
          alt={valor.alt}
          className="max-h-44 rounded-lg border object-contain"
        />
      ) : (
        <p className="text-sm text-muted-foreground">Sem imagem: {textoVazio}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => escolher(e.target.files?.[0])}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-1.5 h-4 w-4" />
          {enviando ? 'Enviando...' : valor ? 'Trocar imagem' : 'Enviar imagem'}
        </Button>
        {valor && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => onChange(null)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Remover imagem
          </Button>
        )}
      </div>
      {valor && (
        <div>
          <Label htmlFor={`alt-${valor.id}`} className="text-xs">
            Descrição da imagem (para leitores de tela e Google)
          </Label>
          <Input
            id={`alt-${valor.id}`}
            value={valor.alt}
            onChange={(e) => onChange({ ...valor, alt: e.target.value })}
            className="mt-1"
          />
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        JPG, PNG, WebP ou GIF, até 5 MB. Fotos grandes são reduzidas automaticamente.
      </p>
    </div>
  )
}
