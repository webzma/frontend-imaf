/**
 * Sanitizadores y patrones compartidos para validar tipos de dato
 * en los formularios (cédula, teléfono, nombres, referencias).
 */

export const SOLO_DIGITOS = /^\d+$/;
export const SOLO_LETRAS = /^[\p{L}\p{M}\s'.-]+$/u;

/** Elimina todo carácter que no sea un dígito. */
export const sanitizarDigitos = (valor: string) => valor.replace(/\D/g, "");

/** Elimina todo carácter que no sea letra, espacio, apóstrofe, punto o guión. */
export const sanitizarLetras = (valor: string) =>
  valor.replace(/[^\p{L}\p{M}\s'.-]/gu, "");

export const esSoloDigitos = (valor: string) => SOLO_DIGITOS.test(valor);
export const esSoloLetras = (valor: string) => SOLO_LETRAS.test(valor);
