import type { CellObject, Sheet, SheetData } from "write-excel-file/browser";

import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/format";

export type FormatoTabla = "csv" | "pdf" | "excel";

/**
 * Cómo se interpreta un valor. Las filas guardan el dato crudo (número o fecha
 * ISO) y cada formato lo presenta a su manera: el PDF lo escribe para leerlo,
 * Excel lo guarda como número o fecha reales para poder operar con él y el CSV
 * lo deja sin adornos para poder importarlo.
 */
export type TipoColumna =
  | "texto"
  | "entero"
  | "decimal"
  | "porcentaje"
  | "fecha";

export type ValorCelda = string | number | null;

/** Celda de distinto tipo que su columna (tablas de indicadores mixtos). */
export interface CeldaTipada {
  valor: ValorCelda;
  tipo: TipoColumna;
}

export type Celda = ValorCelda | CeldaTipada;

export interface Columna {
  titulo: string;
  /** Por defecto, `texto`. Los porcentajes se expresan de 0 a 100. */
  tipo?: TipoColumna;
  /** Ancho fijo en el PDF, en mm. Sin él, se reparte según el contenido. */
  anchoPdf?: number;
}

export interface SeccionTabla {
  /** Encabezado en el PDF y nombre de la hoja en Excel. */
  titulo: string;
  /** Aclara el alcance de la tabla (p. ej. si es histórica). */
  descripcion?: string;
  columnas: Columna[];
  filas: Celda[][];
  /** Fila de totales. No se incluye en el CSV, que es solo datos. */
  totales?: Celda[];
  /** Mensaje del PDF y de Excel cuando no hay filas. */
  vacio?: string;
}

export interface Indicador {
  etiqueta: string;
  valor: string;
  detalle?: string;
}

export interface DocumentoExportable {
  titulo: string;
  /** Líneas de contexto bajo el título: rango de fechas, filtros, curso… */
  subtitulos?: string[];
  /** Nombre del archivo sin extensión ni fecha. */
  nombreArchivo: string;
  /** Texto del pie de página del PDF. */
  pie?: string;
  /** Cifras clave: tarjetas en el PDF y hoja «Resumen» en Excel. */
  indicadores?: Indicador[];
  secciones: SeccionTabla[];
}

const INSTITUTO =
  "Instituto de la Mujer, Atención a la Familia y Formación para el Trabajo";

/** El PDF no lee `globals.css`: son los tokens `primary`, `on-surface`, etc. */
const PRIMARY: [number, number, number] = [181, 37, 105];
const TEXTO: [number, number, number] = [26, 24, 23];
const MUTED: [number, number, number] = [95, 91, 89];
const FRANJA: [number, number, number] = [250, 240, 245];
const CONTENEDOR: [number, number, number] = [251, 221, 232];
const SOBRE_CONTENEDOR: [number, number, number] = [122, 15, 67];
const HEX_CONTENEDOR = "#fbdde8";
const HEX_SOBRE_CONTENEDOR = "#7a0f43";
const HEX_PRIMARY = "#b52569";
const HEX_MUTED = "#5f5b59";

const MARGEN = 12;
const ALTO_BANDA = 24;
const MARGEN_INFERIOR = 16;
const ANCHO_MAX_EXCEL = 44;
/** Estimación de la altura de una fila del PDF, en mm. */
const ALTO_FILA = 7.2;
const FILAS_TABLA_CORTA = 15;

const HOJA_RESUMEN = "Resumen";

/**
 * Sin esto el archivo no declara nombre ni tamaño de fuente, y cada programa
 * elige uno distinto para las celdas con estilo y para las que no lo tienen.
 */
export const OPCIONES_EXCEL = { fontFamily: "Calibri", fontSize: 11 };

function celda(valor: Celda, columna: Columna): CeldaTipada {
  if (valor !== null && typeof valor === "object") return valor;
  return { valor, tipo: columna.tipo ?? "texto" };
}

function alinear(tipo: TipoColumna | undefined): "left" | "right" {
  return tipo === "entero" || tipo === "decimal" || tipo === "porcentaje"
    ? "right"
    : "left";
}

