"use client";

import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  User,
  Bell,
} from "lucide-react";
import { MobileNavbar, type MobileNavItem } from "@/components/mobile-navbar";

const items: MobileNavItem[] = [
  { label: "Inicio", href: "/estudiante", icon: LayoutDashboard, exact: true },
  { label: "Cursos", href: "/estudiante/cursos", icon: BookOpen },
  { label: "Mi curso", href: "/estudiante/curso", icon: GraduationCap },
  { label: "Perfil", href: "/estudiante/perfil", icon: User },
  {
    label: "Avisos",
    href: "/estudiante/notificaciones",
    icon: Bell,
    badge: true,
  },
];

export default function EstudianteMobileNavbar() {
  return (
    <MobileNavbar
      items={items}
      countUrl={`${process.env.API_URL}api/estudiante/notificaciones/count`}
      countQueryKey={["estudiante", "notificaciones", "count"]}
    />
  );
}
