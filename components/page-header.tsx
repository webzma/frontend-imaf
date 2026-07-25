import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Icono lucide que acompaña al eyebrow */
  icon?: React.ComponentType<{ className?: string }>;
  /** Etiqueta corta en mayúsculas sobre el título (ej. "Gestión / Cursos") */
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Acciones alineadas a la derecha del título (botones, filtros) */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-10 md:mb-12", className)}>
      <div className="flex items-center gap-4 mb-4">
        {Icon && <Icon className="size-6 md:size-7 text-primary/70" />}
        <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/70 font-semibold">
          {eyebrow}
        </span>
      </div>
      <div
        className={
          actions
            ? "flex flex-col md:flex-row md:items-end md:justify-between gap-4"
            : undefined
        }
      >
        <div>
          <h1 className="font-serif text-[2.4rem] md:text-[3rem] tight-tracking leading-[1.05] text-on-surface mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="font-sans text-sm md:text-base text-muted-foreground max-w-lg">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
