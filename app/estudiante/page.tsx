"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect } from "react";
import { LOCALE, formatDate } from "@/lib/format";
import { clearSession } from "@/lib/session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { ESTILO_CURSO, estadoVisualCurso } from "@/lib/curso-estado";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  User,
  Hash,
  GraduationCap,
  CalendarDays,
  ArrowUpRight,
  Sparkles,
  Mail,
  Phone,
  LayoutDashboard,
  Library,
  Clock,
} from "lucide-react";

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: string;
  fecha_fin?: string | null;
  instructor?: {
    id: number;
    user?: { name: string } | null;
  } | null;
}

interface EstudiantePerfil {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  foto: string | null;
  fecha_inscripcion: string;
  estado: string;
  user: { id: number; name: string; email: string };
  curso: Curso | null;
}

type EstadoAprobacion = "pendiente" | "aprobado" | "reprobado";

interface CursoHistorial {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
  fecha_fin: string | null;
  instructor: string | null;
  fecha_inscripcion: string | null;
  estado_aprobacion_curso: EstadoAprobacion;
  es_actual: boolean;
}

interface SolicitudPendiente {
  pago_id: number;
  curso_id: number;
  codigo: string | null;
  nombre: string | null;
  fecha_solicitud: string | null;
}

interface MisCursosResponse {
  cursos: CursoHistorial[];
  solicitudes_pendientes: SolicitudPendiente[];
}

