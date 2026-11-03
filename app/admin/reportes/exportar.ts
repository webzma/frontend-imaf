import {
  exportarTabla,
  type FormatoTabla,
  type TablaExportable,
} from "@/lib/exportar-tabla";

export type FormatoReporte = FormatoTabla;
export type TablaReporte = TablaExportable;

/** Descarga una tabla de reporte en el formato elegido. */
export async function exportarReporte(
  tabla: TablaReporte,
  formato: FormatoReporte,
) {
  await exportarTabla({ pie: "IMAF — Reportes", ...tabla }, formato);
}
