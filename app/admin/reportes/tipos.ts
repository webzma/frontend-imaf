export interface IngresoItem {
  label: string;
  total: number;
  cantidad: number;
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

export interface ReporteData {
  ingresos: IngresoItem[];
  pagos_por_usuario: PagoUsuario[];
  pagos_por_curso: PagoCurso[];
  resumen: {
    total_pagos: number;
    aprobados: number;
    pendientes: number;
    rechazados: number;
    total_ingresos: number;
  };
  totales: { estudiantes: number; cursos: number; instructores: number };
  cursos: CursoOcupacion[];
  estado_estudiantes: Record<string, number>;
  estado_cursos: Record<string, number>;
}

export const PERIODOS = [
  { key: "semanal", label: "Semanal" },
  { key: "mensual", label: "Mensual" },
  { key: "anual", label: "Anual" },
] as const;

export type Periodo = (typeof PERIODOS)[number]["key"];
