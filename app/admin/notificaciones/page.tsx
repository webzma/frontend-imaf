"use client";

import { NotificacionesPage } from "@/components/notificaciones-page";
import { NOTIF_COUNT_ADMIN_KEY, adminKeys } from "@/lib/query-keys";

export default function AdminNotificacionesPage() {
  return (
    <NotificacionesPage
      basePath="api/admin/notificaciones"
      queryKey={adminKeys.notificaciones()}
      countQueryKey={NOTIF_COUNT_ADMIN_KEY}
    />
  );
}
