import { describe, expect, it } from "vitest";

import { INFORMES, construirInforme } from "./exportar";
import type { ReporteData } from "./tipos";

const datos: ReporteData = {
  ingresos: [
    {
      label: "2026-09",
      desde: "2026-09-01",
      total: 300,
      cantidad: 3,
      aprobados: 3,
      pendientes: 1,
      rechazados: 1,
    },
    {
      label: "2026-10",
      desde: "2026-10-01",
      total: 100.5,
      cantidad: 1,
      aprobados: 1,
      pendientes: 0,
      rechazados: 0,
    },
  ],
  pagos_por_usuario: [
    {
      user_id: 1,
      nombre: "Ana",
      total_pagos: 2,
      aprobados: 1,
      pendientes: 1,
      rechazados: 0,
      total_ingreso: 100,
    },
  ],
  pagos_por_curso: [
    {
      curso_id: 1,
      nombre: "Costura",
      codigo: "COS1",
      precio: 100,
      total_pagos: 4,
      aprobados: 3,
      pendientes: 0,
      rechazados: 1,
      total_ingreso: 300,
    },
  ],
  resumen: {
    total_pagos: 6,
    aprobados: 4,
    pendientes: 1,
    rechazados: 1,
    total_ingresos: 400.5,
  },
  periodo: {
    desde: "2025-11-01",
    hasta: "2026-10-31",
    actual: {
      ingresos: 400.5,
      total_pagos: 6,
      aprobados: 4,
      pendientes: 1,
      rechazados: 1,
    },
    anterior: {
      ingresos: 0,
      total_pagos: 2,
      aprobados: 2,
      pendientes: 0,
      rechazados: 0,
    },
    metodos_pago: [
      { metodo: "pago_movil", cantidad: 3, ingresos: 300 },
      { metodo: "efectivo", cantidad: 1, ingresos: 100 },
    ],
  },
  totales: { estudiantes: 10, cursos: 2, instructores: 1 },
  cursos: [
    {
      id: 1,
      nombre: "Costura",
      codigo: "COS1",
      estado: "activo",
      limite_cupo: 10,
      estudiantes: 12,
    },
    {
      id: 2,
      nombre: "Cocina",
      codigo: "COC1",
      estado: "inactivo",
      limite_cupo: 20,
      estudiantes: 2,
    },
  ],
  estado_estudiantes: { activo: 8, inactivo: 2 },
  estado_cursos: { activo: 1, inactivo: 1 },
};

describe("construirInforme", () => {
  it("toda fila tiene tantas celdas como columnas, en todos los informes", () => {
    for (const { key } of INFORMES) {
      for (const seccion of construirInforme(datos, key, "mensual").secciones) {
        const ancho = seccion.columnas.length;
        for (const fila of seccion.filas) expect(fila).toHaveLength(ancho);
        if (seccion.totales) expect(seccion.totales).toHaveLength(ancho);
      }
    }
  });

  it("solo el reporte completo reúne varias tablas (no admite CSV)", () => {
    for (const { key, multitabla } of INFORMES) {
      const { secciones } = construirInforme(datos, key, "mensual");
      expect(secciones.length > 1).toBe(multitabla);
    }
  });

  it("la serie indica el rango, humaniza el período y suma los totales", () => {
    const doc = construirInforme(datos, "serie", "mensual");
    expect(doc.subtitulos?.[0]).toMatch(/^Últimos 12 meses: 1 nov\.? 2025 – /);

    const [seccion] = doc.secciones;
    expect(seccion.filas[0][0]).toBe("Septiembre de 2026");
    expect(seccion.filas[0][3]).toBe(5);
    expect(seccion.totales).toEqual(["Total", null, 400.5, 6, 4, 1, 1, 80]);
  });

  it("sin base de comparación no inventa un porcentaje", () => {
    const [ingresos] = construirInforme(datos, "serie", "mensual").indicadores!;
    expect(ingresos.valor).toBe("Bs. 400,50");
    expect(ingresos.detalle).toBe("Sin datos en los 12 meses anteriores");
  });

  it("muestra la variación con signo cuando hay con qué comparar", () => {
    const doc = construirInforme(
      {
        ...datos,
        periodo: {
          ...datos.periodo,
          anterior: { ...datos.periodo.anterior, ingresos: 320 },
        },
      },
      "serie",
      "mensual",
    );
    expect(doc.indicadores?.[0].detalle).toBe("+25,2% vs. 12 meses anteriores");
  });

  it("los informes por curso y estudiante avisan de que son históricos", () => {
    for (const key of ["cursos", "estudiantes"] as const) {
      const doc = construirInforme(datos, key, "semanal");
      expect(doc.subtitulos?.[0]).toMatch(/^Histórico completo/);
    }
  });

  it("la participación por método suma el 100% y el total es coherente", () => {
    const [seccion] = construirInforme(datos, "metodos", "anual").secciones;
    expect(seccion.filas.map((f) => f[3])).toEqual([75, 25]);
    expect(seccion.totales).toEqual(["Total", 4, 400, 100]);
  });

  it("la ocupación no da cupos negativos en un curso sobrepasado", () => {
    const doc = construirInforme(datos, "ocupacion", "mensual");
    const [seccion] = doc.secciones;
    expect(seccion.filas[0].slice(3)).toEqual([10, 12, 0, 120, "Llena"]);
    expect(seccion.totales?.slice(3, 6)).toEqual([30, 14, 18]);

    const valor = (etiqueta: string) =>
      doc.indicadores?.find((i) => i.etiqueta === etiqueta)?.valor;
    expect(valor("Cursos activos")).toBe("1");
    expect(valor("Ocupación media")).toBe("120%");
    expect(valor("Cursos llenos")).toBe("1");
  });
});
