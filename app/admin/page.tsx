"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BookOpen, TrendingUp, ArrowUpRight, Plus } from "lucide-react";

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
      fetch(`${process.env.API_URL}api/admin/estudiantes`, { headers }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/profesores`,  { headers }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/cursos`,      { headers }).then((r) => r.json()),
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
      color: "text-on-primary-container",
      glow: "bg-primary-container",
      href: "/admin/estudiantes",
    },
    {
      label: "Profesores",
      value: loading ? "—" : counts.profesores,
      sub: "activos en la plataforma",
      icon: GraduationCap,
      color: "text-on-secondary-container",
      glow: "bg-secondary-container",
      href: "/admin/profesores",
    },
    {
      label: "Cursos",
      value: loading ? "—" : counts.cursos,
      sub: "disponibles actualmente",
      icon: BookOpen,
      color: "text-on-primary-container",
      glow: "bg-primary-container/60",
      href: "/admin/cursos",
    },
  ];

  return (
    <div className="relative min-h-full bg-surface">
      {/* Blob decorativo tonal */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-10 py-10 max-w-8xl">

        {/* ── Header ── */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-10 text-primary/70" />
            <span className="font-sans text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
              Resumen general
            </span>
          </div>
          <h1 className="font-serif font-light text-[3.2rem] tight-tracking leading-[1.08] text-on-surface mb-3">
            Bienvenido al Panel
          </h1>
          <p className="font-sans text-sm text-muted-foreground max-w-md">
            Aquí tienes un resumen del estado actual de la plataforma.
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}>
              <div className="bg-surface-container-low hover:bg-surface-container rounded-sm p-6 cursor-pointer group ambient-shadow hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${s.glow}`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <ArrowUpRight className="size-10 text-muted-foreground/30 group-hover:text-primary/80 transition-colors" />
                </div>
                <p className="font-sans text-5xl font-light tight-tracking text-on-surface tabular-nums mb-1">
                  {s.value}
                </p>
                <p className="font-sans text-xs tracking-[0.15em] uppercase text-on-surface/60 font-medium mt-2">
                  {s.label}
                </p>
                <p className="font-sans text-xs text-on-surface/35 mt-0.5">
                  {s.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Acceso rápido ── */}
        <div>
          <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-on-surface/45 font-medium mb-4">
            Acceso rápido
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Registrar estudiante", href: "/admin/estudiantes", icon: Users },
              { label: "Registrar profesor",   href: "/admin/profesores",  icon: GraduationCap },
              { label: "Crear curso",          href: "/admin/cursos",      icon: BookOpen },
            ].map((a) => (
              <Button key={a.label} asChild className="gap-2 w-full h-11">
                <Link href={a.href}>
                  <Plus className="w-4 h-4" />
                  {a.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
