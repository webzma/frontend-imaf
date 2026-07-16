/**
 * Utilidades para validar días hábiles: rechaza sábados, domingos
 * y feriados nacionales de Venezuela (fijos y móviles).
 */

/** Feriados nacionales de fecha fija, en formato "MM-DD". */
const FERIADOS_FIJOS: Record<string, string> = {
  "01-01": "Año Nuevo",
  "04-19": "Declaración de la Independencia",
  "05-01": "Día del Trabajador",
  "06-24": "Batalla de Carabobo",
  "07-05": "Día de la Independencia",
  "07-24": "Natalicio de Simón Bolívar",
  "10-12": "Día de la Resistencia Indígena",
  "12-24": "Nochebuena",
  "12-25": "Navidad",
  "12-31": "Fin de Año",
};

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). */
function domingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

function mismaFecha(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Parsea una fecha "YYYY-MM-DD" como fecha local (evita el corrimiento
 * de día que produce `new Date("YYYY-MM-DD")` al interpretarla en UTC).
 */
function parsearFechaLocal(fecha: string): Date | null {
  const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, anio, mes, dia] = match.map(Number);
  const d = new Date(anio, mes - 1, dia);
  return d.getMonth() === mes - 1 && d.getDate() === dia ? d : null;
}

/** Nombre del feriado nacional si la fecha lo es; null en caso contrario. */
export function nombreFeriado(fecha: Date): string | null {
  const clave = `${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
    fecha.getDate(),
  ).padStart(2, "0")}`;
  if (FERIADOS_FIJOS[clave]) return FERIADOS_FIJOS[clave];

  const pascua = domingoDePascua(fecha.getFullYear());
  const desplazar = (dias: number) =>
    new Date(pascua.getFullYear(), pascua.getMonth(), pascua.getDate() + dias);

  const moviles: [string, Date][] = [
    ["Lunes de Carnaval", desplazar(-48)],
    ["Martes de Carnaval", desplazar(-47)],
    ["Jueves Santo", desplazar(-3)],
    ["Viernes Santo", desplazar(-2)],
  ];
  for (const [nombre, dia] of moviles) {
    if (mismaFecha(fecha, dia)) return nombre;
  }
  return null;
}

/**
 * Devuelve el motivo por el que una fecha "YYYY-MM-DD" no es un día hábil
 * (fin de semana o feriado), o null si es un día hábil válido.
 */
export function motivoDiaNoHabil(fecha: string): string | null {
  const dia = parsearFechaLocal(fecha);
  if (!dia) return null; // formato inválido: lo reporta otra validación

  const diaSemana = dia.getDay();
  if (diaSemana === 6) return "No se permiten sábados";
  if (diaSemana === 0) return "No se permiten domingos";

  const feriado = nombreFeriado(dia);
  if (feriado) return `No se permiten días feriados (${feriado})`;

  return null;
}
