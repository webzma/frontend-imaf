/**
 * Esquemas zod compartidos para los formularios de gestión de cursos
 * (crear/editar curso, temario y sesiones) usados por el rol admin.
 * Centralizan la validación para evitar divergencias entre páginas.
 */

import { z } from "zod";
import { motivoDiaNoHabil } from "@/lib/dias-habiles";
import {
  SOLO_DIGITOS,
  SOLO_LETRAS,
  SOLO_TEXTO_SEGURO,
  SIN_INYECCION,
} from "@/lib/validators";

/** Fecha "YYYY-MM-DD" opcional que rechaza días no hábiles. */
const fechaOpcional = z
  .string()
  .optional()
  .superRefine((v, ctx) => {
    if (!v) return;
    const motivo = motivoDiaNoHabil(v);
    if (motivo) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: motivo });
    }
  });

/** Mínimo de estudiantes: opcional, entero ≥ 1 (NaN/"" → undefined). */
const minimoEstudiantes = z.preprocess(
  (v) =>
    (typeof v === "number" && Number.isNaN(v)) || v === "" ? undefined : v,
  z.number().int().min(1, "Mínimo 1 estudiante").optional(),
);

const camposBaseCurso = {
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(255)
    .regex(
      SOLO_TEXTO_SEGURO,
      "El nombre contiene caracteres no permitidos (evita ( ) [ ] = < > \" ' ; etc.)",
    ),
  descripcion: z
    .string()
    .max(1000)
    .regex(SIN_INYECCION, "La descripción contiene caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  limite_cupo: z.number().int().min(1, "Mínimo 1 participante"),
  minimo_estudiantes: minimoEstudiantes,
  fecha_inicio: fechaOpcional,
  fecha_fin: fechaOpcional,
  requisitos: z
    .string()
    .max(2000)
    .regex(SIN_INYECCION, "Los requisitos contienen caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  whatsapp_url: z.string().url("URL inválida").optional().or(z.literal("")),
  estado: z.enum(["activo", "inactivo"]),
};

const refineMinimoCupo = (d: {
  minimo_estudiantes?: number;
  limite_cupo: number;
}) =>
  d.minimo_estudiantes === undefined || d.minimo_estudiantes <= d.limite_cupo;

/** Esquema de creación de curso (usado en app/admin/cursos/page.tsx). */
export const cursoSchema = z
  .object({
    ...camposBaseCurso,
    profesor_id: z.string().min(1, "Debes seleccionar un instructor"),
  })
  .refine(refineMinimoCupo, {
    message: "El mínimo no puede superar el límite de cupo",
    path: ["minimo_estudiantes"],
  });

export type CursoForm = z.infer<typeof cursoSchema>;

/** Esquema de edición de curso (usado en app/admin/cursos/[id]/page.tsx). */
export const editCursoSchema = z
  .object({
    ...camposBaseCurso,
    profesor_id: z.string().optional(),
  })
  .refine(refineMinimoCupo, {
    message: "El mínimo no puede superar el límite de cupo",
    path: ["minimo_estudiantes"],
  });

export type EditCursoForm = z.infer<typeof editCursoSchema>;

/** Esquema del formulario de temario (título obligatorio, texto seguro). */
export const temarioSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es obligatorio")
    .max(255)
    .regex(
      SOLO_TEXTO_SEGURO,
      "El título contiene caracteres no permitidos (evita ( ) [ ] = < > \" ' ; etc.)",
    ),
  descripcion: z
    .string()
    .max(2000)
    .regex(SIN_INYECCION, "La descripción contiene caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  orden: z.number().int().min(0, "El orden no puede ser negativo"),
});

export type TemarioForm = z.infer<typeof temarioSchema>;

/** Campos base compartidos del formulario de sesión. */
const camposSesion = {
  titulo: z
    .string()
    .min(1, "El título es obligatorio")
    .max(255)
    .regex(
      SOLO_TEXTO_SEGURO,
      "El título contiene caracteres no permitidos (evita ( ) [ ] = < > \" ' ; etc.)",
    ),
  descripcion: z
    .string()
    .max(2000)
    .regex(SIN_INYECCION, "La descripción contiene caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  hora_inicio: z.string().optional(),
  hora_fin: z.string().optional(),
  estado: z.enum(["programada", "realizada", "cancelada"]),
};

const refineHorasSesion = (d: { hora_inicio?: string; hora_fin?: string }) =>
  !d.hora_inicio || !d.hora_fin || d.hora_fin > d.hora_inicio;

/** Esquema del formulario de sesión dentro de un curso (sin curso_id). */
export const sesionSchema = z.object(camposSesion).refine(refineHorasSesion, {
  message: "La hora fin debe ser posterior",
  path: ["hora_fin"],
});

export type SesionForm = z.infer<typeof sesionSchema>;

/** Esquema del diálogo de sesión del horario (exige curso_id). */
export const sesionHorarioSchema = z
  .object({
    ...camposSesion,
    curso_id: z.string().min(1, "Selecciona un curso"),
  })
  .refine(refineHorasSesion, {
    message: "La hora fin debe ser posterior",
    path: ["hora_fin"],
  });

export type SesionHorarioForm = z.infer<typeof sesionHorarioSchema>;

/* ── Auth: login ── */

export const loginSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginForm = z.infer<typeof loginSchema>;

/* ── Auth: forgot password ── */

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

/* ── Auth: reset password ── */

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    password_confirmation: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

/* ── Campos de identidad (nombre dividido en 4) ── */

/**
 * Nombre estructurado: primer nombre y apellidos (obligatorios) + segundo
 * nombre (opcional). El backend guarda `users.name` sincronizado a partir
 * de estos campos, por eso el frontend ya no envía `name`.
 */
export const camposNombre = {
  primer_nombre: z
    .string()
    .min(1, "El primer nombre es obligatorio")
    .max(100)
    .regex(
      SOLO_LETRAS,
      "El primer nombre solo puede contener letras y espacios",
    ),
  segundo_nombre: z
    .string()
    .max(100)
    .regex(
      SOLO_LETRAS,
      "El segundo nombre solo puede contener letras y espacios",
    )
    .optional()
    .or(z.literal("")),
  primer_apellido: z
    .string()
    .min(1, "El primer apellido es obligatorio")
    .max(100)
    .regex(
      SOLO_LETRAS,
      "El primer apellido solo puede contener letras y espacios",
    ),
  segundo_apellido: z
    .string()
    .min(1, "El segundo apellido es obligatorio")
    .max(100)
    .regex(
      SOLO_LETRAS,
      "El segundo apellido solo puede contener letras y espacios",
    ),
} as const;

/* ── Cédula: 7 u 8 dígitos ── */

/** Nacionalidad: V (venezolano) o E (extranjero). */
const nacionalidadRequerida = z.enum(["V", "E"], {
  message: "Selecciona una nacionalidad",
});

const nacionalidadOpcional = z.enum(["V", "E"]).optional();

/** Cédula obligatoria: solo dígitos y de 7 u 8 caracteres. */
const cedulaObligatoria = z
  .string()
  .min(1, "La cédula es obligatoria")
  .regex(SOLO_DIGITOS, "La cédula solo puede contener dígitos")
  .max(8, "La cédula debe tener 7 u 8 dígitos")
  .min(7, "La cédula debe tener 7 u 8 dígitos");

/** Cédula opcional (perfil): vacía o de 7 u 8 dígitos. */
const cedulaOpcional = z
  .string()
  .regex(SOLO_DIGITOS, "La cédula solo puede contener dígitos")
  .max(8, "La cédula debe tener 7 u 8 dígitos")
  .min(7, "La cédula debe tener 7 u 8 dígitos")
  .optional()
  .or(z.literal(""));

/* ── Dirección de habitación: texto libre con protección anti-inyección ── */

/**
 * Dirección obligatoria: admite texto libre (letras, números, #, ., -, etc.)
 * pero bloquea los caracteres de riesgo de inyección SQL.
 */
const direccionObligatoria = z
  .string()
  .min(1, "La dirección es obligatoria")
  .max(255, "La dirección no puede superar 255 caracteres")
  .regex(SIN_INYECCION, "La dirección contiene caracteres no permitidos");

/* ── Auth: registro ── */

export const registroSchema = z
  .object({
    ...camposNombre,
    email: z
      .string()
      .min(1, "El correo es obligatorio")
      .email("Correo inválido"),
    nacionalidad: nacionalidadRequerida,
    cedula: cedulaObligatoria,
    telefono: z
      .string()
      .min(1, "El teléfono es obligatorio")
      .max(20)
      .regex(SOLO_DIGITOS, "El teléfono solo puede contener dígitos"),
    fecha_nacimiento: z
      .string()
      .min(1, "La fecha de nacimiento es obligatoria"),
    genero: z.string().min(1, "Selecciona un género"),
    municipio: z.string().min(1, "Selecciona un municipio"),
    direccion: direccionObligatoria,
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    password_confirmation: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });

export type RegistroForm = z.infer<typeof registroSchema>;

/* ── Perfil estudiante ── */

export const perfilEstudianteSchema = z.object({
  telefono: z
    .string()
    .max(20, "El teléfono no puede superar 20 dígitos")
    .regex(SOLO_DIGITOS, "El teléfono solo puede contener dígitos")
    .optional()
    .or(z.literal("")),
  municipio: z
    .string()
    .max(255)
    .regex(SIN_INYECCION, "El municipio contiene caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
});

export type PerfilEstudianteForm = z.infer<typeof perfilEstudianteSchema>;

/* ── Perfil instructor ── */

export const perfilInstructorSchema = z.object({
  nacionalidad: nacionalidadOpcional,
  cedula: cedulaOpcional,
  telefono: z
    .string()
    .max(20, "El teléfono no puede superar 20 dígitos")
    .regex(SOLO_DIGITOS, "El teléfono solo puede contener dígitos")
    .optional()
    .or(z.literal("")),
  municipio: z
    .string()
    .max(255)
    .regex(SIN_INYECCION, "El municipio contiene caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  especialidad: z
    .string()
    .max(255)
    .regex(SIN_INYECCION, "La especialidad contiene caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  titulo: z.enum(["licenciatura", "maestria", "doctorado"]).optional(),
  departamento: z
    .string()
    .max(255)
    .regex(SIN_INYECCION, "El departamento contiene caracteres no permitidos")
    .optional()
    .or(z.literal("")),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
});

export type PerfilInstructorForm = z.infer<typeof perfilInstructorSchema>;

/* ── Admin: crear/editar estudiante ── */

export const estudianteSchema = z.object({
  ...camposNombre,
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  nacionalidad: nacionalidadRequerida,
  cedula: cedulaObligatoria,
  telefono: z
    .string()
    .max(20)
    .regex(SOLO_DIGITOS, "El teléfono solo puede contener dígitos")
    .optional()
    .or(z.literal("")),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
  municipio: z.string().min(1, "Selecciona un municipio"),
  direccion: direccionObligatoria,
  curso_id: z.string().optional(),
  fecha_inscripcion: z
    .string()
    .min(1, "La fecha de inscripción es obligatoria"),
  estado: z.enum(["activo", "inactivo", "graduado"]),
});

export type EstudianteForm = z.infer<typeof estudianteSchema>;

export const editEstudianteSchema = z.object({
  ...camposNombre,
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  nacionalidad: nacionalidadRequerida,
  cedula: cedulaObligatoria,
  telefono: z
    .string()
    .max(20)
    .regex(SOLO_DIGITOS, "El teléfono solo puede contener dígitos")
    .optional()
    .or(z.literal("")),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
  municipio: z.string().min(1, "Selecciona un municipio"),
  direccion: direccionObligatoria,
  curso_id: z.string().optional(),
  fecha_inscripcion: z
    .string()
    .min(1, "La fecha de inscripción es obligatoria"),
  estado: z.enum(["activo", "inactivo", "graduado"]),
});

export type EditEstudianteForm = z.infer<typeof editEstudianteSchema>;

/* ── Admin: crear/editar instructor ── */

export const instructorSchema = z.object({
  ...camposNombre,
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  nacionalidad: nacionalidadRequerida,
  cedula: cedulaObligatoria,
  telefono: z
    .string()
    .max(20)
    .regex(SOLO_DIGITOS, "El teléfono solo puede contener dígitos")
    .optional()
    .or(z.literal("")),
  municipio: z.string().max(255).optional(),
  tipo_contrato_id: z.number().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
  especialidad: z.string().max(255).optional(),
  titulo: z.enum(["licenciatura", "maestria", "doctorado"]).optional(),
  departamento: z.string().max(255).optional(),
});

export type InstructorForm = z.infer<typeof instructorSchema>;

export const editInstructorSchema = z.object({
  ...camposNombre,
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  nacionalidad: nacionalidadRequerida,
  cedula: cedulaObligatoria,
  telefono: z
    .string()
    .max(20)
    .regex(SOLO_DIGITOS, "El teléfono solo puede contener dígitos")
    .optional()
    .or(z.literal("")),
  municipio: z.string().max(255).optional(),
  tipo_contrato_id: z.number().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
  especialidad: z.string().max(255).optional(),
  titulo: z.enum(["licenciatura", "maestria", "doctorado"]).optional(),
  departamento: z.string().max(255).optional(),
});

export type EditInstructorForm = z.infer<typeof editInstructorSchema>;
