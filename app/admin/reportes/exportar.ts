import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import {
  exportarDocumento,
  type DocumentoExportable,
  type FormatoTabla,
  type Indicador,
  type SeccionTabla,
} from "@/lib/exportar-tabla";
import {
  etiquetaLarga,
  nivelOcupacion,
  ocupacion,
  ocupacionMedia,
  rango,
  tasaAprobacion,
  variacion,
  type NivelOcupacion,
} from "./metricas";
import {
  METODO_LABEL,
  PERIODOS,
  type Periodo,
  type ReporteData,
  type TramoResumen,
} from "./tipos";

export type FormatoReporte = FormatoTabla;

export const INFORMES = [
  { key: "completo", label: "Reporte completo", multitabla: true },
  { key: "serie", label: "Ingresos por período", multitabla: false },
  { key: "metodos", label: "Métodos de pago", multitabla: false },
  { key: "ocupacion", label: "Ocupación de cursos", multitabla: false },
  { key: "cursos", label: "Pagos por curso", multitabla: false },
  { key: "estudiantes", label: "Pagos por estudiante", multitabla: false },
] as const;

export type Informe = (typeof INFORMES)[number]["key"];

const NIVEL_LABEL: Record<NivelOcupacion, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  llena: "Llena",
};

const HISTORICO =
  "Histórico completo de la plataforma: no depende del período elegido.";
const OCUPACION_ACTUAL =
  "Situación actual: inscritos con el pago aprobado sobre el cupo de cada curso.";

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function sumar<T>(filas: T[], campo: (fila: T) => number) {
  return filas.reduce((total, fila) => total + campo(fila), 0);
}

function ventanaDe(periodo: Periodo) {
  return PERIODOS.find((p) => p.key === periodo)!.ventana;
}

function alcancePeriodo(datos: ReporteData, periodo: Periodo) {
  return `Últimos ${ventanaDe(periodo)}: ${rango(datos.periodo.desde, datos.periodo.hasta)}`;
}

function textoVariacion(actual: number, anterior: number, periodo: Periodo) {
  const { pct } = variacion(actual, anterior);
  const comparacion = `${ventanaDe(periodo)} anteriores`;
  if (pct === null) return `Sin datos en los ${comparacion}`;
  const signo = pct > 0 ? "+" : "";
  return `${signo}${formatPercent(pct)} vs. ${comparacion}`;
}

function indicadoresPeriodo(datos: ReporteData, periodo: Periodo): Indicador[] {
  const { actual, anterior } = datos.periodo;
  const tasa = tasaAprobacion(actual.aprobados, actual.rechazados);
  const tasaPrevia = tasaAprobacion(anterior.aprobados, anterior.rechazados);
  return [
    {
      etiqueta: "Ingresos",
      valor: formatCurrency(actual.ingresos),
      detalle: textoVariacion(actual.ingresos, anterior.ingresos, periodo),
    },
    {
      etiqueta: "Pagos aprobados",
      valor: formatNumber(actual.aprobados),
      detalle: `de ${formatNumber(actual.total_pagos)} solicitudes recibidas`,
    },
    {
      etiqueta: "Tasa de aprobación",
      valor: tasa === null ? "—" : `${tasa}%`,
      detalle:
        tasa !== null && tasaPrevia !== null
          ? textoVariacion(tasa, tasaPrevia, periodo)
          : "Aprobados sobre pagos ya resueltos",
    },
    {
      etiqueta: "Pendientes de revisar",
      valor: formatNumber(actual.pendientes),
      detalle: "Reportados en el período, sin resolver",
    },
  ];
}

function indicadoresHistoricos(
  datos: ReporteData,
  extra: Indicador,
): Indicador[] {
  const { resumen } = datos;
  const tasa = tasaAprobacion(resumen.aprobados, resumen.rechazados);
  return [
    extra,
    {
      etiqueta: "Ingresos históricos",
      valor: formatCurrency(resumen.total_ingresos),
    },
    {
      etiqueta: "Pagos aprobados",
      valor: formatNumber(resumen.aprobados),
      detalle: `de ${formatNumber(resumen.total_pagos)} solicitudes`,
    },
    {
      etiqueta: "Tasa de aprobación",
      valor: tasa === null ? "—" : `${tasa}%`,
    },
    { etiqueta: "Pendientes", valor: formatNumber(resumen.pendientes) },
  ];
}

