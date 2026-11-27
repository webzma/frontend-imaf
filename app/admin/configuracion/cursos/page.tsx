"use client";

import { BookOpen } from "lucide-react";

import CatalogosView from "../_components/CatalogosView";
import { CATALOGOS_CURSOS } from "@/lib/admin-nav";

export default function ConfiguracionCursosPage() {
  return (
    <CatalogosView
      catalogos={CATALOGOS_CURSOS}
      eyebrow="Configuración / Cursos"
      title="Catálogos de cursos"
      subtitle="Los niveles disponibles al crear o editar un curso. Un cambio aquí se ve de inmediato en el formulario de cursos."
      icon={BookOpen}
    />
  );
}
