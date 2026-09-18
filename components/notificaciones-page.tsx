"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Bell, BellRing, Check, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Notificacion {
  id: number;
  read_at: string | null;
  created_at: string;
  data: { titulo: string; mensaje: string; url: string };
}

/**
 * Centro de notificaciones.
 *
 * Cada tarjeta es un `<button>`, no un `div` con `onClick`: antes la lista
 * completa era inalcanzable con teclado y un lector de pantalla no anunciaba
 * que aquello se pudiera abrir. El conteo de no leídas se propaga por el mismo
 * evento que escuchan la barra lateral y la cabecera, así que el punto rojo
 * desaparece a la vez en los tres sitios.
 */
export function NotificacionesPage({
  basePath,
  queryKey,
  countQueryKey,
}: {
  /** Prefijo de la API del rol, p. ej. "api/admin/notificaciones". */
  basePath: string;
  queryKey: readonly unknown[];
  countQueryKey: readonly unknown[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const body = await apiFetch<{ data?: Notificacion[] } | Notificacion[]>(
        basePath,
      );
      return Array.isArray(body) ? body : (body.data ?? []);
    },
    // Sondeo en segundo plano; se detiene con la pestaña oculta para no gastar
    // datos en los teléfonos desde los que entra buena parte del instituto.
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const notificaciones = data ?? [];
  const sinLeer = notificaciones.filter((n) => !n.read_at).length;
  const visibles = soloNoLeidas
    ? notificaciones.filter((n) => !n.read_at)
    : notificaciones;

  const avisarContador = (count: number, type: "single" | "all") => {
    queryClient.setQueryData(countQueryKey, count);
    window.dispatchEvent(
      new CustomEvent("notificationRead", { detail: { type, count } }),
    );
  };

  const abrir = useMutation({
    mutationFn: (notificacion: Notificacion) =>
      apiFetch(`${basePath}/${notificacion.id}/read`, { method: "POST" }),
    onSettled: (_data, _error, notificacion) => {
      queryClient.setQueryData<Notificacion[]>(queryKey, (actual) =>
        (actual ?? []).map((n) =>
          n.id === notificacion.id
            ? { ...n, read_at: new Date().toISOString() }
            : n,
        ),
      );
      avisarContador(
        notificaciones.filter((n) => !n.read_at && n.id !== notificacion.id)
          .length,
        "single",
      );
      // Se navega pase lo que pase: que falle el marcado no debe dejar a la
      // persona clavada en la lista.
      router.push(notificacion.data.url);
    },
  });

  const marcarTodas = useMutation({
    mutationFn: () => apiFetch(`${basePath}/mark-all-read`, { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData<Notificacion[]>(queryKey, (actual) =>
        (actual ?? []).map((n) => ({
          ...n,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
      );
      avisarContador(0, "all");
    },
  });

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        icon={Bell}
        eyebrow="Notificaciones"
        title="Centro de notificaciones"
        subtitle={
          sinLeer > 0
            ? `Tienes ${sinLeer} notificación${sinLeer !== 1 ? "es" : ""} por revisar.`
            : "Estás al día con todas tus notificaciones."
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filtrar notificaciones"
          className="inline-flex items-center gap-1 rounded-full bg-surface-container-low p-1"
        >
          {[
            { activo: false, label: "Todas", total: notificaciones.length },
            { activo: true, label: "No leídas", total: sinLeer },
          ].map((opcion) => (
            <button
              key={opcion.label}
              type="button"
              aria-pressed={soloNoLeidas === opcion.activo}
              onClick={() => setSoloNoLeidas(opcion.activo)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-sans text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                soloNoLeidas === opcion.activo
                  ? "bg-surface-container-lowest text-on-surface ambient-shadow"
                  : "text-muted-foreground hover:text-on-surface",
              )}
            >
              {opcion.label}
              <span className="ml-1.5 tabular-nums opacity-70">
                {opcion.total}
              </span>
            </button>
          ))}
        </div>

        {sinLeer > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => marcarTodas.mutate()}
            disabled={marcarTodas.isPending}
          >
            <Check className="size-3.5" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {error ? (
        <ErrorState
          error={error}
          onRetry={refetch}
          fallback="No se pudieron cargar las notificaciones."
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-surface-container-lowest p-6 ambient-shadow"
            >
              <Skeleton className="mb-3 h-5 w-48" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title={
            soloNoLeidas ? "Sin notificaciones nuevas" : "Sin notificaciones"
          }
          description={
            soloNoLeidas
              ? "Has leído todas tus notificaciones. Las nuevas aparecerán aquí."
              : "Cuando recibas alguna aparecerá en este espacio."
          }
          action={
            soloNoLeidas ? (
              <Button variant="outline" onClick={() => setSoloNoLeidas(false)}>
                Ver todas
              </Button>
            ) : undefined
          }
          className="rounded-sm bg-surface-container-low/50"
        />
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {visibles.map((notificacion) => {
            const noLeida = !notificacion.read_at;

            return (
              <li key={notificacion.id}>
                <button
                  type="button"
                  onClick={() => abrir.mutate(notificacion)}
                  className={cn(
                    "group relative block w-full overflow-hidden rounded-sm bg-surface-container-lowest p-5 text-left transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:p-6",
                    noLeida
                      ? "ring-1 ring-primary/20 ambient-shadow"
                      : "shadow-sm hover:shadow-md",
                  )}
                >
                  {noLeida && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-[2px] gradient-primary"
                    />
                  )}

                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-md",
                        noLeida
                          ? "bg-primary-container"
                          : "bg-surface-container",
                      )}
                    >
                      <Bell
                        aria-hidden="true"
                        className={cn(
                          "size-4",
                          noLeida
                            ? "text-on-primary-container"
                            : "text-muted-foreground",
                        )}
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-sans text-base font-semibold text-on-surface">
                          {notificacion.data.titulo}
                        </span>
                        {noLeida && (
                          <span className="rounded-full bg-primary px-2 py-0.5 font-sans text-[9px] font-bold tracking-[0.15em] uppercase text-primary-foreground">
                            Nueva
                          </span>
                        )}
                      </div>
                      <p className="mb-3 line-clamp-2 font-sans text-sm leading-relaxed text-muted-foreground">
                        {notificacion.data.mensaje}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground">
                          <Clock aria-hidden="true" className="size-3" />
                          {formatRelativeTime(notificacion.created_at)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-medium text-primary">
                          Abrir
                          <ArrowUpRight aria-hidden="true" className="size-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
