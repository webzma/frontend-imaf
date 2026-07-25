"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect } from "react";
import { formatDateLong } from "@/lib/format";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BookMarked,
  CalendarCheck,
  Sparkles,
  ArrowUpRight,
  Download,
  Loader2,
} from "lucide-react";

/* ── Types ── */

interface TemarioItem {
  id: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
}

interface SesionItem {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "programada" | "realizada" | "cancelada";
}

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
    temario: TemarioItem[];
    sesiones: SesionItem[];
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
  {
    label: string;
    icon: React.ElementType;
    variant: "pendiente" | "aprobado" | "reprobado";
  }
> = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    variant: "pendiente",
  },
  aprobado: {
    label: "Aprobado",
    icon: CheckCircle2,
    variant: "aprobado",
  },
  reprobado: {
    label: "Reprobado",
    icon: Ban,
    variant: "reprobado",
  },
};

function StatusRow({ label, estado }: { label: string; estado: EstadoKey }) {
  const cfg = estadoConfig[estado] ?? estadoConfig.pendiente;

  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant last:border-0">
      <p className="font-sans text-sm text-on-surface font-medium">{label}</p>
      <Badge variant={cfg.variant} className="gap-1.5 px-2.5 py-1">
        {cfg.label}
      </Badge>
    </div>
  );
}

/* ── Page ── */

