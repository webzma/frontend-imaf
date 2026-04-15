"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Hash,
  GraduationCap,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: string;
  profesor?: { id: number; name: string } | null;
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

export default function CursoPage() {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.API_URL}api/estudiante/perfil`, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    })
      .then((r) => r.json())
      .then((data) => setCurso(data?.curso ?? null))
      .catch(() => toast.error("Error al cargar el curso"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Mi curso
            </span>
          </div>
          <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface">
            Curso inscrito
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-8">
              <Skeleton className="h-9 w-64 mb-3" />
              <Skeleton className="h-5 w-32 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : curso ? (
          <div className="space-y-6">
            {/* Main course card */}
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
              <div className="h-1 gradient-primary" />
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-serif font-light text-4xl text-on-surface mb-2">
                      {curso.nombre}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-on-primary-container bg-primary-container px-3 py-1 rounded-sm">
                      <Hash className="w-3 h-3" />
                      {curso.codigo}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-sm font-semibold ${
                      curso.estado === "activo"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {curso.estado === "activo" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {curso.estado === "activo" ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {curso.descripcion && (
                  <p className="font-sans text-base text-muted-foreground leading-relaxed mb-6">
                    {curso.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-8 pt-6 border-t border-outline-variant/30">
                  {curso.profesor && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground/60" />
                      <div>
                        <p className="font-sans text-xs text-muted-foreground">
                          Profesor
                        </p>
                        <p className="font-sans text-sm font-semibold text-on-surface">
                          {curso.profesor.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 bg-secondary-container/40 rounded-sm px-4 py-3 border border-outline-variant/20">
              <Info className="w-4 h-4 text-on-surface/50 shrink-0 mt-0.5" />
              <p className="font-sans text-sm text-muted-foreground">
                Si necesitas cambiar de curso o tienes alguna consulta sobre tu
                inscripción, comunícate con la administración.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/60 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-on-primary-container" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-light text-2xl text-on-surface mb-2">
                  Sin curso asignado
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  No estás inscrito en ningún curso actualmente. Comunícate con
                  la administración para más información.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
