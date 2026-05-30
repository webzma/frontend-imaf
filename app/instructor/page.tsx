"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  GraduationCap,
  ArrowRight,
  Loader2,
  CalendarDays,
} from "lucide-react";

/* ── Types ── */

interface CursoResumen {
  id: number;
  nombre: string;
  codigo: string;
  estado: "activo" | "inactivo";
  limite_cupo: number;
  cupos_restantes: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface ProfesorMe {
  id: number;
  user_id: number;
  especialidad: string | null;
  titulo: string | null;
  cursos: CursoResumen[];
}

interface MeResponse {
  id: number;
  name: string;
  email: string;
  profesor: ProfesorMe;
}

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${getCookie("token")}`,
    Accept: "application/json",
  };
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const estadoStyle: Record<string, string> = {
  activo:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  inactivo: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400",
};

/* ── Page ── */

export default function InstructorDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${process.env.API_URL}api/me`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data: MeResponse) => setMe(data))
      .catch(() => setError("Error al cargar los datos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground font-sans text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando...
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="px-10 py-10">
        <p className="font-sans text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const cursos = me.profesor?.cursos ?? [];
  const totalEstudiantes = cursos.reduce(
    (sum, c) => sum + (c.limite_cupo - c.cupos_restantes),
    0,
  );
  const cursosActivos = cursos.filter((c) => c.estado === "activo").length;

  const firstName = me.name.split(" ")[0];

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[520px] h-[320px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[380px] h-[260px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Panel de Instructor
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl tight-tracking text-on-surface mb-1">
            Bienvenido, {firstName}
          </h1>
          {me.profesor?.especialidad && (
            <p className="font-sans text-sm text-muted-foreground">
              {me.profesor.especialidad}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Cursos
              </p>
            </div>
            <p className="font-sans text-3xl font-light text-on-surface">
              {cursos.length}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              {cursosActivos} activo{cursosActivos !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-surface-container-low rounded-sm ambient-shadow p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Estudiantes
              </p>
            </div>
            <p className="font-sans text-3xl font-light text-on-surface">
              {totalEstudiantes}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              en todos los cursos
            </p>
          </div>

          <div className="bg-primary/5 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-3.5 h-3.5 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Activos
              </p>
            </div>
            <p className="font-sans text-3xl font-light text-primary">
              {cursosActivos}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              de {cursos.length} total
            </p>
          </div>
        </div>

        {/* Cursos recientes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-on-surface/55 font-medium">
                Mis cursos
              </p>
            </div>
            <button
              onClick={() => router.push("/instructor/mis-cursos")}
              className="flex items-center gap-1 font-sans text-xs text-primary hover:underline"
            >
              Ver todos
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {cursos.length === 0 ? (
            <div className="bg-surface-container-low rounded-sm ambient-shadow p-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-on-primary-container" />
              </div>
              <p className="font-sans text-sm text-muted-foreground">
                Aún no tienes cursos asignados.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-sm ambient-shadow overflow-hidden">
              {cursos.slice(0, 5).map((curso, i) => {
                const inscritos = curso.limite_cupo - curso.cupos_restantes;
                return (
                  <button
                    key={curso.id}
                    onClick={() =>
                      router.push(`/instructor/cursos/${curso.id}`)
                    }
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-container transition-colors ${
                      i < Math.min(cursos.length, 5) - 1
                        ? "border-b border-outline-variant/30"
                        : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-on-surface truncate">
                        {curso.nombre}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">
                          {curso.codigo}
                        </span>
                        {curso.fecha_inicio && (
                          <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(curso.fecha_inicio)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-sans text-xs text-muted-foreground">
                        {inscritos}/{curso.limite_cupo}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-semibold capitalize ${estadoStyle[curso.estado]}`}
                      >
                        {curso.estado}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
