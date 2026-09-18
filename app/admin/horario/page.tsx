"use client";

import { PageHeader } from "@/components/page-header";
import { useCallback, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorState } from "@/components/error-state";
import { apiFetch, fetchAll, mensajeDeError } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Loader2,
} from "lucide-react";
import CalendarMonth from "./_components/CalendarMonth";
import CalendarWeek from "./_components/CalendarWeek";
import CalendarDay from "./_components/CalendarDay";
import CalendarAgenda from "./_components/CalendarAgenda";
import SesionDialog from "./_components/SesionDialog";
import type {
  CalendarView,
  CursoRef,
  InstructorRef,
  Sesion,
} from "./_components/types";
import {
  MONTH_LABELS,
  addDays,
  addMonths,
  ESTADO_LABEL,
  estadoColor,
  formatLongDate,
  formatShortDate,
  normalizeDate,
  parseISODate,
  startOfMonth,
  startOfWeek,
  toISODate,
} from "./_components/utils";

const VIEW_LABELS: Record<CalendarView, string> = {
  mes: "Mes",
  semana: "Semana",
  dia: "Día",
  agenda: "Agenda",
};

export default function HorarioPage() {
  const [view, setView] = useState<CalendarView>("mes");
  const [current, setCurrent] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showCursoRanges, setShowCursoRanges] = useState(true);

  const [filterCurso, setFilterCurso] = useState<string>("todos");
  const [filterInstructor, setFilterInstructor] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sesion | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [defaultHora, setDefaultHora] = useState<string>("");

  const queryClient = useQueryClient();

  /**
   * Las tres listas, en paralelo y cacheadas.
   *
   * Los desplegables de curso e instructor pedían su endpoint sin `per_page`,
   * que devuelve diez registros: filtrar por el curso número once era
   * imposible y el diálogo de sesión tampoco lo ofrecía. `fetchAll` trae el
   * catálogo completo.
   */
  const [consultaSesiones, consultaCursos, consultaInstructores] = useQueries({
    queries: [
      {
        queryKey: adminKeys.horario(),
        queryFn: async () => {
          const d = await apiFetch<Sesion[] | { data?: Sesion[] }>(
            "api/admin/horario",
          );
          return Array.isArray(d) ? d : (d.data ?? []);
        },
      },
      {
        queryKey: adminKeys.opciones("cursos"),
        queryFn: () => fetchAll<CursoRef>("api/admin/cursos"),
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: adminKeys.opciones("profesores"),
        queryFn: () => fetchAll<InstructorRef>("api/admin/profesores"),
        staleTime: 5 * 60 * 1000,
      },
    ],
  });

  const sesiones = useMemo(
    () => consultaSesiones.data ?? [],
    [consultaSesiones.data],
  );
  const cursos = useMemo(
    () => consultaCursos.data ?? [],
    [consultaCursos.data],
  );
  const instructores = useMemo(
    () => consultaInstructores.data ?? [],
    [consultaInstructores.data],
  );
  const loading =
    consultaSesiones.isLoading ||
    consultaCursos.isLoading ||
    consultaInstructores.isLoading;

  // Sin el horario no hay pantalla; que falle un catálogo solo vacía un filtro.
  const errorCarga = consultaSesiones.error;
  const recargar = () => {
    consultaSesiones.refetch();
    consultaCursos.refetch();
    consultaInstructores.refetch();
  };

  /** Escribe en la caché de sesiones; sustituye al `setSesiones` de antes. */
  const setSesiones = useCallback(
    (actualizar: (prev: Sesion[]) => Sesion[]) =>
      queryClient.setQueryData<Sesion[]>(adminKeys.horario(), (prev) =>
        actualizar(prev ?? []),
      ),
    [queryClient],
  );

  // Aplica filtros
  const filteredSesiones = useMemo(() => {
    return sesiones.filter((s) => {
      if (filterCurso !== "todos" && String(s.curso_id) !== filterCurso)
        return false;
      if (
        filterInstructor !== "todos" &&
        String(s.curso?.instructor?.id ?? "") !== filterInstructor
      )
        return false;
      if (filterEstado !== "todos" && s.estado !== filterEstado) return false;
      return true;
    });
  }, [sesiones, filterCurso, filterInstructor, filterEstado]);

  const filteredCursos = useMemo(() => {
    return cursos.filter((c) => {
      if (filterCurso !== "todos" && String(c.id) !== filterCurso) return false;
      if (
        filterInstructor !== "todos" &&
        String(c.instructor?.id ?? "") !== filterInstructor
      )
        return false;
      return true;
    });
  }, [cursos, filterCurso, filterInstructor]);

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

  // Acciones del calendario
  const openCreate = (date: string, hora?: string) => {
    setEditing(null);
    setDefaultDate(date);
    setDefaultHora(hora ?? "");
    setDialogOpen(true);
  };

  const openEdit = (sesion: Sesion) => {
    setEditing(sesion);
    setDialogOpen(true);
  };

  const handleSaved = (saved: Sesion) => {
    setSesiones((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleDeleted = (id: number) => {
    setSesiones((prev) => prev.filter((s) => s.id !== id));
  };

  // Drag & drop -> mover sesión a otra fecha
  const handleMove = async (sesionId: number, newDate: string) => {
    const sesion = sesiones.find((s) => s.id === sesionId);
    if (!sesion || normalizeDate(sesion.fecha) === newDate) return;

    const previous = sesion.fecha;
    setSesiones((prev) =>
      prev.map((s) => (s.id === sesionId ? { ...s, fecha: newDate } : s)),
    );

    try {
      const updated = await apiFetch<Sesion>(`api/admin/sesiones/${sesionId}`, {
        method: "PUT",
        body: { fecha: newDate },
      });
      setSesiones((prev) => prev.map((s) => (s.id === sesionId ? updated : s)));
      toast.success("Sesión reprogramada");
    } catch (e) {
      // Se deshace el movimiento optimista: la sesión vuelve a su día.
      setSesiones((prev) =>
        prev.map((s) => (s.id === sesionId ? { ...s, fecha: previous } : s)),
      );
      toast.error(mensajeDeError(e, "No se pudo mover la sesión."));
    }
  };

  // Rango de fechas visible según la vista actual (fin exclusivo)
  const visibleRange = useMemo(() => {
    if (view === "semana") {
      const start = startOfWeek(current);
      return { start, end: addDays(start, 7) };
    }
    if (view === "dia") {
      return { start: current, end: addDays(current, 1) };
    }
    return { start: startOfMonth(current), end: addMonths(current, 1) };
  }, [view, current]);

  const sesionesEnRango = useMemo(() => {
    const desde = toISODate(visibleRange.start);
    const hasta = toISODate(visibleRange.end);
    return filteredSesiones.filter((s) => {
      const f = normalizeDate(s.fecha);
      return f >= desde && f < hasta;
    });
  }, [filteredSesiones, visibleRange]);

  // Sesión más cercana a la fecha visible (para orientar cuando el rango está vacío)
  const sesionMasCercana = useMemo(() => {
    if (filteredSesiones.length === 0) return null;
    const ref = current.getTime();
    return [...filteredSesiones].sort((a, b) => {
      const da = Math.abs(parseISODate(normalizeDate(a.fecha)).getTime() - ref);
      const db = Math.abs(parseISODate(normalizeDate(b.fecha)).getTime() - ref);
      return da - db;
    })[0];
  }, [filteredSesiones, current]);

  const goToSesion = (fecha: string) => {
    setCurrent(parseISODate(normalizeDate(fecha)));
  };

  const hayFiltros =
    filterCurso !== "todos" ||
    filterInstructor !== "todos" ||
    filterEstado !== "todos";

  const showDay = (date: string) => {
    setCurrent(parseISODate(date));
    setView("dia");
  };

  const clearFilters = () => {
    setFilterCurso("todos");
    setFilterInstructor("todos");
    setFilterEstado("todos");
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

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        <PageHeader
          icon={CalendarDays}
          eyebrow="Planificación / Horario"
          title="Horario"
          subtitle="Planifica y gestiona las sesiones de todos los cursos."
          className="mb-8 md:mb-8"
          actions={
            <Button
              className="gap-2"
              onClick={() => openCreate(toISODate(current))}
            >
              <Plus className="w-4 h-4" />
              Nueva sesión
            </Button>
          }
        />

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
              glow: "bg-success-container",
              color: "text-on-success-container",
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
              <p className="font-sans text-xs truncate tracking-[0.15em] uppercase text-muted-foreground font-semibold">
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
              className="w-9 h-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              className="w-9 h-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <h2
              aria-live="polite"
              className="font-serif text-2xl md:text-3xl font-light tight-tracking text-on-surface ml-1 capitalize"
            >
              {rangeLabel}
            </h2>
          </div>

          {/* View switch */}
          <div
            role="group"
            aria-label="Vista del calendario"
            className="inline-flex items-center bg-surface-container-low border border-border rounded-md p-1"
          >
            {(["mes", "semana", "dia", "agenda"] as CalendarView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-3 md:px-4 py-1.5 rounded-sm font-sans text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  view === v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-x-4 gap-y-3 mb-6 flex-wrap bg-surface-container-low border border-border rounded-lg px-3 py-3 md:px-4">
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <Filter
              className="hidden sm:block w-3.5 h-3.5 text-muted-foreground"
              aria-hidden
            />
            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger
                aria-label="Filtrar por curso"
                className="h-9 w-full sm:w-56 font-sans text-sm bg-surface-container-lowest"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                {cursos.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.codigo} — {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterInstructor}
              onValueChange={setFilterInstructor}
            >
              <SelectTrigger
                aria-label="Filtrar por instructor"
                className="h-9 w-full sm:w-56 font-sans text-sm bg-surface-container-lowest"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los instructores</SelectItem>
                {instructores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger
                aria-label="Filtrar por estado"
                className="h-9 w-full sm:w-48 font-sans text-sm bg-surface-container-lowest"
              >
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

          <div className="flex items-center gap-x-5 gap-y-2 lg:ml-auto flex-wrap">
            {hayFiltros && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-sans text-xs font-semibold text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Limpiar filtros
              </button>
            )}

            {/* Leyenda de estados */}
            <ul
              className="flex items-center gap-3"
              aria-label="Leyenda de estados"
            >
              {(["programada", "realizada", "cancelada"] as const).map((e) => (
                <li
                  key={e}
                  className="inline-flex items-center gap-1.5 font-sans text-xs text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className={`w-2.5 h-2.5 rounded-[3px] ${estadoColor(e).dot}`}
                  />
                  {ESTADO_LABEL[e]}
                </li>
              ))}
            </ul>

            <button
              type="button"
              role="switch"
              aria-checked={showCursoRanges}
              onClick={() => setShowCursoRanges((v) => !v)}
              className="group inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                  showCursoRanges
                    ? "bg-primary"
                    : "bg-surface-container-highest"
                }`}
              >
                <span
                  className={`absolute h-3 w-3 rounded-full bg-surface-container-lowest shadow-sm transition-transform ${
                    showCursoRanges ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </span>
              <span className="font-sans text-xs text-muted-foreground group-hover:text-on-surface">
                Rango de cursos
              </span>
            </button>
          </div>
        </div>

        {/* Aviso cuando el rango visible no tiene sesiones */}
        {!loading && sesionesEnRango.length === 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-surface-container-low border border-border border-l-[3px] border-l-info rounded-lg px-4 py-3 mb-6">
            <p className="font-sans text-sm text-on-surface-variant">
              {sesiones.length === 0 ? (
                <>
                  Aún no hay sesiones creadas. Usa{" "}
                  <span className="font-semibold">“Nueva sesión”</span> o haz
                  clic en un día del calendario para crear la primera.
                </>
              ) : filteredSesiones.length === 0 ? (
                <>Ninguna sesión coincide con los filtros seleccionados.</>
              ) : (
                <>
                  No hay sesiones en este rango. La sesión más cercana es{" "}
                  <span className="font-semibold">
                    “{sesionMasCercana?.titulo}”
                  </span>{" "}
                  el{" "}
                  <span className="font-semibold">
                    {formatLongDate(
                      parseISODate(normalizeDate(sesionMasCercana!.fecha)),
                    )}
                  </span>
                  .
                </>
              )}
            </p>
            {sesiones.length > 0 &&
              (filteredSesiones.length === 0 ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToSesion(sesionMasCercana!.fecha)}
                >
                  Ir a esa fecha
                </Button>
              ))}
          </div>
        )}

        {/* Vistas */}
        {errorCarga ? (
          <ErrorState
            error={errorCarga}
            onRetry={recargar}
            fallback="No se pudo cargar el horario."
          />
        ) : loading ? (
          <div className="bg-surface-container-lowest border border-border rounded-lg ambient-shadow py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : view === "mes" ? (
          <CalendarMonth
            current={current}
            sesiones={filteredSesiones}
            cursos={filteredCursos}
            showCursoRanges={showCursoRanges}
            onCreate={openCreate}
            onEdit={openEdit}
            onMove={handleMove}
            onShowDay={showDay}
          />
        ) : view === "semana" ? (
          <CalendarWeek
            current={current}
            sesiones={filteredSesiones}
            onCreate={openCreate}
            onEdit={openEdit}
            onMove={handleMove}
          />
        ) : view === "dia" ? (
          <CalendarDay
            current={current}
            sesiones={filteredSesiones}
            cursos={filteredCursos}
            showCursoRanges={showCursoRanges}
            onCreate={openCreate}
            onEdit={openEdit}
            onMove={handleMove}
          />
        ) : (
          <CalendarAgenda
            current={current}
            sesiones={filteredSesiones}
            onEdit={openEdit}
          />
        )}
      </div>

      <SesionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cursos={cursos}
        initial={editing}
        defaultDate={defaultDate}
        defaultHora={defaultHora}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
