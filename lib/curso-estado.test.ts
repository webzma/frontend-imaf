import { describe, it, expect } from "vitest";
import { estadoVisualCurso } from "@/lib/curso-estado";

const HOY = new Date(2026, 8, 24); // 24 sep 2026

describe("estadoVisualCurso", () => {
  it("activo sin fecha de fin", () => {
    expect(estadoVisualCurso({ estado: "activo" }, HOY).clave).toBe("activo");
  });

  it("activo con fin lejano", () => {
    expect(
      estadoVisualCurso({ estado: "activo", fecha_fin: "2026-12-01" }, HOY)
        .clave,
    ).toBe("activo");
  });

  it("por finalizar cuando quedan 7 días o menos", () => {
    const e = estadoVisualCurso(
      { estado: "activo", fecha_fin: "2026-09-29" },
      HOY,
    );
    expect(e.clave).toBe("por_finalizar");
    expect(e.etiqueta).toBe("Finaliza en 5 días");
  });

  it("dice mañana cuando queda un día", () => {
    expect(
      estadoVisualCurso({ estado: "activo", fecha_fin: "2026-09-25" }, HOY)
        .etiqueta,
    ).toBe("Finaliza mañana");
  });

  it("finalizado el mismo día de la fecha de fin, como el backend", () => {
    expect(
      estadoVisualCurso({ estado: "activo", fecha_fin: "2026-09-24" }, HOY)
        .clave,
    ).toBe("finalizado");
  });

  it("finalizado aunque el backend aún no lo haya inactivado", () => {
    expect(
      estadoVisualCurso({ estado: "activo", fecha_fin: "2026-09-01" }, HOY)
        .clave,
    ).toBe("finalizado");
  });

  it("finalizado tiene prioridad sobre inactivo", () => {
    expect(
      estadoVisualCurso({ estado: "inactivo", fecha_fin: "2026-09-01" }, HOY)
        .clave,
    ).toBe("finalizado");
  });

  it("inactivo cuando se desactivó antes de terminar", () => {
    expect(
      estadoVisualCurso({ estado: "inactivo", fecha_fin: "2026-12-01" }, HOY)
        .clave,
    ).toBe("inactivo");
  });

  it("acepta fechas con hora (ISO)", () => {
    expect(
      estadoVisualCurso(
        { estado: "activo", fecha_fin: "2026-09-01T00:00:00.000000Z" },
        HOY,
      ).clave,
    ).toBe("finalizado");
  });
});
