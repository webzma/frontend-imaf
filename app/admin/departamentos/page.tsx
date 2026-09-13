"use client";

import CatalogoPage from "@/components/catalogo-page";
import { Building2 } from "lucide-react";

export default function DepartamentosPage() {
  return (
    <CatalogoPage
      title="Departamentos"
      subtitle="Gestiona los departamentos disponibles para asignar a instructores."
      singular="departamento"
      apiSlug="departamentos"
      icon={Building2}
    />
  );
}
