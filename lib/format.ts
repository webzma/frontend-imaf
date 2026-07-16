/**
 * Formateadores compartidos de fecha y moneda.
 * Toda la app usa un único locale para que el mismo dato
 * se muestre igual en cualquier página.
 */
export const LOCALE = "es-VE";

type DateInput = string | null | undefined;

/**
 * Interpreta "YYYY-MM-DD" (o el tramo de fecha de un ISO) como fecha local,
 * evitando el corrimiento de día por zona horaria.
 */
function parseLocalDate(value: string): Date {
  return new Date(value.slice(0, 10) + "T00:00:00");
}

function formatWith(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  const date = parseLocalDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(LOCALE, options);
}

/** "05 mar 2026" */
export function formatDate(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatWith(
    value,
    options ?? { day: "2-digit", month: "short", year: "numeric" },
  );
}

/** "5 de marzo de 2026" */
export function formatDateLong(value: DateInput): string {
  return formatWith(value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "jueves, 05 de marzo de 2026" */
export function formatDateFull(value: DateInput): string {
  return formatWith(value, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** "05 mar 2026, 10:30" — para timestamps ISO completos */
export function formatDateTime(value: DateInput): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "HH:MM" desde "HH:MM:SS" */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

/** "1.234" — número decimal sin símbolo */
export function formatNumber(
  value: number,
  maximumFractionDigits: number = 0,
): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "decimal",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
  }).format(value);
}

/** "Bs. 1.234,00" */
export function formatCurrency(value: number): string {
  return `Bs. ${formatNumber(value, 2)}`;
}

/** Precio de curso: "Gratuito" cuando es 0, si no "1.234" (se antepone "Bs." en la UI) */
export function formatPrice(precio: number): string {
  if (precio === 0) return "Gratuito";
  return formatNumber(precio);
}

/** "Hace 5 minutos" / "Hace 3 días"; pasa a fecha corta después de 30 días */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );
    if (diffInMinutes < 1) return "Hace un momento";
    return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`;
  }
  if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours !== 1 ? "s" : ""}`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Hace ${diffInDays} día${diffInDays !== 1 ? "s" : ""}`;
  }
  return formatDate(dateString);
}
