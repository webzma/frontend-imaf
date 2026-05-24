"use client";

import { Plus } from "lucide-react";
import {
  WEEKDAY_LABELS,
  cursosActivosForDate,
  estadoColor,
  formatHour,
  isToday,
  monthGrid,
  normalizeDate,
  toISODate,
} from "./utils";
import type { CursoRef, Sesion } from "./types";

interface Props {
  current: Date;
  sesiones: Sesion[];
  cursos: CursoRef[];
  showCursoRanges: boolean;
  onCreate: (date: string) => void;
  onEdit: (sesion: Sesion) => void;
  onMove: (sesionId: number, newDate: string) => void;
}

// Genera un color sutil estable por curso id, en tonos rosa/cream/sage.
const CURSO_BAR_PALETTE = [
  "bg-rose-300/70 dark:bg-rose-400/40",
  "bg-amber-300/70 dark:bg-amber-400/40",
  "bg-emerald-300/70 dark:bg-emerald-400/40",
  "bg-sky-300/70 dark:bg-sky-400/40",
  "bg-violet-300/70 dark:bg-violet-400/40",
  "bg-orange-300/70 dark:bg-orange-400/40",
];

function cursoBarColor(id: number) {
  return CURSO_BAR_PALETTE[id % CURSO_BAR_PALETTE.length];
}

export default function CalendarMonth({
  current,
  sesiones,
  cursos,
  showCursoRanges,
  onCreate,
  onEdit,
  onMove,
}: Props) {
  const days = monthGrid(current);
  const month = current.getMonth();

  return (
    <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
      <div className="grid grid-cols-7 bg-surface-container-low border-b border-outline-variant/30">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-3 py-2.5 font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/55 font-semibold text-center"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === month;
          const today = isToday(day);
          const iso = toISODate(day);

          const sesionesDia = sesiones
            .filter((s) => normalizeDate(s.fecha) === iso)
            .sort((a, b) =>
              (a.hora_inicio ?? "").localeCompare(b.hora_inicio ?? ""),
            );
          const cursosDia = showCursoRanges
            ? cursosActivosForDate(cursos, day)
            : [];

          const visible = sesionesDia.slice(0, 3);
          const extra = sesionesDia.length - visible.length;

          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = Number(e.dataTransfer.getData("text/plain"));
                if (id) onMove(id, iso);
              }}
              className={`group relative min-h-[120px] border-b border-r border-outline-variant/20 transition-colors ${
                inMonth ? "bg-surface-container-lowest" : "bg-surface/40"
              } hover:bg-surface-container-low/60`}
            >
              {/* Franjas de cursos activos en este día */}
              {cursosDia.length > 0 && (
                <div className="absolute inset-x-0 top-0 flex flex-col gap-px">
                  {cursosDia.slice(0, 3).map((c) => (
                    <span
                      key={c.id}
                      title={`${c.codigo} · ${c.nombre}`}
                      className={`h-[3px] ${cursoBarColor(c.id)}`}
                    />
                  ))}
                </div>
              )}

              <div className="p-2 pt-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-sans tabular-nums ${
                      today
                        ? "bg-primary text-on-primary font-semibold w-6 h-6 rounded-full"
                        : inMonth
                          ? "text-on-surface font-medium"
                          : "text-on-surface/30"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <button
                    onClick={() => onCreate(iso)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-primary/10 text-primary"
                    aria-label="Crear sesión"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {visible.map((s) => {
                    const color = estadoColor(s.estado);
                    return (
                      <button
                        key={s.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", String(s.id));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={() => onEdit(s)}
                        className={`text-left rounded-sm px-1.5 py-0.5 text-[11px] font-sans font-medium truncate transition-all ${color.bg} ${color.text} hover:brightness-95 cursor-pointer`}
                      >
                        {s.hora_inicio && (
                          <span className="font-semibold mr-1 tabular-nums">
                            {formatHour(s.hora_inicio)}
                          </span>
                        )}
                        {s.titulo}
                      </button>
                    );
                  })}
                  {extra > 0 && (
                    <button
                      onClick={() => onCreate(iso)}
                      className="text-[10px] text-on-surface/55 px-1.5 font-sans hover:text-primary text-left"
                    >
                      +{extra} más
                    </button>
                  )}
                  {cursosDia.length > 3 && (
                    <span className="text-[9px] text-on-surface/40 px-1.5 font-sans">
                      +{cursosDia.length - 3} curso(s) activo(s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
