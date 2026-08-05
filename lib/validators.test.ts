import { describe, it, expect } from "vitest";
import {
  SOLO_TEXTO_SEGURO,
  SIN_INYECCION,
  sanitizarDigitos,
  sanitizarLetras,
  sanitizarTexto,
  esSoloDigitos,
  esSoloLetras,
} from "@/lib/validators";

describe("sanitizarDigitos", () => {
  it("elimina letras y deja solo los dígitos", () => {
    expect(sanitizarDigitos("12ab34")).toBe("1234");
  });

  it("elimina separadores y símbolos", () => {
    expect(sanitizarDigitos("(0412) 123-45")).toBe("041212345");
  });

  it("mantiene intacta una cadena de solo dígitos", () => {
    expect(sanitizarDigitos("12345678")).toBe("12345678");
  });
});

describe("sanitizarLetras", () => {
  it("elimina paréntesis, signos y caracteres no permitidos", () => {
    expect(sanitizarLetras("Juan()=Pérez")).toBe("JuanPérez");
  });

  it("conserva letras, espacios, apóstrofes, puntos y guiones", () => {
    expect(sanitizarLetras("María José-O'Neil")).toBe("María José-O'Neil");
  });
});

describe("sanitizarTexto", () => {
  it("elimina comillas, punto y coma, backtick y backslash", () => {
    expect(sanitizarTexto("Casa 5'; DROP TABLE users;--")).toBe(
      "Casa 5 DROP TABLE users--",
    );
    expect(sanitizarTexto('dijo "hola"')).toBe("dijo hola");
    expect(sanitizarTexto("a`b\\c")).toBe("abc");
  });

  it("conserva letras, números, #, puntos y guiones (texto libre)", () => {
    expect(sanitizarTexto("Av. Principal, casa N° 5")).toBe(
      "Av. Principal, casa N° 5",
    );
  });
});

describe("esSoloDigitos", () => {
  it("acepta solo dígitos", () => {
    expect(esSoloDigitos("1234")).toBe(true);
  });

  it("rechaza letras o símbolos", () => {
    expect(esSoloDigitos("12a4")).toBe(false);
    expect(esSoloDigitos("12-4")).toBe(false);
  });
});

describe("esSoloLetras", () => {
  it("acepta letras con acentos y espacios", () => {
    expect(esSoloLetras("Juan Pérez")).toBe(true);
  });

  it("rechaza números, paréntesis y corchetes", () => {
    expect(esSoloLetras("Juan1")).toBe(false);
    expect(esSoloLetras("Juan()")).toBe(false);
    expect(esSoloLetras("Juan[Perez]")).toBe(false);
  });
});

describe("SOLO_TEXTO_SEGURO", () => {
  it("acepta nombres y títulos normales (con acentos)", () => {
    expect(SOLO_TEXTO_SEGURO.test("Fotografía Básica")).toBe(true);
    expect(SOLO_TEXTO_SEGURO.test("Sesión 1")).toBe(true);
  });

  it("acepta guiones largos (— y –) usados en títulos", () => {
    expect(SOLO_TEXTO_SEGURO.test("Sesión 1 — Introducción")).toBe(true);
    expect(SOLO_TEXTO_SEGURO.test("Repaso – Tema 2")).toBe(true);
  });

  it("bloquea paréntesis, corchetes y signo igual", () => {
    expect(SOLO_TEXTO_SEGURO.test("nombre=malo")).toBe(false);
    expect(SOLO_TEXTO_SEGURO.test("Clase (Avanzado)")).toBe(false);
    expect(SOLO_TEXTO_SEGURO.test("Clase [Avanzado]")).toBe(false);
  });

  it("bloquea comillas y punto y coma", () => {
    expect(SOLO_TEXTO_SEGURO.test("comilla'")).toBe(false);
    expect(SOLO_TEXTO_SEGURO.test("drop;")).toBe(false);
  });
});

describe("SIN_INYECCION", () => {
  it("permite texto largo con puntuación legítima", () => {
    expect(SIN_INYECCION.test("Descripción con (paréntesis) y puntos.")).toBe(
      true,
    );
  });

  it("bloquea comillas simples y dobles", () => {
    expect(SIN_INYECCION.test("O'Brien")).toBe(false);
    expect(SIN_INYECCION.test('dijo "hola"')).toBe(false);
  });

  it("bloquea punto y coma, backtick y backslash", () => {
    expect(SIN_INYECCION.test("a; DROP TABLE")).toBe(false);
    expect(SIN_INYECCION.test("a`b")).toBe(false);
    expect(SIN_INYECCION.test("a\\b")).toBe(false);
  });
});
