"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useRef } from "react";
import { formatDate } from "@/lib/format";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { fetchPage, PAGE_SIZE } from "@/lib/api";
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

/* ── Page ── */

export default function InstructorDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [cursos, setCursos] = useState<CursoResumen[]>([]);
  const [totalCursos, setTotalCursos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    } catch {
      setError("Error al cargar los datos.");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    // Perfil (nombre y especialidad) + cursos paginados (10 por petición).
    Promise.all([
      loadCursos(1, true),
      fetch(`${process.env.API_URL}api/me`, { headers: getAuthHeaders() }).then(
        (r) => r.json(),
      ),
    ])
      .then(([, data]) => setMe(data as MeResponse))
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
        <p className="font-sans text-sm text-danger">{error}</p>
      </div>
    );
  }

  // Estadísticas con el set completo (viene del perfil api/me).
  const cursosCompletos = me?.profesor?.cursos ?? [];
  const totalEstudiantes = cursosCompletos.reduce(
    (sum, c) => sum + (c.limite_cupo - c.cupos_restantes),
    0,
  );
  const cursosActivos = cursosCompletos.filter(
    (c) => c.estado === "activo",
  ).length;
  const safePage = Math.min(page, totalPages);

  const firstName = me.name.split(" ")[0];

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        <PageHeader
          icon={GraduationCap}
          eyebrow="Panel de Instructor"
          title={<>Bienvenido, {firstName}</>}
          subtitle={me.profesor?.especialidad}
        />

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
              {totalCursos}
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
              de {totalCursos} total
            </p>
          </div>
        </div>

        {/* Cursos recientes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-medium">
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
              {cursos.map((curso, i) => {
                const inscritos = curso.limite_cupo - curso.cupos_restantes;
                return (
                  <button
                    key={curso.id}
                    onClick={() =>
                      router.push(`/instructor/cursos/${curso.id}`)
                    }
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-container transition-colors ${
                      i < cursos.length - 1
                        ? "border-b border-outline-variant"
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
                      <Badge
                        variant={curso.estado as "activo" | "inactivo"}
                        className="capitalize"
                      >
                        {curso.estado}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}

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
        </div>
      </div>
    </div>
  );
}