function indicadoresOcupacion(datos: ReporteData): Indicador[] {
  const activos = datos.cursos.filter((c) => c.estado === "activo");
  const nivel = (nombre: NivelOcupacion) =>
    activos.filter(
      (c) => nivelOcupacion(ocupacion(c.estudiantes, c.limite_cupo)) === nombre,
    ).length;
  const media = ocupacionMedia(datos.cursos);
  return [
    {
      etiqueta: "Cursos activos",
      valor: formatNumber(activos.length),
      detalle: `de ${formatNumber(datos.cursos.length)} en total`,
    },
    {
      etiqueta: "Ocupación media",
      valor: media === null ? "—" : `${media}%`,
      detalle: "De los cursos activos",
    },
    {
      etiqueta: "Cursos llenos",
      valor: formatNumber(nivel("llena")),
      detalle: "Activos, con el cupo completo",
    },
    {
      etiqueta: "Baja ocupación",
      valor: formatNumber(nivel("baja")),
      detalle: "Activos, por debajo del 40% del cupo",
    },
  ];
}

function indicadoresMetodos(datos: ReporteData, periodo: Periodo): Indicador[] {
  const metodos = datos.periodo.metodos_pago;
  const principal = metodos[0];
  return [
    {
      etiqueta: "Ingresos aprobados",
      valor: formatCurrency(sumar(metodos, (m) => m.ingresos)),
      detalle: `Últimos ${ventanaDe(periodo)}`,
    },
    {
      etiqueta: "Pagos aprobados",
      valor: formatNumber(sumar(metodos, (m) => m.cantidad)),
    },
    {
      etiqueta: "Método principal",
      valor: principal ? METODO_LABEL[principal.metodo] : "—",
      detalle: principal ? "Por ingresos" : undefined,
    },
  ];
}

function seccionComparacion(
  datos: ReporteData,
  periodo: Periodo,
): SeccionTabla {
  const { actual, anterior } = datos.periodo;
  const conteo = (
    etiqueta: string,
    campo: keyof Omit<TramoResumen, "ingresos">,
  ) => [
    etiqueta,
    actual[campo],
    anterior[campo],
    {
      valor: variacion(actual[campo], anterior[campo]).pct,
      tipo: "porcentaje" as const,
    },
  ];
  const tasa = tasaAprobacion(actual.aprobados, actual.rechazados);
  const tasaPrevia = tasaAprobacion(anterior.aprobados, anterior.rechazados);
  return {
    titulo: "Comparación con el período anterior",
    descripcion: `Últimos ${ventanaDe(periodo)} frente a los ${ventanaDe(periodo)} previos.`,
    columnas: [
      { titulo: "Indicador" },
      { titulo: "Actual", tipo: "entero" },
      { titulo: "Anterior", tipo: "entero" },
      { titulo: "Variación (%)", tipo: "porcentaje" },
    ],
    filas: [
      [
        "Ingresos (Bs.)",
        { valor: actual.ingresos, tipo: "decimal" },
        { valor: anterior.ingresos, tipo: "decimal" },
        {
          valor: variacion(actual.ingresos, anterior.ingresos).pct,
          tipo: "porcentaje",
        },
      ],
      conteo("Solicitudes recibidas", "total_pagos"),
      conteo("Pagos aprobados", "aprobados"),
      conteo("Pagos pendientes", "pendientes"),
      conteo("Pagos rechazados", "rechazados"),
      [
        "Tasa de aprobación (%)",
        { valor: tasa, tipo: "porcentaje" },
        { valor: tasaPrevia, tipo: "porcentaje" },
        {
          valor:
            tasa !== null && tasaPrevia !== null
              ? variacion(tasa, tasaPrevia).pct
              : null,
          tipo: "porcentaje",
        },
      ],
    ],
  };
}

function seccionSerie(datos: ReporteData, periodo: Periodo): SeccionTabla {
  const serie = datos.ingresos;
  const solicitudes = (f: (typeof serie)[number]) =>
    f.aprobados + f.pendientes + f.rechazados;
  const aprobados = sumar(serie, (f) => f.aprobados);
  const rechazados = sumar(serie, (f) => f.rechazados);
  return {
    titulo: "Ingresos por período",
    columnas: [
      { titulo: "Período" },
      { titulo: "Desde", tipo: "fecha" },
      { titulo: "Ingresos (Bs.)", tipo: "decimal" },
      { titulo: "Solicitudes", tipo: "entero" },
      { titulo: "Aprobados", tipo: "entero" },
      { titulo: "Pendientes", tipo: "entero" },
      { titulo: "Rechazados", tipo: "entero" },
      { titulo: "Tasa de aprobación (%)", tipo: "porcentaje" },
    ],
    filas: serie.map((f) => [
      capitalizar(etiquetaLarga(f.desde, periodo)),
      f.desde,
      f.total,
      solicitudes(f),
      f.aprobados,
      f.pendientes,
      f.rechazados,
      tasaAprobacion(f.aprobados, f.rechazados),
    ]),
    totales: [
      "Total",
      null,
      sumar(serie, (f) => f.total),
      sumar(serie, solicitudes),
      aprobados,
      sumar(serie, (f) => f.pendientes),
      rechazados,
      tasaAprobacion(aprobados, rechazados),
    ],
    vacio: "No hubo pagos en este período.",
  };
}

