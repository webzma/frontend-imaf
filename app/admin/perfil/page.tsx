"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Loader2, UserRound } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Field } from "@/components/field";
import { FormGrid, FormSection } from "@/components/form-panel";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, mensajeDeError } from "@/lib/api-client";
import { PERFIL_ADMIN_KEY } from "@/lib/query-keys";
import { cuentaAdminSchema, type CuentaAdminForm } from "@/lib/schemas";
import { useAdminProfile, type AdminProfile } from "@/hooks/use-admin-profile";

/**
 * Cuenta del administrador.
 *
 * Estudiante e instructor tenían su pantalla de perfil desde el principio; el
 * administrador era el único rol que no podía corregir su nombre ni cambiar su
 * contraseña sin pasar por la base de datos.
 */
export default function PerfilAdminPage() {
  const queryClient = useQueryClient();
  const { data: perfil, isLoading, error, refetch } = useAdminProfile();

  const form = useForm<CuentaAdminForm>({
    resolver: zodResolver(cuentaAdminSchema),
    defaultValues: {
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      email: "",
      password_actual: "",
      password: "",
      password_confirmation: "",
    },
  });

  const { reset } = form;

  // El formulario se rellena cuando llega el perfil, no antes: `defaultValues`
  // solo se leen en el primer render y entonces todavía no hay datos.
  useEffect(() => {
    if (!perfil) return;
    reset({
      primer_nombre: perfil.primer_nombre ?? "",
      segundo_nombre: perfil.segundo_nombre ?? "",
      primer_apellido: perfil.primer_apellido ?? "",
      segundo_apellido: perfil.segundo_apellido ?? "",
      email: perfil.email,
      password_actual: "",
      password: "",
      password_confirmation: "",
    });
  }, [perfil, reset]);

  const guardar = useMutation({
    mutationFn: (datos: CuentaAdminForm) =>
      apiFetch<AdminProfile>("api/me", {
        method: "PUT",
        body: {
          primer_nombre: datos.primer_nombre,
          segundo_nombre: datos.segundo_nombre || null,
          primer_apellido: datos.primer_apellido,
          segundo_apellido: datos.segundo_apellido,
          email: datos.email,
          ...(datos.password
            ? {
                password_actual: datos.password_actual,
                password: datos.password,
                password_confirmation: datos.password_confirmation,
              }
            : {}),
        },
      }),
    onSuccess: (actualizado) => {
      // La barra lateral y el menú de cuenta leen de esta misma clave: sin la
      // invalidación, el nombre de la cabecera seguiría siendo el viejo.
      queryClient.setQueryData(PERFIL_ADMIN_KEY, actualizado);
      form.setValue("password_actual", "");
      form.setValue("password", "");
      form.setValue("password_confirmation", "");
      toast.success("Cuenta actualizada");
    },
  });

  const nombre = perfil?.name ?? "";

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        icon={UserRound}
        eyebrow="Mi cuenta"
        title="Tu cuenta"
        subtitle="Los datos con los que entras a la plataforma y apareces en el panel."
      />

      {error ? (
        <ErrorState
          error={error}
          onRetry={refetch}
          fallback="No se pudo cargar tu perfil."
        />
      ) : isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <div className="mb-8 flex items-center gap-4 rounded-lg bg-surface-container-low px-5 py-4 ambient-shadow">
            <Avatar name={nombre} size={12} />
            <div className="min-w-0">
              <p className="truncate font-sans text-base font-semibold text-on-surface">
                {nombre}
              </p>
              <p className="truncate font-sans text-sm text-muted-foreground">
                {perfil?.email}
              </p>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit((datos) => guardar.mutate(datos))}
            className="space-y-8"
          >
            {guardar.isError && (
              <Alert variant="danger">
                {mensajeDeError(
                  guardar.error,
                  "No se pudieron guardar los cambios.",
                )}
              </Alert>
            )}

            <FormSection title="Identidad">
              <FormGrid>
                <Field
                  label="Primer nombre"
                  error={form.formState.errors.primer_nombre?.message}
                >
                  <Input
                    autoComplete="given-name"
                    {...form.register("primer_nombre")}
                  />
                </Field>
                <Field
                  label="Segundo nombre"
                  hint="Opcional"
                  error={form.formState.errors.segundo_nombre?.message}
                >
                  <Input
                    autoComplete="additional-name"
                    {...form.register("segundo_nombre")}
                  />
                </Field>
                <Field
                  label="Primer apellido"
                  error={form.formState.errors.primer_apellido?.message}
                >
                  <Input
                    autoComplete="family-name"
                    {...form.register("primer_apellido")}
                  />
                </Field>
                <Field
                  label="Segundo apellido"
                  error={form.formState.errors.segundo_apellido?.message}
                >
                  <Input {...form.register("segundo_apellido")} />
                </Field>
              </FormGrid>

              <Field
                label="Correo electrónico"
                error={form.formState.errors.email?.message}
              >
                <Input
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                />
              </Field>
            </FormSection>

            <FormSection
              title="Contraseña"
              description="Déjalo en blanco si no quieres cambiarla."
            >
              <Field
                label="Contraseña actual"
                error={form.formState.errors.password_actual?.message}
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...form.register("password_actual")}
                />
              </Field>
              <FormGrid>
                <Field
                  label="Contraseña nueva"
                  error={form.formState.errors.password?.message}
                >
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...form.register("password")}
                  />
                </Field>
                <Field
                  label="Repite la contraseña"
                  error={form.formState.errors.password_confirmation?.message}
                >
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...form.register("password_confirmation")}
                  />
                </Field>
              </FormGrid>
            </FormSection>

            <div className="flex justify-end gap-2 border-t border-outline-variant pt-6">
              <Button type="submit" disabled={guardar.isPending}>
                {guardar.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                <KeyRound className="mr-2 size-4" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </>
      )}
    </PageShell>
  );
}
