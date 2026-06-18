"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  Users,
  Check,
  X,
  Save,
  Search,
  CheckCheck,
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


/* ── Page ── */

export default function AsistenciaInstructorPage({
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
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.API_URL}api/sesiones/${sesionId}/asistencia`, {
      headers: getAuthHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
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

  const filtered = useMemo(
    () =>
      asistencia.filter(
        (r) =>
          r.nombre.toLowerCase().includes(search.toLowerCase()) ||
          r.cedula.includes(search),
      ),
    [asistencia, search],
  );

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
        `${process.env.API_URL}api/sesiones/${sesionId}/asistencia`,
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
      <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground font-sans text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
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

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[520px] h-[320px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[380px] h-[260px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20">
          <div className="px-4 md:px-10 py-3 max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={() =>
                router.push(`/instructor/cursos/${sesion.curso_id}`)
              }
              className="flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-on-surface transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                Volver a {sesion.curso_nombre}
              </span>
              <span className="sm:hidden">Volver</span>
            </button>

            <div className="flex-1" />

            {total > 0 && (
              <div className="hidden md:flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  {presentes} presentes
                </span>
                <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-rose-500 dark:text-rose-400">
                  <X className="w-3.5 h-3.5" />
                  {total - presentes} ausentes
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-sans text-xs text-muted-foreground tabular-nums">
                    {pct}%
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="gap-2 shrink-0"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        <div className="px-4 md:px-10 py-8 max-w-8xl mx-auto">
          {/* Session header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-3 h-3 text-primary/70" />
              <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
                Asistencia / {sesion.curso_nombre}
              </span>
            </div>
            <h1 className="font-serif font-light text-3xl md:text-4xl tight-tracking text-on-surface mb-3">
              {sesion.titulo}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-sans text-sm text-muted-foreground capitalize">
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
              <Badge variant={sesion.estado as "programada" | "realizada" | "cancelada"} className="capitalize">
                {sesion.estado}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          {total > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-sm p-4">
                <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
                  Presentes
                </p>
                <p className="font-sans text-3xl font-light text-emerald-700 dark:text-emerald-400">
                  {presentes}
                </p>
                <p className="font-sans text-xs text-muted-foreground mt-1">
                  de {total}
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
                  de {total}
                </p>
              </div>
              <div className="bg-primary/5 rounded-sm p-4">
                <p className="font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground font-medium mb-1">
                  Asistencia
                </p>
                <p className="font-sans text-3xl font-light text-primary">
                  {pct}%
                </p>
                <div className="mt-2 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-on-surface/55 font-medium">
                Estudiantes ({total})
              </p>
            </div>

            {total > 0 && (
              <>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o cédula..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background/60 font-sans text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => marcarTodos(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Todos presentes</span>
                  </button>
                  <button
                    onClick={() => marcarTodos(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-medium text-muted-foreground hover:bg-surface-container transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Todos ausentes</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Student list */}
          {total === 0 ? (
            <div className="bg-surface-container-low rounded-sm ambient-shadow p-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <Users className="w-5 h-5 text-on-primary-container" />
              </div>
              <p className="font-sans text-sm text-muted-foreground">
                No hay estudiantes inscritos en este curso.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-low rounded-sm ambient-shadow p-10 flex flex-col items-center gap-3">
              <p className="font-sans text-sm text-muted-foreground">
                No se encontraron estudiantes con {search}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((registro) => (
                <div
                  key={registro.estudiante_id}
                  className={`rounded-sm ambient-shadow transition-all duration-200 ${
                    registro.presente
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-500/25"
                      : "bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-4 px-5 pt-4 pb-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        registro.presente
                          ? "bg-emerald-100 dark:bg-emerald-500/25"
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
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-on-surface truncate">
                        {registro.nombre}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {registro.cedula}
                      </p>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-outline-variant/50 shrink-0 text-xs font-semibold font-sans">
                      <button
                        onClick={() =>
                          setPresente(registro.estudiante_id, false)
                        }
                        className={`flex items-center gap-1.5 px-4 py-2.5 transition-colors ${
                          !registro.presente
                            ? "bg-rose-500 text-white"
                            : "text-muted-foreground hover:bg-surface-container"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        Ausente
                      </button>
                      <div className="w-px bg-outline-variant/50" />
                      <button
                        onClick={() =>
                          setPresente(registro.estudiante_id, true)
                        }
                        className={`flex items-center gap-1.5 px-4 py-2.5 transition-colors ${
                          registro.presente
                            ? "bg-emerald-500 text-white"
                            : "text-muted-foreground hover:bg-surface-container"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Presente
                      </button>
                    </div>
                  </div>
                  <div className="px-5 pb-3.5 pl-[4.75rem]">
                    <input
                      type="text"
                      placeholder="Agregar observación (opcional)..."
                      value={registro.observacion ?? ""}
                      onChange={(e) =>
                        setObservacion(registro.estudiante_id, e.target.value)
                      }
                      className="w-full rounded-md border border-input/50 bg-background/50 px-3 py-1.5 font-sans text-xs placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
