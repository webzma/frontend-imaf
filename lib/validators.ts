/**
 * Sanitizadores y patrones compartidos para validar tipos de dato
 * en los formularios (cédula, teléfono, nombres, referencias).
 */

export const SOLO_DIGITOS = /^\d+$/;
export const SOLO_LETRAS = /^[\p{L}\p{M}\s'.-]+$/u;

/**
 * Texto general seguro para títulos/nombres de entidades (cursos, sesiones,
 * temario). Permite letras (con acentos), números, espacios y puntuación
 * común, pero bloquea caracteres de riesgo de inyección: () [] {} = < >
 * comillas, punto y coma, backslash y backtick.
 */
export const SOLO_TEXTO_SEGURO = /^[\p{L}\p{M}\p{N}\p{Pd}\s.,:!?@#$%&*+/_]+$/u;

/**
 * Para campos de texto largo (descripciones, requisitos, notas): bloquea solo
 * los caracteres de inyección SQL reales (comillas, punto y coma, backtick,
 * backslash) sin prohibir puntuación legítima como paréntesis.
 */
export const SIN_INYECCION = /^[^'"`;\\]+$/u;

/** Elimina todo carácter que no sea un dígito. */
export const sanitizarDigitos = (valor: string) => valor.replace(/\D/g, "");

/** Elimina todo carácter que no sea letra, espacio, apóstrofe, punto o guión. */
export const sanitizarLetras = (valor: string) =>
  valor.replace(/[^\p{L}\p{M}\s'.-]/gu, "");

/**
 * Elimina los caracteres de riesgo de inyección: comillas simples y dobles,
 * punto y coma, backtick y backslash (los mismos que bloquea SIN_INYECCION).
 */
export const sanitizarTexto = (valor: string) => valor.replace(/['"`;\\]/g, "");

export const esSoloDigitos = (valor: string) => SOLO_DIGITOS.test(valor);
export const esSoloLetras = (valor: string) => SOLO_LETRAS.test(valor);
