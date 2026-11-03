import { describe, expect, it } from "vitest";

import type { Sesion } from "../_components/types";
import { construirFilas } from "./exportar-horario";

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
      "02 mar 2026",
      "Lunes",
      "08:00 – 10:00",
      "PROG101 · Programación I",
      "Introducción a Python",
      "Ana Pérez",
      "Programada",
    ]);
    expect(filas[1][0]).toBe(2);
    expect(filas[1][1]).toBe("03 mar 2026");
    expect(filas[1][3]).toBe("09:00 – 11:00");
    expect(filas[1][7]).toBe("Realizada");
  });

  it("usa guiones cuando faltan curso, instructor u hora", () => {
    const [fila] = construirFilas([
      sesion({ hora_inicio: null, hora_fin: null }),
    ]);

    expect(fila[3]).toBe("—");
    expect(fila[4]).toBe("—");
    expect(fila[6]).toBe("—");
  });
});
