"use client";

import { useMemo } from "react";
import {
  WEEKDAY_LABELS,
  computeHourRange,
  estadoColor,
  formatHour,
  isToday,
  layoutOverlap,
  normalizeDate,
  toISODate,
  weekGrid,
} from "./utils";
import type { Sesion } from "./types";

interface Props {
  current: Date;
  sesiones: Sesion[];
  onCreate: (date: string, hora?: string) => void;
  onEdit: (sesion: Sesion) => void;
  onMove: (sesionId: number, newDate: string) => void;
}

const HOUR_PX = 56;

export default function CalendarWeek({
  current,
  sesiones,
  onCreate,
  onEdit,
  onMove,
}: Props) {
  const days = weekGrid(current);
  const weekIsoSet = useMemo(
    () => new Set(days.map((d) => toISODate(d))),
    [days],
  );

  const weekSesiones = useMemo(
    () => sesiones.filter((s) => weekIsoSet.has(normalizeDate(s.fecha))),
    [sesiones, weekIsoSet],
  );

  const { min: HOUR_START, max: HOUR_END } = useMemo(
    () => computeHourRange(weekSesiones),
    [weekSesiones],
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: HOUR_END - HOUR_START + 1 },
        (_, i) => HOUR_START + i,
      ),
    [HOUR_START, HOUR_END],
  );

  const timeToPx = (time: string | null | undefined): number => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return (h - HOUR_START) * HOUR_PX + (m / 60) * HOUR_PX;
  };

  const durationPx = (start?: string | null, end?: string | null): number => {
    if (!start) return HOUR_PX * 0.75;
    if (!end) return HOUR_PX * 0.75;
    return Math.max(HOUR_PX * 0.5, timeToPx(end) - timeToPx(start));
  };

  return (
    <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
      {/* Cabecera con días */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-surface-container-low border-b border-outline-variant">
        <div />
        {days.map((d, i) => {
          const today = isToday(d);
          return (
            <div
              key={i}
              className="px-3 py-3 text-center border-l border-outline-variant"
            >
              <div className="font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold mb-1">
                {WEEKDAY_LABELS[i]}
              </div>
              <div
                className={`inline-flex items-center justify-center font-sans text-lg tabular-nums ${
                  today
                    ? "bg-primary text-primary-foreground font-semibold w-8 h-8 rounded-full"
                    : "text-on-surface font-medium"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fila all-day (sesiones sin hora_inicio) */}
      {weekSesiones.some((s) => !s.hora_inicio) && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-outline-variant bg-surface-container-low/40">
          <div className="px-2 py-2 font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-right pr-3 flex items-center justify-end">
            Todo el día
          </div>
          {days.map((d, i) => {
            const iso = toISODate(d);
            const allDay = weekSesiones.filter(
              (s) => normalizeDate(s.fecha) === iso && !s.hora_inicio,
            );
            return (
              <div
                key={i}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = Number(e.dataTransfer.getData("text/plain"));
                  if (id) onMove(id, iso);
                }}
                className="border-l border-outline-variant p-1 min-h-[34px] flex flex-col gap-1"
              >
                {allDay.map((s) => {
                  const color = estadoColor(s.estado);
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
                      className={`text-left rounded-sm px-1.5 py-0.5 text-[11px] font-sans font-medium truncate ${color.bg} ${color.text} hover:brightness-95 cursor-pointer`}
                    >
                      {s.titulo}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Grilla horaria */}
      <div
        className="grid grid-cols-[60px_repeat(7,1fr)] relative"
        style={{ minHeight: hours.length * HOUR_PX }}
      >
        <div className="relative">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="font-sans text-[10px] text-muted-foreground tabular-nums text-right pr-2 pt-0.5 border-b border-outline-variant"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day, dayIdx) => {
          const iso = toISODate(day);
          const dayTimed = weekSesiones.filter(
            (s) => normalizeDate(s.fecha) === iso && s.hora_inicio,
          );
          const laid = layoutOverlap(dayTimed);

          return (
            <div
              key={dayIdx}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = Number(e.dataTransfer.getData("text/plain"));
                if (id) onMove(id, iso);
              }}
              className="relative border-l border-outline-variant"
            >
              {hours.map((h) => (
                <button
                  key={h}
                  onClick={() =>
                    onCreate(iso, `${String(h).padStart(2, "0")}:00`)
                  }
                  style={{ height: HOUR_PX }}
                  className="block w-full border-b border-outline-variant hover:bg-primary/5 transition-colors cursor-pointer"
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
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                    }}
                    className={`absolute rounded-sm px-1.5 py-1 text-left text-[11px] font-sans ${color.bg} ${color.text} hover:brightness-95 shadow-sm overflow-hidden cursor-pointer`}
                  >
                    <div className="font-semibold truncate leading-tight">
                      {s.titulo}
                    </div>
                    <div className="text-[10px] opacity-80 tabular-nums truncate">
                      {formatHour(s.hora_inicio)}
                      {s.hora_fin && ` – ${formatHour(s.hora_fin)}`}
                    </div>
                    {s.curso && (
                      <div className="text-[10px] opacity-75 truncate">
                        {s.curso.codigo}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
