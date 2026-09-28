/* Home pública: apresenta o app (com telas desenhadas a partir do visual
   real ou imagens enviadas pelo editor), a calculadora grátis e o convite
   para a lista de espera. O texto vem do editor (Admin > Textos do site),
   com os textos originais como padrão. */
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useSiteConteudo } from '@/hooks/use-site-conteudo'
import { HOME_PADRAO } from '@/lib/siteConteudo'
import HomeView from '@/components/site/HomeView'

export default function PublicHome() {
  const { isAuthenticated, loading } = useAuth()
  const { conteudo, carregando } = useSiteConteudo('home', HOME_PADRAO)

  if (!loading && isAuthenticated) {
    return <Navigate to="/painel" replace />
  }

  if (carregando) {
    return <div className="min-h-[70vh]" aria-busy="true" />
  }

  return <HomeView conteudo={conteudo} />
}
