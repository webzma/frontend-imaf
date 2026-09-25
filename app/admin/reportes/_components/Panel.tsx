import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Card de shadcn con el acabado del panel (esquinas de 2px, sombra ambiente
 * en vez del anillo por defecto). Todas las secciones de Reportes la usan.
 */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-5 rounded-sm bg-surface-container-lowest py-5 shadow-none ring-0 ambient-shadow",
        className,
      )}
    >
      {/* En móvil la acción baja bajo el título: al lado apretaba la
          descripción en una columna de tres palabras. */}
      <CardHeader className="px-5 max-sm:grid-cols-1!">
        <CardTitle className="font-serif text-xl font-light tight-tracking text-on-surface">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="font-sans text-xs">
            {description}
          </CardDescription>
        )}
        {action && (
          <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-auto max-sm:mt-2 max-sm:justify-self-start">
            {action}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className={cn("px-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
