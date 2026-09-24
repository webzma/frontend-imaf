/**
 * Validación de nombres de catálogo, la misma que aplica el backend
 * (CatalogoController::REGEX_NOMBRE). Se valida mientras se escribe para no
 * esperar al envío.
 */

const NOMBRE_VALIDO = /^[\p{L}\p{M}\d\s'\-.()]+$/u;

export const MENSAJE_CARACTERES =
  "Solo letras, números, espacios y los signos . - ' ( ).";

/** Clave de comparación: sin mayúsculas, tildes ni espacios sobrantes. */
export function claveNombre(nombre: string): string {
  return nombre
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/**
 * Motivo por el que `valor` no es un nombre válido, o null si lo es. Un valor
 * vacío devuelve null: el botón ya queda desactivado y no hace falta un error
 * antes de que se escriba nada.
 */
export function validarNombreCatalogo(
  valor: string,
  existentes: { id: number; nombre: string }[],
  opciones: { excluirId?: number; duplicado: string },
): string | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (limpio.length > 255) return "Máximo 255 caracteres.";
  if (!NOMBRE_VALIDO.test(limpio)) return MENSAJE_CARACTERES;

  const clave = claveNombre(limpio);
  const repetido = existentes.some(
    (e) => e.id !== opciones.excluirId && claveNombre(e.nombre) === clave,
  );
  return repetido ? opciones.duplicado : null;
}
