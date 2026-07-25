"use client";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Bell,
} from "lucide-react";
import { MobileNavbar, type MobileNavItem } from "@/components/mobile-navbar";

/**
 * Las cinco tareas más frecuentes. El resto del panel (Instructores, Horario,
 * Reportes) sigue accesible desde el menú lateral, que en móvil se abre con el
 * botón de la cabecera.
 */
const items: MobileNavItem[] = [
  { label: "Panel", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Estudiantes", href: "/admin/estudiantes", icon: Users },
  { label: "Cursos", href: "/admin/cursos", icon: BookOpen },
  { label: "Pagos", href: "/admin/pagos", icon: CreditCard },
  {
    label: "Avisos",
    href: "/admin/notificaciones",
    icon: Bell,
    badge: true,
  },
];

export default function AdminMobileNavbar() {
  return (
    <MobileNavbar
      items={items}
      countUrl={`${process.env.API_URL}api/admin/notificaciones/count`}
      countQueryKey={["admin", "notificaciones", "count"]}
    />
  );
}
