import type { CursoRef } from "./types";

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Devuelve sólo la parte YYYY-MM-DD, aceptando "YYYY-MM-DD" o ISO datetime. */
export function normalizeDate(d: string | null | undefined): string {
  if (!d) return "";
  return d.slice(0, 10);
}

/** Devuelve sólo la parte HH:MM aceptando "HH:MM" o "HH:MM:SS". */
export function normalizeTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Lunes como primer día (ISO). Devuelve fecha del lunes que contiene `d`. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7; // 0 = lunes
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return sameDay(d, new Date());
}

/** Genera las 6 semanas (42 días) que cubren el mes, comenzando en lunes. */
export function monthGrid(d: Date): Date[] {
  const first = startOfMonth(d);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function weekGrid(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatHour(h: string | null | undefined): string {
  return normalizeTime(h);
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

/** Devuelve los cursos cuyo rango incluye esta fecha (para mostrar como "activos"). */
export function cursosActivosForDate(
  cursos: CursoRef[],
  date: Date,
): CursoRef[] {
  const iso = toISODate(date);
  return cursos.filter((c) => {
    const ini = normalizeDate(c.fecha_inicio);
    if (!ini) return false;
    const end = normalizeDate(c.fecha_fin) || ini;
    return ini <= iso && iso <= end;
  });
}

/** Asigna columnas para que eventos solapados se muestren lado a lado. */
export function layoutOverlap<
  T extends { hora_inicio?: string | null; hora_fin?: string | null },
>(events: T[]): Array<T & { _col: number; _cols: number }> {
  const toMin = (t?: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  // Eventos sin hora se ignoran (van como all-day aparte).
  const timed = events.filter((e) => e.hora_inicio);
  const sorted = [...timed].sort((a, b) => {
    const sa = toMin(a.hora_inicio) ?? 0;
    const sb = toMin(b.hora_inicio) ?? 0;
    return sa - sb;
  });

  type Active = { end: number; col: number; idx: number };
  const result: Array<T & { _col: number; _cols: number }> = [];
  let active: Active[] = [];
  let cluster: number[] = [];
  let clusterCols = 0;

  const flush = () => {
    for (const i of cluster) {
      (result[i] as { _cols: number })._cols = clusterCols;
    }
    cluster = [];
    clusterCols = 0;
  };

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const start = toMin(ev.hora_inicio) ?? 0;
    const end = toMin(ev.hora_fin) ?? start + 60;

    active = active.filter((a) => a.end > start);

    if (active.length === 0 && cluster.length > 0) flush();

    const used = new Set(active.map((a) => a.col));
    let col = 0;
    while (used.has(col)) col++;

    const item = { ...ev, _col: col, _cols: 1 } as T & {
      _col: number;
      _cols: number;
    };
    result.push(item);
    cluster.push(result.length - 1);
    active.push({ end, col, idx: result.length - 1 });
    clusterCols = Math.max(clusterCols, active.length);
  }
  if (cluster.length > 0) flush();

  return result;
}

/** Calcula el rango horario a mostrar basado en las sesiones (con bordes razonables). */
export function computeHourRange(
  events: Array<{ hora_inicio?: string | null; hora_fin?: string | null }>,
  fallback: { min: number; max: number } = { min: 7, max: 22 },
): { min: number; max: number } {
  const toH = (t?: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  };
  let min = fallback.min;
  let max = fallback.max;
  for (const e of events) {
    const s = toH(e.hora_inicio);
    const f = toH(e.hora_fin);
    if (s !== null) min = Math.min(min, Math.floor(s));
    if (f !== null) max = Math.max(max, Math.ceil(f));
    else if (s !== null) max = Math.max(max, Math.ceil(s + 1));
  }
  min = Math.max(0, Math.min(min, 23));
  max = Math.min(24, Math.max(max, min + 1));
  return { min, max };
}

/** Colores por estado de sesión. */
export function estadoColor(estado: string): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (estado) {
    case "realizada":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-500/15",
        text: "text-emerald-800 dark:text-emerald-400",
        dot: "bg-emerald-500",
      };
    case "cancelada":
      return {
        bg: "bg-rose-100 dark:bg-rose-500/15",
        text: "text-rose-800 dark:text-rose-400",
        dot: "bg-rose-500",
      };
    case "programada":
    default:
      return {
        bg: "bg-primary-container",
        text: "text-on-primary-container",
        dot: "bg-primary",
      };
  }
}