/** Solo el tramo de fecha, venga como "YYYY-MM-DD" o como ISO completo. */
function fechaIso(valor: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(valor) ? valor.slice(0, 10) : null;
}

/** El dato tal como se lee: "1.234,50", "75%", "02 mar. 2026". */
export function textoCelda({ valor, tipo }: CeldaTipada): string {
  if (valor === null || valor === "") return "—";
  if (typeof valor === "number") {
    if (tipo === "entero") return formatNumber(valor);
    if (tipo === "decimal") return formatNumber(valor, 2);
    if (tipo === "porcentaje") return formatPercent(valor);
    return String(valor);
  }
  if (tipo === "fecha" && fechaIso(valor)) return formatDate(valor);
  return valor;
}

/**
 * Los espacios finos que `toLocaleString` mete en la hora ("p. m.") no existen
 * en la codificación de las fuentes estándar del PDF y saldrían como basura.
 */
function sinEspaciosEspeciales(texto: string) {
  return texto.replace(/[   ]/g, " ");
}

function nombreHoja(titulo: string, usadas: Set<string>) {
  const base = titulo.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Datos";
  let nombre = base;
  for (let n = 2; usadas.has(nombre); n++) {
    const sufijo = ` ${n}`;
    nombre = `${base.slice(0, 31 - sufijo.length)}${sufijo}`;
  }
  usadas.add(nombre);
  return nombre;
}

/** Fecha local, no la de UTC: de noche en Venezuela ya sería «mañana». */
function fechaLocalIso(ahora: Date) {
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function nombreConFecha(nombre: string, ahora: Date) {
  return `${nombre}-${fechaLocalIso(ahora)}`;
}

function generadoEl(ahora: Date) {
  return `Generado el ${sinEspaciosEspeciales(formatDateTime(ahora.toISOString()))}`;
}

/** "Curso de Corte y Costura" → "curso-de-corte-y-costura". */
export function slugArchivo(texto: string, respaldo = "reporte") {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || respaldo
  );
}

/* ── CSV ── */

