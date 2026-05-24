"use client";

import { useMemo } from "react";
import { Calendar, GraduationCap, Clock } from "lucide-react";
import {
  estadoColor,
  formatHour,
  formatLongDate,
  normalizeDate,
  parseISODate,
  toISODate,
  endOfMonth,
  startOfMonth,
} from "./utils";
import type { Sesion } from "./types";

interface Props {
  current: Date;
  sesiones: Sesion[];
  onEdit: (sesion: Sesion) => void;
}

const ESTADO_LABEL: Record<string, string> = {
  programada: "Programada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export default function CalendarAgenda({ current, sesiones, onEdit }: Props) {
  const grouped = useMemo(() => {
    const startIso = toISODate(startOfMonth(current));
    const endIso = toISODate(endOfMonth(current));

    const filtered = sesiones
      .map((s) => ({ s, d: normalizeDate(s.fecha) }))
      .filter(({ d }) => d >= startIso && d <= endIso)
      .sort((a, b) => {
        if (a.d !== b.d) return a.d.localeCompare(b.d);
        return (a.s.hora_inicio ?? "").localeCompare(b.s.hora_inicio ?? "");
      });

    const map = new Map<string, Sesion[]>();
    for (const { s, d } of filtered) {
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    }
    return Array.from(map.entries());
  }, [sesiones, current]);

  if (grouped.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-sm ambient-shadow py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
          <Calendar className="w-6 h-6 text-on-primary-container" />
        </div>
        <p className="font-serif font-light text-2xl text-on-surface">
          Sin sesiones este mes
        </p>
        <p className="font-sans text-sm text-muted-foreground">
          Navega a otro mes o crea sesiones desde el calendario.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-sm ambient-shadow divide-y divide-outline-variant/20">
      {grouped.map(([date, dayItems]) => (
        <div key={date} className="px-6 py-5">
          <div className="flex items-baseline gap-3 mb-3">
            <p className="font-serif font-light text-xl text-on-surface capitalize">
              {formatLongDate(parseISODate(date))}
            </p>
            <span className="font-sans text-xs text-on-surface/45">
              {dayItems.length} sesi{dayItems.length === 1 ? "ón" : "ones"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {dayItems.map((s) => {
              const color = estadoColor(s.estado);
              return (
                <button
                  key={s.id}
                  onClick={() => onEdit(s)}
                  className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-3 rounded-sm bg-surface-container-low/50 hover:bg-surface-container transition-colors text-left"
                >
                  <div className="flex items-center gap-2 md:min-w-[150px]">
                    <Clock className="w-3.5 h-3.5 text-on-surface/40" />
                    <span className="font-sans text-sm font-medium text-on-surface tabular-nums">
                      {s.hora_inicio ? formatHour(s.hora_inicio) : "Todo el día"}
                      {s.hora_fin && s.hora_inicio && ` – ${formatHour(s.hora_fin)}`}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold text-on-surface truncate">
                      {s.titulo}
                    </p>
                    {s.curso && (
                      <p className="font-sans text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-semibold text-primary/70">
                          {s.curso.codigo}
                        </span>
                        <span>·</span>
                        <span>{s.curso.nombre}</span>
                        {s.curso.instructor?.user?.name && (
                          <>
                            <span>·</span>
                            <GraduationCap className="w-3 h-3" />
                            <span>{s.curso.instructor.user.name}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex self-start md:self-auto items-center gap-1.5 px-2.5 py-0.5 rounded-full font-sans text-[11px] font-semibold ${color.bg} ${color.text} shrink-0`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                    {ESTADO_LABEL[s.estado] ?? s.estado}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
