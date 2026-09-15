"use client";

import CatalogoPage from "@/components/catalogo-page";
import { Award } from "lucide-react";

export default function TitulosPage() {
  return (
    <CatalogoPage
      title="Títulos"
      subtitle="Gestiona los títulos académicos disponibles para asignar a instructores."
      singular="título"
      apiSlug="titulos"
      icon={Award}
    />
  );
}
