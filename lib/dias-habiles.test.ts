import { describe, it, expect } from "vitest";
import { motivoDiaNoHabil } from "@/lib/dias-habiles";

describe("motivoDiaNoHabil", () => {
  it("rechaza sábados", () => {
    // 2026-09-05 es sábado
    expect(motivoDiaNoHabil("2026-09-05")).toBe("No se permiten sábados");
  });

  it("rechaza domingos", () => {
    // 2026-09-06 es domingo
    expect(motivoDiaNoHabil("2026-09-06")).toBe("No se permiten domingos");
  });

  it("rechaza feriados fijos", () => {
    // 2026-07-24 (viernes) es el Natalicio de Simón Bolívar
    expect(motivoDiaNoHabil("2026-07-24")).toBe(
      "No se permiten días feriados (Natalicio de Simón Bolívar)",
    );
  });

  it("rechaza feriados móviles calculados desde la Pascua", () => {
    // Pascua 2026 = 5 de abril → Viernes Santo = 3 de abril
    expect(motivoDiaNoHabil("2026-04-03")).toBe(
      "No se permiten días feriados (Viernes Santo)",
    );
    // Carnaval 2026: lunes 16 y martes 17 de febrero
    expect(motivoDiaNoHabil("2026-02-16")).toBe(
      "No se permiten días feriados (Lunes de Carnaval)",
    );
    expect(motivoDiaNoHabil("2026-02-17")).toBe(
      "No se permiten días feriados (Martes de Carnaval)",
    );
  });

  it("acepta días hábiles normales", () => {
    // Lunes 2026-09-07 y viernes 2026-09-11, ninguno feriado
    expect(motivoDiaNoHabil("2026-09-07")).toBeNull();
    expect(motivoDiaNoHabil("2026-09-11")).toBeNull();
  });

  it("ignora formatos inválidos (los reporta otra validación)", () => {
    expect(motivoDiaNoHabil("no-es-fecha")).toBeNull();
    expect(motivoDiaNoHabil("2026-13-40")).toBeNull();
  });
});