const APROBACION_LABEL: Record<EstadoAprobacion, string> = {
  pendiente: "En curso",
  aprobado: "Aprobado",
  reprobado: "Reprobado",
};

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function EstudianteDashboard() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<EstudiantePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [misCursos, setMisCursos] = useState<MisCursosResponse | null>(null);

  useEffect(() => {
    fetch(`${process.env.API_URL}api/estudiante/mis-cursos`, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setMisCursos(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${process.env.API_URL}api/estudiante/perfil`, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    })
      .then((r) => {
        if (!r.ok) {
          if (r.status === 401) {
            clearSession();
            window.location.href = "/login";
            return null;
          }
          throw new Error("Error al cargar el perfil");
        }
        return r.json();
      })
      .then((data) => data && setPerfil(data))
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  const firstName = perfil?.nombre?.split(" ")[0] ?? "";
  const estadoMiCurso = perfil?.curso ? estadoVisualCurso(perfil.curso) : null;
  // Sin curso en marcha: el último que terminó, para enlazar su historial.
  const ultimoFinalizado = perfil?.curso
    ? null
    : (misCursos?.cursos.find(
        (c) => estadoVisualCurso(c).clave === "finalizado",
      ) ?? null);
  const estiloMiCurso = ESTILO_CURSO[estadoMiCurso?.clave ?? "activo"];
  const today = new Date().toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 px-4 md:px-8 py-10 md:py-14 max-w-5xl mx-auto">
        {loading ? (
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <LayoutDashboard className="size-6 text-primary/80" />
              <span className="font-sans text-[11px] tracking-[0.24em] uppercase text-primary/80 font-semibold">
                Inicio · {today}
              </span>
            </div>
            <Skeleton className="h-14 w-72" />
          </div>
        ) : (
          <PageHeader
            icon={LayoutDashboard}
            eyebrow={`Inicio · ${today}`}
            title={`${getGreeting()}, ${firstName}`}
            subtitle="Bienvenido a tu espacio académico. Aquí encontrarás el resumen de tu actividad y tu curso actual."
            className="mb-12 md:mb-12"
          />
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10">
          {/* Estado */}
          <div className="relative bg-surface-container-low rounded-sm max-sm:p-3 p-5 ambient-shadow overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors pointer-events-none" />
            <div className="relative">
              <div className="max-sm:w-7 max-sm:h-7 w-9 h-9 rounded-md flex items-center justify-center bg-primary-container/80 max-sm:mb-2 mb-3">
                <Sparkles className="max-sm:w-3.5 max-sm:h-3.5 w-4 h-4 text-on-primary-container" />
              </div>
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold mb-2">
                Estado
              </p>
              {loading ? (
                <Skeleton className="max-sm:h-5 max-sm:w-16 h-6 w-24" />
              ) : (
                <Badge
                  variant={
                    (perfil?.estado ?? "activo") as
                      | "activo"
                      | "inactivo"
                      | "graduado"
                  }
                  className="px-2.5 py-1"
                >
                  {perfil?.estado
                    ? perfil.estado.charAt(0).toUpperCase() +
                      perfil.estado.slice(1)
                    : "—"}
                </Badge>
              )}
            </div>
          </div>

          {/* Cédula */}
          <div className="relative bg-surface-container-low rounded-sm max-sm:p-3 p-5 ambient-shadow overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors pointer-events-none" />
            <div className="relative">
              <div className="max-sm:w-7 max-sm:h-7 w-9 h-9 rounded-md flex items-center justify-center bg-primary-container/80 max-sm:mb-2 mb-3">
                <Hash className="max-sm:w-3.5 max-sm:h-3.5 w-4 h-4 text-on-primary-container" />
              </div>
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold mb-2">
                Cédula
              </p>
              {loading ? (
                <Skeleton className="max-sm:h-5 max-sm:w-20 h-6 w-28" />
              ) : (
                <p className="font-mono max-sm:text-sm text-base text-on-surface tabular-nums">
                  {perfil?.cedula ?? "—"}
                </p>
              )}
            </div>
          </div>

          {/* Inscripción */}
          <div className="relative bg-surface-container-low rounded-sm max-sm:p-3 p-5 ambient-shadow overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors pointer-events-none" />
            <div className="relative">
              <div className="max-sm:w-7 max-sm:h-7 w-9 h-9 rounded-md flex items-center justify-center bg-primary-container/80 max-sm:mb-2 mb-3">
                <CalendarDays className="max-sm:w-3.5 max-sm:h-3.5 w-4 h-4 text-on-primary-container" />
              </div>
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold mb-2">
                Inscripción
              </p>
              {loading ? (
                <Skeleton className="max-sm:h-5 max-sm:w-24 h-6 w-36" />
              ) : (
                <p className="font-sans max-sm:text-xs text-sm text-on-surface font-medium">
                  {perfil ? formatDate(perfil.fecha_inscripcion) : "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Mi Curso (featured) */}
          <Link
            href={
              ultimoFinalizado
                ? `/estudiante/curso?id=${ultimoFinalizado.id}`
                : "/estudiante/curso"
            }
            className="lg:col-span-3 group relative block bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow hover:-translate-y-0.5 transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300"
          >
            <div className="absolute inset-0 gradient-primary opacity-[0.04] group-hover:opacity-[0.08] transition-opacity" />
            <div
              className={cn(
                "absolute top-0 left-0 right-0 h-[2px]",
                estiloMiCurso.franja,
              )}
            />
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="relative p-6 md:p-7 h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Mi Curso
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary group-hover:gap-1.5 transition-[background-color,border-color,color,box-shadow,transform,opacity]">
                  Ver detalle
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-3/4" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : perfil?.curso ? (
                <div className="flex-1 flex flex-col">
                  <h4 className="font-serif font-light text-3xl md:text-4xl tight-tracking text-on-surface mb-3 leading-[1.05]">
                    {perfil.curso.nombre}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-on-primary-container bg-primary-container/70 px-2 py-1 rounded-sm">
                      <Hash className="w-2.5 h-2.5" />
                      {perfil.curso.codigo}
                    </span>
                    {estadoMiCurso && estadoMiCurso.clave !== "activo" && (
                      <Badge
                        variant={estadoMiCurso.clave}
                        className="px-2 py-0.5"
                      >
                        {estadoMiCurso.etiqueta}
                      </Badge>
                    )}
                  </div>
                  {perfil.curso.descripcion && (
                    <p className="font-sans text-sm text-muted-foreground line-clamp-2 mb-5">
                      {perfil.curso.descripcion}
                    </p>
                  )}
                  <div className="mt-auto pt-4 border-t border-outline-variant flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-primary/70" />
                    <span className="font-sans text-xs text-muted-foreground">
                      Impartido por{" "}
                      <span className="text-on-surface/80 font-medium">
                        {perfil.curso.instructor?.user?.name || "Sin asignar"}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary-container/60 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-on-primary-container" />
                  </div>
                  {/* Con el pago en revisión todavía no forma parte del
                      curso, pero debe saber que su solicitud va en camino. */}
                  {misCursos?.solicitudes_pendientes[0] ? (
                    <div className="text-center max-w-xs">
                      <p className="font-serif font-light text-xl text-on-surface mb-1">
                        Solicitud en revisión
                      </p>
                      <p className="font-sans text-sm text-muted-foreground">
                        Tu pago para{" "}
                        <span className="font-medium text-on-surface">
                          {misCursos.solicitudes_pendientes[0].nombre}
                        </span>{" "}
                        está en revisión. Entrarás al curso cuando la
                        administración lo apruebe.
                      </p>
                    </div>
                  ) : ultimoFinalizado ? (
                    <div className="text-center max-w-xs">
                      <p className="font-serif font-light text-xl text-on-surface mb-1">
                        Tu curso finalizó
                      </p>
                      <p className="font-sans text-sm text-muted-foreground">
                        <span className="font-medium text-on-surface">
                          {ultimoFinalizado.nombre}
                        </span>{" "}
                        ya terminó. Ábrelo para ver su resumen y tu certificado.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center max-w-xs">
                      <p className="font-serif font-light text-xl text-on-surface mb-1">
                        Sin curso asignado
                      </p>
                      <p className="font-sans text-sm text-muted-foreground">
                        No estás inscrito en ningún curso actualmente.
                      </p>
                    </div>
                  )}
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push("/estudiante/cursos")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push("/estudiante/cursos");
                      }
                    }}
                    className="font-sans text-xs font-medium text-primary hover:underline underline-offset-4 mt-1 cursor-pointer"
                  >
                    Explorar catálogo →
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Mi Perfil */}
          <Link
            href="/estudiante/perfil"
            className="lg:col-span-2 group bg-surface-container-lowest rounded-sm ambient-shadow p-6 hover:-translate-y-0.5 transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300 block"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary/80" />
                <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                  Mi Perfil
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary group-hover:gap-1.5 transition-[background-color,border-color,color,box-shadow,transform,opacity]">
                Editar
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : perfil ? (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full gradient-primary opacity-30 blur-md" />
                  <Avatar
                    src={perfil.foto}
                    name={perfil.nombre}
                    size={16}
                    className="relative ring-2 ring-primary/10"
                  />
                </div>
                <div>
                  <h4 className="font-serif font-light text-xl text-on-surface tight-tracking">
                    {perfil.nombre}
                  </h4>
                  <p className="font-sans text-xs text-muted-foreground break-all">
                    {perfil.user.email}
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-outline-variant space-y-2.5 text-left">
                  {perfil.telefono && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        Teléfono
                      </span>
                      <span className="font-sans text-xs text-on-surface tabular-nums">
                        {perfil.telefono}
                      </span>
                    </div>
                  )}
                  {perfil.genero && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                        Género
                      </span>
                      <span className="font-sans text-xs text-on-surface capitalize">
                        {perfil.genero}
                      </span>
                    </div>
                  )}
                  {perfil.fecha_nacimiento && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                        Nacimiento
                      </span>
                      <span className="font-sans text-xs text-on-surface">
                        {formatDate(perfil.fecha_nacimiento)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Usuario
                    </span>
                    <span className="font-sans text-xs text-on-surface truncate max-w-[140px]">
                      {perfil.user.name}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </Link>
        </div>

        {/* Mis cursos: historial completo + solicitudes en revisión */}
        {misCursos &&
          (misCursos.cursos.length > 0 ||
            misCursos.solicitudes_pendientes.length > 0) && (
            <section className="mt-6 bg-surface-container-lowest rounded-sm ambient-shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Library className="w-3.5 h-3.5 text-primary/80" />
                <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                  Mis cursos
                </h3>
                <span className="font-sans text-xs text-muted-foreground">
                  · {misCursos.cursos.length}
                </span>
              </div>

              <ul className="divide-y divide-outline-variant">
                {misCursos.solicitudes_pendientes.map((s) => (
                  <li
                    key={`pago-${s.pago_id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-on-surface truncate">
                        {s.nombre ?? "Curso"}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        Solicitud enviada{" "}
                        {s.fecha_solicitud ? formatDate(s.fecha_solicitud) : ""}
                        {" · "}esperando la verificación del pago
                      </p>
                    </div>
                    <Badge variant="pendiente" className="gap-1 px-2.5 py-1">
                      <Clock className="w-3 h-3" />
                      Pago en revisión
                    </Badge>
                  </li>
                ))}

                {misCursos.cursos.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={
                        c.es_actual
                          ? "/estudiante/curso"
                          : `/estudiante/curso?id=${c.id}`
                      }
                      className="group flex flex-wrap items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-sm hover:bg-surface-container-low transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-semibold text-on-surface truncate">
                          {c.nombre}
                          <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">
                            {c.codigo}
                          </span>
                        </p>
                        <p className="font-sans text-xs text-muted-foreground">
                          {c.fecha_inscripcion
                            ? `Inscrito el ${formatDate(c.fecha_inscripcion)}`
                            : "Inscrito"}
                          {c.instructor ? ` · ${c.instructor}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const e = estadoVisualCurso(c);
                          return e.clave === "activo" ? null : (
                            <Badge variant={e.clave} className="px-2.5 py-1">
                              {e.etiqueta}
                            </Badge>
                          );
                        })()}
                        {c.es_actual && (
                          <Badge variant="graduado" className="px-2.5 py-1">
                            Actual
                          </Badge>
                        )}
                        <Badge
                          variant={
                            c.estado_aprobacion_curso === "pendiente"
                              ? "neutral"
                              : c.estado_aprobacion_curso
                          }
                          className="px-2.5 py-1"
                        >
                          {APROBACION_LABEL[c.estado_aprobacion_curso]}
                        </Badge>
                        <ArrowUpRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

        {/* Quick links */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/estudiante/cursos"
              className="group flex items-center justify-between gap-3 bg-surface-container-low rounded-sm px-5 py-4 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-on-primary-container" />
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-on-surface">
                    Catálogo de cursos
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Explora todos los cursos disponibles
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/estudiante/notificaciones"
              className="group flex items-center justify-between gap-3 bg-surface-container-low rounded-sm px-5 py-4 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-on-primary-container" />
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-on-surface">
                    Centro de notificaciones
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Revisa tus avisos recientes
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
