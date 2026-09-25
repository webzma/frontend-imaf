import { LOCALE } from "@/lib/format";
import type { Periodo } from "./tipos";

export interface Variacion {
  /** Cambio relativo en %, o null si no hay base con la que comparar. */
  pct: number | null;
  direccion: "sube" | "baja" | "igual";
}

/** Variación de `actual` frente a `anterior`. */
export function variacion(actual: number, anterior: number): Variacion {
  if (actual === anterior) return { pct: 0, direccion: "igual" };
  const direccion = actual > anterior ? "sube" : "baja";
  if (anterior === 0) return { pct: null, direccion };
  return {
    pct: Math.round(((actual - anterior) / anterior) * 1000) / 10,
    direccion,
  };
}

/**
 * Pagos aprobados sobre los ya resueltos (aprobados + rechazados). Los
 * pendientes no cuentan: todavía no son ni un sí ni un no.
 */
export function tasaAprobacion(aprobados: number, rechazados: number) {
  const resueltos = aprobados + rechazados;
  return resueltos === 0 ? null : Math.round((aprobados / resueltos) * 100);
}

/** Porcentaje de cupo ocupado, sin tope (un curso puede pasarse). */
export function ocupacion(estudiantes: number, limite: number) {
  return limite > 0 ? Math.round((estudiantes / limite) * 100) : 0;
}

export type NivelOcupacion = "baja" | "media" | "alta" | "llena";

export function nivelOcupacion(pct: number): NivelOcupacion {
  if (pct >= 100) return "llena";
  if (pct >= 80) return "alta";
  if (pct >= 40) return "media";
  return "baja";
}

function fechaLocal(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d);
}

/** Etiqueta corta para el eje: "sep 26", "S39", "2026". */
export function etiquetaCorta(label: string, periodo: Periodo) {
  if (periodo === "mensual") {
    const [anio, mes] = label.split("-");
    return new Date(Number(anio), Number(mes) - 1)
      .toLocaleDateString(LOCALE, { month: "short", year: "2-digit" })
      .replace(".", "");
  }
  if (periodo === "semanal") return label.replace(/^\d{4}-W0?(\d+)$/, "S$1");
  return label;
}

/** Etiqueta larga para tooltips: "septiembre de 2026", "semana del 21 sep". */
export function etiquetaLarga(desde: string, periodo: Periodo) {
  const fecha = fechaLocal(desde);
  if (periodo === "mensual")
    return fecha.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
  if (periodo === "semanal")
    return `Semana del ${fecha.toLocaleDateString(LOCALE, { day: "numeric", month: "short" })}`;
  return String(fecha.getFullYear());
}

/** "1 oct 2025 – 30 sep 2026". */
export function rango(desde: string, hasta: string) {
  const f = (iso: string) =>
    fechaLocal(iso).toLocaleDateString(LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${f(desde)} – ${f(hasta)}`;
}

/** Descarga filas como CSV (con BOM para que Excel respete las tildes). */
export function descargarCsv(nombre: string, filas: (string | number)[][]) {
  const escapar = (v: string | number) => {
    const t = String(v);
    return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = filas.map((f) => f.map(escapar).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
