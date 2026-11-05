import { describe, expect, it } from "vitest";

import { construirDocumento, type CursoExport } from "./exportar-estudiantes";

const curso: CursoExport = {
  nombre: "Corte y Costura",
  codigo: "COS1",
  limite_cupo: 20,
  precio: 0,
  fecha_inicio: "2026-03-01",
  fecha_fin: "2026-06-30",
  nivel_curso: { nombre: "Básico" },
  instructor: { user: { name: "Luz Díaz" } },
  estudiantes: [
    {
      nombre: "Zoila Rojas",
      cedula: "111",
      nacionalidad: "E",
      telefono: null,
      user: { email: "z@imaf.test" },
      estado: "activo",
      estado_pago: "pendiente",
      deleted_at: null,
      fecha_inscripcion: "2026-02-10T12:00:00Z",
    },
    {
      nombre: "Ángela Mora",
      cedula: "222",
      telefono: "0412",
      user: { email: "a@imaf.test" },
      estado: "activo",
      estado_pago: "aprobado",
      deleted_at: null,
      fecha_inscripcion: "2026-02-11",
    },
    {
      nombre: "Bea Paz",
      cedula: "333",
      nacionalidad: "V",
      telefono: "0414",
      user: { email: "b@imaf.test" },
      estado: "activo",
      estado_pago: "aprobado",
      deleted_at: "2026-03-01T00:00:00Z",
      fecha_inscripcion: "2026-02-12",
    },
  ],
};

describe("construirDocumento (inscritos)", () => {
  const doc = construirDocumento(curso);
  const [seccion] = doc.secciones;

  it("ordena por nombre respetando las tildes", () => {
    expect(seccion.filas.map((f) => f[1])).toEqual([
      "Ángela Mora",
      "Bea Paz",
      "Zoila Rojas",
    ]);
  });

  it("incluye correo, cédula con prefijo y marca a los archivados", () => {
    const [angela, bea, zoila] = seccion.filas;
    expect(angela[2]).toBe("222");
    expect(angela[3]).toBe("a@imaf.test");
    expect(bea[2]).toBe("V-333");
    expect(bea[5]).toBe("Archivado");
    expect(zoila[2]).toBe("E-111");
    expect(zoila[4]).toBeNull();
  });

  it("solo cuenta en el cupo a quien pagó y no está archivado", () => {
    const valor = (etiqueta: string) =>
      doc.indicadores?.find((i) => i.etiqueta === etiqueta)?.valor;
    expect(valor("Registrados")).toBe("3");
    expect(valor("Ocupan cupo")).toBe("1 de 20");
    expect(valor("Pago pendiente")).toBe("1");
    expect(valor("Archivados")).toBe("1");
  });

  it("da el contexto del curso", () => {
    expect(doc.subtitulos?.[0]).toBe("Corte y Costura");
    expect(doc.subtitulos?.[1]).toBe(
      "Código: COS1 · Nivel: Básico · Instructor: Luz Díaz",
    );
    expect(doc.subtitulos?.[2]).toContain("Precio: Gratuito");
    expect(doc.nombreArchivo).toBe("corte-y-costura-estudiantes");
  });

  it("entiende el precio aunque la API lo envíe como texto", () => {
    const conPrecio = construirDocumento({ ...curso, precio: "150.00" });
    expect(conPrecio.subtitulos?.[2]).toContain("Precio: Bs. 150,00");
    const sinPrecio = construirDocumento({ ...curso, precio: null });
    expect(sinPrecio.subtitulos?.[2]).not.toContain("Precio");
  });
});
