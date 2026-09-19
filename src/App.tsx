/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import ProtectedRoute from '@/components/ProtectedRoute'
import Index from './pages/Index'
import Login from './pages/Login'
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
            {/* ADD ALL CUSTOM ROUTES MUST BE ADDED HERE */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
