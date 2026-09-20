import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface Stat {
  label: string;
  value: number | string;
  /** Línea de apoyo: qué significa el número. */
  sub?: string;
  icon: LucideIcon;
  /** Familia de color del contenedor del icono. */
  tone?: "primary" | "secondary" | "info" | "success" | "warning" | "danger";
  href?: string;
}

const TONOS = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  info: "bg-info-container text-on-info-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-danger-container text-on-danger-container",
} as const;

/**
 * Fila de métricas.
 *
 * Cada pantalla dibujaba sus contadores con un tratamiento distinto — tarjetas
 * grandes en el panel de inicio, texto suelto en estudiantes, cajas de color en
 * pagos — así que el mismo tipo de dato se leía de tres maneras.
 */
export function StatRow({
  stats,
  loading = false,
  columns = 3,
  className,
}: {
  stats: Stat[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const rejilla = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div
      className={cn(
        "grid max-sm:grid-cols-3 grid-cols-1 gap-2 sm:gap-4",
        rejilla,
        className,
      )}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} loading={loading} />
      ))}
    </div>
  );
}

function StatCard({ stat, loading }: { stat: Stat; loading: boolean }) {
  const Icon = stat.icon;

  const contenido = (
    <>
      <div className="max-sm:mb-2 mb-5 flex items-start justify-between">
        <div
          className={cn(
            "flex max-sm:size-7 size-10 items-center justify-center rounded-md",
            TONOS[stat.tone ?? "primary"],
          )}
        >
          <Icon aria-hidden="true" className="max-sm:size-3.5 size-5" />
        </div>
        {stat.href && (
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
          />
        )}
      </div>
      {loading ? (
        <Skeleton className="mb-1 max-sm:h-7 max-sm:w-14 h-12 w-20" />
      ) : (
        <p className="max-sm:mb-0.5 mb-1 font-sans max-sm:text-2xl text-5xl font-light tabular-nums tight-tracking text-on-surface">
          {stat.value}
        </p>
      )}
      <p className="max-sm:mt-1 mt-2 font-sans max-sm:text-[10px] text-xs font-medium tracking-[0.15em] uppercase text-on-surface">
        {stat.label}
      </p>
      {stat.sub && (
        <p className="mt-0.5 font-sans text-xs text-muted-foreground">
          {stat.sub}
        </p>
      )}
    </>
  );

  const base =
    "rounded-lg bg-surface-container-low max-sm:p-3 p-6 ambient-shadow transition-[background-color,box-shadow,transform] duration-200";

  if (!stat.href) {
    return <div className={base}>{contenido}</div>;
  }

  return (
    // El anillo de foco va en el enlace, no en un div interior: si no, la
    // tarjeta se puede tabular pero no se ve cuál tiene el foco.
    <Link
      href={stat.href}
      className={cn(
        base,
        "group hover:-translate-y-0.5 hover:bg-surface-container hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      )}
    >
      {contenido}
    </Link>
  );
}
