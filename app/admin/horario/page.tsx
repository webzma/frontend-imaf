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
  formatLongDate,
  formatShortDate,
  normalizeDate,
  startOfWeek,
  toISODate,
} from "./_components/utils";

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

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cursos, setCursos] = useState<CursoRef[]>([]);
  const [instructores, setInstructores] = useState<InstructorRef[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCurso, setFilterCurso] = useState<string>("todos");
  const [filterInstructor, setFilterInstructor] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sesion | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [defaultHora, setDefaultHora] = useState<string>("");

  const apiUrl = process.env.API_URL ?? "";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, cRes, iRes] = await Promise.all([
        fetch(`${apiUrl}api/admin/horario`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}api/admin/cursos`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}api/admin/profesores`, { headers: getAuthHeaders() }),
      ]);
      if (hRes.ok) {
        const d = await hRes.json();
        setSesiones(Array.isArray(d) ? d : (d.data ?? []));
      }
      if (cRes.ok) {
        const d = await cRes.json();
        setCursos(Array.isArray(d) ? d : (d.data ?? []));
      }
      if (iRes.ok) {
        const d = await iRes.json();
        setInstructores(Array.isArray(d) ? d : (d.data ?? []));
      }
    } catch {
      toast.error("Error al cargar el horario.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
    if (view === "mes" || view === "agenda")
      setCurrent((d) => addMonths(d, 1));
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
      const res = await fetch(`${apiUrl}api/admin/sesiones/${sesionId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ fecha: newDate }),
      });
      if (!res.ok) throw new Error("update failed");
      const updated: Sesion = await res.json();
      setSesiones((prev) => prev.map((s) => (s.id === sesionId ? updated : s)));
      toast.success("Sesión reprogramada");
    } catch {
      setSesiones((prev) =>
        prev.map((s) =>
          s.id === sesionId ? { ...s, fecha: previous } : s,
        ),
      );
      toast.error("No se pudo mover la sesión.");
    }
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
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-8 flex-col md:flex-row md:flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="size-6 md:size-10 text-primary/70" />
              <span className="font-sans text-xs md:text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
                Planificación / Horario
              </span>
            </div>
            <h1 className="font-serif font-light text-[3.2rem] tight-tracking leading-[1.08] text-on-surface mb-2">
              Horario
            </h1>
            <p className="font-sans text-sm text-muted-foreground max-w-md">
              Planifica y gestiona las sesiones de todos los cursos.
            </p>
          </div>

          <Button
            className="gap-2 mt-6 md:mt-0"
            onClick={() => openCreate(toISODate(current))}
          >
            <Plus className="w-4 h-4" />
            Nueva sesión
          </Button>
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
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
            <Select value={filterCurso} onValueChange={setFilterCurso}>
              <SelectTrigger className="h-9 w-48 font-sans text-sm">
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
              <SelectTrigger className="h-9 w-44 font-sans text-sm">
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

          <label className="inline-flex items-center gap-2 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={showCursoRanges}
              onChange={(e) => setShowCursoRanges(e.target.checked)}
              className="accent-primary"
            />
            <span className="font-sans text-xs text-on-surface/65">
              Mostrar rango de cursos
            </span>
          </label>
        </div>

        {/* Vistas */}
        {loading ? (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
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
        getAuthHeaders={getAuthHeaders}
        apiUrl={apiUrl}
      />
    </div>
  );
}