export default function CursoPage() {
  const [data, setData] = useState<MiCursoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCertificado, setDownloadingCertificado] = useState(false);

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
  const canDownloadCertificate = data?.estado_aprobacion_curso === "aprobado";

  const handleDownloadCertificate = async () => {
    setDownloadingCertificado(true);
    try {
      const response = await fetch(
        `${process.env.API_URL}api/estudiante/certificado`,
        {
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
            Accept: "application/pdf,application/json",
          },
        },
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        const body = contentType.includes("application/json")
          ? await response.json()
          : null;
        throw new Error(
          body?.message || "No se pudo descargar el certificado.",
        );
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? "certificado.pdf";

      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
      toast.success("Certificado descargado correctamente.");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al descargar el certificado.",
      );
    } finally {
      setDownloadingCertificado(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 px-4 md:px-8 py-10 md:py-14 max-w-5xl mx-auto">
        <PageHeader
          icon={BookOpen}
          eyebrow="Mi curso"
          title="Curso inscrito"
          subtitle="Revisa los detalles, el temario, las sesiones y el estado de tu inscripción."
        />

        {loading ? (
          <div className="space-y-5">
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-8">
              <Skeleton className="h-9 w-64 mb-3" />
              <Skeleton className="h-5 w-32 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-8" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-outline-variant">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Skeleton className="h-40 w-full rounded-sm" />
              <Skeleton className="h-40 w-full rounded-sm" />
            </div>
          </div>
        ) : curso ? (
          <div className="space-y-5">
            {/* Hero course card */}
            <div className="relative bg-surface-container-lowest rounded-md overflow-hidden ambient-shadow">
              <div className="absolute inset-0 gradient-primary opacity-[0.05] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

              <div className="relative p-7 md:p-9">
                <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.22em] uppercase text-primary font-bold">
                      <Sparkles className="w-3 h-3" />
                      Mi curso
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-on-primary-container bg-primary-container/70 px-2 py-1 rounded-sm">
                      <Hash className="w-2.5 h-2.5" />
                      {curso.codigo}
                    </span>
                  </div>
                  <Badge
                    variant={curso.estado as "activo" | "inactivo"}
                    className="gap-1.5 px-3 py-1 shrink-0"
                  >
                    {curso.estado === "activo" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-success dark:bg-success" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Inactivo
                      </>
                    )}
                  </Badge>
                </div>

                <h2 className="font-serif font-light text-3xl md:text-5xl tight-tracking text-on-surface mb-4 leading-[1.05]">
                  {curso.nombre}
                </h2>

                {curso.descripcion && (
                  <p className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                    {curso.descripcion}
                  </p>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-outline-variant">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-on-primary-container" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                        Inicio
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface mt-0.5">
                        {formatDateLong(curso.fecha_inicio)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-3.5 h-3.5 text-on-primary-container" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                        Finalización
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface mt-0.5">
                        {formatDateLong(curso.fecha_fin)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-on-primary-container" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                        Precio
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface mt-0.5 tabular-nums">
                        ${parseFloat(curso.precio).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-on-primary-container" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                        Cupos
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface mt-0.5 tabular-nums">
                        {curso.cupos_restantes} disponibles
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Estado de inscripción */}
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
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
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Instructor
                  </h3>
                </div>
                {curso.instructor ? (
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-full gradient-primary opacity-30 blur-md" />
                      <div className="relative w-12 h-12 rounded-full bg-primary-container flex items-center justify-center ring-2 ring-primary/10">
                        <span className="font-sans text-base font-bold text-on-primary-container">
                          {getInitials(curso.instructor.nombre)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-light text-xl text-on-surface tight-tracking leading-tight">
                        {curso.instructor.nombre ?? "Sin nombre"}
                      </p>
                      {curso.instructor.especialidad && (
                        <p className="font-sans text-xs text-primary/80 mt-1.5 font-semibold">
                          {curso.instructor.especialidad}
                        </p>
                      )}
                      {curso.instructor.titulo && (
                        <p className="font-sans text-xs text-muted-foreground mt-1 capitalize">
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

            {canDownloadCertificate && (
              <div className="bg-success-container rounded-sm ambient-shadow px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-semibold text-on-success-container">
                    Tu certificado está disponible
                  </p>
                  <p className="font-sans text-xs text-on-success-container dark:text-success mt-0.5">
                    Descárgalo en PDF para guardarlo o imprimirlo.
                  </p>
                </div>
                <Button
                  onClick={handleDownloadCertificate}
                  disabled={downloadingCertificado}
                  className="font-sans text-sm h-10 text-white dark:text-[#1a1817]"
                >
                  {downloadingCertificado ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar certificado
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Temario */}
            {curso.temario?.length > 0 && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <BookMarked className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Temario · {curso.temario.length} módulos
                  </h3>
                </div>
                <ol className="space-y-1">
                  {[...curso.temario]
                    .sort((a, b) => a.orden - b.orden)
                    .map((item, idx) => (
                      <li
                        key={item.id}
                        className="group flex gap-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low/30 -mx-2 px-2 rounded-sm transition-colors"
                      >
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary-container flex items-center justify-center font-mono text-xs font-bold text-on-primary-container mt-0.5 group-hover:scale-105 transition-transform">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm font-semibold text-on-surface">
                            {item.titulo}
                          </p>
                          {item.descripcion && (
                            <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              </div>
            )}

            {/* Sesiones */}
            {curso.sesiones?.length > 0 && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarCheck className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Sesiones · {curso.sesiones.length}
                  </h3>
                </div>
                <div className="space-y-1">
                  {curso.sesiones.map((sesion) => {
                    const sesionEstado: Record<
                      SesionItem["estado"],
                      {
                        label: string;
                        variant: "programada" | "realizada" | "cancelada";
                        dot: string;
                      }
                    > = {
                      programada: {
                        label: "Programada",
                        variant: "programada",
                        dot: "bg-info",
                      },
                      realizada: {
                        label: "Realizada",
                        variant: "realizada",
                        dot: "bg-success",
                      },
                      cancelada: {
                        label: "Cancelada",
                        variant: "cancelada",
                        dot: "bg-danger",
                      },
                    };
                    const cfg =
                      sesionEstado[sesion.estado] ?? sesionEstado.programada;
                    return (
                      <div
                        key={sesion.id}
                        className="flex flex-col sm:flex-row sm:items-start gap-3 py-3.5 border-b border-outline-variant last:border-0"
                      >
                        <div className="sm:w-44 shrink-0">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <p className="font-sans text-xs font-semibold text-on-surface">
                              {formatDateLong(sesion.fecha)}
                            </p>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground mt-0.5 ml-5">
                            {sesion.hora_inicio} – {sesion.hora_fin}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold text-on-surface">
                            {sesion.titulo}
                          </p>
                          {sesion.descripcion && (
                            <p className="font-sans text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {sesion.descripcion}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={cfg.variant}
                          className="gap-1.5 px-2.5 py-1 text-[10px] shrink-0"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Requisitos */}
            {curso.requisitos && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Requisitos
                  </h3>
                </div>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
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
                className="group flex items-center gap-4 bg-success-container rounded-sm px-5 py-4 hover:bg-success-container dark:hover:bg-success-container transition-colors ambient-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-success-container dark:bg-success-container flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-sans text-sm font-semibold text-on-success-container">
                    Grupo de WhatsApp del curso
                  </p>
                  <p className="font-sans text-xs text-on-success-container dark:text-success mt-0.5">
                    Únete para recibir información y actualizaciones
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-success group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </a>
            )}

            {/* Info note */}
            <div className="flex items-start gap-3 bg-secondary-container/30 rounded-sm px-5 py-4">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                Si necesitas cambiar de curso o tienes alguna consulta sobre tu
                inscripción, comunícate con la administración.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-low/50 rounded-sm p-12 md:p-16">
            <div className="flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-md" />
                <div className="relative w-16 h-16 rounded-full bg-primary-container/70 flex items-center justify-center ring-2 ring-primary/10">
                  <BookOpen className="w-7 h-7 text-on-primary-container" />
                </div>
              </div>
              <div className="text-center max-w-sm">
                <h3 className="font-serif font-light text-2xl tight-tracking text-on-surface mb-2">
                  Sin curso asignado
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  No estás inscrito en ningún curso actualmente. Explora el
                  catálogo para encontrar uno que te interese.
                </p>
              </div>
              <Link
                href="/estudiante/cursos"
                className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:gap-2 transition-[background-color,border-color,color,box-shadow,transform,opacity]"
              >
                Explorar catálogo
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
