import { redirect } from "next/navigation";

/**
 * Ruta heredada. El catálogo vive ahora en Configuración › Instructor; se
 * mantiene la redirección para no romper los enlaces guardados.
 */
export default function DepartamentosRedirect() {
  redirect("/admin/configuracion/instructor?tipo=departamentos");
}
