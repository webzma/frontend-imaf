"use client";

import { useState, useEffect, use, useMemo } from "react";
import { formatDate, formatTime } from "@/lib/format";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import {
  ArrowLeft,
  Users,
  CalendarDays,
  Clock,
  Loader2,
  Check,
  X,
  Search,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";

/* ── Types ── */

interface Instructor {
  id: number;
  user: { name: string; email: string };
}

interface Estudiante {
  id: number;
  nombre: string;
  cedula: string;
  foto: string | null;
  estado: "activo" | "inactivo" | "graduado";
  estado_pago: "pendiente" | "aprobado" | "reprobado";
  estado_aprobacion_curso: "pendiente" | "aprobado" | "reprobado";
  fecha_inscripcion: string;
  user: { email: string };
}

interface Sesion {
  id: number;
  titulo: string;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: "programada" | "realizada" | "cancelada";
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: "activo" | "inactivo";
  limite_cupo: number;
  cupos_restantes: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  instructor: Instructor | null;
  estudiantes: Estudiante[];
  sesiones: Sesion[];
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
    "Content-Type": "application/json",
  };
}

/* ── Page ── */

export default function CursoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [approving, setApproving] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"estudiantes" | "sesiones">(
    "estudiantes",
  );

  useEffect(() => {
    fetch(`${process.env.API_URL}api/cursos/${id}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Curso) => setCurso(data))
      .catch(() => setError("Error al cargar el curso."))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredEstudiantes = useMemo(() => {
    if (!curso) return [];
    const q = search.toLowerCase();
    return curso.estudiantes.filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.cedula.includes(q),
    );
  }, [curso, search]);

  const handleAprobacion = async (
    estudianteId: number,
    estado: "pendiente" | "aprobado" | "reprobado",
  ) => {
    setApproving(estudianteId);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/profesor/estudiantes/${estudianteId}/aprobacion-curso`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado_aprobacion_curso: estado }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Error al actualizar la aprobación.");
        return;
      }
      setCurso((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          estudiantes: prev.estudiantes.map((e) =>
            e.id === estudianteId
              ? { ...e, estado_aprobacion_curso: estado }
              : e,
          ),
        };
      });
      toast.success("Aprobación actualizada.");
    } catch {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground font-sans text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando curso...
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="px-10 py-10">
        <p className="font-sans text-sm text-danger">
          {error || "Curso no encontrado."}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 font-sans text-sm text-primary hover:underline"
        >
          Volver
        </button>
      </div>
    );
  }

  const inscritos = curso.limite_cupo - curso.cupos_restantes;
  const pendientesAprobacion = curso.estudiantes.filter(
    (e) => e.estado_aprobacion_curso === "pendiente",
  ).length;

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Back */}
        <button
          onClick={() => router.push("/instructor/mis-cursos")}
          className="flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mis Cursos
        </button>

        {/* Course header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Mis Cursos / Detalle
            </span>
          </div>
          <h1 className="font-serif font-light text-3xl md:text-4xl tight-tracking text-on-surface mb-3">
            {curso.nombre}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">
              {curso.codigo}
            </span>
            {curso.fecha_inicio && (
              <span className="flex items-center gap-1.5 font-sans text-sm text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(curso.fecha_inicio)}
                {curso.fecha_fin && ` → ${formatDate(curso.fecha_fin)}`}
              </span>
            )}
            <Badge
              variant={curso.estado as "activo" | "inactivo"}
              className="capitalize"
            >
              {curso.estado}
            </Badge>
          </div>
          {curso.descripcion && (
            <p className="mt-3 font-sans text-sm text-muted-foreground max-w-2xl">
              {curso.descripcion}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-4">
            <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
              Inscritos
            </p>
            <p className="font-sans text-3xl font-light text-on-surface">
              {inscritos}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              de {curso.limite_cupo} cupos
            </p>
          </div>
          <div
            className={`rounded-sm p-4 ${
              pendientesAprobacion > 0
                ? "bg-warning-container"
                : "bg-surface-container-low ambient-shadow"
            }`}
          >
            <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
              Pendientes
            </p>
            <p
              className={`font-sans text-3xl font-light ${
                pendientesAprobacion > 0
                  ? "text-on-warning-container"
                  : "text-on-surface"
              }`}
            >
              {pendientesAprobacion}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              de aprobación
            </p>
          </div>
          <div className="bg-success-container rounded-sm p-4">
            <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
              Aprobados
            </p>
            <p className="font-sans text-3xl font-light text-on-success-container">
              {
                curso.estudiantes.filter(
                  (e) => e.estado_aprobacion_curso === "aprobado",
                ).length
              }
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              curso completado
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-outline-variant">
          <button
            onClick={() => setActiveTab("estudiantes")}
            className={`flex items-center gap-2 px-4 py-2 font-sans text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "estudiantes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-on-surface"
            }`}
          >
            <Users className="w-4 h-4" />
            Estudiantes ({curso.estudiantes.length})
          </button>
          <button
            onClick={() => setActiveTab("sesiones")}
            className={`flex items-center gap-2 px-4 py-2 font-sans text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "sesiones"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-on-surface"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Sesiones ({curso.sesiones.length})
          </button>
        </div>

        {/* Tab: Estudiantes */}
        {activeTab === "estudiantes" && (
          <>
            {curso.estudiantes.length > 0 && (
              <div className="relative mb-4 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background/60 font-sans text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

            {curso.estudiantes.length === 0 ? (
              <div className="bg-surface-container-low rounded-sm ambient-shadow p-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                  <Users className="w-5 h-5 text-on-primary-container" />
                </div>
                <p className="font-sans text-sm text-muted-foreground">
                  No hay estudiantes inscritos aún.
                </p>
              </div>
            ) : filteredEstudiantes.length === 0 ? (
              <div className="bg-surface-container-low rounded-sm ambient-shadow p-8 text-center">
                <p className="font-sans text-sm text-muted-foreground">
                  No se encontraron estudiantes con {search}.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEstudiantes.map((est) => (
                  <div
                    key={est.id}
                    className="bg-surface-container-low rounded-sm ambient-shadow"
                  >
                    {/* Row principal */}
                    <div className="flex items-center gap-4 px-5 pt-4 pb-3">
                      <Avatar
                        src={est.foto}
                        name={est.nombre}
                        size={10}
                        tone="muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-semibold text-on-surface truncate">
                          {est.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">
                            {est.cedula}
                          </span>
                          <Badge
                            variant={
                              est.estado_pago as
                                | "pendiente"
                                | "aprobado"
                                | "reprobado"
                            }
                            className="text-[10px]"
                          >
                            Pago: {est.estado_pago}
                          </Badge>
                        </div>
                      </div>
                      {/* Estado aprobación actual */}
                      <Badge
                        variant={
                          est.estado_aprobacion_curso as
                            | "pendiente"
                            | "aprobado"
                            | "reprobado"
                        }
                        className="capitalize"
                      >
                        {est.estado_aprobacion_curso}
                      </Badge>
                    </div>

                    {/* Acciones de aprobación */}
                    <div className="px-5 pb-3.5 pl-[4.75rem] flex items-center gap-2">
                      <span className="font-sans text-xs text-muted-foreground mr-1">
                        Aprobación del curso:
                      </span>
                      <div className="flex rounded-lg overflow-hidden border border-outline-variant text-xs font-semibold font-sans">
                        <button
                          disabled={
                            approving === est.id ||
                            est.estado_aprobacion_curso === "reprobado"
                          }
                          onClick={() => handleAprobacion(est.id, "reprobado")}
                          className={`flex items-center gap-1 px-3 py-1.5 transition-colors disabled:opacity-50 ${
                            est.estado_aprobacion_curso === "reprobado"
                              ? "bg-danger text-white"
                              : "text-muted-foreground hover:bg-surface-container"
                          }`}
                        >
                          <X className="w-3 h-3" />
                          Reprobado
                        </button>
                        <div className="w-px bg-outline-variant" />
                        <button
                          disabled={
                            approving === est.id ||
                            est.estado_aprobacion_curso === "pendiente"
                          }
                          onClick={() => handleAprobacion(est.id, "pendiente")}
                          className={`flex items-center gap-1 px-3 py-1.5 transition-colors disabled:opacity-50 ${
                            est.estado_aprobacion_curso === "pendiente"
                              ? "bg-warning text-white"
                              : "text-muted-foreground hover:bg-surface-container"
                          }`}
                        >
                          {approving === est.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : null}
                          Pendiente
                        </button>
                        <div className="w-px bg-outline-variant" />
                        <button
                          disabled={
                            approving === est.id ||
                            est.estado_aprobacion_curso === "aprobado"
                          }
                          onClick={() => handleAprobacion(est.id, "aprobado")}
                          className={`flex items-center gap-1 px-3 py-1.5 transition-colors disabled:opacity-50 ${
                            est.estado_aprobacion_curso === "aprobado"
                              ? "bg-success text-white"
                              : "text-muted-foreground hover:bg-surface-container"
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          Aprobado
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab: Sesiones */}
        {activeTab === "sesiones" && (
          <>
            {curso.sesiones.length === 0 ? (
              <div className="bg-surface-container-low rounded-sm ambient-shadow p-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-on-primary-container" />
                </div>
                <p className="font-sans text-sm text-muted-foreground">
                  No hay sesiones registradas aún.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {curso.sesiones.map((sesion) => (
                  <div
                    key={sesion.id}
                    className="bg-surface-container-low rounded-sm ambient-shadow px-5 py-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-on-surface truncate">
                        {sesion.titulo}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(sesion.fecha)}
                        </span>
                        {(sesion.hora_inicio || sesion.hora_fin) && (
                          <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTime(sesion.hora_inicio)}
                            {sesion.hora_fin &&
                              ` – ${formatTime(sesion.hora_fin)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          sesion.estado as
                            | "programada"
                            | "realizada"
                            | "cancelada"
                        }
                        className="capitalize"
                      >
                        {sesion.estado}
                      </Badge>
                      <button
                        onClick={() =>
                          router.push(
                            `/instructor/sesiones/${sesion.id}/asistencia`,
                          )
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-sans text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Asistencia
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
