"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CedulaInput } from "@/components/cedula-input";
import { Field } from "@/components/field";
import { FormGrid, FormPanel, FormSection } from "@/components/form-panel";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, mensajeDeError } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import {
  estudiantePanelSchema,
  nuevoEstudianteSchema,
  type EstudiantePanelForm,
} from "@/lib/schemas";
import {
  sanitizarDigitos,
  sanitizarLetras,
  sanitizarTexto,
} from "@/lib/validators";
import municipios from "@/data/municipios.json";
import type { Curso, Estudiante } from "../tipos";

const VACIO: EstudiantePanelForm = {
  primer_nombre: "",
  segundo_nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  email: "",
  password: "",
  nacionalidad: "V",
  cedula: "",
  telefono: "",
  fecha_nacimiento: "",
  genero: undefined,
  municipio: "",
  direccion: "",
  curso_id: "",
  fecha_inscripcion: new Date().toISOString().slice(0, 10),
  estado: "activo",
};

/**
 * Alta y edición de un estudiante en un panel lateral.
 *
 * Eran dos formularios de casi cuatrocientas líneas cada uno, con los mismos
 * quince campos escritos dos veces dentro de la misma pantalla. Los dos modos
 * comparten aquí el marcado; lo único que cambia es la contraseña (solo al
 * crear) y a qué endpoint se envía.
 */
