import {
  ListChecks,
  Volume2,
  Activity,
  Thermometer,
  FlaskConical,
  Zap,
  Cog,
  HardHat,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  FileCheck2,
  Wrench,
  Settings2,
  Droplets,
  Flame,
  Eye,
  Lock,
  Package,
  Boxes,
  Truck,
  Building2,
  Leaf,
  HeartPulse,
  Search,
  Camera,
  MapPin,
  CalendarCheck,
  Gauge,
  type LucideIcon,
} from 'lucide-react'

export interface IconeFormularioOpcao {
  id: string
  label: string
  icon: LucideIcon
}

/**
 * Lista de ícones disponíveis para fichas/formulários de campo.
 * Os 8 primeiros são mantidos estritamente para compatibilidade com fichas existentes.
 * O total conta com 32 ícones focados em Segurança do Trabalho, Vistorias e Auditorias de campo.
 */
export const ICONES_FORMULARIO: IconeFormularioOpcao[] = [
  // 8 originais mantidos na mesma ordem e identificadores
  { id: 'clipboard-list', label: 'Checklist', icon: ListChecks },
  { id: 'volume-2', label: 'Ruído / Som', icon: Volume2 },
  { id: 'activity', label: 'Vibração / Atividade', icon: Activity },
  { id: 'thermometer', label: 'Temperatura / Calor', icon: Thermometer },
  { id: 'flask-conical', label: 'Químico / Amostra', icon: FlaskConical },
  { id: 'zap', label: 'Elétrico / Raio', icon: Zap },
  { id: 'cog', label: 'Maquinário / Mecânica', icon: Cog },
  { id: 'hard-hat', label: 'EPI / Obra', icon: HardHat },

  // Segurança, Risco & Proteção
  { id: 'alert-triangle', label: 'Atenção / Risco', icon: AlertTriangle },
  { id: 'shield', label: 'Segurança / Proteção', icon: Shield },
  { id: 'shield-check', label: 'Conformidade / Segurança', icon: ShieldCheck },
  { id: 'shield-alert', label: 'Alerta de Segurança', icon: ShieldAlert },
  { id: 'flame', label: 'Incêndio / Inflamável', icon: Flame },

  // Inspeção, Auditoria & Documentação
  { id: 'clipboard-check', label: 'Inspeção / Auditoria', icon: ClipboardCheck },
  { id: 'file-text', label: 'Relatório / Procedimento', icon: FileText },
  { id: 'file-check-2', label: 'Ficha Aprovada', icon: FileCheck2 },
  { id: 'search', label: 'Vistoria / Investigação', icon: Search },
  { id: 'camera', label: 'Evidência Fotográfica', icon: Camera },

  // Manutenção, Ferramentas & Medição
  { id: 'wrench', label: 'Manutenção / Ferramenta', icon: Wrench },
  { id: 'settings-2', label: 'Calibração / Ajustes', icon: Settings2 },
  { id: 'gauge', label: 'Pressão / Manômetro', icon: Gauge },
  { id: 'droplets', label: 'Umidade / Líquidos', icon: Droplets },

  // Ergonomia, Saúde & Pessoas
  { id: 'heart-pulse', label: 'Saúde Ocupacional', icon: HeartPulse },
  { id: 'eye', label: 'Proteção Visual / Observação', icon: Eye },

  // Meio Ambiente, Instalações & Logística
  { id: 'leaf', label: 'Meio Ambiente / Sustentabilidade', icon: Leaf },
  { id: 'building-2', label: 'Edificação / Instalação', icon: Building2 },
  { id: 'map-pin', label: 'Localização / Área', icon: MapPin },
  { id: 'lock', label: 'Bloqueio / LOTO', icon: Lock },
  { id: 'package', label: 'Materiais / Cargas', icon: Package },
  { id: 'boxes', label: 'Almoxarifado / Estoque', icon: Boxes },
  { id: 'truck', label: 'Veículos / Transporte', icon: Truck },
  { id: 'calendar-check', label: 'Rotina / Peridiocidade', icon: CalendarCheck },
]

export const MAPA_ICONES_FORMULARIO: Record<string, LucideIcon> = ICONES_FORMULARIO.reduce(
  (acc, item) => {
    acc[item.id] = item.icon
    return acc
  },
  {} as Record<string, LucideIcon>,
)

export const ICONES_FICHA_IDS = ICONES_FORMULARIO.map((item) => item.id)

export function getIconeFormulario(id?: string | null): LucideIcon {
  if (!id) return ListChecks
  return MAPA_ICONES_FORMULARIO[id] || ListChecks
}
