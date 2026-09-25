/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import LoadingScreen from '@/components/LoadingScreen'
import ProtectedRoute from '@/components/ProtectedRoute'
import Index from './pages/Index'
import Login from './pages/Login'
import PublicLayout from './components/PublicLayout'
import PublicHome from './pages/PublicHome'
import CalculadoraPublica from './pages/CalculadoraPublica'
import Blog from './pages/Blog'
import ArtigoDetalhe from './pages/ArtigoDetalhe'
import EmBreve from './pages/EmBreve'
import DocumentoLegal from './pages/DocumentoLegal'
import AdminArtigos from './pages/AdminArtigos'
import Empresas from './pages/Empresas'
import EmpresaDetalhe from './pages/EmpresaDetalhe'
import Vistorias from './pages/Vistorias'
import VistoriaDetalhe from './pages/VistoriaDetalhe'
import AuditoriaEFormularios from './pages/AuditoriaEFormularios'
import ModelosVistoria from './pages/ModelosVistoria'
import Formularios from './pages/Formularios'
import BuilderFormulario from './pages/BuilderFormulario'
import PreencherFormulario from './pages/PreencherFormulario'
import Agenda from './pages/Agenda'
import Orcamentos from './pages/Orcamentos'
import ModelosProposta from './pages/ModelosProposta'
import Configuracoes from './pages/Configuracoes'
import Equipe from './pages/Equipe'
import NotFound from './pages/NotFound'
import AdminConsole from './pages/AdminConsole'
import AdminNormas from './pages/AdminNormas'
import TrocarSenha from './pages/TrocarSenha'
import EditorConteudo from './pages/EditorConteudo'
import Layout from './components/Layout'
import { trackPublicPageView } from '@/lib/analytics'
import AvisoCookies from '@/components/AvisoCookies'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

/**
 * Monitor de navegação para rastrear páginas públicas no Google Analytics 4.
 * Rastreia rotas públicas isoladas como /login e rotas sob PublicLayout (/ , /calculadora, /blog, /blog/:slug, etc.)
 * Evita disparar page_view nas rotas do painel/sistema logado.
 */
function PublicAnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    const rotasPublicas = [
      '/',
      '/login',
      '/calculadora',
      '/blog',
      '/em-breve',
      '/termos',
      '/privacidade',
    ]

    const ehRotaPublica =
      rotasPublicas.includes(path) || path.startsWith('/blog/') || path.startsWith('/calculadora')

    if (ehRotaPublica) {
      trackPublicPageView(path + location.search)
    }
  }, [location.pathname, location.search])

  return null
}

const App = () => (
  <BrowserRouter>
    <PublicAnalyticsTracker />
    <AvisoCookies />
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicHome />} />
            <Route path="/calculadora" element={<CalculadoraPublica />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<ArtigoDetalhe />} />
            <Route path="/em-breve" element={<EmBreve />} />
            <Route path="/termos" element={<DocumentoLegal tipo="termos" />} />
            <Route path="/privacidade" element={<DocumentoLegal tipo="privacidade" />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route
              path="/painel"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresas"
              element={
                <ProtectedRoute>
                  <Empresas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresas/:id"
              element={
                <ProtectedRoute>
                  <EmpresaDetalhe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vistorias"
              element={
                <ProtectedRoute>
                  <Vistorias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vistorias/:id"
              element={
                <ProtectedRoute>
                  <VistoriaDetalhe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auditoria-formularios"
              element={
                <ProtectedRoute>
                  <AuditoriaEFormularios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modelos"
              element={
                <ProtectedRoute>
                  <ModelosVistoria />
                </ProtectedRoute>
              }
            />
            <Route
              path="/formularios"
              element={
                <ProtectedRoute>
                  <Formularios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/formularios/novo"
              element={
                <ProtectedRoute>
                  <BuilderFormulario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/formularios/:id/preencher"
              element={
                <ProtectedRoute>
                  <PreencherFormulario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agenda"
              element={
                <ProtectedRoute>
                  <Agenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orcamentos"
              element={
                <ProtectedRoute>
                  <Orcamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orcamentos/modelos"
              element={
                <ProtectedRoute gestorOnly>
                  <ModelosProposta />
                </ProtectedRoute>
              }
            />
            <Route path="/multas" element={<Navigate to="/painel" replace />} />
            <Route
              path="/artigos"
              element={
                <ProtectedRoute adminOnly>
                  <AdminArtigos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipe"
              element={
                <ProtectedRoute gestorOnly>
                  <Equipe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminConsole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/normas"
              element={
                <ProtectedRoute adminOnly>
                  <AdminNormas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trocar-senha"
              element={
                <ProtectedRoute>
                  <TrocarSenha />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conteudo"
              element={
                <ProtectedRoute adminOnly>
                  <EditorConteudo />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES MUST BE ADDED HERE */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
