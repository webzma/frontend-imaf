export interface IngresoItem {
  /** "2026-09", "2026-W39" o "2026". */
  label: string;
  /** Primer día del período (YYYY-MM-DD). */
  desde: string;
  /** Ingreso de los pagos aprobados. */
  total: number;
  /** Pagos aprobados (igual que `aprobados`; se conserva por compatibilidad). */
  cantidad: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
}

export interface PagoUsuario {
  user_id: number;
  nombre: string;
  total_pagos: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  total_ingreso: number;
}

export interface PagoCurso {
  curso_id: number;
  nombre: string;
  codigo: string;
  precio: number;
  total_pagos: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  total_ingreso: number;
}

export interface CursoOcupacion {
  id: number;
  nombre: string;
  codigo: string;
  estado: "activo" | "inactivo";
  limite_cupo: number;
  estudiantes: number;
}

export interface TramoResumen {
  ingresos: number;
  total_pagos: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
}

export interface MetodoPago {
  metodo: "transferencia" | "pago_movil" | "efectivo" | "sin_especificar";
  cantidad: number;
  ingresos: number;
}

export interface ReporteData {
  ingresos: IngresoItem[];
  pagos_por_usuario: PagoUsuario[];
  pagos_por_curso: PagoCurso[];
  /** Histórico completo. */
  resumen: {
    total_pagos: number;
    aprobados: number;
    pendientes: number;
    rechazados: number;
    total_ingresos: number;
  };
  /** Ventana del período elegido frente a la ventana anterior. */
  periodo: {
    desde: string;
    hasta: string;
    actual: TramoResumen;
    anterior: TramoResumen;
    metodos_pago: MetodoPago[];
  };
  totales: { estudiantes: number; cursos: number; instructores: number };
  cursos: CursoOcupacion[];
  estado_estudiantes: Record<string, number>;
  estado_cursos: Record<string, number>;
}

export const PERIODOS = [
  { key: "semanal", label: "Semanal", ventana: "12 semanas" },
  { key: "mensual", label: "Mensual", ventana: "12 meses" },
  { key: "anual", label: "Anual", ventana: "5 años" },
] as const;

export type Periodo = (typeof PERIODOS)[number]["key"];
