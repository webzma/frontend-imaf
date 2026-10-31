"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IdCard } from "lucide-react";

import { CedulaInput } from "@/components/cedula-input";
import { Field } from "@/components/field";
import { FormGrid, FormPanel, FormSection } from "@/components/form-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [fotoCedula, setFotoCedula] = useState<File | null>(null);
  const [fotoCedulaPreview, setFotoCedulaPreview] = useState<string | null>(
    estudiante?.foto_cedula ?? null,
  );
  const [fotoCedulaError, setFotoCedulaError] = useState("");

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

  useEffect(() => {
    return () => {
      if (fotoCedulaPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(fotoCedulaPreview);
      }
    };
  }, [fotoCedulaPreview]);

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFotoCedulaError("");

    if (!file) {
      setFotoCedula(null);
      setFotoCedulaPreview(estudiante?.foto_cedula ?? null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFotoCedulaError("La cédula debe ser una imagen JPG, PNG o WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFotoCedulaError("La imagen de la cédula no debe superar los 5 MB.");
      e.target.value = "";
      return;
    }

    setFotoCedula(file);
    setFotoCedulaPreview(URL.createObjectURL(file));
  };

  const guardar = useMutation({
    mutationFn: (datos: EstudiantePanelForm) => {
      const cuerpo = new FormData();
      cuerpo.append("primer_nombre", datos.primer_nombre);
      cuerpo.append("segundo_nombre", datos.segundo_nombre || "");
      cuerpo.append("primer_apellido", datos.primer_apellido);
      cuerpo.append("segundo_apellido", datos.segundo_apellido);
      cuerpo.append("email", datos.email);
      cuerpo.append("nacionalidad", datos.nacionalidad);
      cuerpo.append("cedula", datos.cedula);
      cuerpo.append("telefono", datos.telefono || "");
      cuerpo.append("fecha_nacimiento", datos.fecha_nacimiento || "");
      cuerpo.append("genero", datos.genero || "");
      cuerpo.append("municipio", datos.municipio);
      cuerpo.append("direccion", datos.direccion);
      cuerpo.append("curso_id", datos.curso_id || "");
      cuerpo.append("fecha_inscripcion", datos.fecha_inscripcion);
      cuerpo.append("estado", datos.estado);

      if (!editando) cuerpo.append("password", datos.password ?? "");
      if (fotoCedula) cuerpo.append("foto_cedula", fotoCedula);
      // `PUT` no transporta archivos en PHP; el panel envía `POST` con
      // spoofing de método para poder reemplazar la cédula al editar.
      if (editando) cuerpo.append("_method", "PUT");

      return apiFetch<Estudiante>(
        editando
          ? `api/admin/estudiantes/${estudiante!.id}`
          : "api/admin/estudiantes",
        { method: "POST", rawBody: cuerpo },
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
      onSubmit={form.handleSubmit((datos) => {
        if (!editando && !fotoCedula) {
          setFotoCedulaError("Debes adjuntar una imagen de la cédula.");
          return;
        }
        guardar.mutate(datos);
      })}
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

      <FormSection
        title="Documento de identidad"
        description={
          editando
            ? "Adjunta una nueva imagen solo si quieres reemplazar la actual."
            : "La imagen de la cédula es obligatoria para completar el registro."
        }
      >
        <div className="grid gap-2">
          <Label htmlFor="foto_cedula_estudiante">
            Imagen de la cédula
            {!editando && <span className="ml-1 text-danger">*</span>}
          </Label>
          <label
            htmlFor="foto_cedula_estudiante"
            className="flex cursor-pointer items-center gap-4 rounded-sm border border-dashed border-outline-variant bg-surface-container-low px-4 py-3 transition-colors hover:border-primary/60"
          >
            <input
              id="foto_cedula_estudiante"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleCedulaChange}
            />
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface-container">
              {fotoCedulaPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotoCedulaPreview}
                  alt="Vista previa de la cédula"
                  className="h-full w-full object-cover"
                />
              ) : (
                <IdCard className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-sans text-sm font-medium text-on-surface">
                {fotoCedula
                  ? fotoCedula.name
                  : fotoCedulaPreview
                    ? "Imagen actual"
                    : "Adjuntar imagen"}
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                JPG, PNG o WEBP · máx. 5 MB
              </p>
            </div>
          </label>
          {fotoCedulaError && (
            <p role="alert" className="font-sans text-xs text-danger">
              {fotoCedulaError}
            </p>
          )}
        </div>
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
