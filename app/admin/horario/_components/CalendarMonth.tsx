"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  ESTADO_LABEL,
  WEEKDAY_LABELS,
  cursoAccent,
  cursoSegmentsForWeek,
  estadoColor,
  formatHour,
  formatLongDate,
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
  onShowDay: (date: string) => void;
  /** Oculta la creación y desactiva el arrastre (vista de instructor). */
  readOnly?: boolean;
}

/** Carriles de curso visibles por semana antes de agrupar en "+N". */
const MAX_LANES = 2;
/** Alto de cada carril de curso, en px. Coincide con `h-[18px]` + separación. */
const LANE_PX = 20;
/** Sesiones visibles por celda antes de "+N más". */
const MAX_SESIONES = 3;

export default function CalendarMonth({
  current,
  sesiones,
  cursos,
  showCursoRanges,
  onCreate,
  onEdit,
  onMove,
  onShowDay,
  readOnly = false,
}: Props) {
  const days = monthGrid(current);
  const month = current.getMonth();
  const weeks = Array.from({ length: 6 }, (_, w) =>
    days.slice(w * 7, w * 7 + 7),
  );

  const [dragging, setDragging] = useState(false);
  const [dropIso, setDropIso] = useState<string | null>(null);

  const sesionesPorDia = new Map<string, Sesion[]>();
  for (const s of sesiones) {
    const iso = normalizeDate(s.fecha);
    if (!sesionesPorDia.has(iso)) sesionesPorDia.set(iso, []);
    sesionesPorDia.get(iso)!.push(s);
  }
  for (const list of sesionesPorDia.values()) {
    list.sort((a, b) =>
      (a.hora_inicio ?? "").localeCompare(b.hora_inicio ?? ""),
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-lg ambient-shadow overflow-hidden border border-border">
      <div className="grid grid-cols-7 bg-surface-container-low border-b border-border">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={`px-2 py-2.5 font-sans text-[10px] tracking-[0.18em] uppercase font-semibold text-center ${
              i >= 5 ? "text-muted-foreground" : "text-on-surface-variant"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        {weeks.map((week, w) => {
          const segments = showCursoRanges
            ? cursoSegmentsForWeek(cursos, week[0])
            : [];
          const visibleSegments = segments.filter((s) => s.lane < MAX_LANES);
          const hiddenCursos = segments.length - visibleSegments.length;
          const lanes = Math.min(
            MAX_LANES,
            segments.reduce((m, s) => Math.max(m, s.lane + 1), 0),
          );
          const lanesPx = lanes * LANE_PX + (hiddenCursos > 0 ? 14 : 0);

          return (
            <div
              key={w}
              className="relative grid grid-cols-7 border-b border-border last:border-b-0"
            >
              {week.map((day) => {
                const inMonth = day.getMonth() === month;
                const today = isToday(day);
                const iso = toISODate(day);
                const sesionesDia = sesionesPorDia.get(iso) ?? [];
                const visible = sesionesDia.slice(0, MAX_SESIONES);
                const extra = sesionesDia.length - visible.length;
                const isDrop = dropIso === iso;

                return (
                  <div
                    key={iso}
                    onDragOver={(e) => {
                      if (readOnly) return;
                      e.preventDefault();
                      if (dropIso !== iso) setDropIso(iso);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node))
                        setDropIso((cur) => (cur === iso ? null : cur));
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropIso(null);
                      setDragging(false);
                      const id = Number(e.dataTransfer.getData("text/plain"));
                      if (id) onMove(id, iso);
                    }}
                    className={`group relative min-h-[96px] md:min-h-[124px] flex flex-col border-r border-border last:border-r-0 transition-colors ${
                      isDrop
                        ? "bg-primary-container/40 ring-2 ring-inset ring-primary"
                        : today
                          ? "bg-primary-container/15"
                          : inMonth
                            ? "bg-surface-container-lowest hover:bg-surface-container-low"
                            : "bg-surface-container-low/60"
                    }`}
                  >
                    <div className="flex items-center justify-between px-1.5 pt-1.5 md:px-2">
                      <button
                        type="button"
                        onClick={() => onShowDay(iso)}
                        aria-label={`Ver ${formatLongDate(day)}`}
                        aria-current={today ? "date" : undefined}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-sans text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          today
                            ? "bg-primary text-primary-foreground font-semibold"
                            : inMonth
                              ? "text-on-surface font-medium hover:bg-surface-container-high"
                              : "text-muted-foreground hover:bg-surface-container-high"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onCreate(iso)}
                          className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-md text-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-[opacity,background-color]"
                          aria-label={`Crear sesión el ${formatLongDate(day)}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Espacio reservado para las franjas de curso */}
                    <div style={{ height: lanesPx }} aria-hidden />

                    {/* Móvil: puntos por sesión */}
                    {sesionesDia.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onShowDay(iso)}
                        className="sm:hidden flex flex-wrap gap-1 px-1.5 pt-1"
                        aria-label={`${sesionesDia.length} sesiones, ver día`}
                      >
                        {sesionesDia.slice(0, 6).map((s) => (
                          <span
                            key={s.id}
                            className={`w-1.5 h-1.5 rounded-full ${estadoColor(s.estado).dot}`}
                          />
                        ))}
                      </button>
                    )}

                    <div className="hidden sm:flex flex-col gap-1 px-1.5 pb-1.5 pt-1 md:px-2 min-w-0">
                      {visible.map((s) => {
                        const color = estadoColor(s.estado);
                        const cancelada = s.estado === "cancelada";
                        return (
                          <button
                            key={s.id}
                            type="button"
                            draggable={!readOnly}
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "text/plain",
                                String(s.id),
                              );
                              e.dataTransfer.effectAllowed = "move";
                              setDragging(true);
                            }}
                            onDragEnd={() => {
                              setDragging(false);
                              setDropIso(null);
                            }}
                            onClick={() => onEdit(s)}
                            title={[
                              s.titulo,
                              s.curso
                                ? `${s.curso.codigo} · ${s.curso.nombre}`
                                : "",
                              s.hora_inicio
                                ? `${formatHour(s.hora_inicio)}${s.hora_fin ? ` – ${formatHour(s.hora_fin)}` : ""}`
                                : "Todo el día",
                              ESTADO_LABEL[s.estado] ?? s.estado,
                            ]
                              .filter(Boolean)
                              .join("\n")}
                            className={`flex items-center gap-1.5 w-full min-w-0 text-left rounded-sm border-l-[3px] pl-1.5 pr-1 py-[3px] text-[11px] leading-tight font-sans ${readOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} transition-[filter,box-shadow] hover:brightness-110 dark:hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${color.bg} ${color.text} ${color.accent}`}
                          >
                            {s.hora_inicio && (
                              <span className="font-semibold tabular-nums shrink-0">
                                {formatHour(s.hora_inicio)}
                              </span>
                            )}
                            <span
                              className={`truncate ${cancelada ? "line-through" : ""}`}
                            >
                              {s.titulo}
                            </span>
                          </button>
                        );
                      })}
                      {extra > 0 && (
                        <button
                          type="button"
                          onClick={() => onShowDay(iso)}
                          className="self-start rounded-sm px-1.5 py-0.5 text-[11px] font-sans font-semibold text-muted-foreground hover:text-on-surface hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          +{extra} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Franjas de curso que cruzan la semana */}
              {visibleSegments.length > 0 && (
                <div
                  className={`absolute inset-x-0 top-[34px] grid grid-cols-7 gap-y-0.5 ${
                    dragging ? "pointer-events-none" : ""
                  }`}
                  style={{ gridAutoRows: `${LANE_PX - 2}px` }}
                >
                  {visibleSegments.map((seg) => {
                    const accent = cursoAccent(seg.curso.id);
                    return (
                      <div
                        key={seg.curso.id}
                        title={`${seg.curso.codigo} · ${seg.curso.nombre}\n${normalizeDate(seg.curso.fecha_inicio)} → ${normalizeDate(seg.curso.fecha_fin) || "—"}`}
                        style={{
                          gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                          gridRow: seg.lane + 1,
                        }}
                        className={`flex items-center min-w-0 bg-surface-container-high text-on-surface-variant font-sans text-[10px] leading-none px-1.5 ${
                          seg.continuesBefore
                            ? "ml-0 rounded-l-none"
                            : `ml-1 rounded-l-sm border-l-[3px] ${accent.border}`
                        } ${seg.continuesAfter ? "mr-0 rounded-r-none" : "mr-1 rounded-r-sm"}`}
                      >
                        <span className="truncate">
                          {seg.continuesBefore && (
                            <span
                              aria-hidden
                              className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${accent.dot}`}
                            />
                          )}
                          <span className="font-semibold">
                            {seg.curso.codigo}
                          </span>
                          <span className="hidden md:inline">
                            {" "}
                            · {seg.curso.nombre}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  {hiddenCursos > 0 && (
                    <span
                      className="col-span-7 justify-self-end self-center mr-2 font-sans text-[10px] leading-none font-semibold text-muted-foreground pointer-events-auto"
                      style={{ gridRow: MAX_LANES + 1, height: 12 }}
                      title={segments
                        .filter((s) => s.lane >= MAX_LANES)
                        .map((s) => `${s.curso.codigo} · ${s.curso.nombre}`)
                        .join("\n")}
                    >
                      +{hiddenCursos} cursos
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
