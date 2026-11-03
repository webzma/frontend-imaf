import type { SheetData } from "write-excel-file/browser";

import { LOCALE, formatDate } from "@/lib/format";

export type FormatoExportacion = "csv" | "pdf" | "excel";

export interface EstudianteExport {
  nombre: string;
  cedula: string;
  telefono?: string | null;
  user: { email: string };
  estado: "activo" | "inactivo" | "graduado";
  estado_pago: "pendiente" | "aprobado" | "reprobado";
  deleted_at: string | null;
  fecha_inscripcion: string;
}

export interface CursoExport {
  nombre: string;
  codigo: string;
  instructor: { user: { name: string } } | null;
  estudiantes: EstudianteExport[];
}

const ESTADO_LABEL: Record<EstudianteExport["estado"], string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  graduado: "Graduado",
};

const PAGO_LABEL: Record<EstudianteExport["estado_pago"], string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  reprobado: "Rechazado",
};

const COLUMNAS = [
  "#",
  "Nombre",
  "Cédula",
  "Teléfono",
  "Estado",
  "Pago",
  "Inscripción",
];

const PRIMARY: [number, number, number] = [181, 37, 105];
const TEXTO: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 110, 110];
const FRANJA: [number, number, number] = [250, 240, 245];
const MARGEN = 14;

function nombreBase(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${limpio || "curso"}-estudiantes`;
}

function filas(curso: CursoExport): (string | number)[][] {
  return curso.estudiantes.map((e, i) => [
    i + 1,
    e.nombre,
    e.cedula,
    e.telefono || "—",
    ESTADO_LABEL[e.estado] ?? e.estado,
    PAGO_LABEL[e.estado_pago] ?? e.estado_pago,
    formatDate(e.fecha_inscripcion),
  ]);
}

function exportarCsv(curso: CursoExport) {
  const escapar = (v: string | number) => {
    const t = String(v);
    return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = [COLUMNAS, ...filas(curso)]
    .map((fila) => fila.map(escapar).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreBase(curso.nombre)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportarExcel(curso: CursoExport) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const encabezado: SheetData[number] = COLUMNAS.map((columna) => ({
    value: columna,
    fontWeight: "bold",
    backgroundColor: "#fbdde8",
    textColor: "#7a0f43",
    align: "center",
    wrap: true,
  }));

  const cuerpo: SheetData = filas(curso).map((fila) =>
    fila.map((valor, i) => ({
      value: valor,
      align: i === 0 ? "right" : "left",
    })),
  );

  const anchos = COLUMNAS.map((columna, i) => {
    const mayor = Math.max(
      columna.length,
      ...filas(curso).map((f) => String(f[i] ?? "").length),
    );
    return { width: Math.min(40, Math.max(12, mayor + 2)) };
  });

  await writeXlsxFile([encabezado, ...cuerpo], {
    sheet: "Estudiantes",
    columns: anchos,
  }).toFile(`${nombreBase(curso.nombre)}.xlsx`);
}

async function exportarPdf(curso: CursoExport) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXTO);
  doc.text(curso.nombre, MARGEN, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Código: ${curso.codigo}`, MARGEN, 27);
  doc.text(
    `Instructor: ${curso.instructor?.user.name ?? "Sin instructor"}`,
    MARGEN,
    32,
  );
  doc.text(
    `Generado el ${new Date().toLocaleDateString(LOCALE, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`,
    ancho - MARGEN,
    27,
    { align: "right" },
  );

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(MARGEN, 35, ancho - MARGEN, 35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);
  doc.text(`Estudiantes inscritos: ${curso.estudiantes.length}`, MARGEN, 42);

  autoTable(doc, {
    startY: 46,
    head: [COLUMNAS],
    body: filas(curso),
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
    columnStyles: {
      0: { cellWidth: 8, halign: "right" },
      2: { cellWidth: 22 },
      6: { cellWidth: 24 },
    },
    margin: { left: MARGEN, right: MARGEN },
    didDrawPage: ({ pageNumber }) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("IMAF — Gestión de cursos", MARGEN, alto - 8);
      doc.text(`Página ${pageNumber}`, ancho - MARGEN, alto - 8, {
        align: "right",
      });
    },
  });

  doc.save(`${nombreBase(curso.nombre)}.pdf`);
}

/** Genera y descarga el listado completo de inscritos de un curso. */
export async function exportarEstudiantes(
  curso: CursoExport,
  formato: FormatoExportacion,
) {
  if (formato === "csv") {
    exportarCsv(curso);
    return;
  }
  if (formato === "excel") {
    await exportarExcel(curso);
    return;
  }
  await exportarPdf(curso);
}
