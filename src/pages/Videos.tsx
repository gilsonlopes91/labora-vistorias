/* Vídeos — página própria, sem vínculo com Documentação SST (Levantamento,
 * Catálogo de agentes, Matrizes de risco). Por enquanto exibe um estado
 * vazio; os vídeos serão adicionados aqui futuramente. */
import { Video } from 'lucide-react'

export default function Videos() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vídeos</h1>
        <p className="text-sm text-muted-foreground">Vídeos e tutoriais em breve.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <Video className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum vídeo disponível ainda.</p>
      </div>
    </div>
  )
}
