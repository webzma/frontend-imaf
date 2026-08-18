/**
 * Claves de react-query compartidas entre la barra lateral y las pantallas que
 * editan ese mismo dato.
 *
 * La barra lateral cachea el perfil (nombre, correo, foto) mientras el usuario
 * navega. Cuando el perfil sube una foto nueva, esa pantalla actualiza su
 * propio estado pero la caché de la barra lateral se queda con la anterior y el
 * avatar sigue mostrando las iniciales hasta recargar la página. Compartir la
 * clave permite invalidarla desde el perfil.
 */

export const PERFIL_ESTUDIANTE_KEY = ["estudiante", "perfil"] as const;
export const PERFIL_INSTRUCTOR_KEY = ["instructor", "me"] as const;
