import { describe, expect, it } from "vitest";

import {
  construirPdf,
  contenidoCsv,
  hojasExcel,
  nombreConFecha,
  textoCelda,
  type DocumentoExportable,
  type SeccionTabla,
} from "./exportar-tabla";

const seccion: SeccionTabla = {
  titulo: "Pagos",
  columnas: [
    { titulo: "Nombre" },
    { titulo: "Fecha", tipo: "fecha" },
    { titulo: "Pagos", tipo: "entero" },
    { titulo: "Ingreso (Bs.)", tipo: "decimal" },
    { titulo: "Tasa (%)", tipo: "porcentaje" },
  ],
  filas: [["Ana, Pérez", "2026-03-02T10:00:00Z", 1200, 1234.5, 75]],
  totales: ["Total", null, 1200, 1234.5, null],
};

const documento: DocumentoExportable = {
  titulo: "Reporte",
  subtitulos: ["Marzo"],
  nombreArchivo: "reporte",
  indicadores: [{ etiqueta: "Ingresos", valor: "Bs. 1.234,50" }],
  secciones: [seccion],
};

const AHORA = new Date(2026, 2, 5, 22, 30);

describe("textoCelda", () => {
  it("presenta cada tipo como se lee en español", () => {
    expect(textoCelda({ valor: 1200, tipo: "entero" })).toBe("1.200");
    expect(textoCelda({ valor: 1234.5, tipo: "decimal" })).toBe("1.234,50");
    expect(textoCelda({ valor: 12.5, tipo: "porcentaje" })).toBe("12,5%");
    expect(textoCelda({ valor: "2026-03-02", tipo: "fecha" })).toMatch(
      /^02 mar\.? 2026$/,
    );
    expect(textoCelda({ valor: null, tipo: "decimal" })).toBe("—");
  });

  it("no toma por fecha un texto que no lo es", () => {
    expect(textoCelda({ valor: "Total", tipo: "fecha" })).toBe("Total");
  });
});

describe("contenidoCsv", () => {
  it("deja los datos crudos, sin totales ni formato de presentación", () => {
    expect(contenidoCsv(seccion).split("\r\n")).toEqual([
      "Nombre,Fecha,Pagos,Ingreso (Bs.),Tasa (%)",
      '"Ana, Pérez",2026-03-02,1200,1234.5,75',
    ]);
  });

  it("neutraliza los textos que una hoja de cálculo ejecutaría", () => {
    const csv = contenidoCsv({
      titulo: "T",
      columnas: [{ titulo: "Nombre" }, { titulo: "Saldo", tipo: "entero" }],
      filas: [
        ['=HYPERLINK("http://mal")', -5],
        ["@SUM(A1)", 5],
        ["+58 412", 5],
      ],
    });
    const [, a, b, c] = csv.split("\r\n");
    expect(a).toBe(`"'=HYPERLINK(""http://mal"")",-5`);
    expect(b).toBe("'@SUM(A1),5");
    expect(c).toBe("'+58 412,5");
  });
});

describe("hojasExcel", () => {
  it("añade un resumen y guarda números y fechas con su tipo real", () => {
    const [resumen, datos] = hojasExcel(documento, AHORA);
    expect(resumen.sheet).toBe("Resumen");
    expect(datos.sheet).toBe("Pagos");
    expect(datos.stickyRowsCount).toBe(1);

    const fila = datos.data[1] as { value: unknown; format?: string }[];
    expect(fila[1].value).toEqual(new Date("2026-03-02T00:00:00Z"));
    expect(fila[1].format).toBe("dd/mm/yyyy");
    expect(fila[2]).toMatchObject({ value: 1200, format: "#,##0" });
    expect(fila[3]).toMatchObject({ value: 1234.5, format: "#,##0.00" });
    expect(fila[4]).toMatchObject({ value: 0.75, format: "0%" });
  });

  it("no deja que un título largo ensanche su columna más de la cuenta", () => {
    const [, datos] = hojasExcel(
      {
        ...documento,
        secciones: [
          {
            titulo: "T",
            columnas: [
              { titulo: "Tasa de aprobación (%)", tipo: "porcentaje" },
              { titulo: "Cupo", tipo: "entero" },
              { titulo: "Nombre" },
            ],
            filas: [[75, 10, "x".repeat(80)]],
          },
        ],
      },
      AHORA,
    );
    expect(datos.columns?.map((c) => c.width)).toEqual([15, 6, 44]);
  });

  it("no repite nombres de hoja ni pisa la de resumen", () => {
    const hojas = hojasExcel(
      {
        ...documento,
        secciones: [
          seccion,
          seccion,
          { ...seccion, titulo: "Resumen" },
          { ...seccion, titulo: "Un título larguísimo: que no cabe en Excel" },
        ],
      },
      AHORA,
    );
    expect(hojas.map((h) => h.sheet)).toEqual([
      "Resumen",
      "Pagos",
      "Pagos 2",
      "Resumen 2",
      "Un título larguísimo  que no ca",
    ]);
  });
});

describe("nombreConFecha", () => {
  it("usa el día local aunque en UTC ya sea el siguiente", () => {
    expect(nombreConFecha("reporte", new Date(2026, 2, 5, 23, 59))).toBe(
      "reporte-2026-03-05",
    );
  });
});

describe("construirPdf", () => {
  it("numera las páginas sobre el total y aguanta tablas vacías", async () => {
    const doc = await construirPdf(
      {
        ...documento,
        secciones: [
          { ...seccion, filas: [], vacio: "Sin pagos." },
          {
            ...seccion,
            filas: Array.from({ length: 120 }, () => seccion.filas[0]),
          },
        ],
      },
      AHORA,
    );
    const paginas = doc.getNumberOfPages();
    expect(paginas).toBeGreaterThan(1);

    const salida = doc.output();
    expect(salida).toContain(`gina 1 de ${paginas}`);
    expect(salida).toContain("Sin pagos.");
  });
});
