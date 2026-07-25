"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Search,
  Clock,
  CheckCircle2,
  Ban,
  Eye,
  Loader2,
  Filter,
  ImageIcon,
  BookOpen,
  Users,
  AlertTriangle,
} from "lucide-react";

/* ── Types ── */

type MetodoPago = "transferencia" | "pago_movil" | "efectivo";

const METODO_LABELS: Record<MetodoPago, string> = {
  transferencia: "Transferencia",
  pago_movil: "Pago Móvil",
  efectivo: "Efectivo",
};

interface Pago {
  id: number;
  metodo_pago?: MetodoPago;
  referencia: string | null;
  banco_origen: string | null;
  comprobante: string | null;
  comprobante_url: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  nota_admin: string | null;
  created_at: string;
  estudiante: {
    id: number;
    nombre: string;
    cedula: string;
    user: { name: string; email: string };
  };
  curso: {
    id: number;
    nombre: string;
    codigo: string;
  };
}

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${getCookie("token")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    variant: "pendiente" as const,
    dot: "bg-warning",
  },
  aprobado: {
    label: "Aprobado",
    icon: CheckCircle2,
    variant: "aprobado" as const,
    dot: "bg-success",
  },
  rechazado: {
    label: "Rechazado",
    icon: Ban,
    variant: "rechazado" as const,
    dot: "bg-danger",
  },
};

/* ── Modal de detalle / revisión ── */

