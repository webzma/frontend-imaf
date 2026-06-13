"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  CalendarDays,
  ArrowRight,
  Loader2,
  Search,
} from "lucide-react";

/* ── Types ── */

interface CursoResumen {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: "activo" | "inactivo";
  limite_cupo: number;
  cupos_restantes: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface ProfesorMe {
  cursos: CursoResumen[];
}

interface MeResponse {
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
  if (!d) return "—";
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

export default function MisCursosPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState<CursoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<
    "todos" | "activo" | "inactivo"
  >("todos");

  useEffect(() => {
    fetch(`${process.env.API_URL}api/me`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data: MeResponse) => setCursos(data.profesor?.cursos ?? []))
      .catch(() => setError("Error al cargar los cursos."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cursos.filter((c) => {
      const matchSearch =
        c.nombre.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q);
      const matchEstado = filterEstado === "todos" || c.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [cursos, search, filterEstado]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground font-sans text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando cursos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-10 py-10">
        <p className="font-sans text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[520px] h-[320px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[380px] h-[260px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <BookOpen className="size-6 md:size-7 text-primary/70" />
            <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Instructor / Mis Cursos
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl tight-tracking text-on-surface mb-2">
            Mis Cursos
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            {cursos.length} curso{cursos.length !== 1 ? "s" : ""} asignado
            {cursos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Stats rápidas */}
        {cursos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-sm p-4">
              <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
                Activos
              </p>
              <p className="font-sans text-3xl font-light text-emerald-700 dark:text-emerald-400">
                {cursos.filter((c) => c.estado === "activo").length}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-sm ambient-shadow p-4">
              <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
                Total estudiantes
              </p>
              <p className="font-sans text-3xl font-light text-on-surface">
                {cursos.reduce(
                  (sum, c) => sum + (c.limite_cupo - c.cupos_restantes),
                  0,
                )}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-sm ambient-shadow p-4">
              <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
                Cupos disponibles
              </p>
              <p className="font-sans text-3xl font-light text-on-surface">
                {cursos.reduce((sum, c) => sum + c.cupos_restantes, 0)}
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        {cursos.length > 0 && (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar curso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background/60 font-sans text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1">
              {(["todos", "activo", "inactivo"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilterEstado(v)}
                  className={`px-3 py-1.5 rounded-md font-sans text-xs font-medium capitalize transition-colors ${
                    filterEstado === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-container"
                  }`}
                >
                  {v === "todos" ? "Todos" : v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista */}
        {cursos.length === 0 ? (
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-on-primary-container" />
            </div>
            <p className="font-sans text-sm text-muted-foreground">
              Aún no tienes cursos asignados.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-10 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              No se encontraron cursos con ese criterio.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((curso) => {
              const inscritos = curso.limite_cupo - curso.cupos_restantes;
              const pct =
                curso.limite_cupo > 0
                  ? Math.round((inscritos / curso.limite_cupo) * 100)
                  : 0;
              return (
                <button
                  key={curso.id}
                  onClick={() => router.push(`/instructor/cursos/${curso.id}`)}
                  className="w-full text-left bg-surface-container-low rounded-sm ambient-shadow p-5 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-semibold capitalize ${estadoStyle[curso.estado]}`}
                        >
                          {curso.estado}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {curso.codigo}
                        </span>
                      </div>
                      <p className="font-sans text-base font-semibold text-on-surface truncate">
                        {curso.nombre}
                      </p>
                      {curso.descripcion && (
                        <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-1">
                          {curso.descripcion}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {curso.fecha_inicio && (
                          <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(curso.fecha_inicio)}
                            {curso.fecha_fin &&
                              ` → ${formatDate(curso.fecha_fin)}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {inscritos} / {curso.limite_cupo} estudiantes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 mt-1">
                      <div className="text-right">
                        <p className="font-sans text-lg font-light text-primary">
                          {pct}%
                        </p>
                        <p className="font-sans text-[10px] text-muted-foreground">
                          ocupado
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  </div>
                  <div className="mt-3 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
