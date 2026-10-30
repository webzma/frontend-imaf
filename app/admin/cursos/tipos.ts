export interface InstructorRef {
  id: number;
  user_id: number;
  foto?: string | null;
  user: { id: number; name: string; email: string };
}

export interface NivelCursoRef {
  id: number;
  nombre: string;
}

/** Valor centinela para el `<Select>` cuando el curso no tiene nivel. */
export const SIN_NIVEL = "__sin_nivel__";

export interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  limite_cupo: number;
  cupos_restantes: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  requisitos?: string | null;
  precio: number;
  whatsapp_url?: string | null;
  estado: "activo" | "inactivo";
  nivel_curso?: NivelCursoRef | null;
  instructor?: InstructorRef | null;
  estudiantes?: { id: number }[];
}
