"use client";

import CatalogoPage from "@/components/catalogo-page";
import { FileText } from "lucide-react";

export default function TipoContratosPage() {
  return (
    <CatalogoPage
      title="Tipos de Contrato"
      subtitle="Gestiona los tipos de contrato disponibles para asignar a instructores."
      singular="tipo de contrato"
      apiSlug="tipo-contratos"
      icon={FileText}
    />
  );
}
