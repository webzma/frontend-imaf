export interface InstructorUser {
  id: number;
  name: string;
  email: string;
}

export interface InstructorRef {
  id: number;
  user_id: number;
  user: InstructorUser;
}

export interface CursoRef {
  id: number;
  nombre: string;
  codigo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: "activo" | "inactivo";
  instructor?: InstructorRef | null;
}

export interface Sesion {
  id: number;
  curso_id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: "programada" | "realizada" | "cancelada";
  curso?: CursoRef | null;
}

export type CalendarView = "mes" | "semana" | "dia" | "agenda";
