import { formatCurrency, formatDate } from "@/lib/format";
import { SEDE } from "@/lib/modalidad";

export type MetodoPagoComprobante = "transferencia" | "pago_movil" | "efectivo";

export interface ComprobantePagoData {
  /** Número visible del comprobante, p. ej. "IMAF-2026-000123". */
  numero: string;
  /** Fecha del pago en formato ISO. */
  fecha: string;
  estudiante: {
    nombre: string;
    cedula: string;
    email?: string | null;
    telefono?: string | null;
  };
  curso: {
    nombre: string;
    codigo: string;
    instructor?: string | null;
    precio: number;
  };
  pago: {
    metodo?: MetodoPagoComprobante | null;
    referencia?: string | null;
    banco?: string | null;
    /** Si se omite, se usa el precio del curso. */
    monto?: number | null;
  };
}

const METODO_LABEL: Record<MetodoPagoComprobante, string> = {
  transferencia: "Transferencia bancaria",
  pago_movil: "Pago móvil",
  efectivo: "Efectivo",
};

const PRIMARY: [number, number, number] = [181, 37, 105];
const DARK: [number, number, number] = [45, 35, 40];
const MUTED: [number, number, number] = [115, 100, 108];
const SOFT: [number, number, number] = [250, 240, 245];
const BORDER: [number, number, number] = [228, 208, 218];
const MARGEN = 14;

function nombreArchivo(numero: string) {
  const limpio = numero
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `comprobante-pago-${limpio || "imaf"}.pdf`;
}

function dato(
  doc: import("jspdf").jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  const texto = value.length > 46 ? `${value.slice(0, 45)}...` : value;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text(texto, x, y + 4);
}

/**
 * Genera y descarga el comprobante de pago de una inscripción.
 * jsPDF se carga de forma dinámica para no pesar en el bundle inicial.
 */
export async function descargarComprobantePago(data: ComprobantePagoData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const monto = data.pago.monto ?? data.curso.precio;
  const colDerecha = MARGEN + 92;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, ancho, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("IMAF", MARGEN, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Instituto de la Mujer, Atención a la Familia", MARGEN, 22);
  doc.text("y Formación para el Trabajo", MARGEN, 26.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("COMPROBANTE DE PAGO", ancho - MARGEN, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`N° ${data.numero}`, ancho - MARGEN, 21.5, { align: "right" });
  doc.text(
    `Emitido: ${formatDate(new Date().toISOString())}`,
    ancho - MARGEN,
    26.5,
    {
      align: "right",
    },
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY);
  doc.text("DATOS DEL ESTUDIANTE", MARGEN, 46);
  doc.text("DATOS DEL CURSO", colDerecha, 46);

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, 48.5, ancho - MARGEN, 48.5);

  dato(doc, "Nombre", data.estudiante.nombre, MARGEN, 55);
  dato(doc, "Cédula", data.estudiante.cedula, MARGEN, 66);
  dato(doc, "Teléfono", data.estudiante.telefono || "—", MARGEN, 77);
  dato(doc, "Email", data.estudiante.email || "—", MARGEN, 88);

  dato(doc, "Curso", data.curso.nombre, colDerecha, 55);
  dato(doc, "Código", data.curso.codigo, colDerecha, 66);
  dato(
    doc,
    "Instructor",
    data.curso.instructor || "Sin instructor asignado",
    colDerecha,
    77,
  );
  dato(doc, "Fecha del pago", formatDate(data.fecha), colDerecha, 88);

  const cajaY = 102;
  const cajaAlto = 42;
  doc.setFillColor(...SOFT);
  doc.roundedRect(MARGEN, cajaY, ancho - 2 * MARGEN, cajaAlto, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY);
  doc.text("DETALLE DEL PAGO", MARGEN + 5, cajaY + 8);

  dato(
    doc,
    "Método de pago",
    data.pago.metodo ? METODO_LABEL[data.pago.metodo] : "—",
    MARGEN + 5,
    cajaY + 16,
  );
  dato(doc, "Referencia", data.pago.referencia || "—", MARGEN + 5, cajaY + 27);
  dato(doc, "Banco de origen", data.pago.banco || "—", colDerecha, cajaY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("MONTO PAGADO", ancho - MARGEN - 5, cajaY + 24, { align: "right" });
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY);
  doc.text(formatCurrency(monto), ancho - MARGEN - 5, cajaY + 33, {
    align: "right",
  });

  doc.setFillColor(232, 245, 238);
  doc.roundedRect(MARGEN, cajaY + cajaAlto + 8, 38, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(22, 122, 74);
  doc.text("PAGO APROBADO", MARGEN + 19, cajaY + cajaAlto + 13.3, {
    align: "center",
  });

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, alto - 30, ancho - MARGEN, alto - 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "Documento generado automáticamente por IMAF. Válido como comprobante de pago de inscripción.",
    MARGEN,
    alto - 24,
  );
  doc.text(`Sede IMAF: ${SEDE}`, MARGEN, alto - 19.5);
  doc.text(
    "Instituto de la Mujer, Atención a la Familia y Formación para el Trabajo",
    MARGEN,
    alto - 15,
  );

  doc.save(nombreArchivo(data.numero));
}