function valorCsv({ valor, tipo }: CeldaTipada): string {
  if (valor === null) return "";
  if (typeof valor === "number") return String(valor);
  if (tipo === "fecha") return fechaIso(valor) ?? valor;
  // Un nombre como `=HYPERLINK(...)` se ejecutaría como fórmula al abrir el CSV
  // en una hoja de cálculo; el apóstrofo hace que se lea como texto.
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

export function contenidoCsv(seccion: SeccionTabla): string {
  const escapar = (t: string) =>
    /[",;\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  const filas = [
    seccion.columnas.map((c) =>
      escapar(valorCsv({ valor: c.titulo, tipo: "texto" })),
    ),
    ...seccion.filas.map((fila) =>
      fila.map((v, i) => escapar(valorCsv(celda(v, seccion.columnas[i])))),
    ),
  ];
  return filas.map((f) => f.join(",")).join("\r\n");
}

/** Descarga un CSV (con BOM para que Excel respete las tildes). */
function descargarCsv(nombre: string, contenido: string) {
  const blob = new Blob(["﻿" + contenido], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Excel ── */

function celdaExcel({ valor, tipo }: CeldaTipada): CellObject {
  const align = alinear(tipo);
  if (valor === null) return { value: undefined, align };
  if (typeof valor === "number") {
    if (tipo === "porcentaje") {
      return {
        value: valor / 100,
        format: Number.isInteger(valor) ? "0%" : "0.0%",
        align,
      };
    }
    return {
      value: valor,
      format: tipo === "decimal" ? "#,##0.00" : "#,##0",
      align,
    };
  }
  const iso = tipo === "fecha" ? fechaIso(valor) : null;
  if (iso) {
    return {
      value: new Date(`${iso}T00:00:00Z`),
      format: "dd/mm/yyyy",
      align: "left",
    };
  }
  return { value: valor, align, wrap: valor.length > ANCHO_MAX_EXCEL };
}

/** Ancho para que el título quepa en dos líneas sin partir ninguna palabra. */
function anchoEncabezado(titulo: string) {
  const palabraMayor = Math.max(...titulo.split(" ").map((p) => p.length));
  return Math.max(palabraMayor + 2, Math.ceil(titulo.length / 2) + 4);
}

function hojaDatos(seccion: SeccionTabla, sheet: string): Sheet<Blob> {
  const { columnas, filas, totales } = seccion;

  const encabezado: SheetData[number] = columnas.map((c) => ({
    value: c.titulo,
    fontWeight: "bold",
    backgroundColor: HEX_CONTENEDOR,
    textColor: HEX_SOBRE_CONTENEDOR,
    align: alinear(c.tipo),
    alignVertical: "center",
    wrap: true,
    // El alto no se ajusta solo en todos los programas: caben dos líneas.
    height: 32,
  }));

  const cuerpo: SheetData = filas.map((fila) =>
    fila.map((v, i) => celdaExcel(celda(v, columnas[i]))),
  );

  const pie: SheetData =
    totales && filas.length > 0
      ? [
          totales.map((v, i) => ({
            ...celdaExcel(celda(v, columnas[i])),
            fontWeight: "bold",
            backgroundColor: HEX_CONTENEDOR,
            textColor: HEX_SOBRE_CONTENEDOR,
            topBorderStyle: "thin",
            topBorderColor: HEX_SOBRE_CONTENEDOR,
          })),
        ]
      : [];

  const vacio: SheetData =
    filas.length === 0
      ? [[{ value: seccion.vacio ?? "Sin datos.", textColor: HEX_MUTED }]]
      : [];

  const anchos = columnas.map((c, i) => {
    const textos = [...filas, ...(totales ? [totales] : [])].map((f) =>
      textoCelda(celda(f[i], c)),
    );
    const contenido = Math.max(0, ...textos.map((t) => t.length)) + 2;
    return {
      width: Math.min(
        ANCHO_MAX_EXCEL,
        Math.max(6, anchoEncabezado(c.titulo), contenido),
      ),
    };
  });

  return {
    data: [encabezado, ...cuerpo, ...vacio, ...pie],
    sheet,
    columns: anchos,
    stickyRowsCount: 1,
    // Al imprimir, una tabla ancha en vertical se parte en varias páginas.
    orientation: "landscape",
  };
}

function hojaResumen(
  doc: DocumentoExportable,
  ahora: Date,
  hojas: string[],
): Sheet<Blob> {
  const nota = (value: string): SheetData[number] => [
    { value, textColor: HEX_MUTED, columnSpan: 3, wrap: true },
    null,
    null,
  ];
  const encabezado = (
    textos: string[],
    derecha: string[] = [],
  ): SheetData[number] =>
    textos.map((value) => ({
      value,
      fontWeight: "bold",
      backgroundColor: HEX_CONTENEDOR,
      textColor: HEX_SOBRE_CONTENEDOR,
      align: derecha.includes(value) ? "right" : "left",
    }));

  const data: SheetData = [
    [
      {
        value: doc.titulo,
        fontWeight: "bold",
        fontSize: 14,
        textColor: HEX_PRIMARY,
        columnSpan: 3,
      },
      null,
      null,
    ],
    nota(INSTITUTO),
    ...(doc.subtitulos ?? []).map(nota),
    nota(generadoEl(ahora)),
  ];

  if (doc.indicadores?.length) {
    data.push(
      [],
      encabezado(["Indicador", "Valor", "Detalle"], ["Valor"]),
      ...doc.indicadores.map((i): SheetData[number] => [
        { value: i.etiqueta },
        { value: i.valor, fontWeight: "bold", align: "right" },
        { value: i.detalle ?? "", textColor: HEX_MUTED, wrap: true },
      ]),
    );
  }

  const descritas = doc.secciones
    .map((s, i) => ({ hoja: hojas[i], descripcion: s.descripcion }))
    .filter((s) => s.descripcion);
  if (descritas.length > 0) {
    data.push(
      [],
      encabezado(["Hoja", "Alcance", ""]),
      ...descritas.map((s): SheetData[number] => [
        { value: s.hoja },
        { value: s.descripcion, columnSpan: 2, wrap: true },
        null,
      ]),
    );
  }

  return {
    data,
    sheet: HOJA_RESUMEN,
    columns: [{ width: 32 }, { width: 22 }, { width: 46 }],
    showGridLines: false,
    orientation: "landscape",
  };
}

/** Una hoja «Resumen» con el contexto y una hoja limpia por cada tabla. */
export function hojasExcel(
  doc: DocumentoExportable,
  ahora: Date,
): Sheet<Blob>[] {
  const usadas = new Set([HOJA_RESUMEN]);
  const nombres = doc.secciones.map((s) => nombreHoja(s.titulo, usadas));
  return [
    hojaResumen(doc, ahora, nombres),
    ...doc.secciones.map((s, i) => hojaDatos(s, nombres[i])),
  ];
}

/* ── PDF ── */

type Pdf = import("jspdf").jsPDF;

function posicionFinal(doc: Pdf, respaldo: number) {
  const { lastAutoTable } = doc as Pdf & {
    lastAutoTable?: { finalY: number };
  };
  return lastAutoTable?.finalY ?? respaldo;
}

function dibujarCabecera(doc: Pdf, datos: DocumentoExportable, ahora: Date) {
  const ancho = doc.internal.pageSize.getWidth();
  const util = ancho - 2 * MARGEN;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, ancho, ALTO_BANDA, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("IMAF", MARGEN, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(INSTITUTO, MARGEN, 18);
  doc.setFontSize(8);
  doc.text(generadoEl(ahora), ancho - MARGEN, 12, { align: "right" });

  let y = ALTO_BANDA + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...TEXTO);
  const titulo: string[] = doc.splitTextToSize(datos.titulo, util);
  doc.text(titulo, MARGEN, y);
  y += (titulo.length - 1) * 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  y += 1;
  for (const linea of datos.subtitulos ?? []) {
    for (const parte of doc.splitTextToSize(linea, util) as string[]) {
      y += 4.5;
      doc.text(parte, MARGEN, y);
    }
  }
  return y + 5;
}

function dibujarIndicadores(
  doc: Pdf,
  indicadores: Indicador[],
  inicio: number,
) {
  const ancho = doc.internal.pageSize.getWidth();
  const hueco = 3;
  const alto = 21;
  const util = ancho - 2 * MARGEN;
  const porFila = Math.min(indicadores.length, util > 200 ? 5 : 4);
  const anchoTarjeta = (util - hueco * (porFila - 1)) / porFila;

  indicadores.forEach((indicador, i) => {
    const x = MARGEN + (i % porFila) * (anchoTarjeta + hueco);
    const y = inicio + Math.floor(i / porFila) * (alto + hueco);
    const interior = anchoTarjeta - 6;

    doc.setFillColor(...FRANJA);
    doc.roundedRect(x, y, anchoTarjeta, alto, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    const [etiqueta] = doc.splitTextToSize(
      indicador.etiqueta.toUpperCase(),
      interior,
    ) as string[];
    doc.text(etiqueta, x + 3, y + 5);

    // Encoge la cifra antes que dejar que se salga de su tarjeta.
    let tamano = 13;
    doc.setFontSize(tamano);
    while (tamano > 8 && doc.getTextWidth(indicador.valor) > interior) {
      tamano -= 0.5;
      doc.setFontSize(tamano);
    }
    doc.setTextColor(...PRIMARY);
    doc.text(indicador.valor, x + 3, y + 11.5);

    if (indicador.detalle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      const lineas: string[] = doc.splitTextToSize(indicador.detalle, interior);
      doc.text(lineas.slice(0, 2), x + 3, y + 15.5);
    }
  });

  const filas = Math.ceil(indicadores.length / porFila);
  return inicio + filas * alto + (filas - 1) * hueco + 6;
}

function dibujarPies(doc: Pdf, pie: string) {
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(pie, MARGEN, alto - 8);
    doc.text(`Página ${pagina} de ${total}`, ancho - MARGEN, alto - 8, {
      align: "right",
    });
  }
}

/** Compone el PDF sin descargarlo. */
export async function construirPdf(datos: DocumentoExportable, ahora: Date) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  // Las tablas anchas no caben en vertical sin partir cada palabra.
  const columnasMax = Math.max(
    ...datos.secciones.map((s) => s.columnas.length),
  );
  const doc = new jsPDF({
    orientation: columnasMax > 6 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  doc.setProperties({
    title: datos.titulo,
    subject: datos.subtitulos?.join(" · ") ?? "",
    author: "IMAF",
    creator: "IMAF",
  });
  const alto = doc.internal.pageSize.getHeight();
  const util = doc.internal.pageSize.getWidth() - 2 * MARGEN;

  let y = dibujarCabecera(doc, datos, ahora);
  if (datos.indicadores?.length) {
    y = dibujarIndicadores(doc, datos.indicadores, y);
  }

  datos.secciones.forEach((seccion, indice) => {
    const conEncabezado = datos.secciones.length > 1 || !!seccion.descripcion;

    // Una tabla corta no se parte si cabe entera en la página siguiente, y un
    // título nunca se queda solo al final de la página, separado de su tabla.
    const esCorta = seccion.filas.length <= FILAS_TABLA_CORTA;
    const necesario = esCorta
      ? (seccion.filas.length + 2) * ALTO_FILA + 10
      : 30;
    if (conEncabezado && indice > 0 && y + necesario > alto - MARGEN_INFERIOR) {
      doc.addPage();
      y = MARGEN + 4;
    }

    if (conEncabezado) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...PRIMARY);
      doc.text(seccion.titulo, MARGEN, y);
      y += 1.5;
      if (seccion.descripcion) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        for (const parte of doc.splitTextToSize(
          seccion.descripcion,
          util,
        ) as string[]) {
          y += 3.5;
          doc.text(parte, MARGEN, y);
        }
      }
      y += 2;
    }

    const { columnas, filas, totales } = seccion;
    const columnStyles: Record<number, { cellWidth: number }> = {};
    columnas.forEach((c, i) => {
      if (c.anchoPdf) columnStyles[i] = { cellWidth: c.anchoPdf };
    });

    const fila = (valores: Celda[]) =>
      valores.map((v, i) => ({
        content: textoCelda(celda(v, columnas[i])),
        styles: { halign: alinear(columnas[i].tipo) },
      }));

    autoTable(doc, {
      startY: y,
      head: [
        columnas.map((c) => ({
          content: c.titulo,
          styles: { halign: alinear(c.tipo) },
        })),
      ],
      body:
        filas.length > 0
          ? filas.map(fila)
          : [
              [
                {
                  content: seccion.vacio ?? "Sin datos.",
                  colSpan: columnas.length,
                  styles: { halign: "center", textColor: MUTED },
                },
              ],
            ],
      foot: totales && filas.length > 0 ? [fila(totales)] : undefined,
      showFoot: "lastPage",
      theme: "striped",
      headStyles: {
        fillColor: PRIMARY,
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8.5,
        valign: "middle",
      },
      footStyles: {
        fillColor: CONTENEDOR,
        textColor: SOBRE_CONTENEDOR,
        fontStyle: "bold",
      },
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        textColor: TEXTO,
      },
      alternateRowStyles: { fillColor: FRANJA },
      columnStyles,
      rowPageBreak: "avoid",
      margin: {
        left: MARGEN,
        right: MARGEN,
        top: MARGEN,
        bottom: MARGEN_INFERIOR,
      },
    });

    if (indice < datos.secciones.length - 1) {
      y = posicionFinal(doc, y) + 9;
    }
  });

  dibujarPies(doc, datos.pie ?? "IMAF");
  return doc;
}

/** Descarga el documento en el formato elegido. */
export async function exportarDocumento(
  datos: DocumentoExportable,
  formato: FormatoTabla,
) {
  const ahora = new Date();
  const nombre = nombreConFecha(datos.nombreArchivo, ahora);

  if (formato === "csv") {
    // Un CSV es una sola tabla: repartir varias en él lo haría inimportable.
    if (datos.secciones.length !== 1) {
      throw new Error("El CSV solo admite documentos de una tabla.");
    }
    descargarCsv(`${nombre}.csv`, contenidoCsv(datos.secciones[0]));
    return;
  }
  if (formato === "excel") {
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    await writeXlsxFile(hojasExcel(datos, ahora), OPCIONES_EXCEL).toFile(
      `${nombre}.xlsx`,
    );
    return;
  }
  const doc = await construirPdf(datos, ahora);
  doc.save(`${nombre}.pdf`);
}
