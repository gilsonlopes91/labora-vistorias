/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import ProtectedRoute from '@/components/ProtectedRoute'
import Index from './pages/Index'
import Login from './pages/Login'
import PublicLayout from './components/PublicLayout'
import PublicHome from './pages/PublicHome'
import CalculadoraPublica from './pages/CalculadoraPublica'
import Blog from './pages/Blog'
import Empresas from './pages/Empresas'
import Vistorias from './pages/Vistorias'
import VistoriaDetalhe from './pages/VistoriaDetalhe'
import ModelosVistoria from './pages/ModelosVistoria'
import Formularios from './pages/Formularios'
import BuilderFormulario from './pages/BuilderFormulario'
import PreencherFormulario from './pages/PreencherFormulario'
import Agenda from './pages/Agenda'
import Configuracoes from './pages/Configuracoes'
import Equipe from './pages/Equipe'
import NotFound from './pages/NotFound'
import AdminConsole from './pages/AdminConsole'
import TrocarSenha from './pages/TrocarSenha'
import EditorConteudo from './pages/EditorConteudo'
import Layout from './components/Layout'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicHome />} />
            <Route path="/calculadora" element={<CalculadoraPublica />} />
            <Route path="/blog" element={<Blog />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route
              path="/"
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
                <ProtectedRoute>
                  <Equipe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminConsole />
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
                <ProtectedRoute>
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
