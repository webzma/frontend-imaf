"use client";

import {
  BookOpen,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { MobileNavbar, type MobileNavItem } from "@/components/mobile-navbar";

/**
 * Las cinco tareas más frecuentes. El resto del panel (Horario, Reportes,
 * Catálogos) sigue accesible desde el menú lateral, que en móvil se abre con
 * el botón de la cabecera.
 */
const items: MobileNavItem[] = [
  { label: "Inicio", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Estudiantes", href: "/admin/estudiantes", icon: Users },
  { label: "Instructores", href: "/admin/instructores", icon: GraduationCap },
  { label: "Cursos", href: "/admin/cursos", icon: BookOpen },
  { label: "Pagos", href: "/admin/pagos", icon: CreditCard },
];

export default function AdminMobileNavbar() {
  return <MobileNavbar items={items} />;
}
