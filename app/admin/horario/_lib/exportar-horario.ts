import {
  exportarDocumento,
  slugArchivo,
  type Celda,
  type Columna,
  type DocumentoExportable,
  type FormatoTabla,
} from "@/lib/exportar-tabla";
import { LOCALE, formatNumber } from "@/lib/format";

import type { Sesion } from "../_components/types";
import {
  ESTADO_LABEL,
  normalizeDate,
  normalizeTime,
  parseISODate,
} from "../_components/utils";

export type FormatoHorario = FormatoTabla;

const COLUMNAS: Columna[] = [
  { titulo: "#", tipo: "entero", anchoPdf: 9 },
  { titulo: "Fecha", tipo: "fecha", anchoPdf: 23 },
  { titulo: "Día", anchoPdf: 20 },
  { titulo: "Hora", anchoPdf: 26 },
  { titulo: "Duración (h)", tipo: "decimal", anchoPdf: 24 },
  { titulo: "Código", anchoPdf: 22 },
  { titulo: "Curso" },
  { titulo: "Título" },
  { titulo: "Instructor" },
  { titulo: "Estado", anchoPdf: 22 },
];

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function hora(sesion: Sesion) {
  const inicio = normalizeTime(sesion.hora_inicio);
  if (!inicio) return null;
  const fin = normalizeTime(sesion.hora_fin);
  return fin ? `${inicio} – ${fin}` : inicio;
}

function minutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Horas de la sesión, o null si falta un extremo o el rango no tiene sentido. */
export function duracionHoras(sesion: Sesion): number | null {
  const inicio = normalizeTime(sesion.hora_inicio);
  const fin = normalizeTime(sesion.hora_fin);
  if (!inicio || !fin) return null;
  const diferencia = minutos(fin) - minutos(inicio);
  if (!(diferencia > 0)) return null;
  return Math.round((diferencia / 60) * 100) / 100;
}

function ordenadas(sesiones: Sesion[]) {
  return [...sesiones].sort((a, b) => {
    const fecha = normalizeDate(a.fecha).localeCompare(normalizeDate(b.fecha));
    if (fecha !== 0) return fecha;
    return normalizeTime(a.hora_inicio).localeCompare(
      normalizeTime(b.hora_inicio),
    );
  });
}

export function construirFilas(sesiones: Sesion[]): Celda[][] {
  return ordenadas(sesiones).map((s, i) => {
    const fecha = normalizeDate(s.fecha);
    return [
      i + 1,
      fecha,
      capitalizar(
        parseISODate(fecha).toLocaleDateString(LOCALE, { weekday: "long" }),
      ),
      hora(s),
      duracionHoras(s),
      s.curso?.codigo ?? null,
      s.curso?.nombre ?? null,
      s.titulo,
      s.curso?.instructor?.user.name ?? null,
      ESTADO_LABEL[s.estado] ?? s.estado,
    ];
  });
}

/** Horas impartidas o por impartir: una sesión cancelada no es tiempo de clase. */
export function horasDeClase(sesiones: Sesion[]) {
  return sesiones
    .filter((s) => s.estado !== "cancelada")
    .reduce((total, s) => total + (duracionHoras(s) ?? 0), 0);
}

export function construirDocumento(
  sesiones: Sesion[],
  rangoLabel: string,
  filtros: string[] = [],
): DocumentoExportable {
  const contar = (estado: Sesion["estado"]) =>
    formatNumber(sesiones.filter((s) => s.estado === estado).length);
  const cursos = new Set(sesiones.map((s) => s.curso_id)).size;
  const horas = horasDeClase(sesiones);

  return {
    titulo: "Agenda de cursos",
    subtitulos: [
      rangoLabel,
      ...(filtros.length > 0 ? [`Filtros: ${filtros.join(" · ")}`] : []),
    ],
    nombreArchivo: `horario-${slugArchivo(rangoLabel, "horario")}`,
    pie: "IMAF — Horario",
    indicadores: [
      {
        etiqueta: "Sesiones",
        valor: formatNumber(sesiones.length),
        detalle: `En ${formatNumber(cursos)} curso${cursos === 1 ? "" : "s"}`,
      },
      { etiqueta: "Programadas", valor: contar("programada") },
      { etiqueta: "Realizadas", valor: contar("realizada") },
      { etiqueta: "Canceladas", valor: contar("cancelada") },
      {
        etiqueta: "Horas de clase",
        valor: formatNumber(horas, 2),
        detalle: "Sin contar las canceladas",
      },
    ],
    secciones: [
      {
        titulo: "Agenda",
        columnas: COLUMNAS,
        filas: construirFilas(sesiones),
        totales: [
          null,
          null,
          null,
          { valor: "Horas de clase", tipo: "texto" },
          horas,
          null,
          null,
          null,
          null,
          null,
        ],
        vacio: "No hay sesiones en este rango.",
      },
    ],
  };
}

/**
 * Exporta la agenda visible del calendario (ya filtrada por curso, instructor,
 * estado y rango de fechas) en CSV, PDF o Excel.
 */
export async function exportarHorario(
  sesiones: Sesion[],
  formato: FormatoHorario,
  rangoLabel: string,
  filtros: string[] = [],
) {
  await exportarDocumento(
    construirDocumento(sesiones, rangoLabel, filtros),
    formato,
  );
}
