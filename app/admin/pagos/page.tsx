"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

/* ── Types ── */

interface Pago {
  id: number;
  referencia: string;
  banco_origen: string | null;
  comprobante: string;
  comprobante_url: string;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  aprobado: {
    label: "Aprobado",
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  rechazado: {
    label: "Rechazado",
    icon: Ban,
    cls: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
    dot: "bg-red-500",
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

  useEffect(() => {
    if (pago) setNota(pago.nota_admin ?? "");
  }, [pago]);

  const handleDecision = async (estado: "aprobado" | "rechazado") => {
    if (!pago) return;
    setSaving(estado);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/pagos/${pago.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado, nota_admin: nota || null }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Error al actualizar.");
      toast.success(
        estado === "aprobado"
          ? "Pago aprobado. Estudiante inscrito."
          : "Pago rechazado.",
      );
      onUpdate(body);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar.");
    } finally {
      setSaving(null);
    }
  };

  if (!pago) return null;

  const cfg = estadoConfig[pago.estado];
  const Icon = cfg.icon;
  const isPdf = pago.comprobante.endsWith(".pdf");

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
            <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface/50 font-semibold mb-1">
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
            <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface/50 font-semibold mb-1">
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
            <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface/50 font-semibold mb-1">
              Referencia
            </p>
            <p className="font-mono font-semibold text-on-surface">
              {pago.referencia}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-sm p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface/50 font-semibold mb-1">
              Banco origen
            </p>
            <p className="font-medium text-on-surface">
              {pago.banco_origen || "—"}
            </p>
          </div>
        </div>

        {/* Estado actual */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-semibold ${cfg.cls}`}
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
          <span className="font-sans text-xs text-muted-foreground">
            {formatDate(pago.created_at)}
          </span>
        </div>

        {/* Comprobante */}
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-surface/70 mb-2">
            Comprobante adjunto
          </p>
          {isPdf ? (
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
                className="w-full max-h-64 object-contain rounded-sm border border-outline-variant/30 hover:opacity-90 transition-opacity cursor-zoom-in"
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
              className="flex-1 font-sans text-sm h-10 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
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
              className="flex-1 gradient-primary font-sans text-sm h-10 text-white"
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
      </DialogContent>
    </Dialog>
  );
}

/* ── Page ── */

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [selected, setSelected] = useState<Pago | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.API_URL}api/admin/pagos`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setPagos(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar los pagos"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return pagos.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.estudiante.nombre.toLowerCase().includes(q) ||
        p.estudiante.cedula.includes(q) ||
        p.referencia.toLowerCase().includes(q) ||
        p.curso.nombre.toLowerCase().includes(q) ||
        p.curso.codigo.toLowerCase().includes(q);
      const matchEstado = filterEstado === "todos" || p.estado === filterEstado;
      return matchSearch && matchEstado;
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
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-8 py-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Admin / Pagos
            </span>
          </div>
          <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface mb-2">
            Comprobantes de pago
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Revisa y gestiona las solicitudes de inscripción por pago móvil.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total", value: stats.total, icon: CreditCard, cls: "" },
            {
              label: "Pendientes",
              value: stats.pendiente,
              icon: Clock,
              cls: "text-amber-600",
            },
            {
              label: "Aprobados",
              value: stats.aprobado,
              icon: CheckCircle2,
              cls: "text-emerald-600",
            },
            {
              label: "Rechazados",
              value: stats.rechazado,
              icon: Ban,
              cls: "text-red-500",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low rounded-sm p-4 ambient-shadow"
            >
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary-container mb-3">
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
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              placeholder="Buscar por estudiante, referencia, curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-semibold">
                      Estudiante
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-semibold">
                      Curso
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-semibold hidden md:table-cell">
                      Referencia
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-semibold hidden lg:table-cell">
                      Fecha
                    </th>
                    <th className="text-left px-5 py-3.5 font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-semibold">
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
                        className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/50 transition-colors"
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
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
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
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="font-mono text-sm text-on-surface">
                            {pago.referencia}
                          </span>
                          {pago.banco_origen && (
                            <p className="font-sans text-xs text-muted-foreground mt-0.5">
                              {pago.banco_origen}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="font-sans text-xs text-muted-foreground">
                            {formatDate(pago.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-semibold ${cfg.cls}`}
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
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
            <div className="px-5 py-3 border-t border-outline-variant/20 flex items-center gap-2">
              <Users className="w-3 h-3 text-muted-foreground/50" />
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
