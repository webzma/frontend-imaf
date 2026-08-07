"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useState, useEffect, useMemo, useRef } from "react";
import { formatDate } from "@/lib/format";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { fetchPage, PAGE_SIZE } from "@/lib/api";
import {
  BookOpen,
  Users,
  CalendarDays,
  ArrowRight,
  Loader2,
  Search,
  SearchX,
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

/* ── Page ── */

export default function MisCursosPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState<CursoResumen[]>([]);
  const [totalCursos, setTotalCursos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<
    "todos" | "activo" | "inactivo"
  >("todos");
  const [page, setPage] = useState(1);

  // Guarda contra respuestas fuera de orden al navegar rápido entre páginas.
  const latestPageRef = useRef(1);

  const loadCursos = async (pageNum: number, background = false) => {
    latestPageRef.current = pageNum;
    if (!background) setLoading(true);
    try {
      const result = await fetchPage<CursoResumen>(
        `${process.env.API_URL}api/profesor/cursos`,
        pageNum,
        getAuthHeaders(),
      );
      if (latestPageRef.current !== pageNum) return; // respuesta obsoleta
      setCursos(result.items);
      setTotalCursos(result.total);
      setTotalPages(result.totalPages);
      setError("");
    } catch {
      setError("Error al cargar los cursos.");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    loadCursos(1);
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

  const safePage = Math.min(page, totalPages);

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
        <p className="font-sans text-sm text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        <PageHeader
          icon={BookOpen}
          eyebrow="Instructor / Mis Cursos"
          title="Mis Cursos"
          subtitle={`${totalCursos} curso${totalCursos !== 1 ? "s" : ""} asignado${totalCursos !== 1 ? "s" : ""}`}
          className="mb-8 md:mb-8"
        />

        {/* Stats rápidas */}
        {cursos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-success-container rounded-sm p-4">
              <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
                Activos
              </p>
              <p className="font-sans text-3xl font-light text-on-success-container">
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                  loadCursos(1, true);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background/60 font-sans text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-1">
              {(["todos", "activo", "inactivo"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setFilterEstado(v);
                    setPage(1);
                    loadCursos(1, true);
                  }}
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
          <div className="bg-surface-container-low rounded-sm ambient-shadow">
            <EmptyState
              icon={BookOpen}
              title="Aún no tienes cursos asignados"
              description="Cuando la coordinación te asigne un curso, aparecerá aquí junto a su horario y su lista de estudiantes."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-low rounded-sm ambient-shadow">
            <EmptyState
              icon={SearchX}
              title="Sin resultados"
              description="Ninguno de tus cursos coincide con esa búsqueda."
              action={
                <Button variant="outline" onClick={() => setSearch("")}>
                  Limpiar búsqueda
                </Button>
              }
            />
          </div>
        ) : (
          <>
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
                    onClick={() =>
                      router.push(`/instructor/cursos/${curso.id}`)
                    }
                    className="w-full text-left bg-surface-container-low rounded-sm ambient-shadow p-5 hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={curso.estado as "activo" | "inactivo"}
                            className="capitalize"
                          >
                            {curso.estado}
                          </Badge>
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
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-3 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {filtered.length > 0 && totalPages > 1 && (
              <div className="mt-3 bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={totalCursos}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => {
                    setPage(p);
                    loadCursos(p);
                  }}
                  itemLabel={["curso", "cursos"]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
