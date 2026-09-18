import {
  Award,
  BarChart2,
  Bell,
  BookMarked,
  BookOpen,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Crumb } from "@/components/ui/breadcrumb";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Solo activo con coincidencia exacta (para el índice del panel). */
  exact?: boolean;
  /** Muestra el punto de no leídas. */
  badge?: boolean;
}

export interface NavGroup {
  section: string;
  items: NavItem[];
}

/**
 * Navegación del panel, en un solo sitio.
 *
 * La barra lateral, la navegación móvil, el rastro de navegación y la búsqueda
 * global leen de aquí. Antes cada una llevaba su propia lista y los catálogos
 * no aparecían en ninguna: solo se llegaba a ellos por cuatro botones al final
 * del panel de inicio, sin forma de volver desde otra pantalla.
 */
export const ADMIN_NAV: NavGroup[] = [
  {
    section: "General",
    items: [
      { label: "Inicio", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    section: "Gestión",
    items: [
      { label: "Estudiantes", href: "/admin/estudiantes", icon: Users },
      {
        label: "Instructores",
        href: "/admin/instructores",
        icon: GraduationCap,
      },
      { label: "Cursos", href: "/admin/cursos", icon: BookOpen },
      { label: "Horario", href: "/admin/horario", icon: CalendarDays },
      { label: "Pagos", href: "/admin/pagos", icon: CreditCard },
      {
        label: "Notificaciones",
        href: "/admin/notificaciones",
        icon: Bell,
        badge: true,
      },
    ],
  },
  {
    section: "Configuración",
    items: [{ label: "Catálogos", href: "/admin/catalogos", icon: Layers }],
  },
  {
    section: "Analítica",
    items: [{ label: "Reportes", href: "/admin/reportes", icon: BarChart2 }],
  },
];

/* ── Catálogos de instructores ── */

export interface CatalogoSpec {
  /** Segmento en la URL (`?tipo=especialidades`). */
  slug: string;
  title: string;
  singular: string;
  /**
   * Plural del singular. No siempre es +"s": "tipo de contrato" hace "tipos de
   * contrato", y `${singular}s` daba "tipo de contratos".
   */
  plural: string;
  /** Artículo del singular, para redactar mensajes correctos en español. */
  articulo: "el" | "la";
  subtitle: string;
  icon: LucideIcon;
}

export const CATALOGOS: CatalogoSpec[] = [
  {
    slug: "especialidades",
    title: "Especialidades",
    singular: "especialidad",
    plural: "especialidades",
    articulo: "la",
    subtitle: "Áreas de conocimiento que se asignan a cada instructor.",
    icon: BookMarked,
  },
  {
    slug: "departamentos",
    title: "Departamentos",
    singular: "departamento",
    plural: "departamentos",
    articulo: "el",
    subtitle: "Unidades organizativas del instituto.",
    icon: Building2,
  },
  {
    slug: "titulos",
    title: "Títulos",
    singular: "título",
    plural: "títulos",
    articulo: "el",
    subtitle: "Grados académicos que puede acreditar un instructor.",
    icon: Award,
  },
  {
    slug: "tipo-contratos",
    title: "Tipos de contrato",
    singular: "tipo de contrato",
    plural: "tipos de contrato",
    articulo: "el",
    subtitle: "Modalidades de contratación disponibles.",
    icon: FileText,
  },
];

/* ── Rastro de navegación ── */

const ETIQUETAS: Record<string, string> = {
  admin: "Panel",
  estudiantes: "Estudiantes",
  instructores: "Instructores",
  cursos: "Cursos",
  horario: "Horario",
  pagos: "Pagos",
  notificaciones: "Notificaciones",
  reportes: "Reportes",
  catalogos: "Catálogos",
  perfil: "Mi cuenta",
  sesiones: "Sesiones",
  asistencia: "Asistencia",
  nuevo: "Nuevo",
  especialidades: "Especialidades",
  departamentos: "Departamentos",
  titulos: "Títulos",
  "tipo-contratos": "Tipos de contrato",
};

/**
 * Convierte `/admin/cursos/12` en Panel › Cursos › Detalle.
 *
 * Un segmento numérico no tiene nombre hasta que la pantalla carga el
 * registro, así que la página puede sustituir el último tramo con
 * `overrideLast`.
 */
export function breadcrumbsFromPath(
  pathname: string,
  overrideLast?: string,
): Crumb[] {
  const segmentos = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];

  segmentos.forEach((segmento, i) => {
    const href = "/" + segmentos.slice(0, i + 1).join("/");
    const esId = /^\d+$/.test(segmento);
    const label = esId ? "Detalle" : (ETIQUETAS[segmento] ?? segmento);
    crumbs.push({ label, href: esId ? undefined : href });
  });

  if (overrideLast && crumbs.length > 0) {
    crumbs[crumbs.length - 1] = { label: overrideLast };
  }

  return crumbs;
}
