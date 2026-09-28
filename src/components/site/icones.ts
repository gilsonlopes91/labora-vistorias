/* Ícones que o editor do site oferece nos recursos da home. A chave (texto)
   é o que fica salvo; o componente é resolvido aqui. */
import {
  Bell,
  Calculator,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cloud,
  FileText,
  Lock,
  MapPin,
  Receipt,
  ShieldCheck,
  Smartphone,
  Star,
  Thermometer,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export const ICONES_SITE: Record<string, { label: string; icon: LucideIcon }> = {
  checklist: { label: 'Checklist', icon: ClipboardCheck },
  calculadora: { label: 'Calculadora', icon: Calculator },
  camera: { label: 'Câmera', icon: Camera },
  arquivo: { label: 'Documento', icon: FileText },
  termometro: { label: 'Termômetro', icon: Thermometer },
  agenda: { label: 'Agenda', icon: CalendarDays },
  orcamento: { label: 'Orçamento', icon: Receipt },
  equipe: { label: 'Equipe', icon: Users },
  escudo: { label: 'Escudo', icon: ShieldCheck },
  celular: { label: 'Celular', icon: Smartphone },
  alerta: { label: 'Aviso', icon: Bell },
  mapa: { label: 'Localização', icon: MapPin },
  relogio: { label: 'Relógio', icon: Clock },
  ok: { label: 'Confirmado', icon: CheckCircle2 },
  raio: { label: 'Raio', icon: Zap },
  cadeado: { label: 'Cadeado', icon: Lock },
  nuvem: { label: 'Nuvem', icon: Cloud },
  estrela: { label: 'Estrela', icon: Star },
}

export function iconeSite(chave: string): LucideIcon {
  return ICONES_SITE[chave]?.icon ?? ClipboardCheck
}
