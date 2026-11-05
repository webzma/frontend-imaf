import { describe, expect, it } from "vitest";

import type { Sesion } from "../_components/types";
import {
  construirDocumento,
  construirFilas,
  duracionHoras,
  horasDeClase,
} from "./exportar-horario";

function sesion(overrides: Partial<Sesion>): Sesion {
  return {
    id: 1,
    curso_id: 1,
    titulo: "Sesión",
    descripcion: null,
    fecha: "2026-03-02",
    hora_inicio: "08:00",
    hora_fin: "10:00",
    estado: "programada",
    ...overrides,
  };
}

describe("construirFilas", () => {
  it("ordena por fecha y hora y formatea las columnas de la agenda", () => {
    const filas = construirFilas([
      sesion({
        id: 2,
        fecha: "2026-03-03",
        hora_inicio: "09:00",
        hora_fin: "11:00",
        titulo: "Estructuras de datos",
        estado: "realizada",
      }),
      sesion({
        id: 1,
        fecha: "2026-03-02",
        titulo: "Introducción a Python",
        curso: {
          id: 1,
          nombre: "Programación I",
          codigo: "PROG101",
          fecha_inicio: null,
          fecha_fin: null,
          estado: "activo",
          instructor: {
            id: 5,
            user_id: 9,
            user: { id: 9, name: "Ana Pérez", email: "ana@imaf.test" },
          },
        },
      }),
    ]);

    expect(filas[0]).toEqual([
      1,
      "2026-03-02",
      "Lunes",
      "08:00 – 10:00",
      2,
      "PROG101",
      "Programación I",
      "Introducción a Python",
      "Ana Pérez",
      "Programada",
    ]);
    expect(filas[1][0]).toBe(2);
    expect(filas[1][1]).toBe("2026-03-03");
    expect(filas[1][3]).toBe("09:00 – 11:00");
    expect(filas[1][9]).toBe("Realizada");
  });

  it("deja vacíos los datos que faltan", () => {
    const [fila] = construirFilas([
      sesion({ hora_inicio: null, hora_fin: null }),
    ]);

    expect(fila[3]).toBeNull();
    expect(fila[4]).toBeNull();
    expect(fila[5]).toBeNull();
    expect(fila[6]).toBeNull();
    expect(fila[8]).toBeNull();
  });
});

describe("duracionHoras", () => {
  it("calcula las horas de la sesión", () => {
    expect(
      duracionHoras(sesion({ hora_inicio: "08:00", hora_fin: "09:30:00" })),
    ).toBe(1.5);
  });

  it("no inventa una duración si el rango es incompleto o está invertido", () => {
    expect(duracionHoras(sesion({ hora_fin: null }))).toBeNull();
    expect(
      duracionHoras(sesion({ hora_inicio: "10:00", hora_fin: "09:00" })),
    ).toBeNull();
  });
});

describe("construirDocumento", () => {
  const sesiones = [
    sesion({ id: 1, curso_id: 1 }),
    sesion({ id: 2, curso_id: 2, estado: "realizada" }),
    sesion({ id: 3, curso_id: 2, estado: "cancelada" }),
  ];

  it("no cuenta las sesiones canceladas como horas de clase", () => {
    expect(horasDeClase(sesiones)).toBe(4);
    const [seccion] = construirDocumento(sesiones, "marzo 2026").secciones;
    expect(seccion.totales?.[4]).toBe(4);
  });

  it("resume la agenda por estado y dice qué filtros se aplicaron", () => {
    const doc = construirDocumento(sesiones, "marzo 2026", [
      "Estado: Realizada",
    ]);
    expect(doc.subtitulos).toEqual([
      "marzo 2026",
      "Filtros: Estado: Realizada",
    ]);
    expect(doc.indicadores?.map((i) => [i.etiqueta, i.valor])).toEqual([
      ["Sesiones", "3"],
      ["Programadas", "1"],
      ["Realizadas", "1"],
      ["Canceladas", "1"],
      ["Horas de clase", "4,00"],
    ]);
    expect(doc.indicadores?.[0].detalle).toBe("En 2 cursos");
  });
});
