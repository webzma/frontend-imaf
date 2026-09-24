/**
 * Estado visual de un curso para las tarjetas.
 *
 * `estado` solo dice activo/inactivo, y el backend pasa a inactivo un curso
 * vencido como mucho cada 10 minutos (CursoEstadoService). Por eso la fecha de
 * fin se mira aquí también: un curso cuya fecha de fin ya llegó se muestra
 * como finalizado aunque todavía figure activo, y uno activo al que le queda
 * poco se avisa antes.
 */

import { parsearFechaLocal } from "@/lib/dias-habiles";

export type EstadoVisualCurso =
  | "activo"
  | "por_finalizar"
  | "inactivo"
  | "finalizado";

/** Días antes de la fecha de fin en que un curso activo pasa a "por finalizar". */
export const DIAS_AVISO_FIN = 7;

const MS_DIA = 86_400_000;

export interface EstadoCurso {
  clave: EstadoVisualCurso;
  etiqueta: string;
  /** Días hasta la fecha de fin (negativo si ya pasó); null sin fecha. */
  diasRestantes: number | null;
}

export function estadoVisualCurso(
  curso: { estado: string; fecha_fin?: string | null },
  hoy: Date = new Date(),
): EstadoCurso {
  const fin = curso.fecha_fin
    ? parsearFechaLocal(curso.fecha_fin.slice(0, 10))
    : null;
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diasRestantes = fin
    ? Math.round((fin.getTime() - inicioHoy.getTime()) / MS_DIA)
    : null;

  // Igual que el backend: el curso termina el mismo día de su fecha de fin.
  if (diasRestantes !== null && diasRestantes <= 0) {
    return { clave: "finalizado", etiqueta: "Finalizado", diasRestantes };
  }

  if (curso.estado !== "activo") {
    return { clave: "inactivo", etiqueta: "Inactivo", diasRestantes };
  }

  if (diasRestantes !== null && diasRestantes <= DIAS_AVISO_FIN) {
    return {
      clave: "por_finalizar",
      etiqueta:
        diasRestantes === 1
          ? "Finaliza mañana"
          : `Finaliza en ${diasRestantes} días`,
      diasRestantes,
    };
  }

  return { clave: "activo", etiqueta: "Activo", diasRestantes };
}

/**
 * Clases por estado. Activo conserva el acento de marca; inactivo se apaga a
 * neutro; finalizado se apaga y marca la franja y la fecha en rojo; por
 * finalizar solo cambia la franja y la fecha a ámbar.
 */
export const ESTILO_CURSO: Record<
  EstadoVisualCurso,
  {
    /** Franja superior de la tarjeta. */
    franja: string;
    /** Contenedor de la tarjeta. */
    tarjeta: string;
    /** Título del curso. */
    titulo: string;
    /** Línea de fechas. */
    fecha: string;
    /** Barra de ocupación (sustituye al tono de cupo si no está activo). */
    barra: string | null;
  }
> = {
  activo: {
    franja: "gradient-primary",
    tarjeta: "",
    titulo: "text-on-surface",
    fecha: "text-muted-foreground",
    barra: null,
  },
  por_finalizar: {
    franja: "bg-warning",
    tarjeta: "ring-1 ring-inset ring-warning/40",
    titulo: "text-on-surface",
    fecha: "text-warning font-semibold",
    barra: null,
  },
  inactivo: {
    franja: "bg-outline-variant",
    tarjeta: "bg-surface-container-low [&_img]:grayscale",
    titulo: "text-muted-foreground",
    fecha: "text-muted-foreground",
    barra: "bg-muted-foreground/40",
  },
  finalizado: {
    franja: "bg-danger",
    tarjeta: "bg-surface-container-low [&_img]:grayscale",
    titulo: "text-muted-foreground",
    fecha: "text-danger font-semibold",
    barra: "bg-muted-foreground/40",
  },
};
