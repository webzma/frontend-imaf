"use client";

import { GraduationCap } from "lucide-react";

import CatalogosView from "../_components/CatalogosView";
import { CATALOGOS_INSTRUCTOR } from "@/lib/admin-nav";

export default function ConfiguracionInstructorPage() {
  return (
    <CatalogosView
      catalogos={CATALOGOS_INSTRUCTOR}
      eyebrow="Configuración / Instructor"
      title="Catálogos de instructor"
      subtitle="Las listas que alimentan los formularios de instructores: especialidades, departamentos, títulos y tipos de contrato."
      icon={GraduationCap}
    />
  );
}
