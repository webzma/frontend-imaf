/**
 * Claves de react-query de toda la plataforma.
 *
 * Están centralizadas por dos motivos. El primero es de caché: la barra
 * lateral guarda el perfil (nombre, correo, foto) mientras el usuario navega,
 * así que la pantalla que sube una foto nueva necesita poder invalidar esa
 * misma entrada o el avatar se queda con la anterior hasta recargar. El
 * segundo es de deduplicación: la barra lateral y la navegación móvil piden el
 * mismo contador de no leídas, y con la clave compartida se hace una sola
 * petición en vez de dos.
 */

import type { QueryParams } from "@/lib/api-client";

export const PERFIL_ESTUDIANTE_KEY = ["estudiante", "perfil"] as const;
export const PERFIL_INSTRUCTOR_KEY = ["instructor", "me"] as const;
export const PERFIL_ADMIN_KEY = ["admin", "me"] as const;

export const NOTIF_COUNT_ADMIN_KEY = [
  "admin",
  "notificaciones",
  "count",
] as const;
export const NOTIF_COUNT_INSTRUCTOR_KEY = [
  "instructor",
  "notificaciones",
  "count",
] as const;
export const NOTIF_COUNT_ESTUDIANTE_KEY = [
  "estudiante",
  "notificaciones",
  "count",
] as const;

/* ── Recursos del panel administrativo ── */

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => ["admin", "dashboard"] as const,
  notificaciones: () => ["admin", "notificaciones"] as const,
  reportes: (periodo: string) => ["admin", "reportes", periodo] as const,
  /** Lista paginada y filtrada: los filtros forman parte de la clave. */
  lista: (recurso: string, params: QueryParams) =>
    ["admin", recurso, "lista", params] as const,
  /** Catálogo completo para poblar un `<Select>`. */
  opciones: (recurso: string) => ["admin", recurso, "opciones"] as const,
  detalle: (recurso: string, id: string | number) =>
    ["admin", recurso, "detalle", String(id)] as const,
  horario: () => ["admin", "horario"] as const,
};
