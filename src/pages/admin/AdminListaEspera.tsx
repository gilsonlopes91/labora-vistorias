/* Console de contas — inscritos da lista de espera do site, em página própria. */
import AdminNav from '@/components/admin/AdminNav'
import ListaEsperaPanel from '@/components/ListaEsperaPanel'

export default function AdminListaEspera() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Lista de espera</h1>
        <p className="text-sm text-muted-foreground">
          Pessoas que pediram acesso pelo site enquanto o cadastro está fechado.
        </p>
      </div>
      <AdminNav />
      <ListaEsperaPanel />
    </div>
  )
}
