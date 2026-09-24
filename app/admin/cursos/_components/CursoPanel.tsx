"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FechaHabilPicker } from "@/components/fecha-habil-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar } from "@/components/avatar";
import { Field } from "@/components/field";
import { FormGrid, FormPanel, FormSection } from "@/components/form-panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, mensajeDeError } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { cursoSchema, type CursoForm } from "@/lib/schemas";
import type { Curso, InstructorRef } from "../tipos";

const VACIO: CursoForm = {
  nombre: "",
  descripcion: "",
  profesor_id: "",
  limite_cupo: 30,
  minimo_estudiantes: undefined,
  fecha_inicio: "",
  fecha_fin: "",
  requisitos: "",
  precio: 0,
  whatsapp_url: "",
  estado: "inactivo",
};

/** Alta de curso. La edición vive en el detalle, junto al temario y las sesiones. */
export function CursoPanel({
  open,
  onOpenChange,
  instructores,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructores: InstructorRef[];
}) {
  const queryClient = useQueryClient();

  const form = useForm<CursoForm>({
    resolver: zodResolver(cursoSchema),
    defaultValues: VACIO,
  });

  const { reset, control } = form;

  useEffect(() => {
    if (open) reset(VACIO);
  }, [open, reset]);

  const profesorId = useWatch({ control, name: "profesor_id" });
  const estado = useWatch({ control, name: "estado" });
  const fechaInicio = useWatch({ control, name: "fecha_inicio" });

  const crear = useMutation({
    mutationFn: (datos: CursoForm) =>
      apiFetch<Curso>("api/admin/cursos", {
        method: "POST",
        body: {
          ...datos,
          descripcion: datos.descripcion || null,
          requisitos: datos.requisitos || null,
          whatsapp_url: datos.whatsapp_url || null,
          fecha_inicio: datos.fecha_inicio || null,
          fecha_fin: datos.fecha_fin || null,
          profesor_id: Number(datos.profesor_id),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      onOpenChange(false);
      toast.success("Curso creado");
    },
  });

  const errores = form.formState.errors;

  return (
    <FormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Crear curso"
      description="Define el curso; el temario y las sesiones se añaden después, desde su ficha."
      error={
        crear.isError
          ? mensajeDeError(crear.error, "No se pudo crear el curso.")
          : undefined
      }
      submitting={crear.isPending}
      submitLabel="Crear curso"
      onSubmit={form.handleSubmit((datos) => crear.mutate(datos))}
    >
      <FormSection title="Identificación">
        <Field label="Nombre del curso" error={errores.nombre?.message}>
          <Input placeholder="Repostería básica" {...form.register("nombre")} />
        </Field>

        <FormGrid>
          <Field label="Instructor" error={errores.profesor_id?.message}>
            <Select
              value={profesorId}
              onValueChange={(v) =>
                form.setValue("profesor_id", v, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructores.map((instructor) => (
                  <SelectItem key={instructor.id} value={String(instructor.id)}>
                    <span className="flex items-center gap-2">
                      <Avatar
                        src={instructor.foto}
                        name={instructor.user.name}
                        size={7}
                      />
                      {instructor.user.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Estado" error={errores.estado?.message}>
            <Select
              value={estado}
              onValueChange={(v) =>
                form.setValue("estado", v as CursoForm["estado"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Cupo y precio">
        <FormGrid>
          <Field label="Límite de cupo" error={errores.limite_cupo?.message}>
            <Input
              type="number"
              min={1}
              {...form.register("limite_cupo", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Mínimo de estudiantes"
            hint="Opcional"
            error={errores.minimo_estudiantes?.message}
          >
            <Input
              type="number"
              min={1}
              {...form.register("minimo_estudiantes", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Precio"
            hint="0 = gratuito"
            error={errores.precio?.message}
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              {...form.register("precio", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Enlace de WhatsApp"
            hint="Opcional"
            error={errores.whatsapp_url?.message}
          >
            <Input
              type="url"
              placeholder="https://chat.whatsapp.com/…"
              {...form.register("whatsapp_url")}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Calendario">
        <FormGrid>
          <Field label="Fecha de inicio" error={errores.fecha_inicio?.message}>
            <Controller
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FechaHabilPicker
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errores.fecha_inicio}
                />
              )}
            />
          </Field>
          <Field label="Fecha de fin" error={errores.fecha_fin?.message}>
            <Controller
              control={form.control}
              name="fecha_fin"
              render={({ field }) => (
                <FechaHabilPicker
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={fechaInicio}
                  invalid={!!errores.fecha_fin}
                />
              )}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Contenido">
        <Field
          label="Descripción"
          hint="Opcional"
          error={errores.descripcion?.message}
        >
          <Textarea
            rows={3}
            placeholder="Breve descripción del contenido del curso…"
            {...form.register("descripcion")}
          />
        </Field>
        <Field
          label="Requisitos o materiales"
          hint="Opcional"
          error={errores.requisitos?.message}
        >
          <Textarea
            rows={3}
            placeholder="Ej.: cuaderno, lápices de colores, cámara…"
            {...form.register("requisitos")}
          />
        </Field>
      </FormSection>
    </FormPanel>
  );
}
