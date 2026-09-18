export interface Curso {
  id: number;
  nombre: string;
  codigo: string;
}

export interface UserRef {
  name: string;
  email: string;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
}

export type EstadoEstudiante = "activo" | "inactivo" | "graduado";

export interface Estudiante {
  id: number;
  nacionalidad: string | null;
  cedula: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  municipio: string | null;
  direccion: string | null;
  foto: string | null;
  fecha_inscripcion: string;
  estado: EstadoEstudiante;
  user: UserRef;
  curso: Curso | null;
}

export const ESTADO_LABEL: Record<EstadoEstudiante, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  graduado: "Graduado",
};

export const GENERO_LABEL: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  otro: "Otro",
};
