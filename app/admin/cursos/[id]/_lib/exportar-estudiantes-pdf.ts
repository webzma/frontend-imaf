import { LOCALE, formatDate } from "@/lib/format";

export interface EstudiantePdf {
  nombre: string;
  cedula: string;
  telefono?: string | null;
  user: { email: string };
  estado: "activo" | "inactivo" | "graduado";
  estado_pago: "pendiente" | "aprobado" | "reprobado";
  deleted_at: string | null;
  fecha_inscripcion: string;
}

export interface CursoPdf {
  nombre: string;
  codigo: string;
  instructor: { user: { name: string } } | null;
  estudiantes: EstudiantePdf[];
}

const ESTADO_LABEL: Record<EstudiantePdf["estado"], string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  graduado: "Graduado",
};

const PAGO_LABEL: Record<EstudiantePdf["estado_pago"], string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  reprobado: "Rechazado",
};

const PRIMARY: [number, number, number] = [181, 37, 105];
const TEXTO: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 110, 110];
const FRANJA: [number, number, number] = [250, 240, 245];
const MARGEN = 14;

function nombreArchivo(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${limpio || "curso"}-estudiantes.pdf`;
}

/**
 * Genera y descarga el listado completo de inscritos de un curso.
 * jsPDF se carga de forma dinámica para no pesar en el bundle inicial.
 */
export async function exportarEstudiantesPdf(curso: CursoPdf) {
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
    head: [
      ["#", "Nombre", "Cédula", "Teléfono", "Estado", "Pago", "Inscripción"],
    ],
    body: curso.estudiantes.map((e, i) => [
      String(i + 1),
      e.nombre,
      e.cedula,
      e.telefono || "—",
      ESTADO_LABEL[e.estado] ?? e.estado,
      PAGO_LABEL[e.estado_pago] ?? e.estado_pago,
      formatDate(e.fecha_inscripcion),
    ]),
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

  doc.save(nombreArchivo(curso.nombre));
}
