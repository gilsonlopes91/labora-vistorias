/* Formulário do rodapé no editor do site. */
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RodapeConteudo } from '@/lib/siteConteudo'

interface Props {
  valor: RodapeConteudo
  onChange: (v: RodapeConteudo) => void
}

export default function FormRodape({ valor, onChange }: Props) {
  const campos: { chave: keyof RodapeConteudo; rotulo: string; ajuda?: string; tipo?: string }[] = [
    { chave: 'nome', rotulo: 'Nome' },
    { chave: 'descricao', rotulo: 'Descrição curta' },
    {
      chave: 'email_contato',
      rotulo: 'E-mail de contato',
      tipo: 'email',
      ajuda: 'Aparece no link "Contato" do rodapé. Deixe vazio para esconder o link.',
    },
    {
      chave: 'assinatura',
      rotulo: 'Assinatura de direitos',
      ajuda: 'O ano entra sozinho: © 2026 e o texto abaixo.',
    },
  ]
  return (
    <Card className="space-y-4 rounded-2xl border-none p-5 shadow-subtle">
      <h2 className="text-lg font-bold">Rodapé</h2>
      {campos.map((c) => (
        <div key={c.chave}>
          <Label
            htmlFor={`rodape-${c.chave}`}
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            {c.rotulo}
          </Label>
          <Input
            id={`rodape-${c.chave}`}
            type={c.tipo || 'text'}
            value={valor[c.chave]}
            onChange={(e) => onChange({ ...valor, [c.chave]: e.target.value })}
            className="mt-1.5"
          />
          {c.ajuda && <p className="mt-1 text-[11px] text-muted-foreground">{c.ajuda}</p>}
        </div>
      ))}
    </Card>
  )
}