function seccionMetodos(datos: ReporteData, periodo: Periodo): SeccionTabla {
  const metodos = datos.periodo.metodos_pago;
  const ingresos = sumar(metodos, (m) => m.ingresos);
  return {
    titulo: "Métodos de pago",
    descripcion: `Pagos aprobados en los últimos ${ventanaDe(periodo)}.`,
    columnas: [
      { titulo: "Método" },
      { titulo: "Pagos", tipo: "entero" },
      { titulo: "Ingresos (Bs.)", tipo: "decimal" },
      { titulo: "Participación (%)", tipo: "porcentaje" },
    ],
    filas: metodos.map((m) => [
      METODO_LABEL[m.metodo],
      m.cantidad,
      m.ingresos,
      ingresos > 0 ? Math.round((m.ingresos / ingresos) * 1000) / 10 : null,
    ]),
    totales: [
      "Total",
      sumar(metodos, (m) => m.cantidad),
      ingresos,
      ingresos > 0 ? 100 : null,
    ],
    vacio: "Sin pagos aprobados en este período.",
  };
}

function seccionOcupacion(datos: ReporteData): SeccionTabla {
  const disponibles = (c: ReporteData["cursos"][number]) =>
    Math.max(0, c.limite_cupo - c.estudiantes);
  return {
    titulo: "Ocupación de cursos",
    descripcion: OCUPACION_ACTUAL,
    columnas: [
      { titulo: "Curso" },
      { titulo: "Código" },
      { titulo: "Estado" },
      { titulo: "Cupo", tipo: "entero" },
      { titulo: "Inscritos", tipo: "entero" },
      { titulo: "Disponibles", tipo: "entero" },
      { titulo: "Ocupación (%)", tipo: "porcentaje" },
      { titulo: "Nivel" },
    ],
    filas: datos.cursos.map((c) => {
      const pct = ocupacion(c.estudiantes, c.limite_cupo);
      return [
        c.nombre,
        c.codigo,
        c.estado === "activo" ? "Activo" : "Inactivo",
        c.limite_cupo,
        c.estudiantes,
        disponibles(c),
        pct,
        NIVEL_LABEL[nivelOcupacion(pct)],
      ];
    }),
    totales: [
      "Total",
      null,
      null,
      sumar(datos.cursos, (c) => c.limite_cupo),
      sumar(datos.cursos, (c) => c.estudiantes),
      sumar(datos.cursos, disponibles),
      null,
      null,
    ],
    vacio: "No hay cursos registrados.",
  };
}

function seccionCursos(datos: ReporteData): SeccionTabla {
  const filas = datos.pagos_por_curso;
  const aprobados = sumar(filas, (c) => c.aprobados);
  const rechazados = sumar(filas, (c) => c.rechazados);
  return {
    titulo: "Pagos por curso",
    descripcion: HISTORICO,
    columnas: [
      { titulo: "Curso" },
      { titulo: "Código" },
      { titulo: "Precio (Bs.)", tipo: "decimal" },
      { titulo: "Solicitudes", tipo: "entero" },
      { titulo: "Aprobados", tipo: "entero" },
      { titulo: "Pendientes", tipo: "entero" },
      { titulo: "Rechazados", tipo: "entero" },
      { titulo: "Tasa de aprobación (%)", tipo: "porcentaje" },
      { titulo: "Ingreso (Bs.)", tipo: "decimal" },
    ],
    filas: filas.map((c) => [
      c.nombre,
      c.codigo,
      c.precio,
      c.total_pagos,
      c.aprobados,
      c.pendientes,
      c.rechazados,
      tasaAprobacion(c.aprobados, c.rechazados),
      c.total_ingreso,
    ]),
    totales: [
      "Total",
      null,
      null,
      sumar(filas, (c) => c.total_pagos),
      aprobados,
      sumar(filas, (c) => c.pendientes),
      rechazados,
      tasaAprobacion(aprobados, rechazados),
      sumar(filas, (c) => c.total_ingreso),
    ],
    vacio: "Todavía no hay pagos registrados.",
  };
}

