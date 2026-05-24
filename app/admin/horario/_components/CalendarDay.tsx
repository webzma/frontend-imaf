"use client";

import { useMemo } from "react";
import {
  computeHourRange,
  cursosActivosForDate,
  estadoColor,
  formatHour,
  formatLongDate,
  layoutOverlap,
  normalizeDate,
  toISODate,
} from "./utils";
import type { CursoRef, Sesion } from "./types";

interface Props {
  current: Date;
  sesiones: Sesion[];
  cursos: CursoRef[];
  showCursoRanges: boolean;
  onCreate: (date: string, hora?: string) => void;
  onEdit: (sesion: Sesion) => void;
  onMove: (sesionId: number, newDate: string) => void;
}

const HOUR_PX = 64;

export default function CalendarDay({
  current,
  sesiones,
  cursos,
  showCursoRanges,
  onCreate,
  onEdit,
  onMove,
}: Props) {
  const iso = toISODate(current);

  const daySesiones = useMemo(
    () => sesiones.filter((s) => normalizeDate(s.fecha) === iso),
    [sesiones, iso],
  );
  const allDay = daySesiones.filter((s) => !s.hora_inicio);
  const timed = daySesiones.filter((s) => s.hora_inicio);
  const laid = useMemo(() => layoutOverlap(timed), [timed]);
  const { min: HOUR_START, max: HOUR_END } = useMemo(
    () => computeHourRange(daySesiones),
    [daySesiones],
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: HOUR_END - HOUR_START + 1 },
        (_, i) => HOUR_START + i,
      ),
    [HOUR_START, HOUR_END],
  );

  const cursosDia = showCursoRanges ? cursosActivosForDate(cursos, current) : [];

  const timeToPx = (time: string | null | undefined): number => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return (h - HOUR_START) * HOUR_PX + (m / 60) * HOUR_PX;
  };
  const durationPx = (start?: string | null, end?: string | null): number => {
    if (!start || !end) return HOUR_PX * 0.75;
    return Math.max(HOUR_PX * 0.5, timeToPx(end) - timeToPx(start));
  };

  return (
    <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
      <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30">
        <p className="font-serif text-2xl font-light tight-tracking text-on-surface capitalize">
          {formatLongDate(current)}
        </p>
        <p className="font-sans text-xs text-muted-foreground mt-0.5">
          {daySesiones.length} sesi{daySesiones.length === 1 ? "ón" : "ones"}
          {cursosDia.length > 0 &&
            ` · ${cursosDia.length} curso${cursosDia.length === 1 ? "" : "s"} activo${cursosDia.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {cursosDia.length > 0 && (
        <div className="px-6 py-3 flex flex-wrap gap-2 bg-secondary-container/30 border-b border-outline-variant/20">
          {cursosDia.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/80 text-xs font-sans text-on-surface/75"
              title={`${c.fecha_inicio} → ${c.fecha_fin ?? "—"}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="font-mono font-semibold text-primary/80">
                {c.codigo}
              </span>
              <span>{c.nombre}</span>
            </span>
          ))}
        </div>
      )}

      {allDay.length > 0 && (
        <div className="px-6 py-3 border-b border-outline-variant/20 flex flex-wrap gap-2 bg-surface-container-low/40">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-on-surface/55 font-semibold self-center">
            Todo el día
          </span>
          {allDay.map((s) => {
            const color = estadoColor(s.estado);
            return (
              <button
                key={s.id}
                onClick={() => onEdit(s)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(s.id));
                  e.dataTransfer.effectAllowed = "move";
                }}
                className={`text-left rounded-sm px-2.5 py-1 text-xs font-sans font-medium ${color.bg} ${color.text} hover:brightness-95 cursor-pointer`}
              >
                {s.titulo}
                {s.curso && (
                  <span className="ml-2 opacity-70 font-mono text-[10px]">
                    {s.curso.codigo}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const id = Number(e.dataTransfer.getData("text/plain"));
          if (id) onMove(id, iso);
        }}
        className="grid grid-cols-[80px_1fr] relative"
        style={{ minHeight: hours.length * HOUR_PX }}
      >
        <div>
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="font-sans text-[11px] text-on-surface/45 tabular-nums text-right pr-3 pt-1 border-b border-outline-variant/15"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="relative border-l border-outline-variant/20">
          {hours.map((h) => (
            <button
              key={h}
              onClick={() => onCreate(iso, `${String(h).padStart(2, "0")}:00`)}
              style={{ height: HOUR_PX }}
              className="block w-full border-b border-outline-variant/15 hover:bg-primary/5 transition-colors cursor-pointer"
              aria-label={`Crear sesión a las ${h}:00`}
            />
          ))}

          {laid.map((s) => {
            const color = estadoColor(s.estado);
            const top = timeToPx(s.hora_inicio);
            const height = durationPx(s.hora_inicio, s.hora_fin);
            const widthPct = 100 / s._cols;
            const leftPct = widthPct * s._col;
            return (
              <button
                key={s.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(s.id));
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(s);
                }}
                style={{
                  top,
                  height,
                  left: `calc(${leftPct}% + 6px)`,
                  width: `calc(${widthPct}% - 12px)`,
                }}
                className={`absolute rounded-sm px-3 py-2 text-left ${color.bg} ${color.text} hover:brightness-95 shadow-sm overflow-hidden cursor-pointer`}
              >
                <div className="font-sans font-semibold text-sm truncate">
                  {s.titulo}
                </div>
                <div className="font-sans text-xs opacity-80 tabular-nums">
                  {formatHour(s.hora_inicio)}
                  {s.hora_fin && ` – ${formatHour(s.hora_fin)}`}
                </div>
                {s.curso && (
                  <div className="font-sans text-xs opacity-75 truncate">
                    {s.curso.codigo} · {s.curso.nombre}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
