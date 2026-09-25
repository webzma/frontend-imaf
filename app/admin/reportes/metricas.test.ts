import { describe, expect, it } from "vitest";
import {
  etiquetaCorta,
  nivelOcupacion,
  ocupacion,
  tasaAprobacion,
  variacion,
} from "./metricas";

describe("variacion", () => {
  it("calcula el cambio relativo con un decimal", () => {
    expect(variacion(150, 100)).toEqual({ pct: 50, direccion: "sube" });
    expect(variacion(2, 3)).toEqual({ pct: -33.3, direccion: "baja" });
  });
  it("sin base previa no inventa un porcentaje", () => {
    expect(variacion(80, 0)).toEqual({ pct: null, direccion: "sube" });
  });
  it("igual cuando no cambia", () => {
    expect(variacion(0, 0)).toEqual({ pct: 0, direccion: "igual" });
  });
});

describe("tasaAprobacion", () => {
  it("ignora los pendientes", () => {
    expect(tasaAprobacion(3, 1)).toBe(75);
  });
  it("sin pagos resueltos no hay tasa", () => {
    expect(tasaAprobacion(0, 0)).toBeNull();
  });
});

describe("ocupacion", () => {
  it("porcentaje sin tope", () => {
    expect(ocupacion(33, 30)).toBe(110);
    expect(nivelOcupacion(110)).toBe("llena");
    expect(nivelOcupacion(85)).toBe("alta");
    expect(nivelOcupacion(10)).toBe("baja");
  });
  it("cupo cero no divide por cero", () => {
    expect(ocupacion(3, 0)).toBe(0);
  });
});

describe("etiquetaCorta", () => {
  it("semanas ISO", () => {
    expect(etiquetaCorta("2026-W09", "semanal")).toBe("S9");
  });
  it("años", () => {
    expect(etiquetaCorta("2026", "anual")).toBe("2026");
  });
});