export function EstudiantePanel({
  open,
  onOpenChange,
  estudiante,
  cursos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edición; ausente = alta. */
  estudiante?: Estudiante | null;
  cursos: Curso[];
}) {
  const queryClient = useQueryClient();
  const editando = Boolean(estudiante);

  const form = useForm<EstudiantePanelForm>({
    resolver: zodResolver(
      editando ? estudiantePanelSchema : nuevoEstudianteSchema,
    ),
    defaultValues: VACIO,
  });

  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      estudiante
        ? {
            primer_nombre: estudiante.user.primer_nombre ?? "",
            segundo_nombre: estudiante.user.segundo_nombre ?? "",
            primer_apellido: estudiante.user.primer_apellido ?? "",
            segundo_apellido: estudiante.user.segundo_apellido ?? "",
            email: estudiante.user.email,
            password: "",
            nacionalidad:
              (estudiante.nacionalidad as EstudiantePanelForm["nacionalidad"]) ??
              "V",
            cedula: estudiante.cedula,
            telefono: estudiante.telefono ?? "",
            fecha_nacimiento: estudiante.fecha_nacimiento ?? "",
            genero:
              (estudiante.genero as EstudiantePanelForm["genero"]) ?? undefined,
            municipio: estudiante.municipio ?? "",
            direccion: estudiante.direccion ?? "",
            curso_id: estudiante.curso ? String(estudiante.curso.id) : "",
            fecha_inscripcion: estudiante.fecha_inscripcion,
            estado: estudiante.estado,
          }
        : VACIO,
    );
  }, [open, estudiante, reset]);

  const guardar = useMutation({
    mutationFn: (datos: EstudiantePanelForm) => {
      const cuerpo: Record<string, unknown> = {
        primer_nombre: datos.primer_nombre,
        segundo_nombre: datos.segundo_nombre || null,
        primer_apellido: datos.primer_apellido,
        segundo_apellido: datos.segundo_apellido,
        email: datos.email,
        nacionalidad: datos.nacionalidad,
        cedula: datos.cedula,
        telefono: datos.telefono || null,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        genero: datos.genero || null,
        municipio: datos.municipio,
        direccion: datos.direccion,
        curso_id: datos.curso_id ? Number(datos.curso_id) : null,
        fecha_inscripcion: datos.fecha_inscripcion,
        estado: datos.estado,
      };

      if (!editando) cuerpo.password = datos.password;

      return apiFetch<Estudiante>(
        editando
          ? `api/admin/estudiantes/${estudiante!.id}`
          : "api/admin/estudiantes",
        { method: editando ? "PUT" : "POST", body: cuerpo },
      );
    },
    onSuccess: () => {
      // La lista y el resumen dependen del mismo dato; invalidar la raíz del
      // panel evita tener que acordarse de cada clave afectada.
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      onOpenChange(false);
      toast.success(
        editando ? "Estudiante actualizado" : "Estudiante registrado",
      );
    },
  });

  const errores = form.formState.errors;

  // `useWatch` en vez de `form.watch`: el segundo devuelve una función nueva en
  // cada render y el compilador de React no puede memorizar lo que dependa de
  // ella. Aquí solo se vigilan los campos que pintan un control controlado.
  const control = form.control;
  const nacionalidad = useWatch({ control, name: "nacionalidad" }) ?? "V";
  const cedula = useWatch({ control, name: "cedula" }) ?? "";
  const genero = useWatch({ control, name: "genero" });
  const municipio = useWatch({ control, name: "municipio" });
  const cursoId = useWatch({ control, name: "curso_id" });
  const estado = useWatch({ control, name: "estado" });

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={editando ? "Editar estudiante" : "Registrar estudiante"}
      description={
        editando
          ? `Modifica los datos de ${estudiante?.user.name}.`
          : "Completa los datos para crear un nuevo estudiante."
      }
      error={
        guardar.isError
          ? mensajeDeError(guardar.error, "No se pudo guardar el estudiante.")
          : undefined
      }
      submitting={guardar.isPending}
      submitLabel={editando ? "Guardar cambios" : "Crear estudiante"}
      onSubmit={form.handleSubmit((datos) => guardar.mutate(datos))}
    >
      <FormSection title="Identidad">
        <FormGrid>
          <Field label="Primer nombre" error={errores.primer_nombre?.message}>
            <Input
              placeholder="Juan"
              autoComplete="given-name"
              {...form.register("primer_nombre", {
                onChange: (e) =>
                  form.setValue(
                    "primer_nombre",
                    sanitizarLetras(e.target.value),
                  ),
              })}
            />
          </Field>
          <Field
            label="Segundo nombre"
            hint="Opcional"
            error={errores.segundo_nombre?.message}
          >
            <Input
              placeholder="Pablo"
              autoComplete="additional-name"
              {...form.register("segundo_nombre", {
                onChange: (e) =>
                  form.setValue(
                    "segundo_nombre",
                    sanitizarLetras(e.target.value),
                  ),
              })}
            />
          </Field>
          <Field
            label="Primer apellido"
            error={errores.primer_apellido?.message}
          >
            <Input
              placeholder="Pérez"
              autoComplete="family-name"
              {...form.register("primer_apellido", {
                onChange: (e) =>
                  form.setValue(
                    "primer_apellido",
                    sanitizarLetras(e.target.value),
                  ),
              })}
            />
          </Field>
          <Field
            label="Segundo apellido"
            error={errores.segundo_apellido?.message}
          >
            <Input
              placeholder="Gómez"
              {...form.register("segundo_apellido", {
                onChange: (e) =>
                  form.setValue(
                    "segundo_apellido",
                    sanitizarLetras(e.target.value),
                  ),
              })}
            />
          </Field>
        </FormGrid>

        <FormGrid>
          <CedulaInput
            id="cedula-estudiante"
            nacionalidad={nacionalidad}
            onNacionalidadChange={(v) =>
              form.setValue("nacionalidad", v as "V" | "E", {
                shouldValidate: true,
              })
            }
            cedula={cedula}
            onCedulaChange={(v) =>
              form.setValue("cedula", v, { shouldValidate: true })
            }
            error={errores.cedula?.message}
          />
          <Field
            label="Teléfono"
            hint="11 dígitos"
            error={errores.telefono?.message}
          >
            <Input
              inputMode="numeric"
              placeholder="04121234567"
              autoComplete="tel"
              {...form.register("telefono", {
                onChange: (e) =>
                  form.setValue("telefono", sanitizarDigitos(e.target.value), {
                    shouldValidate: true,
                  }),
              })}
            />
          </Field>
        </FormGrid>

        <FormGrid>
          <Field
            label="Fecha de nacimiento"
            error={errores.fecha_nacimiento?.message}
          >
            <Input type="date" {...form.register("fecha_nacimiento")} />
          </Field>
          <Field label="Género" error={errores.genero?.message}>
            <Select
              value={genero ?? ""}
              onValueChange={(v) =>
                form.setValue("genero", v as EstudiantePanelForm["genero"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="femenino">Femenino</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Contacto">
        <FormGrid>
          <Field label="Municipio" error={errores.municipio?.message}>
            <Select
              value={municipio || undefined}
              onValueChange={(v) =>
                form.setValue("municipio", v, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar municipio" />
              </SelectTrigger>
              <SelectContent>
                {municipios.map((municipio) => (
                  <SelectItem key={municipio} value={municipio}>
                    {municipio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Dirección de habitación"
            error={errores.direccion?.message}
          >
            <Input
              placeholder="Av. Principal, casa N° 5"
              maxLength={255}
              autoComplete="street-address"
              {...form.register("direccion", {
                onChange: (e) =>
                  form.setValue("direccion", sanitizarTexto(e.target.value)),
              })}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Acceso">
        <FormGrid>
          <Field label="Correo" error={errores.email?.message}>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              {...form.register("email")}
            />
          </Field>
          {!editando && (
            <Field
              label="Contraseña"
              hint="Mínimo 8 caracteres"
              error={errores.password?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
            </Field>
          )}
        </FormGrid>
      </FormSection>

      <FormSection title="Inscripción">
        <FormGrid>
          <Field label="Curso" error={errores.curso_id?.message}>
            <Select
              value={cursoId || "none"}
              onValueChange={(v) =>
                form.setValue("curso_id", v === "none" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin curso</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={String(curso.id)}>
                    {curso.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado" error={errores.estado?.message}>
            <Select
              value={estado}
              onValueChange={(v) =>
                form.setValue("estado", v as EstudiantePanelForm["estado"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="graduado">Graduado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FormGrid>

        <Field
          label="Fecha de inscripción"
          error={errores.fecha_inscripcion?.message}
        >
          <Input type="date" {...form.register("fecha_inscripcion")} />
        </Field>
      </FormSection>
    </FormPanel>
  );
}
