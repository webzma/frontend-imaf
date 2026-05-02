"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  Users,
  Check,
  X,
  Save,
} from "lucide-react";

/* ── Types ── */

interface SesionInfo {
  id: number;
  titulo: string;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: "programada" | "realizada" | "cancelada";
  curso_id: number;
  curso_nombre: string;
}

interface RegistroAsistencia {
  estudiante_id: number;
  nombre: string;
  cedula: string;
  presente: boolean;
  observacion: string | null;
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

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatTime(t: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

const estadoSesionStyle: Record<string, string> = {
  programada: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400",
  realizada:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelada: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400",
};

/* ── Page ── */

export default function AsistenciaPage({
  params,
}: {
  params: Promise<{ sesionId: string }>;
}) {
  const { sesionId } = use(params);
  const router = useRouter();

  const [sesion, setSesion] = useState<SesionInfo | null>(null);
  const [asistencia, setAsistencia] = useState<RegistroAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ── Fetch ── */
  useEffect(() => {
    fetch(`${process.env.API_URL}api/admin/sesiones/${sesionId}/asistencia`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setSesion(data.sesion);
        setAsistencia(
          (data.asistencia as RegistroAsistencia[]).map((r) => ({
            ...r,
            observacion: r.observacion ?? "",
          })),
        );
      })
      .catch(() => setError("Error al cargar la asistencia."))
      .finally(() => setLoading(false));
  }, [sesionId]);

  /* ── Derived ── */
  const presentes = asistencia.filter((r) => r.presente).length;
  const total = asistencia.length;
  const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;

  /* ── Handlers ── */
  const setPresente = (estudianteId: number, value: boolean) => {
    setAsistencia((prev) =>
      prev.map((r) =>
        r.estudiante_id === estudianteId ? { ...r, presente: value } : r,
      ),
    );
  };

  const setObservacion = (estudianteId: number, value: string) => {
    setAsistencia((prev) =>
      prev.map((r) =>
        r.estudiante_id === estudianteId ? { ...r, observacion: value } : r,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/sesiones/${sesionId}/asistencia`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            asistencia: asistencia.map((r) => ({
              estudiante_id: r.estudiante_id,
              presente: r.presente,
              observacion: r.observacion || null,
            })),
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Error al guardar la asistencia.");
        return;
      }
      toast.success("Asistencia guardada correctamente.");
    } catch {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const marcarTodos = (presente: boolean) => {
    setAsistencia((prev) => prev.map((r) => ({ ...r, presente })));
  };

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground font-sans text-sm">
        Cargando asistencia...
      </div>
    );
  }

  if (error || !sesion) {
    return (
      <div className="px-10 py-10">
        <p className="text-destructive font-sans text-sm">
          {error || "Sesión no encontrada."}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </div>
    );
  }

  const fechaFmt = new Date(sesion.fecha + "T00:00:00").toLocaleDateString(
    "es-ES",
    { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
  );

  /* ── Render ── */
  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-4xl">
        {/* Back */}
        <button
          onClick={() => router.push(`/admin/cursos/${sesion.curso_id}`)}
          className="flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a {sesion.curso_nombre}
        </button>

        {/* ── Sesión header ── */}
        <div className="bg-surface-container-low rounded-sm p-8 ambient-shadow mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-3 h-3 text-primary/70" />
                <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
                  Asistencia / {sesion.curso_nombre}
                </span>
              </div>
              <h1 className="font-serif font-light text-3xl md:text-4xl tight-tracking text-on-surface mb-3">
                {sesion.titulo}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 font-sans text-sm text-muted-foreground">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {fechaFmt}
                </span>
                {(sesion.hora_inicio || sesion.hora_fin) && (
                  <span className="flex items-center gap-1.5 font-sans text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(sesion.hora_inicio)}
                    {sesion.hora_fin && ` – ${formatTime(sesion.hora_fin)}`}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-xs font-semibold capitalize ${estadoSesionStyle[sesion.estado]}`}
                >
                  {sesion.estado}
                </span>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 shrink-0"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {/* ── Resumen ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-sm p-4">
            <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
              Presentes
            </p>
            <p className="font-sans text-3xl font-light text-emerald-700 dark:text-emerald-400">
              {presentes}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              de {total} estudiantes
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-500/10 rounded-sm p-4">
            <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
              Ausentes
            </p>
            <p className="font-sans text-3xl font-light text-rose-700 dark:text-rose-400">
              {total - presentes}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              de {total} estudiantes
            </p>
          </div>
          <div className="bg-primary/5 rounded-sm p-4">
            <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
              Asistencia
            </p>
            <p className="font-sans text-3xl font-light text-primary">{pct}%</p>
            <div className="mt-2 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Lista de estudiantes ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-on-surface/55 font-medium">
                Estudiantes inscritos ({total})
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => marcarTodos(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Todos presentes
              </button>
              <button
                onClick={() => marcarTodos(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-medium text-muted-foreground hover:bg-surface-container transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Todos ausentes
              </button>
            </div>
          </div>

          {total === 0 ? (
            <div className="bg-surface-container-low rounded-sm p-10 ambient-shadow flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <Users className="w-5 h-5 text-on-primary-container" />
              </div>
              <p className="font-sans text-sm text-muted-foreground">
                No hay estudiantes inscritos en este curso.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-sm ambient-shadow overflow-hidden">
              {asistencia.map((registro, i) => (
                <div
                  key={registro.estudiante_id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    registro.presente
                      ? "bg-emerald-50/60 dark:bg-emerald-500/5"
                      : ""
                  } ${i < asistencia.length - 1 ? "border-b border-outline-variant/30" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      registro.presente
                        ? "bg-emerald-100 dark:bg-emerald-500/20"
                        : "bg-surface-container"
                    }`}
                  >
                    <span
                      className={`font-sans text-xs font-bold ${
                        registro.presente
                          ? "text-emerald-800 dark:text-emerald-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      {getInitials(registro.nombre)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold text-on-surface truncate">
                      {registro.nombre}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {registro.cedula}
                    </p>
                  </div>

                  {/* Observación */}
                  <input
                    type="text"
                    placeholder="Observación..."
                    value={registro.observacion ?? ""}
                    onChange={(e) =>
                      setObservacion(registro.estudiante_id, e.target.value)
                    }
                    className="hidden sm:block w-44 shrink-0 rounded-md border border-input bg-background/60 px-3 py-1.5 font-sans text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
                  />

                  {/* Toggle pill: Ausente | Presente */}
                  <div className="flex rounded-lg overflow-hidden border border-outline-variant/50 shrink-0 text-xs font-semibold font-sans">
                    <button
                      onClick={() => setPresente(registro.estudiante_id, false)}
                      className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                        !registro.presente
                          ? "bg-rose-500 text-white"
                          : "text-muted-foreground hover:bg-surface-container"
                      }`}
                    >
                      <X className="w-3 h-3" />
                      Ausente
                    </button>
                    <div className="w-px bg-outline-variant/50" />
                    <button
                      onClick={() => setPresente(registro.estudiante_id, true)}
                      className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                        registro.presente
                          ? "bg-emerald-500 text-white"
                          : "text-muted-foreground hover:bg-surface-container"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      Presente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Guardar (bottom) ── */}
        {total > 0 && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar asistencia
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
