export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface UserRef {
  name: string;
  email: string;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
}

export interface Instructor {
  id: number;
  nacionalidad: string | null;
  cedula: string;
  telefono: string | null;
  especialidad: CatalogoItem | null;
  titulo: CatalogoItem | null;
  departamento: CatalogoItem | null;
  municipio: string | null;
  tipo_contrato: CatalogoItem | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  foto: string | null;
  user: UserRef;
}

export const GENERO_LABEL: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  otro: "Otro",
};

/** Los cuatro catálogos que alimentan los desplegables del formulario. */
export const CATALOGOS_INSTRUCTOR = [
  { slug: "especialidades", campo: "especialidad_id" },
  { slug: "departamentos", campo: "departamento_id" },
  { slug: "titulos", campo: "titulo_id" },
  { slug: "tipo-contratos", campo: "tipo_contrato_id" },
] as const;
