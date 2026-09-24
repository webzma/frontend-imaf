import Link from "next/link";
import { CalendarDays, MessageCircle, UsersRound } from "lucide-react";

import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";
import { ESTILO_CURSO, estadoVisualCurso } from "@/lib/curso-estado";
import { cn } from "@/lib/utils";
import type { Curso } from "../tipos";

/**
 * Tarjeta de curso.
 *
 * La tarjeta entera es un enlace al detalle. Antes era un `div` con hover y
 * elevación, así que parecía pulsable pero solo respondía al ratón: con
 * teclado no había forma de abrir un curso desde esta pantalla.
 */
export function CursoCard({ curso }: { curso: Curso }) {
  const participantes = curso.estudiantes?.length ?? 0;
  const cuposRestantes =
    curso.cupos_restantes ?? curso.limite_cupo - participantes;
  const ocupacion = Math.round((participantes / curso.limite_cupo) * 100);
  const sinCupo = cuposRestantes <= 0;
  const estado = estadoVisualCurso(curso);
  const estilo = ESTILO_CURSO[estado.clave];
  const apagado = estado.clave === "inactivo" || estado.clave === "finalizado";

  const tono = sinCupo
    ? { texto: "text-danger", barra: "bg-danger" }
    : ocupacion >= 80
      ? { texto: "text-warning", barra: "bg-warning" }
      : { texto: "text-success", barra: "bg-success" };

  return (
    <Link
      href={`/admin/cursos/${curso.id}`}
      data-estado={estado.clave}
      className={cn(
        "group flex flex-col overflow-hidden rounded-sm bg-surface-container-lowest ambient-shadow transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        estilo.tarjeta,
      )}
    >
      <div className={cn("h-1", estilo.franja)} />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-sm px-2.5 py-1 font-mono text-xs font-bold",
              apagado
                ? "bg-surface-container-high text-muted-foreground"
                : "bg-primary-container text-on-primary-container",
            )}
          >
            {curso.codigo}
          </span>
          <Badge variant={estado.clave}>{estado.etiqueta}</Badge>
        </div>

        <h3
          className={cn(
            "mb-1 font-serif text-2xl leading-tight font-light tight-tracking",
            estilo.titulo,
          )}
        >
          {curso.nombre}
        </h3>

        {curso.instructor?.user?.name && (
          <p className="mb-2 flex items-center gap-1.5 font-sans text-xs font-medium text-muted-foreground">
            <Avatar
              src={curso.instructor.foto}
              name={curso.instructor.user.name}
              size={7}
            />
            {curso.instructor.user.name}
          </p>
        )}

        <p className="mb-4 line-clamp-2 flex-1 font-sans text-sm text-muted-foreground">
          {curso.descripcion || "Sin descripción"}
        </p>

        {(curso.fecha_inicio || curso.fecha_fin) && (
          <p
            className={cn(
              "mb-3 flex items-center gap-1.5 font-sans text-xs",
              estilo.fecha,
            )}
          >
            <CalendarDays aria-hidden="true" className="size-3 shrink-0" />
            {estado.clave === "finalizado" && curso.fecha_fin
              ? `Finalizó el ${formatDate(curso.fecha_fin)}`
              : `${formatDate(curso.fecha_inicio)}${
                  curso.fecha_fin ? ` → ${formatDate(curso.fecha_fin)}` : ""
                }`}
          </p>
        )}

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
              <UsersRound aria-hidden="true" className="size-3" />
              <span className="font-semibold text-on-surface">
                {participantes}
              </span>
              {` / ${curso.limite_cupo} participantes`}
            </span>
            <span
              className={cn(
                "font-sans text-xs font-semibold",
                apagado ? "text-muted-foreground" : tono.texto,
              )}
            >
              {apagado
                ? "Inscripciones cerradas"
                : sinCupo
                  ? "Sin cupo"
                  : `${cuposRestantes} disponibles`}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-outline-variant"
          >
            <div
              className={cn("h-full rounded-full", estilo.barra ?? tono.barra)}
              style={{ width: `${Math.min(100, ocupacion)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant pt-4">
          <span className="font-sans text-sm font-semibold text-muted-foreground">
            <b>Bs.</b> {formatPrice(curso.precio)}
          </span>
          {curso.whatsapp_url && (
            <span className="flex items-center gap-1 font-sans text-xs text-success">
              <MessageCircle aria-hidden="true" className="size-3" />
              WhatsApp
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CursoCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-sm bg-surface-container-lowest ambient-shadow">
      <div className="h-1 bg-primary-container" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-sm" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-auto flex items-center justify-between border-t border-outline-variant pt-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}
