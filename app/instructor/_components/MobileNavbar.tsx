"use client";

import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  User,
  Bell,
} from "lucide-react";
import { MobileNavbar, type MobileNavItem } from "@/components/mobile-navbar";

const items: MobileNavItem[] = [
  { label: "Panel", href: "/instructor", icon: LayoutDashboard, exact: true },
  { label: "Cursos", href: "/instructor/mis-cursos", icon: BookOpen },
  { label: "Horario", href: "/instructor/horario", icon: CalendarDays },
  { label: "Perfil", href: "/instructor/perfil", icon: User },
  {
    label: "Avisos",
    href: "/instructor/notificaciones",
    icon: Bell,
    badge: true,
  },
];

export default function InstructorMobileNavbar() {
  return (
    <MobileNavbar
      items={items}
      countUrl={`${process.env.API_URL}api/profesor/notificaciones/count`}
      countQueryKey={["instructor", "notificaciones", "count"]}
    />
  );
}
