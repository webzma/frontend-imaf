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
  instructorPanelSchema,
  nuevoInstructorSchema,
  type InstructorPanelForm,
} from "@/lib/schemas";
import { sanitizarDigitos, sanitizarLetras } from "@/lib/validators";
import municipios from "@/data/municipios.json";
import type { CatalogoItem } from "@/hooks/use-catalogos";
import type { Instructor } from "../tipos";

const VACIO: InstructorPanelForm = {
  primer_nombre: "",
  segundo_nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  email: "",
  password: "",
  nacionalidad: "V",
  cedula: "",
  telefono: "",
  municipio: "",
  fecha_nacimiento: "",
  genero: undefined,
  especialidad_id: undefined,
  titulo_id: undefined,
  departamento_id: undefined,
  tipo_contrato_id: undefined,
};

export function InstructorPanel({
  open,
  onOpenChange,
  instructor,
  catalogos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
  catalogos: {
    especialidades: CatalogoItem[];
    departamentos: CatalogoItem[];
    titulos: CatalogoItem[];
    tipoContratos: CatalogoItem[];
  };
}) {
  const queryClient = useQueryClient();
  const editando = Boolean(instructor);

  const form = useForm<InstructorPanelForm>({
    resolver: zodResolver(
      editando ? instructorPanelSchema : nuevoInstructorSchema,
    ),
    defaultValues: VACIO,
  });

  const { reset, control } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      instructor
        ? {
            primer_nombre: instructor.user.primer_nombre ?? "",
            segundo_nombre: instructor.user.segundo_nombre ?? "",
            primer_apellido: instructor.user.primer_apellido ?? "",
            segundo_apellido: instructor.user.segundo_apellido ?? "",
            email: instructor.user.email,
            password: "",
            nacionalidad:
              (instructor.nacionalidad as InstructorPanelForm["nacionalidad"]) ??
              "V",
            cedula: instructor.cedula,
            telefono: instructor.telefono ?? "",
            municipio: instructor.municipio ?? "",
            fecha_nacimiento: instructor.fecha_nacimiento ?? "",
            genero:
              (instructor.genero as InstructorPanelForm["genero"]) ?? undefined,
            especialidad_id: instructor.especialidad?.id,
            titulo_id: instructor.titulo?.id,
            departamento_id: instructor.departamento?.id,
            tipo_contrato_id: instructor.tipo_contrato?.id,
          }
        : VACIO,
    );
  }, [open, instructor, reset]);

  const nacionalidad = useWatch({ control, name: "nacionalidad" }) ?? "V";
  const cedula = useWatch({ control, name: "cedula" }) ?? "";
  const genero = useWatch({ control, name: "genero" });
  const municipio = useWatch({ control, name: "municipio" });
  const especialidadId = useWatch({ control, name: "especialidad_id" });
  const departamentoId = useWatch({ control, name: "departamento_id" });
  const tituloId = useWatch({ control, name: "titulo_id" });
  const contratoId = useWatch({ control, name: "tipo_contrato_id" });

  const guardar = useMutation({
    mutationFn: (datos: InstructorPanelForm) => {
      const cuerpo: Record<string, unknown> = {
        primer_nombre: datos.primer_nombre,
        segundo_nombre: datos.segundo_nombre || null,
        primer_apellido: datos.primer_apellido,
        segundo_apellido: datos.segundo_apellido,
        email: datos.email,
        nacionalidad: datos.nacionalidad,
        cedula: datos.cedula,
        telefono: datos.telefono || null,
        municipio: datos.municipio || null,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        genero: datos.genero || null,
        especialidad_id: datos.especialidad_id,
        titulo_id: datos.titulo_id,
        departamento_id: datos.departamento_id,
        tipo_contrato_id: datos.tipo_contrato_id,
      };

      if (!editando) cuerpo.password = datos.password;

      return apiFetch<Instructor>(
        editando
          ? `api/admin/profesores/${instructor!.id}`
          : "api/admin/profesores",
        { method: editando ? "PUT" : "POST", body: cuerpo },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      onOpenChange(false);
      toast.success(
        editando ? "Instructor actualizado" : "Instructor registrado",
      );
    },
  });

  const errores = form.formState.errors;

  /** Los cuatro catálogos se pintan igual; solo cambia la lista y el campo. */
  const selectorCatalogo = (
    label: string,
    campo:
      | "especialidad_id"
      | "departamento_id"
      | "titulo_id"
      | "tipo_contrato_id",
    valor: number | undefined,
    opciones: CatalogoItem[],
  ) => (
    <Field label={label} error={errores[campo]?.message}>
      <Select
        value={valor?.toString() ?? ""}
        onValueChange={(v) =>
          form.setValue(campo, v ? Number(v) : undefined, {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.id} value={String(opcion.id)}>
              {opcion.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title={editando ? "Editar instructor" : "Registrar instructor"}
      description={
        editando
          ? `Modifica los datos de ${instructor?.user.name}.`
          : "Completa los datos para crear un nuevo instructor."
      }
      error={
        guardar.isError
          ? mensajeDeError(guardar.error, "No se pudo guardar el instructor.")
          : undefined
      }
      submitting={guardar.isPending}
      submitLabel={editando ? "Guardar cambios" : "Crear instructor"}
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
            id="cedula-instructor"
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
                form.setValue("genero", v as InstructorPanelForm["genero"])
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

        <Field label="Municipio" error={errores.municipio?.message}>
          <Select
            value={municipio || undefined}
            onValueChange={(v) => form.setValue("municipio", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar municipio" />
            </SelectTrigger>
            <SelectContent>
              {municipios.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FormSection>

      <FormSection
        title="Datos profesionales"
        description="Las opciones salen de los catálogos; si falta alguna, se añade en Configuración › Catálogos."
      >
        <FormGrid>
          {selectorCatalogo(
            "Especialidad",
            "especialidad_id",
            especialidadId,
            catalogos.especialidades,
          )}
          {selectorCatalogo(
            "Departamento",
            "departamento_id",
            departamentoId,
            catalogos.departamentos,
          )}
          {selectorCatalogo("Título", "titulo_id", tituloId, catalogos.titulos)}
          {selectorCatalogo(
            "Tipo de contrato",
            "tipo_contrato_id",
            contratoId,
            catalogos.tipoContratos,
          )}
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
    </FormPanel>
  );
}
