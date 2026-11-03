import type { SheetData } from "write-excel-file/browser";

import { formatDate } from "@/lib/format";

import { descargarCsv } from "./metricas";

export type FormatoReporte = "csv" | "pdf" | "excel";

export interface TablaReporte {
  /** Título visible en PDF y nombre de la hoja en Excel. */
  titulo: string;
  /** Nombre del archivo sin extensión. */
  nombreArchivo: string;
  columnas: string[];
  filas: (string | number)[][];
  /** Índices de columnas numéricas, para alinearlas a la derecha. */
  numericas?: number[];
}

const PRIMARY: [number, number, number] = [181, 37, 105];
const TEXTO: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 110, 110];
const FRANJA: [number, number, number] = [250, 240, 245];
const MARGEN = 12;

function nombreHoja(titulo: string) {
  return titulo.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Reporte";
}

async function exportarExcel(tabla: TablaReporte) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const encabezado: SheetData[number] = tabla.columnas.map((columna) => ({
    value: columna,
    fontWeight: "bold",
    backgroundColor: "#fbdde8",
    textColor: "#7a0f43",
    align: "center",
    wrap: true,
  }));

  const cuerpo: SheetData = tabla.filas.map((fila) =>
    fila.map((valor, i) => ({
      value: valor,
      align: tabla.numericas?.includes(i) ? "right" : "left",
    })),
  );

  const anchos = tabla.columnas.map((columna, i) => {
    const mayor = Math.max(
      columna.length,
      ...tabla.filas.map((f) => String(f[i] ?? "").length),
    );
    return { width: Math.min(40, Math.max(12, mayor + 2)) };
  });

  await writeXlsxFile([encabezado, ...cuerpo], {
    sheet: nombreHoja(tabla.titulo),
    columns: anchos,
  }).toFile(`${tabla.nombreArchivo}.xlsx`);
}

async function exportarPdf(tabla: TablaReporte) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXTO);
  doc.text("IMAF", MARGEN, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    "Instituto de la Mujer, Atención a la Familia y Formación para el Trabajo",
    MARGEN,
    24,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.text(tabla.titulo, MARGEN, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generado el ${formatDate(new Date().toISOString())}`,
    ancho - MARGEN,
    18,
    { align: "right" },
  );

  const columnStyles: Record<number, { halign: "right" }> = {};
  for (const i of tabla.numericas ?? []) {
    columnStyles[i] = { halign: "right" };
  }

  autoTable(doc, {
    startY: 37,
    head: [tabla.columnas],
    body: tabla.filas,
    theme: "striped",
    headStyles: {
      fillColor: PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
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
    margin: { left: MARGEN, right: MARGEN },
    didDrawPage: ({ pageNumber }) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("IMAF — Reportes", MARGEN, alto - 8);
      doc.text(`Página ${pageNumber}`, ancho - MARGEN, alto - 8, {
        align: "right",
      });
    },
  });

  doc.save(`${tabla.nombreArchivo}.pdf`);
}

/** Descarga una tabla de reporte en el formato elegido. */
export async function exportarReporte(
  tabla: TablaReporte,
  formato: FormatoReporte,
) {
  if (formato === "csv") {
    descargarCsv(`${tabla.nombreArchivo}.csv`, [
      tabla.columnas,
      ...tabla.filas,
    ]);
    return;
  }
  if (formato === "excel") {
    await exportarExcel(tabla);
    return;
  }
  await exportarPdf(tabla);
}
