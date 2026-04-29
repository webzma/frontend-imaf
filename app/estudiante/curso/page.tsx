"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Hash,
  GraduationCap,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Calendar,
  DollarSign,
  Users,
  MessageCircle,
  FileText,
  Award,
} from "lucide-react";

/* ── Types ── */

interface MiCursoResponse {
  curso: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    requisitos: string | null;
    precio: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    estado: string;
    limite_cupo: number;
    cupos_restantes: number;
    whatsapp_url: string | null;
    instructor: {
      id: number;
      nombre: string | null;
      especialidad: string | null;
      titulo: string | null;
      departamento: string | null;
    } | null;
  };
  estado_pago: "pendiente" | "aprobado" | "reprobado";
  estado_aprobacion_curso: "pendiente" | "aprobado" | "reprobado";
}

type EstadoKey = "pendiente" | "aprobado" | "reprobado";

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/* ── Sub-components ── */

const estadoConfig: Record<
  EstadoKey,
  { label: string; icon: React.ElementType; cls: string }
> = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  },
  aprobado: {
    label: "Aprobado",
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  reprobado: {
    label: "Reprobado",
    icon: Ban,
    cls: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  },
};

function StatusRow({ label, estado }: { label: string; estado: EstadoKey }) {
  const cfg = estadoConfig[estado] ?? estadoConfig.pendiente;
  const Icon = cfg.icon;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-outline-variant/20 last:border-0">
      <p className="font-sans text-sm text-on-surface">{label}</p>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-semibold ${cfg.cls}`}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    </div>
  );
}

/* ── Page ── */

export default function CursoPage() {
  const [data, setData] = useState<MiCursoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.API_URL}api/estudiante/curso`, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    })
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((json) => setData(json))
      .catch(() => toast.error("Error al cargar el curso"))
      .finally(() => setLoading(false));
  }, []);

  const curso = data?.curso ?? null;

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Mi curso
            </span>
          </div>
          <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface">
            Curso inscrito
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-8">
              <Skeleton className="h-9 w-64 mb-3" />
              <Skeleton className="h-5 w-32 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-8" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-outline-variant/30">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-40 w-full rounded-sm" />
              <Skeleton className="h-40 w-full rounded-sm" />
            </div>
          </div>
        ) : curso ? (
          <div className="space-y-6">
            {/* Main course card */}
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
              <div className="h-1 gradient-primary" />
              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-serif font-light text-4xl text-on-surface mb-3 leading-tight">
                      {curso.nombre}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-on-primary-container bg-primary-container px-3 py-1 rounded-sm">
                      <Hash className="w-3 h-3" />
                      {curso.codigo}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-sm font-semibold shrink-0 ${
                      curso.estado === "activo"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {curso.estado === "activo" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Inactivo
                      </>
                    )}
                  </span>
                </div>

                {curso.descripcion && (
                  <p className="font-sans text-base text-muted-foreground leading-relaxed mb-6">
                    {curso.descripcion}
                  </p>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-outline-variant/30">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">
                        Inicio
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">
                        {formatDate(curso.fecha_inicio)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">
                        Finalización
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">
                        {formatDate(curso.fecha_fin)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">
                        Precio
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">
                        ${parseFloat(curso.precio).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">
                        Cupos
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">
                        {curso.cupos_restantes} disponibles
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estado de inscripción */}
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Award className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Estado de inscripción
                  </h3>
                </div>
                <div>
                  <StatusRow label="Pago" estado={data!.estado_pago} />
                  <StatusRow
                    label="Aprobación del curso"
                    estado={data!.estado_aprobacion_curso}
                  />
                </div>
              </div>

              {/* Instructor */}
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-5">
                  <GraduationCap className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Instructor
                  </h3>
                </div>
                {curso.instructor ? (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                      <span className="font-sans text-base font-bold text-on-primary-container">
                        {getInitials(curso.instructor.nombre)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-light text-xl text-on-surface">
                        {curso.instructor.nombre ?? "Sin nombre"}
                      </p>
                      {curso.instructor.especialidad && (
                        <p className="font-sans text-xs text-primary/70 mt-1 font-medium">
                          {curso.instructor.especialidad}
                        </p>
                      )}
                      {curso.instructor.titulo && (
                        <p className="font-sans text-xs text-muted-foreground mt-0.5 capitalize">
                          {curso.instructor.titulo}
                        </p>
                      )}
                      {curso.instructor.departamento && (
                        <p className="font-sans text-xs text-muted-foreground mt-0.5">
                          Depto. {curso.instructor.departamento}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary-container/60 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-on-primary-container" />
                    </div>
                    <p className="font-sans text-sm text-muted-foreground">
                      Sin instructor asignado
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Requisitos */}
            {curso.requisitos && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Requisitos
                  </h3>
                </div>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {curso.requisitos}
                </p>
              </div>
            )}

            {/* WhatsApp */}
            {curso.whatsapp_url && (
              <a
                href={curso.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-sm px-5 py-4 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-sans text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                    Grupo de WhatsApp del curso
                  </p>
                  <p className="font-sans text-xs text-emerald-700/70 dark:text-emerald-500/70 mt-0.5">
                    Únete para recibir información y actualizaciones
                  </p>
                </div>
              </a>
            )}

            {/* Info note */}
            <div className="flex items-start gap-3 bg-secondary-container/40 rounded-sm px-4 py-3 border border-outline-variant/20">
              <Info className="w-4 h-4 text-on-surface/50 shrink-0 mt-0.5" />
              <p className="font-sans text-sm text-muted-foreground">
                Si necesitas cambiar de curso o tienes alguna consulta sobre tu
                inscripción, comunícate con la administración.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/60 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-on-primary-container" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-light text-2xl text-on-surface mb-2">
                  Sin curso asignado
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  No estás inscrito en ningún curso actualmente. Comunícate con
                  la administración para más información.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
