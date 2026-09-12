"use client";

import CatalogoPage from "@/components/catalogo-page";
import { BookOpen } from "lucide-react";

export default function EspecialidadesPage() {
  return (
    <CatalogoPage
      title="Especialidades"
      subtitle="Gestiona las especialidades disponibles para asignar a instructores."
      singular="especialidad"
      apiSlug="especialidades"
      icon={BookOpen}
    />
  );
}
