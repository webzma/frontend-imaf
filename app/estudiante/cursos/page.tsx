"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { fetchPage, PAGE_SIZE } from "@/lib/api";
import {
  BookOpen,
  GraduationCap,
  Hash,
  Star,
  Search,
  Users,
  Sparkles,
  ArrowUpRight,
  SearchX,
} from "lucide-react";

/* ── Types ── */

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: "activo" | "inactivo";
  instructor?: { id: number; name: string } | null;
  estudiantes?: { id: number }[];
}

/* Curso anidado en el perfil del estudiante (api/estudiante/perfil). */
interface PerfilCurso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: string;
  instructor?: {
    id: number;
    user?: { name: string } | null;
  } | null;
}

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

/* ── Featured "Mi curso" Card ── */

function FeaturedCursoCard({ curso }: { curso: Curso }) {
  return (
    <Link
      href={`/estudiante/cursos/${curso.id}`}
      className="group relative block bg-surface-container-lowest rounded-md overflow-hidden ambient-shadow hover:-translate-y-0.5 transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300"
    >
      <div className="absolute inset-0 gradient-primary opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" />
      <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative p-7 md:p-9 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.22em] uppercase text-primary font-bold">
              <Sparkles className="w-3 h-3" />
              Mi curso
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {curso.codigo}
            </span>
          </div>

          <h2 className="font-serif font-light text-3xl md:text-4xl tight-tracking leading-[1.05] text-on-surface">
            {curso.nombre}
          </h2>

          {curso.instructor && (
            <p className="font-sans text-sm text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary/70" />
              Impartido por{" "}
              <span className="text-on-surface/80 font-medium">
                {curso.instructor.name}
              </span>
            </p>
          )}

          {curso.descripcion && (
            <p className="font-sans text-sm text-muted-foreground line-clamp-2 max-w-xl">
              {curso.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-sans text-xs tabular-nums">
              {curso.estudiantes?.length ?? 0}{" "}
              {(curso.estudiantes?.length ?? 0) === 1
                ? "estudiante"
                : "estudiantes"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary group-hover:gap-2.5 transition-[background-color,border-color,color,box-shadow,transform,opacity]">
            Continuar
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Card ── */

function CursoCard({
  curso,
  miCursoId,
}: {
  curso: Curso;
  miCursoId: number | null;
}) {
  const esMiCurso = miCursoId === curso.id;
  const studentCount = curso.estudiantes?.length ?? 0;

  return (
    <div
      className={`group relative bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow hover:-translate-y-1 hover:shadow-xl transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300 flex flex-col h-full ${
        esMiCurso ? "ring-1 ring-primary/50" : ""
      }`}
    >
      <div
        className={`h-[2px] ${esMiCurso ? "gradient-primary" : "bg-outline-variant group-hover:gradient-primary group-hover:bg-transparent transition-colors"}`}
      />

      {esMiCurso && (
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 bg-primary text-primary-foreground font-sans text-[9px] font-bold px-2 py-0.5 rounded-full tracking-[0.15em] uppercase">
          <Sparkles className="w-2.5 h-2.5" />
          Mi curso
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-5">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-on-primary-container bg-primary-container/70 px-2 py-1 rounded-sm">
            <Hash className="w-2.5 h-2.5" />
            {curso.codigo}
          </span>
          <Badge variant="activo" className="gap-1 px-2 py-0.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-success dark:bg-success" />
            Activo
          </Badge>
        </div>

        <h3 className="font-serif font-light text-2xl tight-tracking text-on-surface mb-2 leading-[1.15] group-hover:text-primary transition-colors">
          {curso.nombre}
        </h3>

        {curso.instructor ? (
          <p className="font-sans text-xs text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3 text-primary/70" />
            {curso.instructor.name}
          </p>
        ) : (
          <p className="font-sans text-xs text-muted-foreground italic mb-3">
            Sin instructor asignado
          </p>
        )}

        <p className="font-sans text-sm text-muted-foreground line-clamp-2 flex-1 mb-5">
          {curso.descripcion || (
            <span className="italic text-muted-foreground">
              Sin descripción disponible.
            </span>
          )}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-sans text-xs tabular-nums">
              {studentCount} {studentCount === 1 ? "estudiante" : "estudiantes"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-sans text-xs font-medium text-primary/80 group-hover:text-primary group-hover:gap-1.5 transition-[background-color,border-color,color,box-shadow,transform,opacity]">
            Ver detalle
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Card ── */

function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow flex flex-col">
      <div className="h-[2px] bg-primary-container/40" />
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-sm" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant mt-auto">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */

export default function EstudianteCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [miCursoId, setMiCursoId] = useState<number | null>(null);
  const [perfilCurso, setPerfilCurso] = useState<PerfilCurso | null>(null);
  const [page, setPage] = useState(1);
  const [totalCursos, setTotalCursos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Guarda contra respuestas fuera de orden al navegar rápido entre páginas.
  const latestPageRef = useRef(1);

  const loadCursos = async (pageNum: number, background = false) => {
    latestPageRef.current = pageNum;
    if (!background) setLoading(true);
    try {
      const result = await fetchPage<Curso>(
        `${process.env.API_URL}api/estudiante/cursos`,
        pageNum,
        {
          Authorization: `Bearer ${getCookie("token")}`,
          Accept: "application/json",
        },
      );
      if (latestPageRef.current !== pageNum) return; // respuesta obsoleta
      setCursos(result.items);
      setTotalCursos(result.total);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Error al cargar los cursos");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${getCookie("token")}`,
      Accept: "application/json",
    };

    Promise.all([
      loadCursos(1, true),
      fetch(`${process.env.API_URL}api/estudiante/perfil`, { headers }).then(
        (r) => r.json(),
      ),
    ])
      .then(([, perfil]) => {
        setMiCursoId(perfil?.curso?.id ?? null);
        setPerfilCurso(perfil?.curso ?? null);
      })
      .catch(() => toast.error("Error al cargar los cursos"))
      .finally(() => setLoading(false));
  }, []);

  // La tarjeta destacada «Mi curso» sale del perfil (perfil.curso), así sigue
  // visible aunque el curso no esté en la página actual del catálogo.
  const miCurso = useMemo(() => {
    const fromList = cursos.find((c) => c.id === miCursoId);
    if (fromList) return fromList;
    if (!perfilCurso || perfilCurso.id !== miCursoId) return null;
    return {
      id: perfilCurso.id,
      nombre: perfilCurso.nombre,
      codigo: perfilCurso.codigo,
      descripcion: perfilCurso.descripcion,
      estado: perfilCurso.estado as Curso["estado"],
      instructor: perfilCurso.instructor
        ? {
            id: perfilCurso.instructor.id,
            name: perfilCurso.instructor.user?.name ?? "Instructor",
          }
        : null,
      estudiantes: [],
    } satisfies Curso;
  }, [cursos, miCursoId, perfilCurso]);

  const filtered = useMemo(() => {
    return cursos.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        (c.descripcion?.toLowerCase().includes(q) ?? false) ||
        (c.instructor?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [cursos, search]);

  const hasFilters = search !== "";
  const activos = cursos.filter((c) => c.estado === "activo").length;
  const safePage = Math.min(page, totalPages);

  const stats = [
    {
      label: "Total",
      value: totalCursos,
      icon: BookOpen,
      hint: "en catálogo",
    },
    {
      label: "Activos",
      value: activos,
      icon: Star,
      hint: "disponibles ahora",
    },
    {
      label: "Mi curso",
      value: miCursoId ? 1 : 0,
      icon: GraduationCap,
      hint: miCurso ? miCurso.codigo : "sin asignar",
    },
  ];

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 px-4 md:px-8 py-10 md:py-14 max-w-6xl mx-auto">
        <PageHeader
          icon={BookOpen}
          eyebrow="Plataforma · Cursos"
          title="Cursos disponibles"
          subtitle="Explora el catálogo completo de cursos de la plataforma IMAF y revisa el contenido del que ya formas parte."
          className="mb-12 md:mb-14"
          actions={
            !loading && cursos.length > 0 ? (
              <div className="hidden md:flex items-center gap-2 font-sans text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Catálogo actualizado
              </div>
            ) : undefined
          }
        />

        {/* Featured "Mi curso" */}
        {!loading && miCurso && (
          <div className="mb-10">
            <FeaturedCursoCard curso={miCurso} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 max-w-3xl">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative bg-surface-container-low rounded-sm p-4 md:p-5 ambient-shadow overflow-hidden group"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors pointer-events-none" />
              <div className="relative flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary-container/80">
                  <s.icon className="w-4 h-4 text-on-primary-container" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <p className="font-sans text-3xl md:text-4xl font-light tight-tracking text-on-surface tabular-nums leading-none mb-2">
                  {s.value}
                </p>
              )}
              <div className="flex items-baseline gap-2">
                <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
                  {s.label}
                </p>
                <span className="hidden sm:inline font-sans text-[10px] text-muted-foreground truncate">
                  · {s.hint}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por nombre, código o instructor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (page !== 1) {
                  setPage(1);
                  loadCursos(1, true);
                }
              }}
              className="pl-9 h-11 font-sans text-sm bg-surface-container-low border-transparent focus-visible:bg-surface-container-lowest"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => setSearch("")}
              className="font-sans text-xs text-muted-foreground hover:text-on-surface transition-colors underline underline-offset-2"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                {filtered.length} curso{filtered.length !== 1 ? "s" : ""}
                {hasFilters
                  ? ` encontrado${filtered.length !== 1 ? "s" : ""}`
                  : ""}
              </p>
              {hasFilters && filtered.length !== cursos.length && (
                <p className="font-sans text-[10px] text-muted-foreground">
                  de {cursos.length} totales
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.length === 0 ? (
                hasFilters ? (
                  <EmptyState
                    className="col-span-full"
                    icon={SearchX}
                    title="Sin resultados"
                    description="Ningún curso coincide con los filtros aplicados. Intenta con otros términos."
                    action={
                      <Button variant="outline" onClick={() => setSearch("")}>
                        Limpiar búsqueda
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    className="col-span-full"
                    icon={BookOpen}
                    title="No hay cursos disponibles"
                    description="Aún no hay cursos publicados. Vuelve pronto: la oferta formativa se actualiza cada periodo."
                  />
                )
              ) : (
                filtered.map((curso) => (
                  <Link
                    key={curso.id}
                    href={`/estudiante/cursos/${curso.id}`}
                    className="block h-full"
                  >
                    <CursoCard curso={curso} miCursoId={miCursoId} />
                  </Link>
                ))
              )}
            </div>

            {filtered.length > 0 && totalPages > 1 && (
              <div className="mt-6 bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
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
