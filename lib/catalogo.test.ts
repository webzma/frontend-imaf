import { describe, it, expect } from "vitest";
import { MENSAJE_CARACTERES, validarNombreCatalogo } from "@/lib/catalogo";

const EXISTENTES = [
  { id: 1, nombre: "Física" },
  { id: 2, nombre: "Licenciatura" },
];
const OPC = { duplicado: "Ya existe" };

describe("validarNombreCatalogo", () => {
  it("vacío no muestra error", () => {
    expect(validarNombreCatalogo("   ", EXISTENTES, OPC)).toBeNull();
  });

  it("acepta números, puntos y paréntesis", () => {
    expect(
      validarNombreCatalogo("T.S.U. en Informática (2026)", EXISTENTES, OPC),
    ).toBeNull();
  });

  it("rechaza símbolos con el mismo mensaje que el backend", () => {
    expect(validarNombreCatalogo("Título <b>", EXISTENTES, OPC)).toBe(
      MENSAJE_CARACTERES,
    );
  });

  it("detecta duplicados sin distinguir mayúsculas, tildes ni espacios", () => {
    expect(validarNombreCatalogo("  fisica ", EXISTENTES, OPC)).toBe(
      "Ya existe",
    );
  });

  it("al editar no choca consigo mismo", () => {
    expect(
      validarNombreCatalogo("FÍSICA", EXISTENTES, { ...OPC, excluirId: 1 }),
    ).toBeNull();
  });
});
