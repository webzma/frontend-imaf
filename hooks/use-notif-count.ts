"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { NOTIF_COUNT_ADMIN_KEY } from "@/lib/query-keys";

/**
 * Contador de notificaciones sin leer.
 *
 * La barra lateral, la campana de la cabecera y la navegación móvil piden el
 * mismo dato. Con la clave compartida react-query hace una sola petición y las
 * tres se actualizan juntas; antes cada una tenía su propio sondeo.
 */
export function useNotifCount(
  path = "api/admin/notificaciones/count",
  queryKey: readonly unknown[] = NOTIF_COUNT_ADMIN_KEY,
) {
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await apiFetch<{ unread_count?: number }>(path, {
        skipAuthRedirect: true,
      }).catch(() => ({ unread_count: 0 }));
      return data.unread_count ?? 0;
    },
    refetchInterval: 30000,
    // Sondear una pestaña que nadie está mirando gasta batería y datos en los
    // teléfonos de gama baja desde los que entra buena parte del instituto.
    refetchIntervalInBackground: false,
  });

  // Marcar una notificación como leída en otra vista debe bajar el contador.
  useEffect(() => {
    const handler = (event: Event) => {
      const detalle = (event as CustomEvent<{ type?: string; count?: number }>)
        .detail;
      if (detalle?.type === "all") {
        queryClient.setQueryData(queryKey, 0);
      } else if (typeof detalle?.count === "number") {
        queryClient.setQueryData(queryKey, detalle.count);
      }
    };

    window.addEventListener("notificationRead", handler);
    return () => window.removeEventListener("notificationRead", handler);
  }, [queryClient, queryKey]);

  return unreadCount;
}
