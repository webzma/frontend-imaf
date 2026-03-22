import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-surface flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* 404 number */}
        <p className="font-sans font-bold text-[8rem] leading-none tabular-nums text-primary/15 select-none mb-2">
          404
        </p>

        {/* Divider line */}
        <div className="w-12 h-px bg-primary/30 mb-8" />

        {/* Message */}
        <h1 className="font-serif font-light text-4xl tight-tracking text-on-surface mb-3">
          Página no encontrada
        </h1>
        <p className="font-sans text-sm text-muted-foreground max-w-xs mb-10">
          La dirección que buscas no existe o fue movida a otra ubicación.
        </p>

        {/* Action */}
        <Button asChild>
          <Link href="/admin">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
