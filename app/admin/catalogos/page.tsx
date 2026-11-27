import { redirect } from "next/navigation";

import { CATALOGOS } from "@/lib/admin-nav";

export default async function CatalogosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const catalogo = CATALOGOS.find((item) => item.slug === tipo);

  if (catalogo?.grupo === "cursos") {
    redirect(`/admin/configuracion/cursos?tipo=${catalogo.slug}`);
  }

  redirect(
    catalogo
      ? `/admin/configuracion/instructor?tipo=${catalogo.slug}`
      : "/admin/configuracion/instructor",
  );
}
