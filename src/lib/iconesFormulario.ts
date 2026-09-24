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
  // extras (botão "Mostrar mais")
  Ear,
  Wind,
  Sun,
  Snowflake,
  Waves,
  Radiation,
  Biohazard,
  Skull,
  Siren,
  FireExtinguisher,
  Construction,
  Hammer,
  Drill,
  Pickaxe,
  Shovel,
  Forklift,
  Factory,
  Warehouse,
  Container,
  Fuel,
  Cylinder,
  Plug,
  Cable,
  Lightbulb,
  Fan,
  Glasses,
  Shirt,
  Hand,
  Footprints,
  Brain,
  Stethoscope,
  Syringe,
  Ambulance,
  BriefcaseMedical,
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Microscope,
  TestTube,
  Scale,
  Ruler,
  Timer,
  Recycle,
  Trash2,
  TreePine,
  Tractor,
  Car,
  Anchor,
  Utensils,
  Key,
  DoorOpen,
  Megaphone,
  Radio,
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
  { id: 'calendar-check', label: 'Rotina / Periodicidade', icon: CalendarCheck },

  // ---- Extras: aparecem com o botão "Mostrar mais ícones" ----
  // Agentes físicos, químicos e biológicos
  { id: 'ear', label: 'Audição / Protetor auricular', icon: Ear },
  { id: 'wind', label: 'Ventilação / Poeira', icon: Wind },
  { id: 'sun', label: 'Radiação solar / Céu aberto', icon: Sun },
  { id: 'snowflake', label: 'Frio / Câmara fria', icon: Snowflake },
  { id: 'waves', label: 'Umidade / Ondas', icon: Waves },
  { id: 'radiation', label: 'Radiação ionizante', icon: Radiation },
  { id: 'biohazard', label: 'Risco biológico', icon: Biohazard },
  { id: 'skull', label: 'Tóxico / Perigo à vida', icon: Skull },
  // Emergência e combate a incêndio
  { id: 'siren', label: 'Emergência / Alarme', icon: Siren },
  { id: 'fire-extinguisher', label: 'Extintor / Combate a incêndio', icon: FireExtinguisher },
  { id: 'ambulance', label: 'Primeiros socorros / Resgate', icon: Ambulance },
  { id: 'briefcase-medical', label: 'Kit de primeiros socorros', icon: BriefcaseMedical },
  // Obras, máquinas e ferramentas
  { id: 'construction', label: 'Construção civil / Isolamento', icon: Construction },
  { id: 'hammer', label: 'Ferramentas manuais', icon: Hammer },
  { id: 'drill', label: 'Ferramentas elétricas', icon: Drill },
  { id: 'pickaxe', label: 'Mineração / Escavação', icon: Pickaxe },
  { id: 'shovel', label: 'Escavação / Valas', icon: Shovel },
  { id: 'forklift', label: 'Empilhadeira / Movimentação', icon: Forklift },
  { id: 'tractor', label: 'Trabalho rural / Máquinas agrícolas', icon: Tractor },
  // Instalações e energia
  { id: 'factory', label: 'Indústria / Fábrica', icon: Factory },
  { id: 'warehouse', label: 'Galpão / Armazém', icon: Warehouse },
  { id: 'container', label: 'Contêiner / Espaço confinado', icon: Container },
  { id: 'fuel', label: 'Combustíveis / Abastecimento', icon: Fuel },
  { id: 'cylinder', label: 'Cilindros / Vasos de pressão', icon: Cylinder },
  { id: 'plug', label: 'Tomadas / Energia', icon: Plug },
  { id: 'cable', label: 'Cabos / Instalação elétrica', icon: Cable },
  { id: 'lightbulb', label: 'Iluminação', icon: Lightbulb },
  { id: 'fan', label: 'Ventilação / Climatização', icon: Fan },
  { id: 'door-open', label: 'Saídas de emergência', icon: DoorOpen },
  { id: 'key', label: 'Acesso / Permissão de trabalho', icon: Key },
  // EPI e pessoas
  { id: 'glasses', label: 'Óculos de proteção', icon: Glasses },
  { id: 'shirt', label: 'Vestimenta / Uniforme', icon: Shirt },
  { id: 'hand', label: 'Luvas / Proteção das mãos', icon: Hand },
  { id: 'footprints', label: 'Calçado / Circulação', icon: Footprints },
  { id: 'users', label: 'Equipe / CIPA', icon: Users },
  { id: 'user-check', label: 'Trabalhador / Autorização', icon: UserCheck },
  { id: 'graduation-cap', label: 'Treinamento / Capacitação', icon: GraduationCap },
  { id: 'book-open', label: 'Normas / Procedimentos', icon: BookOpen },
  { id: 'megaphone', label: 'DDS / Comunicação', icon: Megaphone },
  { id: 'radio', label: 'Rádio / Comunicação de campo', icon: Radio },
  // Saúde e ergonomia
  { id: 'brain', label: 'Riscos psicossociais', icon: Brain },
  { id: 'stethoscope', label: 'Exame médico / PCMSO', icon: Stethoscope },
  { id: 'syringe', label: 'Vacinação / Perfurocortantes', icon: Syringe },
  { id: 'utensils', label: 'Refeitório / Alimentação', icon: Utensils },
  // Medição e laboratório
  { id: 'microscope', label: 'Laboratório / Análise', icon: Microscope },
  { id: 'test-tube', label: 'Amostra / Coleta', icon: TestTube },
  { id: 'scale', label: 'Pesagem / Carga manual', icon: Scale },
  { id: 'ruler', label: 'Medidas / Dimensões', icon: Ruler },
  { id: 'timer', label: 'Tempo de exposição', icon: Timer },
  // Meio ambiente e transporte
  { id: 'recycle', label: 'Resíduos / Reciclagem', icon: Recycle },
  { id: 'trash-2', label: 'Descarte / Lixo', icon: Trash2 },
  { id: 'tree-pine', label: 'Área verde / Florestal', icon: TreePine },
  { id: 'car', label: 'Frota / Veículo leve', icon: Car },
  { id: 'anchor', label: 'Portuário / Aquaviário', icon: Anchor },
]

/** Quantos ícones aparecem antes do botão "Mostrar mais ícones". */
export const ICONES_VISIVEIS_INICIO = 32

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
