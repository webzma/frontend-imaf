import { redirect } from "next/navigation";

/**
 * Ruta heredada. Los cuatro catálogos viven ahora en una sola pantalla con
 * pestañas; se mantiene la redirección para no romper los enlaces guardados.
 */
export default function TitulosRedirect() {
  redirect("/admin/catalogos?tipo=titulos");
}
