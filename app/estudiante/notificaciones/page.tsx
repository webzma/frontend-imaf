"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  id: number;
  read_at: string | null;
  created_at: string;
  data: {
    titulo: string;
    mensaje: string;
    url: string;
  };
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

export default function NotificacionesPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    fetch(`${process.env.API_URL}api/estudiante/notificaciones`, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (notificationId: number, url: string) => {
    fetch(
      `${process.env.API_URL}api/estudiante/notificaciones/${notificationId}/read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getCookie("token")}`,
          Accept: "application/json",
        },
      },
    )
      .then(() => {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read_at: new Date().toISOString() }
              : n,
          ),
        );
        // Emit event to update sidebar
        window.dispatchEvent(
          new CustomEvent("notificationRead", {
            detail: {
              type: "single",
              count: notifications.filter(
                (n) => !n.read_at && n.id !== notificationId,
              ).length,
            },
          }),
        );
        // Redirect to the notification URL
        router.push(url);
      })
      .catch(() => {
        // Still redirect even if marking as read fails
        router.push(url);
      });
  };

  const markAllAsRead = () => {
    fetch(`${process.env.API_URL}api/estudiante/notificaciones/mark-all-read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    })
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
        );

        // Emit event to update sidebar
        window.dispatchEvent(
          new CustomEvent("notificationRead", {
            detail: { type: "all", count: 0 },
          }),
        );
      })
      .catch(() => {});
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60),
      );
      return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? "s" : ""}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays !== 1 ? "s" : ""}`;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-8 py-10 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Notificaciones
            </span>
          </div>
          <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface">
            Centro de notificaciones
          </h1>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col items-start gap-1">
            <p className="font-sans text-sm text-muted-foreground">
              {unreadCount > 0 &&
                `${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} no leída${unreadCount !== 1 ? "s" : ""}`}
              {unreadCount === 0 && "Todas las notificaciones están leídas"}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="flex items-center gap-2 bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-8">
              <Skeleton className="h-6 w-48 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/60 flex items-center justify-center">
                <Bell className="w-7 h-7 text-on-primary-container" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-light text-2xl text-on-surface mb-2">
                  Sin notificaciones
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  No tienes notificaciones pendientes. Las notificaciones
                  aparecerán aquí cuando las recibas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  !notification.read_at ? "border-l-4 border-primary" : ""
                }`}
                onClick={() =>
                  markAsRead(notification.id, notification.data.url)
                }
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-sans text-lg font-semibold text-on-surface">
                          {notification.data.titulo}
                        </h3>
                        {!notification.read_at && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary-container text-on-primary-container font-sans text-xs font-semibold">
                            Nueva
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-base text-muted-foreground leading-relaxed mb-3">
                        {notification.data.mensaje}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        <Bell className="w-3 h-3" />
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
