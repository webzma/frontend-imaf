"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, ArrowUpRight, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [filter, setFilter] = useState<"all" | "unread">("all");

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
    const interval = setInterval(fetchNotifications, 30000);
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
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read_at: new Date().toISOString() }
              : n,
          ),
        );
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
        router.push(url);
      })
      .catch(() => {
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
      if (diffInMinutes < 1) return "Hace un momento";
      return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? "s" : ""}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `Hace ${diffInDays} día${diffInDays !== 1 ? "s" : ""}`;
      }
      return date.toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const visibleNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read_at)
      : notifications;

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[520px] h-[320px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[380px] h-[260px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 md:py-14 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-10 md:mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Bell className="size-6 text-primary/80" />
            <span className="font-sans text-[11px] tracking-[0.24em] uppercase text-primary/80 font-semibold">
              Notificaciones
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-serif font-light text-[2.6rem] md:text-[3.2rem] tight-tracking leading-[1.05] text-on-surface mb-2">
                Centro de notificaciones
              </h1>
              <p className="font-sans text-sm md:text-base text-muted-foreground max-w-lg">
                {unreadCount > 0
                  ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} por revisar.`
                  : "Estás al día con todas tus notificaciones."}
              </p>
            </div>
          </div>
        </div>

        {/* Filters + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div className="inline-flex items-center gap-1 bg-surface-container-low rounded-full p-1">
            <button
              onClick={() => setFilter("all")}
              className={`font-sans text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                filter === "all"
                  ? "bg-surface-container-lowest text-on-surface ambient-shadow"
                  : "text-muted-foreground hover:text-on-surface"
              }`}
            >
              Todas
              <span className="ml-1.5 tabular-nums opacity-70">
                {notifications.length}
              </span>
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`font-sans text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                filter === "unread"
                  ? "bg-surface-container-lowest text-on-surface ambient-shadow"
                  : "text-muted-foreground hover:text-on-surface"
              }`}
            >
              No leídas
              <span className="ml-1.5 tabular-nums opacity-70">
                {unreadCount}
              </span>
            </button>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-sm ambient-shadow p-6"
              >
                <Skeleton className="h-5 w-48 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="bg-surface-container-low/50 rounded-sm p-12 md:p-16">
            <div className="flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-md" />
                <div className="relative w-16 h-16 rounded-full bg-primary-container/70 flex items-center justify-center ring-2 ring-primary/10">
                  <BellRing className="w-7 h-7 text-on-primary-container" />
                </div>
              </div>
              <div className="text-center max-w-sm">
                <h3 className="font-serif font-light text-2xl tight-tracking text-on-surface mb-2">
                  {filter === "unread"
                    ? "Sin notificaciones nuevas"
                    : "Sin notificaciones"}
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  {filter === "unread"
                    ? "Has leído todas tus notificaciones. Las nuevas aparecerán aquí."
                    : "No tienes notificaciones aún. Cuando recibas alguna aparecerá en este espacio."}
                </p>
              </div>
              {filter === "unread" && (
                <button
                  onClick={() => setFilter("all")}
                  className="font-sans text-xs font-medium text-primary hover:underline underline-offset-4"
                >
                  Ver todas las notificaciones
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map((notification) => {
              const isUnread = !notification.read_at;
              return (
                <div
                  key={notification.id}
                  onClick={() =>
                    markAsRead(notification.id, notification.data.url)
                  }
                  className={`group relative bg-surface-container-lowest rounded-sm overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                    isUnread
                      ? "ambient-shadow ring-1 ring-primary/20"
                      : "shadow-sm hover:shadow-md"
                  }`}
                >
                  {isUnread && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />
                  )}

                  <div className="p-5 md:p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                          isUnread
                            ? "bg-primary-container/80"
                            : "bg-surface-container"
                        }`}
                      >
                        <Bell
                          className={`w-4 h-4 ${
                            isUnread
                              ? "text-on-primary-container"
                              : "text-muted-foreground/70"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3
                            className={`font-sans text-base font-semibold ${
                              isUnread
                                ? "text-on-surface"
                                : "text-on-surface/80"
                            }`}
                          >
                            {notification.data.titulo}
                          </h3>
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-sans text-[9px] font-bold tracking-[0.15em] uppercase">
                              Nueva
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                          {notification.data.mensaje}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground/60">
                            <Clock className="w-3 h-3" />
                            <span className="font-sans text-[11px]">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 font-sans text-xs font-medium text-primary/80 group-hover:text-primary group-hover:gap-1.5 transition-all">
                            Abrir
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
