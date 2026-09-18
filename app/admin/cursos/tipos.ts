export interface InstructorRef {
  id: number;
  user_id: number;
  foto?: string | null;
  user: { id: number; name: string; email: string };
}

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
  instructor?: InstructorRef | null;
  estudiantes?: { id: number }[];
}
