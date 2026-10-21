import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  MessageCircle,
  Users,
} from "lucide-react";

import { ModalidadBadge } from "@/components/modalidad-badge";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CursoPublico {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  limite_cupo: number;
  cupos_restantes: number;
}

/**
 * Cursos con inscripción abierta, leídos de `/api/publico/cursos`.
 *
 * Se renderiza en el servidor y se cachea 5 minutos: la portada no hace una
 * petición a la API por visitante. Si la API no responde, la sección muestra
 * una invitación a registrarse en lugar de romper la página.
 */
async function obtenerCursos(): Promise<CursoPublico[] | null> {
  try {
    const res = await fetch(`${process.env.API_URL}api/publico/cursos`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return Array.isArray(body?.data) ? body.data : null;
  } catch {
    return null;
  }
}

export async function CursosAbiertos() {
  const cursos = await obtenerCursos();

  if (!cursos || cursos.length === 0) {
    return (
      <div className="rounded-lg bg-surface-container-lowest p-10 text-center ambient-shadow md:p-14">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary-container">
          <GraduationCap className="size-7 text-on-primary-container" />
        </div>
        <h3 className="text-2xl text-on-surface lg:text-3xl">
          Muy pronto, nuevos cursos
        </h3>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Estamos preparando la próxima oferta formativa. Crea tu cuenta y te
          avisaremos cuando abran las inscripciones.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Crear cuenta
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="https://wa.me/584121512141"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-surface-container px-6 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <MessageCircle className="size-4" />
            Preguntar por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cursos.map((curso) => (
        <li key={curso.id}>
          <TarjetaCurso curso={curso} />
        </li>
      ))}
    </ul>
  );
}

function TarjetaCurso({ curso }: { curso: CursoPublico }) {
  const ocupados = Math.max(0, curso.limite_cupo - curso.cupos_restantes);
  const pct =
    curso.limite_cupo > 0
      ? Math.min(100, Math.round((ocupados / curso.limite_cupo) * 100))
      : 0;
  const agotado = curso.cupos_restantes <= 0;
  const ultimos =
    !agotado &&
    (curso.cupos_restantes <= 3 ||
      curso.cupos_restantes / Math.max(1, curso.limite_cupo) <= 0.2);
  const gratuito = curso.precio === 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface-container-lowest ambient-shadow transition-transform duration-300 hover:-translate-y-1">
      <div className="h-1 gradient-primary" />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-primary-container/70 px-2 py-0.5 font-mono text-[11px] font-bold text-on-primary-container">
              {curso.codigo}
            </span>
            <ModalidadBadge />
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold",
              gratuito
                ? "bg-success-container text-on-success-container"
                : "bg-surface-container-high text-on-surface",
            )}
          >
            {gratuito ? "Gratuito" : `Bs. ${formatPrice(curso.precio)}`}
          </span>
        </div>

        <h3 className="text-2xl leading-tight text-on-surface">
          {curso.nombre}
        </h3>
        {curso.descripcion && (
          <p className="mt-2 line-clamp-3 font-sans text-sm leading-relaxed text-muted-foreground">
            {curso.descripcion}
          </p>
        )}

        <div className="mt-auto space-y-4 pt-6">
          <p className="flex items-center gap-2 font-sans text-sm text-on-surface">
            <CalendarDays
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
            {curso.fecha_inicio
              ? `Inicia el ${formatDate(curso.fecha_inicio)}`
              : "Fecha de inicio por anunciar"}
          </p>

          <div>
            <p className="mb-1.5 flex items-center justify-between gap-2 font-sans text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users aria-hidden="true" className="size-3.5" />
                Cupos
              </span>
              <span
                className={cn(
                  "font-semibold",
                  agotado
                    ? "text-danger"
                    : ultimos
                      ? "text-warning"
                      : "text-on-surface",
                )}
              >
                {agotado
                  ? "Agotados"
                  : ultimos
                    ? `¡Últimos ${curso.cupos_restantes}!`
                    : `${curso.cupos_restantes} de ${curso.limite_cupo} disponibles`}
              </span>
            </p>
            <div
              role="meter"
              aria-label="Cupos ocupados"
              aria-valuemin={0}
              aria-valuemax={curso.limite_cupo}
              aria-valuenow={ocupados}
              className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  agotado ? "bg-danger" : ultimos ? "bg-warning" : "bg-primary",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {agotado ? (
            <p className="rounded-md bg-surface-container px-4 py-2.5 text-center font-sans text-sm text-muted-foreground">
              Sin cupos por ahora
            </p>
          ) : (
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-sans text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Inscribirme
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