function seccionEstudiantes(datos: ReporteData): SeccionTabla {
  const filas = datos.pagos_por_usuario;
  return {
    titulo: "Pagos por estudiante",
    descripcion: HISTORICO,
    columnas: [
      { titulo: "Estudiante" },
      { titulo: "Pagos", tipo: "entero" },
      { titulo: "Aprobados", tipo: "entero" },
      { titulo: "Pendientes", tipo: "entero" },
      { titulo: "Rechazados", tipo: "entero" },
      { titulo: "Ingreso (Bs.)", tipo: "decimal" },
    ],
    filas: filas.map((u) => [
      u.nombre,
      u.total_pagos,
      u.aprobados,
      u.pendientes,
      u.rechazados,
      u.total_ingreso,
    ]),
    totales: [
      "Total",
      sumar(filas, (u) => u.total_pagos),
      sumar(filas, (u) => u.aprobados),
      sumar(filas, (u) => u.pendientes),
      sumar(filas, (u) => u.rechazados),
      sumar(filas, (u) => u.total_ingreso),
    ],
    vacio: "Todavía no hay pagos registrados.",
  };
}

function seccionPlataforma(datos: ReporteData): SeccionTabla {
  const media = ocupacionMedia(datos.cursos);
  const estudiantes = datos.estado_estudiantes ?? {};
  const cursos = datos.estado_cursos ?? {};
  return {
    titulo: "Plataforma",
    descripcion: "Situación actual de la matrícula y de la oferta de cursos.",
    columnas: [{ titulo: "Indicador" }, { titulo: "Valor", tipo: "entero" }],
    filas: [
      ["Estudiantes registrados", datos.totales.estudiantes],
      ["Estudiantes activos", estudiantes.activo ?? 0],
      ["Estudiantes graduados", estudiantes.graduado ?? 0],
      ["Estudiantes inactivos", estudiantes.inactivo ?? 0],
      ["Cursos registrados", datos.totales.cursos],
      ["Cursos activos", cursos.activo ?? 0],
      ["Cursos inactivos", cursos.inactivo ?? 0],
      ["Instructores", datos.totales.instructores],
      [
        "Ocupación media de cursos activos (%)",
        { valor: media, tipo: "porcentaje" },
      ],
    ],
  };
}

/** Arma el documento de un informe a partir de lo que devuelve la API. */
export function construirInforme(
  datos: ReporteData,
  que: Informe,
  periodo: Periodo,
): DocumentoExportable {
  const pie = "IMAF — Reportes";

  switch (que) {
    case "completo":
      return {
        titulo: "Reporte general",
        subtitulos: [alcancePeriodo(datos, periodo)],
        nombreArchivo: `reporte-general-${periodo}`,
        pie,
        indicadores: indicadoresPeriodo(datos, periodo),
        secciones: [
          seccionComparacion(datos, periodo),
          seccionSerie(datos, periodo),
          seccionMetodos(datos, periodo),
          seccionPlataforma(datos),
          seccionOcupacion(datos),
          seccionCursos(datos),
          seccionEstudiantes(datos),
        ],
      };
    case "serie":
      return {
        titulo: "Ingresos por período",
        subtitulos: [alcancePeriodo(datos, periodo)],
        nombreArchivo: `ingresos-${periodo}`,
        pie,
        indicadores: indicadoresPeriodo(datos, periodo),
        secciones: [seccionSerie(datos, periodo)],
      };
    case "metodos":
      return {
        titulo: "Métodos de pago",
        subtitulos: [alcancePeriodo(datos, periodo)],
        nombreArchivo: `metodos-de-pago-${periodo}`,
        pie,
        indicadores: indicadoresMetodos(datos, periodo),
        secciones: [
          { ...seccionMetodos(datos, periodo), descripcion: undefined },
        ],
      };
    case "ocupacion":
      return {
        titulo: "Ocupación de cursos",
        subtitulos: [OCUPACION_ACTUAL],
        nombreArchivo: "ocupacion-de-cursos",
        pie,
        indicadores: indicadoresOcupacion(datos),
        secciones: [{ ...seccionOcupacion(datos), descripcion: undefined }],
      };
    case "cursos":
      return {
        titulo: "Pagos por curso",
        subtitulos: [HISTORICO],
        nombreArchivo: "pagos-por-curso",
        pie,
        indicadores: indicadoresHistoricos(datos, {
          etiqueta: "Cursos con pagos",
          valor: formatNumber(datos.pagos_por_curso.length),
        }),
        secciones: [{ ...seccionCursos(datos), descripcion: undefined }],
      };
    case "estudiantes":
      return {
        titulo: "Pagos por estudiante",
        subtitulos: [HISTORICO],
        nombreArchivo: "pagos-por-estudiante",
        pie,
        indicadores: indicadoresHistoricos(datos, {
          etiqueta: "Estudiantes con pagos",
          valor: formatNumber(datos.pagos_por_usuario.length),
        }),
        secciones: [{ ...seccionEstudiantes(datos), descripcion: undefined }],
      };
  }
}

/** Descarga un informe en el formato elegido. */
export async function exportarReporte(
  datos: ReporteData,
  que: Informe,
  periodo: Periodo,
  formato: FormatoReporte,
) {
  await exportarDocumento(construirInforme(datos, que, periodo), formato);
}