function PagoDetailModal({
  pago,
  open,
  onClose,
  onUpdate,
}: {
  pago: Pago | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updated: Pago) => void;
}) {
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState<"aprobado" | "rechazado" | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    action: "aprobado" | "rechazado";
    open: boolean;
  }>({ action: "aprobado", open: false });

  useEffect(() => {
    if (pago) setNota(pago.nota_admin ?? "");
  }, [pago]);

  const handleDecision = async (estado: "aprobado" | "rechazado") => {
    // Validar que se ingrese motivo para rechazo
    if (estado === "rechazado" && !nota.trim()) {
      toast.error("Debes ingresar un motivo para el rechazo del pago.");
      return;
    }

    setConfirmDialog({ action: estado, open: true });
  };

  const confirmDecision = async () => {
    if (!pago) return;
    setSaving(confirmDialog.action);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/pagos/${pago.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            estado: confirmDialog.action,
            nota_admin:
              confirmDialog.action === "rechazado" ? nota.trim() : null,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Error al actualizar.");

      // Send notification to student
      await fetch(`${process.env.API_URL}api/admin/notificaciones/send`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: pago.estudiante.user.email, // Send to student's user
          titulo:
            confirmDialog.action === "aprobado"
              ? "¡Pago Aprobado!"
              : "Pago Rechazado",
          mensaje:
            confirmDialog.action === "aprobado"
              ? `Tu pago para el curso ${pago.curso.nombre} ha sido aprobado. Ya estás inscrito en el curso.`
              : `Tu pago para el curso ${pago.curso.nombre} ha sido rechazado. Motivo: ${nota.trim()}`,
          url: `/estudiante/curso`,
        }),
      });

      toast.success(
        confirmDialog.action === "aprobado"
          ? "Pago aprobado. Estudiante inscrito y notificado."
          : "Pago rechazado. Estudiante notificado.",
      );

      // Emit event to update pagos list
      const updatedPayment = body.pago || body;

      window.dispatchEvent(
        new CustomEvent("paymentUpdated", {
          detail: { updatedPayment },
        }),
      );

      onUpdate(updatedPayment);
      onClose();
      setConfirmDialog({ action: "aprobado", open: false });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar.");
    } finally {
      setSaving(null);
    }
  };

  if (!pago) return null;

  const cfg = estadoConfig[pago.estado];
  const Icon = cfg.icon;
  const isPdf = pago.comprobante?.endsWith(".pdf") ?? false;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif font-light text-2xl tight-tracking">
            Comprobante de pago
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            Revisa los datos y el comprobante antes de aprobar o rechazar.
          </DialogDescription>
        </DialogHeader>

        {/* Info estudiante / curso */}
        <div className="grid grid-cols-2 gap-3 text-sm font-sans">
          <div className="bg-surface-container-low rounded-sm p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">
              Estudiante
            </p>
            <p className="font-medium text-on-surface">
              {pago.estudiante.nombre}
            </p>
            <p className="text-xs text-muted-foreground">
              {pago.estudiante.cedula}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-sm p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">
              Curso
            </p>
            <p className="font-medium text-on-surface truncate">
              {pago.curso.nombre}
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              {pago.curso.codigo}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-sm p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">
              Método de pago
            </p>
            <p className="font-medium text-on-surface">
              {METODO_LABELS[pago.metodo_pago ?? "pago_movil"]}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-sm p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">
              Referencia
            </p>
            <p className="font-mono font-semibold text-on-surface">
              {pago.referencia || "—"}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-sm p-3 col-span-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-1">
              Banco origen
            </p>
            <p className="font-medium text-on-surface">
              {pago.banco_origen || "—"}
            </p>
          </div>
        </div>

        {/* Estado actual */}
        <div className="flex items-center gap-2">
          <Badge
            variant={cfg.variant}
            className="font-sans text-xs font-semibold px-2.5 py-1"
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
          </Badge>
          <span className="font-sans text-xs text-muted-foreground">
            {formatDateTime(pago.created_at)}
          </span>
        </div>

        {/* Comprobante */}
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-surface/70 mb-2">
            Comprobante adjunto
          </p>
          {!pago.comprobante_url ? (
            <p className="font-sans text-sm text-muted-foreground italic">
              Sin comprobante — pago reportado en efectivo. Verifica en caja
              antes de aprobar.
            </p>
          ) : isPdf ? (
            <a
              href={pago.comprobante_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              <ImageIcon className="w-4 h-4" />
              Ver PDF del comprobante
            </a>
          ) : (
            <a
              href={pago.comprobante_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pago.comprobante_url}
                alt="Comprobante"
                className="w-full max-h-64 object-contain rounded-sm border border-outline-variant hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </a>
          )}
        </div>

        {/* Nota admin */}
        {pago.estado === "pendiente" && (
          <div className="space-y-1.5">
            <Label className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-surface/70">
              Nota para el estudiante (opcional)
            </Label>
            <Input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Motivo del rechazo, observaciones..."
              className="font-sans text-sm h-10"
            />
          </div>
        )}

        {pago.nota_admin && pago.estado !== "pendiente" && (
          <div className="bg-surface-container-low rounded-sm px-3 py-2">
            <p className="font-sans text-xs text-muted-foreground">
              <span className="font-semibold text-on-surface/70">Nota: </span>
              {pago.nota_admin}
            </p>
          </div>
        )}

        {/* Acciones */}
        {pago.estado === "pendiente" && (
          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => handleDecision("rechazado")}
              variant="outline"
              className="flex-1 font-sans text-sm h-10 border-danger/40 text-on-danger-container hover:bg-danger-container dark:border-danger/40 dark:text-danger dark:hover:bg-danger-container"
              disabled={!!saving}
            >
              {saving === "rechazado" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              Rechazar
            </Button>
            <Button
              onClick={() => handleDecision("aprobado")}
              className="flex-1 font-sans text-sm h-10"
              disabled={!!saving}
            >
              {saving === "aprobado" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Aprobar
            </Button>
          </div>
        )}

        {/* Modal de confirmación */}
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(v) =>
            !v && setConfirmDialog({ ...confirmDialog, open: false })
          }
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif font-light text-xl tight-tracking flex items-center gap-2">
                <AlertTriangle
                  className={`w-5 h-5 ${
                    confirmDialog.action === "aprobado"
                      ? "text-success"
                      : "text-danger"
                  }`}
                />
                {confirmDialog.action === "aprobado"
                  ? "¿Aprobar pago?"
                  : "¿Rechazar pago?"}
              </DialogTitle>
              <DialogDescription className="font-sans text-sm text-muted-foreground">
                {confirmDialog.action === "aprobado"
                  ? `¿Estás seguro que deseas aprobar el pago de ${pago.estudiante.nombre} para el curso ${pago.curso.nombre}? Esta acción inscribirá al estudiante en el curso.`
                  : `¿Estás seguro que deseas rechazar el pago de ${pago.estudiante.nombre} para el curso ${pago.curso.nombre}? El estudiante recibirá una notificación con el motivo del rechazo.`}
              </DialogDescription>
            </DialogHeader>

            {confirmDialog.action === "rechazado" && (
              <div className="mb-4">
                <Label className="font-sans text-sm font-medium text-on-surface mb-2">
                  Motivo del rechazo <span className="text-danger">*</span>
                </Label>
                <Input
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Escribe el motivo por el cual se rechaza el pago..."
                  className="font-sans text-sm"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, open: false })
                }
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDecision}
                disabled={
                  saving !== null ||
                  (confirmDialog.action === "rechazado" && !nota.trim())
                }
                className={`flex-1 ${
                  confirmDialog.action === "aprobado"
                    ? ""
                    : "bg-danger hover:bg-danger text-white"
                }`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : confirmDialog.action === "aprobado" ? (
                  "Aprobar"
                ) : (
                  "Rechazar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

/* ── Page ── */

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [selected, setSelected] = useState<Pago | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.API_URL}api/admin/pagos`, {
      headers: getAuthHeaders(),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          const msg = data?.message || `Error ${r.status}`;
          setFetchError(msg);
          toast.error(`Error al cargar pagos: ${msg}`);
          return;
        }
        const lista = Array.isArray(data) ? data : (data.data ?? []);
        setPagos(lista);
      })
      .catch((err) => {
        const msg = err?.message || "Error de conexión";
        setFetchError(msg);
        toast.error(`Error al cargar los pagos: ${msg}`);
      })
      .finally(() => setLoading(false));

    // Listen for payment update events
    const handlePaymentUpdate = (event: CustomEvent) => {
      const { updatedPayment } = event.detail;
      setPagos((prev) =>
        prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p)),
      );
    };

    window.addEventListener(
      "paymentUpdated",
      handlePaymentUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "paymentUpdated",
        handlePaymentUpdate as EventListener,
      );
    };
  }, []);

  const filtered = useMemo(() => {
    return pagos
      .filter((p) => {
        const q = search.toLowerCase();
        const matchSearch =
          p.estudiante?.nombre?.toLowerCase()?.includes(q) ||
          p.estudiante?.cedula?.includes(q) ||
          p.referencia?.toLowerCase()?.includes(q) ||
          p.curso?.nombre?.toLowerCase()?.includes(q) ||
          p.curso?.codigo?.toLowerCase()?.includes(q);
        const matchEstado =
          filterEstado === "todos" || p.estado === filterEstado;
        return matchSearch && matchEstado;
      })
      .sort((a, b) => {
        // Prioridad: pendientes > aprobados > rechazados
        const priority = { pendiente: 3, aprobado: 2, rechazado: 1 };
        const priorityDiff = priority[b.estado] - priority[a.estado];

        if (priorityDiff !== 0) return priorityDiff;

        // Si mismo estado, ordenar por fecha (más reciente primero)
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [pagos, search, filterEstado]);

  const handleUpdate = (updated: Pago) => {
    setPagos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const openModal = (pago: Pago) => {
    setSelected(pago);
    setModalOpen(true);
  };

  const stats = {
    total: pagos.length,
    pendiente: pagos.filter((p) => p.estado === "pendiente").length,
    aprobado: pagos.filter((p) => p.estado === "aprobado").length,
    rechazado: pagos.filter((p) => p.estado === "rechazado").length,
  };

  const hasFilters = search !== "" || filterEstado !== "todos";

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 px-4 md:px-8 py-10 mx-auto">
        <PageHeader
          icon={CreditCard}
          eyebrow="Admin / Pagos"
          title="Comprobantes de pago"
          subtitle="Revisa y gestiona las solicitudes de inscripción por pago móvil."
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Total",
              value: stats.total,
              icon: CreditCard,
              cls: "text-on-primary-container",
            },
            {
              label: "Pendientes",
              value: stats.pendiente,
              icon: Clock,
              cls: "text-on-primary-container",
            },
            {
              label: "Aprobados",
              value: stats.aprobado,
              icon: CheckCircle2,
              cls: "text-success",
            },
            {
              label: "Rechazados",
              value: stats.rechazado,
              icon: Ban,
              cls: "text-on-primary-container",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low rounded-sm p-4 ambient-shadow"
            >
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary-container/60 mb-3">
                <s.icon
                  className={`w-4 h-4 ${s.cls || "text-on-primary-container"}`}
                />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <p className="font-sans text-3xl font-light tight-tracking text-on-surface tabular-nums mb-1">
                  {s.value}
                </p>
              )}
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por estudiante, referencia, curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-10 w-44 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterEstado("todos");
                }}
                className="font-sans text-xs text-muted-foreground hover:text-on-surface transition-colors underline underline-offset-2"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-sm" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-sm font-sans">
            {fetchError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-on-primary-container" />
            </div>
            <div className="text-center">
              <p className="font-serif font-light text-2xl text-on-surface mb-1">
                {hasFilters ? "Sin resultados" : "No hay comprobantes"}
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                {hasFilters
                  ? "Ningún pago coincide con los filtros aplicados."
                  : "Aún no se han enviado comprobantes de pago."}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
            <div className="h-0.5 gradient-primary" />
            <div className="table-scroll">
              <table className="w-full table-sticky-first [--table-sticky-bg:var(--surface-container-lowest)]">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
                      Estudiante
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
                      Curso
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
                      Método / Referencia
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold hidden lg:table-cell">
                      Fecha
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
                      Estado
                    </th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((pago) => {
                    const cfg = estadoConfig[pago.estado];
                    const Icon = cfg.icon;
                    return (
                      <tr
                        key={pago.id}
                        className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                              <span className="font-sans text-[10px] font-bold text-on-secondary-container">
                                {getInitials(pago.estudiante.nombre)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-sans text-sm font-medium text-on-surface truncate">
                                {pago.estudiante.nombre}
                              </p>
                              <p className="font-sans text-xs text-muted-foreground">
                                {pago.estudiante.cedula}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden md:flex" />
                            <div className="min-w-0">
                              <p className="font-sans text-sm text-on-surface truncate max-w-[160px]">
                                {pago.curso.nombre}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {pago.curso.codigo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-sans text-xs font-semibold text-on-surface">
                            {METODO_LABELS[pago.metodo_pago ?? "pago_movil"]}
                          </p>
                          {pago.referencia && (
                            <span className="font-mono text-sm text-on-surface">
                              {pago.referencia}
                            </span>
                          )}
                          {pago.banco_origen && (
                            <p className="font-sans text-xs text-muted-foreground mt-0.5">
                              {pago.banco_origen}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="font-sans text-xs text-muted-foreground">
                            {formatDateTime(pago.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant={cfg.variant}
                            className="font-sans text-xs font-semibold px-2.5 py-1"
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal(pago)}
                            className="h-8 font-sans text-xs gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {pago.estado === "pendiente" ? "Revisar" : "Ver"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-outline-variant flex items-center gap-2">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="font-sans text-xs text-muted-foreground">
                {filtered.length}{" "}
                {filtered.length === 1 ? "registro" : "registros"}
                {hasFilters ? " encontrados" : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      <PagoDetailModal
        pago={selected}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
