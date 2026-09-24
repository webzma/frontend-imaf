/**
 * Toda la oferta de IMAF se dicta de forma presencial en la sede. El backend
 * lo expone como `modalidad`/`sede` en cada curso (Curso::MODALIDAD); aquí
 * están los textos para mostrarlo sin repetirlos en cada pantalla.
 */

export const MODALIDAD = "Presencial";

export const SEDE =
  "5ta av. entre calles 29 y 30, antigua sede de la Unidad de Diálisis";

export const MODALIDAD_DETALLE = `Clases presenciales en la sede IMAF: ${SEDE}.`;
