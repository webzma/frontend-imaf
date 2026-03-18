"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, BookOpen, GraduationCap } from "lucide-react";

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
}

interface User {
  name: string;
  email: string;
}

interface Estudiante {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  fecha_inscripcion: string;
  estado: "activo" | "inactivo" | "graduado";
  user: User;
  curso: Curso | null;
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

const estadoStyle: Record<string, string> = {
  activo:   "bg-emerald-500/12 text-emerald-400 border border-emerald-500/25",
  inactivo: "bg-yellow-500/12 text-yellow-400 border border-yellow-500/25",
  graduado: "bg-primary/12 text-primary border border-primary/25",
};

const estadoLabel: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  graduado: "Graduado",
};

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        const token = getCookie("token");
        const res = await fetch("http://localhost:8000/api/admin/estudiantes", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          setError("No se pudo cargar la lista de estudiantes.");
          return;
        }

        const data = await res.json();
        setEstudiantes(data);
      } catch {
        setError("Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchEstudiantes();
  }, []);

  const filtered = estudiantes.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(q) ||
      e.cedula.includes(q) ||
      e.user.email.toLowerCase().includes(q) ||
      (e.curso?.nombre.toLowerCase().includes(q) ?? false)
    );
  });

  const counts = {
    total:    estudiantes.length,
    activos:  estudiantes.filter((e) => e.estado === "activo").length,
    graduados: estudiantes.filter((e) => e.estado === "graduado").length,
  };

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.64_0.29_316/0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-mono">
            <Users className="w-3 h-3" />
            <span>Gestión / Estudiantes</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Estudiantes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Todos los estudiantes registrados en la plataforma.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
          {[
            { label: "Total",     value: counts.total,    icon: Users,          color: "text-primary",      bg: "bg-primary/10 border-primary/20" },
            { label: "Activos",   value: counts.activos,  icon: BookOpen,       color: "text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Graduados", value: counts.graduados, icon: GraduationCap, color: "text-sky-400",      bg: "bg-sky-400/10 border-sky-400/20" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="flex items-center gap-3 py-4 px-4">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground tabular-nums">{loading ? "—" : s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border/50 h-9 text-sm"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            Cargando estudiantes...
          </div>
        ) : error ? (
          <div className="bg-destructive/12 border border-destructive/25 text-destructive text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="px-6 py-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}
                {search ? " encontrado" + (filtered.length !== 1 ? "s" : "") : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                  {search ? "Sin resultados." : "No hay estudiantes registrados."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40">
                        {["Nombre", "Cédula", "Correo", "Curso", "Inscripción", "Estado"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e, i) => (
                        <tr
                          key={e.id}
                          className={`hover:bg-muted/25 transition-colors ${
                            i < filtered.length - 1 ? "border-b border-border/30" : ""
                          }`}
                        >
                          <td className="px-6 py-3.5 font-medium text-foreground whitespace-nowrap">
                            {e.nombre}
                          </td>
                          <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs tracking-wide">
                            {e.cedula}
                          </td>
                          <td className="px-6 py-3.5 text-muted-foreground text-xs">
                            {e.user.email}
                          </td>
                          <td className="px-6 py-3.5">
                            {e.curso ? (
                              <span className="text-foreground">{e.curso.nombre}</span>
                            ) : (
                              <span className="text-muted-foreground/40 italic text-xs">Sin curso</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(e.fecha_inscripcion).toLocaleDateString("es-VE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                estadoStyle[e.estado]
                              }`}
                            >
                              {estadoLabel[e.estado]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
