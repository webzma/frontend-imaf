import { exportarTabla, type FormatoTabla } from "@/lib/exportar-tabla";

import type { Sesion } from "../_components/types";
import {
  ESTADO_LABEL,
  normalizeDate,
  normalizeTime,
  parseISODate,
} from "../_components/utils";

export type FormatoHorario = FormatoTabla;

const COLUMNAS = [
  "#",
  "Fecha",
  "Día",
  "Hora",
  "Curso",
  "Título",
  "Instructor",
  "Estado",
];

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function fechaCorta(iso: string) {
  return parseISODate(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function hora(sesion: Sesion) {
  const inicio = normalizeTime(sesion.hora_inicio);
  if (!inicio) return "—";
  const fin = normalizeTime(sesion.hora_fin);
  return fin ? `${inicio} – ${fin}` : inicio;
}

function slug(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "horario"
  );
}

export function construirFilas(sesiones: Sesion[]): (string | number)[][] {
  return [...sesiones]
    .sort((a, b) => {
      const fecha = normalizeDate(a.fecha).localeCompare(
        normalizeDate(b.fecha),
      );
      if (fecha !== 0) return fecha;
      return normalizeTime(a.hora_inicio).localeCompare(
        normalizeTime(b.hora_inicio),
      );
    })
    .map((s, i) => {
      const fecha = normalizeDate(s.fecha);
      const dia = parseISODate(fecha);
      return [
        i + 1,
        fechaCorta(fecha),
        capitalizar(dia.toLocaleDateString("es-ES", { weekday: "long" })),
        hora(s),
        s.curso ? `${s.curso.codigo} · ${s.curso.nombre}` : "—",
        s.titulo,
        s.curso?.instructor?.user.name ?? "—",
        ESTADO_LABEL[s.estado] ?? s.estado,
      ];
    });
}

/**
 * Exporta la agenda visible del calendario (ya filtrada por curso, instructor,
 * estado y rango de fechas) en CSV, PDF o Excel.
 */
export async function exportarHorario(
  sesiones: Sesion[],
  formato: FormatoHorario,
  rangoLabel: string,
) {
  await exportarTabla(
    {
      titulo: "Agenda de cursos",
      subtitulo: rangoLabel,
      nombreArchivo: `horario-${slug(rangoLabel)}`,
      columnas: COLUMNAS,
      filas: construirFilas(sesiones),
      numericas: [0],
      pie: "IMAF — Horario",
    },
    formato,
  );
}
