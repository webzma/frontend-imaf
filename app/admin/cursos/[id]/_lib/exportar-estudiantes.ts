import {
  exportarDocumento,
  slugArchivo,
  type DocumentoExportable,
  type FormatoTabla,
} from "@/lib/exportar-tabla";
import {
  LOCALE,
  formatCedula,
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/lib/format";

export type FormatoExportacion = FormatoTabla;

export interface EstudianteExport {
  nombre: string;
  cedula: string;
  /** No todas las respuestas la traen; sin ella la cédula va sin prefijo. */
  nacionalidad?: string | null;
  telefono?: string | null;
  user: { email: string };
  estado: "activo" | "inactivo" | "graduado";
  estado_pago: "pendiente" | "aprobado" | "reprobado";
  deleted_at: string | null;
  fecha_inscripcion: string;
}

export interface CursoExport {
  nombre: string;
  codigo: string;
  limite_cupo?: number | null;
  precio?: number | string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  nivel_curso?: { nombre: string } | null;
  instructor: { user: { name: string } } | null;
  estudiantes: EstudianteExport[];
}

const ESTADO_LABEL: Record<EstudianteExport["estado"], string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  graduado: "Graduado",
};

const PAGO_LABEL: Record<EstudianteExport["estado_pago"], string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  reprobado: "Rechazado",
};

function contexto(curso: CursoExport): string[] {
  const detalle = [`Código: ${curso.codigo}`];
  if (curso.nivel_curso) detalle.push(`Nivel: ${curso.nivel_curso.nombre}`);
  detalle.push(
    `Instructor: ${curso.instructor?.user.name ?? "Sin instructor"}`,
  );

  const lineas = [curso.nombre, detalle.join(" · ")];

  const condiciones: string[] = [];
  if (curso.fecha_inicio || curso.fecha_fin) {
    condiciones.push(
      `Fechas: ${formatDate(curso.fecha_inicio)} – ${formatDate(curso.fecha_fin)}`,
    );
  }
  // La columna `precio` no tiene cast en el backend: puede llegar como "150.00".
  const precio = Number(curso.precio ?? NaN);
  if (Number.isFinite(precio)) {
    condiciones.push(
      `Precio: ${precio === 0 ? "Gratuito" : formatCurrency(precio)}`,
    );
  }
  if (condiciones.length > 0) lineas.push(condiciones.join(" · "));
  return lineas;
}

/** Arma el listado completo de inscritos, incluidos los archivados. */
export function construirDocumento(curso: CursoExport): DocumentoExportable {
  const estudiantes = [...curso.estudiantes].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, LOCALE),
  );

  const vigentes = estudiantes.filter(
    (e) => e.estado_pago === "aprobado" && !e.deleted_at,
  ).length;
  const contar = (filtro: (e: EstudianteExport) => boolean) =>
    formatNumber(estudiantes.filter(filtro).length);

  return {
    titulo: "Estudiantes inscritos",
    subtitulos: contexto(curso),
    nombreArchivo: `${slugArchivo(curso.nombre, "curso")}-estudiantes`,
    pie: "IMAF — Gestión de cursos",
    indicadores: [
      {
        etiqueta: "Registrados",
        valor: formatNumber(estudiantes.length),
        detalle: "Todas las inscripciones",
      },
      {
        etiqueta: "Ocupan cupo",
        valor: curso.limite_cupo
          ? `${formatNumber(vigentes)} de ${formatNumber(curso.limite_cupo)}`
          : formatNumber(vigentes),
        detalle: "Pago aprobado y no archivados",
      },
      {
        etiqueta: "Pago pendiente",
        valor: contar((e) => e.estado_pago === "pendiente"),
      },
      {
        etiqueta: "Pago rechazado",
        valor: contar((e) => e.estado_pago === "reprobado"),
      },
      { etiqueta: "Archivados", valor: contar((e) => !!e.deleted_at) },
    ],
    secciones: [
      {
        titulo: "Estudiantes",
        columnas: [
          { titulo: "#", tipo: "entero", anchoPdf: 9 },
          { titulo: "Nombre" },
          { titulo: "Cédula", anchoPdf: 24 },
          { titulo: "Correo" },
          { titulo: "Teléfono", anchoPdf: 26 },
          { titulo: "Estado", anchoPdf: 20 },
          { titulo: "Pago", anchoPdf: 20 },
          { titulo: "Inscripción", tipo: "fecha", anchoPdf: 24 },
        ],
        filas: estudiantes.map((e, i) => [
          i + 1,
          e.nombre,
          e.nacionalidad ? formatCedula(e.cedula, e.nacionalidad) : e.cedula,
          e.user.email,
          e.telefono || null,
          e.deleted_at ? "Archivado" : (ESTADO_LABEL[e.estado] ?? e.estado),
          PAGO_LABEL[e.estado_pago] ?? e.estado_pago,
          e.fecha_inscripcion,
        ]),
        vacio: "Este curso no tiene estudiantes inscritos.",
      },
    ],
  };
}

/** Genera y descarga el listado completo de inscritos de un curso. */
export async function exportarEstudiantes(
  curso: CursoExport,
  formato: FormatoExportacion,
) {
  await exportarDocumento(construirDocumento(curso), formato);
}
