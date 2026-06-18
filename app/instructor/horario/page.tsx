"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Clock,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import CalendarMonth from "@/app/admin/horario/_components/CalendarMonth";
import CalendarWeek from "@/app/admin/horario/_components/CalendarWeek";
import CalendarDay from "@/app/admin/horario/_components/CalendarDay";
import CalendarAgenda from "@/app/admin/horario/_components/CalendarAgenda";
import type {
  CalendarView,
  CursoRef,
  Sesion,
} from "@/app/admin/horario/_components/types";
import {
  MONTH_LABELS,
  addDays,
  addMonths,
  estadoColor,
  formatHour,
  formatLongDate,
  formatShortDate,
  parseISODate,
  normalizeDate,
  startOfWeek,
} from "@/app/admin/horario/_components/utils";

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

const VIEW_LABELS: Record<CalendarView, string> = {
  mes: "Mes",
  semana: "Semana",
  dia: "Día",
  agenda: "Agenda",
};

const ESTADO_LABEL: Record<string, string> = {
  programada: "Programada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

const noop = () => {};

export default function InstructorHorarioPage() {
  const [view, setView] = useState<CalendarView>("semana");
  const [current, setCurrent] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCurso, setFilterCurso] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const [detail, setDetail] = useState<Sesion | null>(null);

  const apiUrl = process.env.API_URL ?? "";

  const fetchHorario = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}api/profesor/horario`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setSesiones(Array.isArray(d) ? d : (d.data ?? []));
      } else {
        toast.error("No se pudo cargar tu cronograma.");
      }
    } catch {
      toast.error("Error al cargar el cronograma.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchHorario();
  }, [fetchHorario]);

  // Cursos derivados de las sesiones (solo los del instructor)
  const cursos = useMemo<CursoRef[]>(() => {
    const map = new Map<number, CursoRef>();
    for (const s of sesiones) {
      if (s.curso && !map.has(s.curso.id)) map.set(s.curso.id, s.curso);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }, [sesiones]);

  // Filtros
  const filteredSesiones = useMemo(() => {
    return sesiones.filter((s) => {
      if (filterCurso !== "todos" && String(s.curso_id) !== filterCurso)
        return false;
      if (filterEstado !== "todos" && s.estado !== filterEstado) return false;
      return true;
    });
  }, [sesiones, filterCurso, filterEstado]);

  const filteredCursos = useMemo(() => {
    return cursos.filter((c) => {
      if (filterCurso !== "todos" && String(c.id) !== filterCurso) return false;
      return true;
    });
  }, [cursos, filterCurso]);

  // Navegación
  const goToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setCurrent(t);
  };
  const goPrev = () => {
    if (view === "mes" || view === "agenda")
      setCurrent((d) => addMonths(d, -1));
    else if (view === "semana") setCurrent((d) => addDays(d, -7));
    else setCurrent((d) => addDays(d, -1));
  };
  const goNext = () => {
    if (view === "mes" || view === "agenda") setCurrent((d) => addMonths(d, 1));
    else if (view === "semana") setCurrent((d) => addDays(d, 7));
    else setCurrent((d) => addDays(d, 1));
  };

  // Etiqueta del rango actual
  const rangeLabel = useMemo(() => {
    if (view === "mes" || view === "agenda") {
      return `${MONTH_LABELS[current.getMonth()]} ${current.getFullYear()}`;
    }
    if (view === "semana") {
      const start = startOfWeek(current);
      const end = addDays(start, 6);
      return `${formatShortDate(start)} – ${formatShortDate(end)} ${end.getFullYear()}`;
    }
    return formatLongDate(current);
  }, [current, view]);

  const totalProgramadas = sesiones.filter(
    (s) => s.estado === "programada",
  ).length;
  const totalRealizadas = sesiones.filter(
    (s) => s.estado === "realizada",
  ).length;

  const detailColor = detail ? estadoColor(detail.estado) : null;

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="size-6 md:size-10 text-primary/70" />
            <span className="font-sans text-xs md:text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
              Mi trabajo / Cronograma
            </span>
          </div>
          <h1 className="font-serif font-light text-[3.2rem] tight-tracking leading-[1.08] text-on-surface mb-2">
            Mi Cronograma
          </h1>
          <p className="font-sans text-sm text-muted-foreground max-w-md">
            Consulta tus clases asignadas por día y hora.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5 mb-8 max-w-2xl">
          {[
            {
              label: "Total",
              value: sesiones.length,
              glow: "bg-primary-container",
              color: "text-on-primary-container",
            },
            {
              label: "Programadas",
              value: totalProgramadas,
              glow: "bg-secondary-container",
              color: "text-on-secondary-container",
            },
            {
              label: "Realizadas",
              value: totalRealizadas,
              glow: "bg-emerald-100 dark:bg-emerald-500/15",
              color: "text-emerald-800 dark:text-emerald-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low rounded-sm p-5 ambient-shadow"
            >
              <div
                className={`w-9 md:w-10 h-9 md:h-10 rounded-md flex items-center justify-center ${s.glow} mb-4`}
              >
                <CalendarDays className={`w-4 md:w-5 h-4 md:h-5 ${s.color}`} />
              </div>
              <p className="font-sans text-2xl md:text-4xl font-light tight-tracking text-on-surface tabular-nums mb-1">
                {s.value}
              </p>
              <p className="font-sans text-xs truncate tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoy
            </Button>
            <button
              onClick={goPrev}
              className="w-9 h-9 inline-flex items-center justify-center rounded-sm hover:bg-surface-container-low text-on-surface/70 hover:text-on-surface transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="w-9 h-9 inline-flex items-center justify-center rounded-sm hover:bg-surface-container-low text-on-surface/70 hover:text-on-surface transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="font-serif text-2xl font-light tight-tracking text-on-surface ml-2 capitalize">
              {rangeLabel}
            </p>
          </div>

          {/* View switch */}
          <div className="inline-flex items-center bg-surface-container-low rounded-sm p-0.5 ambient-shadow">
            {(["mes", "semana", "dia", "agenda"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-sm font-sans text-xs font-semibold transition-colors ${
                  view === v
                    ? "bg-primary text-on-primary"
                    : "text-on-surface/60 hover:text-on-surface"
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Select value={filterCurso} onValueChange={setFilterCurso}>
            <SelectTrigger className="h-9 w-56 font-sans text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos mis cursos</SelectItem>
              {cursos.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.codigo} — {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="h-9 w-40 font-sans text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="programada">Programadas</SelectItem>
              <SelectItem value="realizada">Realizadas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vistas (solo lectura: ver detalle al hacer clic) */}
        {loading ? (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
          </div>
        ) : view === "mes" ? (
          <CalendarMonth
            current={current}
            sesiones={filteredSesiones}
            cursos={filteredCursos}
            showCursoRanges={false}
            onCreate={noop}
            onEdit={setDetail}
            onMove={noop}
          />
        ) : view === "semana" ? (
          <CalendarWeek
            current={current}
            sesiones={filteredSesiones}
            onCreate={noop}
            onEdit={setDetail}
            onMove={noop}
          />
        ) : view === "dia" ? (
          <CalendarDay
            current={current}
            sesiones={filteredSesiones}
            cursos={filteredCursos}
            showCursoRanges={false}
            onCreate={noop}
            onEdit={setDetail}
            onMove={noop}
          />
        ) : (
          <CalendarAgenda
            current={current}
            sesiones={filteredSesiones}
            onEdit={setDetail}
          />
        )}
      </div>

      {/* Detalle de sesión (solo lectura) */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif font-light text-2xl text-on-surface">
                  {detail.titulo}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detalle de la sesión
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 pt-2">
                {detailColor && (
                  <span
                    className={`inline-flex self-start items-center gap-1.5 px-2.5 py-0.5 rounded-full font-sans text-[11px] font-semibold ${detailColor.bg} ${detailColor.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${detailColor.dot}`}
                    />
                    {ESTADO_LABEL[detail.estado] ?? detail.estado}
                  </span>
                )}

                <div className="flex items-center gap-2 text-sm text-on-surface">
                  <CalendarDays className="w-4 h-4 text-on-surface/45" />
                  <span className="capitalize">
                    {formatLongDate(parseISODate(normalizeDate(detail.fecha)))}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-on-surface">
                  <Clock className="w-4 h-4 text-on-surface/45" />
                  <span className="tabular-nums">
                    {detail.hora_inicio
                      ? formatHour(detail.hora_inicio)
                      : "Todo el día"}
                    {detail.hora_fin &&
                      detail.hora_inicio &&
                      ` – ${formatHour(detail.hora_fin)}`}
                  </span>
                </div>

                {detail.curso && (
                  <div className="flex items-start gap-2 text-sm text-on-surface">
                    <BookOpen className="w-4 h-4 text-on-surface/45 mt-0.5" />
                    <span>
                      <span className="font-mono font-semibold text-primary/70">
                        {detail.curso.codigo}
                      </span>{" "}
                      · {detail.curso.nombre}
                    </span>
                  </div>
                )}

                {detail.curso?.instructor?.user?.name && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <GraduationCap className="w-4 h-4 text-on-surface/45" />
                    <span>{detail.curso.instructor.user.name}</span>
                  </div>
                )}

                {detail.descripcion && (
                  <p className="font-sans text-sm text-muted-foreground border-t border-outline-variant/30 pt-3">
                    {detail.descripcion}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
