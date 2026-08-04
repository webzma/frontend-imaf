import { describe, it, expect } from "vitest";
import type { ZodError } from "zod";
import {
  loginSchema,
  registroSchema,
  cursoSchema,
  editCursoSchema,
  temarioSchema,
  sesionSchema,
  sesionHorarioSchema,
  perfilEstudianteSchema,
  perfilInstructorSchema,
  estudianteSchema,
  editEstudianteSchema,
  instructorSchema,
  editInstructorSchema,
} from "@/lib/schemas";

/** Devuelve el mensaje de error de un campo concreto (o undefined si no tiene). */
function mensajeDe(
  resultado: { success: boolean; error?: ZodError },
  campo: string,
): string | undefined {
  if (resultado.success) return undefined;
  return resultado.error?.issues.find((i) => i.path.join(".") === campo)
    ?.message;
}

/* ────────────────────────── Login ────────────────────────── */

describe("loginSchema", () => {
  const valido = { email: "admin@imaf.com", password: "clave12345" };

  it("acepta credenciales válidas", () => {
    expect(loginSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza campos vacíos", () => {
    const r = loginSchema.safeParse({ email: "", password: "" });
    expect(mensajeDe(r, "email")).toBe("El correo es obligatorio");
    expect(mensajeDe(r, "password")).toBe("La contraseña es obligatoria");
  });

  it("rechaza un correo sin formato válido", () => {
    const r = loginSchema.safeParse({
      email: "correo-invalido",
      password: "clave12345",
    });
    expect(mensajeDe(r, "email")).toBe("Correo inválido");
  });

  it("rechaza contraseñas de menos de 8 caracteres", () => {
    const r = loginSchema.safeParse({ email: "a@b.com", password: "1234567" });
    expect(mensajeDe(r, "password")).toBe(
      "La contraseña debe tener al menos 8 caracteres",
    );
  });
});

/* ────────────────────────── Registro ────────────────────────── */

describe("registroSchema", () => {
  const valido = {
    primer_nombre: "Juan",
    segundo_nombre: "Pablo",
    primer_apellido: "Pérez",
    segundo_apellido: "Gómez",
    email: "juan@correo.com",
    cedula: "12345678",
    telefono: "04121234567",
    fecha_nacimiento: "2000-01-01",
    genero: "masculino",
    municipio: "San Felipe",
    password: "clave12345",
    password_confirmation: "clave12345",
  };

  it("acepta un registro válido", () => {
    expect(registroSchema.safeParse(valido).success).toBe(true);
  });

  it("acepta un registro sin segundo nombre", () => {
    const r = registroSchema.safeParse({
      ...valido,
      segundo_nombre: "",
    });
    expect(r.success).toBe(true);
  });

  it("exige el primer nombre, primer apellido y segundo apellido", () => {
    const r = registroSchema.safeParse({
      ...valido,
      primer_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
    });
    expect(mensajeDe(r, "primer_nombre")).toBe(
      "El primer nombre es obligatorio",
    );
    expect(mensajeDe(r, "primer_apellido")).toBe(
      "El primer apellido es obligatorio",
    );
    expect(mensajeDe(r, "segundo_apellido")).toBe(
      "El segundo apellido es obligatorio",
    );
  });

  it("rechaza contraseñas que no coinciden", () => {
    const r = registroSchema.safeParse({
      ...valido,
      password_confirmation: "otra12345",
    });
    expect(mensajeDe(r, "password_confirmation")).toBe(
      "Las contraseñas no coinciden",
    );
  });

  it("rechaza contraseñas cortas", () => {
    const r = registroSchema.safeParse({ ...valido, password: "1234567" });
    expect(mensajeDe(r, "password")).toBe(
      "La contraseña debe tener al menos 8 caracteres",
    );
  });

  it("exige seleccionar género y municipio", () => {
    const r = registroSchema.safeParse({
      ...valido,
      genero: "",
      municipio: "",
    });
    expect(mensajeDe(r, "genero")).toBe("Selecciona un género");
    expect(mensajeDe(r, "municipio")).toBe("Selecciona un municipio");
  });

  it("rechaza nombres con paréntesis o signo igual", () => {
    const r = registroSchema.safeParse({
      ...valido,
      primer_nombre: "Juan()=Pérez",
    });
    expect(mensajeDe(r, "primer_nombre")).toBe(
      "El primer nombre solo puede contener letras y espacios",
    );
  });

  it("rechaza cédulas con letras", () => {
    const r = registroSchema.safeParse({ ...valido, cedula: "12ab34" });
    expect(mensajeDe(r, "cedula")).toBe(
      "La cédula solo puede contener dígitos",
    );
  });

  it("rechaza cédulas de menos de 7 dígitos", () => {
    const r = registroSchema.safeParse({ ...valido, cedula: "123456" });
    expect(mensajeDe(r, "cedula")).toBe(
      "La cédula debe tener 7 u 8 dígitos",
    );
  });

  it("rechaza cédulas de más de 8 dígitos", () => {
    const r = registroSchema.safeParse({ ...valido, cedula: "123456789" });
    expect(mensajeDe(r, "cedula")).toBe(
      "La cédula debe tener 7 u 8 dígitos",
    );
  });

  it("acepta una cédula de 7 dígitos", () => {
    expect(
      registroSchema.safeParse({ ...valido, cedula: "1234567" }).success,
    ).toBe(true);
  });

  it("rechaza correos inválidos", () => {
    const r = registroSchema.safeParse({ ...valido, email: "correo-malo" });
    expect(mensajeDe(r, "email")).toBe("Correo inválido");
  });
});

/* ────────────────────────── Curso (crear) ────────────────────────── */

describe("cursoSchema", () => {
  const valido = {
    nombre: "Fotografía Básica",
    descripcion: "",
    limite_cupo: 20,
    minimo_estudiantes: undefined,
    fecha_inicio: undefined,
    fecha_fin: undefined,
    requisitos: "",
    precio: 50,
    whatsapp_url: "",
    estado: "activo",
    profesor_id: "1",
  };

  it("acepta un curso válido", () => {
    expect(cursoSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza un nombre con caracteres de riesgo", () => {
    const r = cursoSchema.safeParse({ ...valido, nombre: "Fotografía=1" });
    expect(mensajeDe(r, "nombre")).toContain("no permitidos");
  });

  it("rechaza cupo en 0", () => {
    const r = cursoSchema.safeParse({ ...valido, limite_cupo: 0 });
    expect(mensajeDe(r, "limite_cupo")).toBe("Mínimo 1 participante");
  });

  it("rechaza precios negativos", () => {
    const r = cursoSchema.safeParse({ ...valido, precio: -5 });
    expect(mensajeDe(r, "precio")).toBe("El precio no puede ser negativo");
  });

  it("rechaza fechas en sábado", () => {
    // 2026-09-05 es sábado
    const r = cursoSchema.safeParse({
      ...valido,
      fecha_inicio: "2026-09-05",
    });
    expect(mensajeDe(r, "fecha_inicio")).toBe("No se permiten sábados");
  });

  it("rechaza un mínimo mayor que el cupo", () => {
    const r = cursoSchema.safeParse({
      ...valido,
      minimo_estudiantes: 30,
    });
    expect(mensajeDe(r, "minimo_estudiantes")).toBe(
      "El mínimo no puede superar el límite de cupo",
    );
  });

  it("trata NaN como sin mínimo (no bloquea el envío)", () => {
    const r = cursoSchema.safeParse({ ...valido, minimo_estudiantes: NaN });
    expect(r.success).toBe(true);
  });

  it("rechaza una URL de WhatsApp incompleta", () => {
    const r = cursoSchema.safeParse({ ...valido, whatsapp_url: "hola" });
    expect(mensajeDe(r, "whatsapp_url")).toBe("URL inválida");
  });

  it("rechaza descripciones con caracteres de inyección", () => {
    const r = cursoSchema.safeParse({
      ...valido,
      descripcion: "Curso genial'; DROP TABLE cursos;--",
    });
    expect(mensajeDe(r, "descripcion")).toContain("no permitidos");
  });

  it("exige seleccionar un instructor", () => {
    const r = cursoSchema.safeParse({ ...valido, profesor_id: "" });
    expect(mensajeDe(r, "profesor_id")).toBe("Debes seleccionar un instructor");
  });
});

/* ────────────────────────── Curso (editar) ────────────────────────── */

describe("editCursoSchema", () => {
  const valido = {
    nombre: "Fotografía Básica",
    descripcion: "",
    limite_cupo: 20,
    minimo_estudiantes: undefined,
    fecha_inicio: undefined,
    fecha_fin: undefined,
    requisitos: "",
    precio: 50,
    whatsapp_url: "",
    estado: "inactivo",
    profesor_id: undefined,
  };

  it("acepta un curso válido sin profesor seleccionado", () => {
    expect(editCursoSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza un nombre vacío al editar", () => {
    const r = editCursoSchema.safeParse({ ...valido, nombre: "" });
    expect(mensajeDe(r, "nombre")).toBe("El nombre es obligatorio");
  });
});

/* ────────────────────────── Temario ────────────────────────── */

describe("temarioSchema", () => {
  const valido = { titulo: "Introducción", descripcion: "", orden: 0 };

  it("acepta un tema válido", () => {
    expect(temarioSchema.safeParse(valido).success).toBe(true);
  });

  it("exige un título", () => {
    const r = temarioSchema.safeParse({ ...valido, titulo: "" });
    expect(mensajeDe(r, "titulo")).toBe("El título es obligatorio");
  });

  it("rechaza títulos con caracteres de riesgo", () => {
    const r = temarioSchema.safeParse({ ...valido, titulo: "a=b" });
    expect(mensajeDe(r, "titulo")).toContain("no permitidos");
  });

  it("rechaza un orden negativo", () => {
    const r = temarioSchema.safeParse({ ...valido, orden: -1 });
    expect(mensajeDe(r, "orden")).toBe("El orden no puede ser negativo");
  });
});

/* ────────────────────────── Sesión ────────────────────────── */

describe("sesionSchema", () => {
  const valido = {
    titulo: "Sesión 1",
    descripcion: "",
    fecha: "2026-09-07",
    hora_inicio: "09:00",
    hora_fin: "10:00",
    estado: "programada",
  };

  it("acepta una sesión válida", () => {
    expect(sesionSchema.safeParse(valido).success).toBe(true);
  });

  it("exige una fecha", () => {
    const r = sesionSchema.safeParse({ ...valido, fecha: "" });
    expect(mensajeDe(r, "fecha")).toBe("La fecha es obligatoria");
  });

  it("rechaza hora fin anterior a la de inicio", () => {
    const r = sesionSchema.safeParse({
      ...valido,
      hora_inicio: "09:00",
      hora_fin: "08:00",
    });
    expect(mensajeDe(r, "hora_fin")).toBe("La hora fin debe ser posterior");
  });

  it("rechaza hora fin igual a la de inicio", () => {
    const r = sesionSchema.safeParse({
      ...valido,
      hora_inicio: "09:00",
      hora_fin: "09:00",
    });
    expect(mensajeDe(r, "hora_fin")).toBe("La hora fin debe ser posterior");
  });
});

describe("sesionHorarioSchema", () => {
  const valido = {
    titulo: "Sesión de horario",
    descripcion: "",
    fecha: "2026-09-07",
    hora_inicio: "09:00",
    hora_fin: "10:00",
    estado: "programada",
    curso_id: "1",
  };

  it("acepta una sesión de horario con curso", () => {
    expect(sesionHorarioSchema.safeParse(valido).success).toBe(true);
  });

  it("exige seleccionar un curso", () => {
    const r = sesionHorarioSchema.safeParse({ ...valido, curso_id: "" });
    expect(mensajeDe(r, "curso_id")).toBe("Selecciona un curso");
  });
});

/* ────────────────────────── Estudiante (admin) ────────────────────────── */

describe("estudianteSchema", () => {
  const valido = {
    primer_nombre: "Juan",
    segundo_nombre: "",
    primer_apellido: "Pérez",
    segundo_apellido: "Gómez",
    email: "juan@correo.com",
    password: "clave12345",
    cedula: "12345678",
    telefono: "",
    fecha_nacimiento: "",
    genero: undefined,
    curso_id: undefined,
    fecha_inscripcion: "2026-08-01",
    estado: "activo",
  };

  it("acepta un estudiante válido", () => {
    expect(estudianteSchema.safeParse(valido).success).toBe(true);
  });

  it("exige los campos de identidad obligatorios", () => {
    const r = estudianteSchema.safeParse({
      ...valido,
      primer_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
    });
    expect(mensajeDe(r, "primer_nombre")).toBe(
      "El primer nombre es obligatorio",
    );
    expect(mensajeDe(r, "primer_apellido")).toBe(
      "El primer apellido es obligatorio",
    );
  });

  it("rechaza apellidos con caracteres no permitidos", () => {
    const r = estudianteSchema.safeParse({
      ...valido,
      primer_apellido: "Pérez=1",
    });
    expect(mensajeDe(r, "primer_apellido")).toBe(
      "El primer apellido solo puede contener letras y espacios",
    );
  });

  it("exige una contraseña de al menos 8 caracteres", () => {
    const r = estudianteSchema.safeParse({ ...valido, password: "1234567" });
    expect(mensajeDe(r, "password")).toBe("Mínimo 8 caracteres");
  });
});

describe("editEstudianteSchema", () => {
  const valido = {
    primer_nombre: "Juan",
    segundo_nombre: "Pablo",
    primer_apellido: "Pérez",
    segundo_apellido: "Gómez",
    email: "juan@correo.com",
    cedula: "12345678",
    telefono: "",
    fecha_nacimiento: "",
    genero: undefined,
    curso_id: undefined,
    fecha_inscripcion: "2026-08-01",
    estado: "inactivo",
  };

  it("acepta una edición válida sin contraseña", () => {
    expect(editEstudianteSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza un primer nombre vacío al editar", () => {
    const r = editEstudianteSchema.safeParse({ ...valido, primer_nombre: "" });
    expect(mensajeDe(r, "primer_nombre")).toBe(
      "El primer nombre es obligatorio",
    );
  });
});

/* ────────────────────────── Instructor (admin) ────────────────────────── */

describe("instructorSchema", () => {
  const valido = {
    primer_nombre: "María",
    segundo_nombre: "",
    primer_apellido: "López",
    segundo_apellido: "García",
    email: "maria@correo.com",
    password: "clave12345",
    cedula: "87654321",
    telefono: "",
    municipio: "",
    tipo_contrato_id: undefined,
    fecha_nacimiento: "",
    genero: undefined,
    especialidad: "",
    titulo: undefined,
    departamento: "",
  };

  it("acepta un instructor válido", () => {
    expect(instructorSchema.safeParse(valido).success).toBe(true);
  });

  it("exige los apellidos", () => {
    const r = instructorSchema.safeParse({
      ...valido,
      primer_apellido: "",
      segundo_apellido: "",
    });
    expect(mensajeDe(r, "primer_apellido")).toBe(
      "El primer apellido es obligatorio",
    );
    expect(mensajeDe(r, "segundo_apellido")).toBe(
      "El segundo apellido es obligatorio",
    );
  });

  it("rechaza un segundo nombre con caracteres no permitidos", () => {
    const r = instructorSchema.safeParse({
      ...valido,
      segundo_nombre: "José();",
    });
    expect(mensajeDe(r, "segundo_nombre")).toBe(
      "El segundo nombre solo puede contener letras y espacios",
    );
  });
});

describe("editInstructorSchema", () => {
  const valido = {
    primer_nombre: "María",
    segundo_nombre: "",
    primer_apellido: "López",
    segundo_apellido: "García",
    email: "maria@correo.com",
    cedula: "87654321",
    telefono: "",
    municipio: "",
    tipo_contrato_id: undefined,
    fecha_nacimiento: "",
    genero: undefined,
    especialidad: "",
    titulo: undefined,
    departamento: "",
  };

  it("acepta una edición válida sin contraseña", () => {
    expect(editInstructorSchema.safeParse(valido).success).toBe(true);
  });

  it("rechaza un correo inválido", () => {
    const r = editInstructorSchema.safeParse({
      ...valido,
      email: "correo-malo",
    });
    expect(mensajeDe(r, "email")).toBe("Correo inválido");
  });
});

/* ────────────────────────── Perfil estudiante ────────────────────────── */

describe("perfilEstudianteSchema", () => {
  it("acepta un perfil vacío (todo opcional)", () => {
    expect(perfilEstudianteSchema.safeParse({}).success).toBe(true);
  });

  it("rechaza teléfonos con letras", () => {
    const r = perfilEstudianteSchema.safeParse({ telefono: "0412a" });
    expect(mensajeDe(r, "telefono")).toBe(
      "El teléfono solo puede contener dígitos",
    );
  });

  it("rechaza teléfonos de más de 20 dígitos", () => {
    const r = perfilEstudianteSchema.safeParse({
      telefono: "123456789012345678901",
    });
    expect(mensajeDe(r, "telefono")).toBe(
      "El teléfono no puede superar 20 dígitos",
    );
  });

  it("rechaza municipios con comillas (inyección)", () => {
    const r = perfilEstudianteSchema.safeParse({ municipio: "O'Brien" });
    expect(mensajeDe(r, "municipio")).toContain("no permitidos");
  });

  it("rechaza un género fuera del enum", () => {
    const r = perfilEstudianteSchema.safeParse({ genero: "desconocido" });
    expect(r.success).toBe(false);
  });
});

/* ────────────────────────── Perfil instructor ────────────────────────── */

describe("perfilInstructorSchema", () => {
  it("acepta un perfil vacío (todo opcional)", () => {
    expect(perfilInstructorSchema.safeParse({}).success).toBe(true);
  });

  it("rechaza cédulas con letras", () => {
    const r = perfilInstructorSchema.safeParse({ cedula: "12a" });
    expect(mensajeDe(r, "cedula")).toBe(
      "La cédula solo puede contener dígitos",
    );
  });

  it("rechaza cédulas de menos de 7 dígitos en el perfil", () => {
    const r = perfilInstructorSchema.safeParse({ cedula: "123456" });
    expect(mensajeDe(r, "cedula")).toBe(
      "La cédula debe tener 7 u 8 dígitos",
    );
  });

  it("acepta una cédula de 8 dígitos en el perfil", () => {
    expect(perfilInstructorSchema.safeParse({ cedula: "12345678" }).success).toBe(
      true,
    );
  });

  it("rechaza especialidades con punto y coma (inyección)", () => {
    const r = perfilInstructorSchema.safeParse({ especialidad: "a;b" });
    expect(mensajeDe(r, "especialidad")).toContain("no permitidos");
  });

  it("rechaza un título fuera del enum", () => {
    const r = perfilInstructorSchema.safeParse({ titulo: "bachiller" });
    expect(r.success).toBe(false);
  });
});
