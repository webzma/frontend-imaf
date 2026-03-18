"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, TrendingUp, ArrowUpRight } from "lucide-react";

interface StatCard {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  href: string;
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ estudiantes: 0, profesores: 0, cursos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    Promise.all([
      fetch("http://localhost:8000/api/admin/estudiantes", { headers }).then((r) => r.json()),
      fetch("http://localhost:8000/api/admin/profesores",  { headers }).then((r) => r.json()),
      fetch("http://localhost:8000/api/admin/cursos",      { headers }).then((r) => r.json()),
    ])
      .then(([est, prof, cur]) => {
        setCounts({
          estudiantes: Array.isArray(est) ? est.length : 0,
          profesores:  Array.isArray(prof) ? prof.length : 0,
          cursos:      Array.isArray(cur)  ? cur.length : 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats: StatCard[] = [
    {
      label: "Estudiantes",
      value: loading ? "—" : counts.estudiantes,
      sub: "registrados en el sistema",
      icon: Users,
      color: "text-primary",
      glow: "bg-primary/15 border-primary/20",
      href: "/admin/estudiantes",
    },
    {
      label: "Profesores",
      value: loading ? "—" : counts.profesores,
      sub: "activos en la plataforma",
      icon: GraduationCap,
      color: "text-sky-400",
      glow: "bg-sky-400/10 border-sky-400/20",
      href: "/admin/profesores",
    },
    {
      label: "Cursos",
      value: loading ? "—" : counts.cursos,
      sub: "disponibles actualmente",
      icon: BookOpen,
      color: "text-emerald-400",
      glow: "bg-emerald-400/10 border-emerald-400/20",
      href: "/admin/cursos",
    },
  ];

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.64_0.29_316/0.08)_0%,transparent_55%)] pointer-events-none" />

      <div className="relative z-10 px-8 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>Resumen general</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Bienvenido al{" "}
            <span className="text-primary">Panel</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Aquí tienes un resumen del estado actual de la plataforma.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="border-border/50 hover:border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.glow}`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {s.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                    {s.sub}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick access */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/50 mb-3">
            Acceso rápido
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Registrar estudiante", href: "/admin/estudiantes", icon: Users },
              { label: "Registrar profesor",   href: "/admin/profesores",  icon: GraduationCap },
              { label: "Crear curso",          href: "/admin/cursos",      icon: BookOpen },
            ].map((a) => (
              <Link key={a.label} href={a.href}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 cursor-pointer group">
                  <a.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {a.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
