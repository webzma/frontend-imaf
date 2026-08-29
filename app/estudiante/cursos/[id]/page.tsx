"use client";

import { useState, useEffect, useRef, use } from "react";
import { formatCurrency, formatDateLong } from "@/lib/format";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import bancosData from "@/data/bancos.json";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Hash,
  Users,
  CheckCircle2,
  XCircle,
  CreditCard,
  Upload,
  Clock,
  Ban,
  Loader2,
  Landmark,
  Smartphone,
  Banknote,
  ChevronRight,
  BookMarked,
  CalendarCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

/* ── Types ── */

interface Instructor {
  id: number;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  especialidad: string | null;
  titulo: string | null;
  departamento: string | null;
  name?: string;
  user: { id: number; name: string; email: string };
}

interface Estudiante {
  id: number;
  nombre: string;
  cedula: string;
  estado: "activo" | "inactivo" | "graduado";
  user: { name: string; email: string };
}

interface TemarioItem {
  id: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
}

interface SesionItem {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "programada" | "realizada" | "cancelada";
}

interface CursoDetalle {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  estado: "activo" | "inactivo";
  instructor: Instructor | null;
  estudiantes: Estudiante[];
  temario: TemarioItem[];
  sesiones: SesionItem[];
}

type MetodoPago = "transferencia" | "pago_movil" | "efectivo";

interface Pago {
  id: number;
  curso_id: number;
  metodo_pago?: MetodoPago;
  referencia: string | null;
  banco_origen: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  nota_admin: string | null;
  created_at: string;
}

const METODO_LABELS: Record<MetodoPago, string> = {
  transferencia: "Transferencia",
  pago_movil: "Pago Móvil",
  efectivo: "Efectivo",
};

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
  };
}

const pagoEstadoConfig = {
  pendiente: {
    label: "Pendiente por pago",
    description:
      "Tu inscripción quedará confirmada cuando la administración verifique tu pago.",
    icon: Clock,
    cls: "bg-warning-container border-warning/40 dark:bg-warning-container dark:border-warning/40",
    titleCls: "text-on-warning-container",
    iconCls: "text-warning",
  },
  aprobado: {
    label: "Inscripción aprobada",
    description: "Tu pago fue aprobado. ¡Bienvenido al curso!",
    icon: CheckCircle2,
    cls: "bg-success-container border-success/40 dark:bg-success-container dark:border-success/40",
    titleCls: "text-on-success-container",
    iconCls: "text-success",
  },
  rechazado: {
    label: "Pago rechazado",
    description:
      "Tu comprobante fue rechazado. Puedes enviar un nuevo pago a continuación.",
    icon: Ban,
    cls: "bg-danger-container border-danger/40 dark:bg-danger-container dark:border-danger/40",
    titleCls: "text-on-danger-container dark:text-danger",
    iconCls: "text-danger",
  },
};

/* ── Modal de Inscripción (selección de método + reporte de pago) ── */

const METODO_OPCIONES: {
  id: MetodoPago;
  label: string;
  desc: string;
  icon: typeof Landmark;
}[] = [
  {
    id: "transferencia",
    label: "Transferencia",
    desc: "Transfiere desde tu banco y reporta la referencia con el comprobante.",
    icon: Landmark,
  },
  {
    id: "pago_movil",
    label: "Pago Móvil",
    desc: "Realiza un pago móvil y adjunta la captura del comprobante.",
    icon: Smartphone,
  },
  {
    id: "efectivo",
    label: "Efectivo",
    desc: "Paga directamente en la administración del instituto.",
    icon: Banknote,
  },
];

function PagoModal({
  curso,
  open,
  onClose,
  onSuccess,
}: {
  curso: CursoDetalle;
  open: boolean;
  onClose: () => void;
  onSuccess: (pago: Pago) => void;
}) {
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [referencia, setReferencia] = useState("");
  const [bancoOrigen, setBancoOrigen] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_ARCHIVO = 5 * 1024 * 1024; // 5 MB
  const TIPOS_PERMITIDOS = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!TIPOS_PERMITIDOS.includes(f.type)) {
      setFormError("Formato no permitido. Usa JPG, PNG, WEBP o PDF.");
      setArchivo(null);
      setPreview(null);
      return;
    }
    if (f.size > MAX_ARCHIVO) {
      setFormError("El comprobante no debe superar los 5 MB.");
      setArchivo(null);
      setPreview(null);
      return;
    }
    setFormError("");
    setArchivo(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (!metodo) return; // el formulario solo se renderiza con un método elegido
    if (metodo !== "efectivo") {
      if (!archivo) {
        setFormError("Debes adjuntar el comprobante de pago.");
        return;
      }
      if (!referencia.trim()) {
        setFormError("Ingresa el número de referencia.");
        return;
      }
      if (referencia.trim().length > 30) {
        setFormError("El número de referencia no puede superar 30 dígitos.");
        return;
      }
      if (!/^\d+$/.test(referencia.trim())) {
        setFormError("El número de referencia solo puede contener dígitos.");
        return;
      }

    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("curso_id", String(curso.id));
      formData.append("metodo_pago", metodo);
      if (metodo !== "efectivo") {
        formData.append("referencia", referencia.trim());
        if (bancoOrigen.trim())
          formData.append("banco_origen", bancoOrigen.trim());
        if (archivo) formData.append("comprobante", archivo);
      }

      const res = await fetch(`${process.env.API_URL}api/estudiante/pagos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getCookie("token")}`,
          Accept: "application/json",
        },
        body: formData,
      });

      let body;
      try {
        body = await res.json();
      } catch {
        throw new Error(`Error del servidor (${res.status})`);
      }

      if (!res.ok) {
        const msg =
          body.message ||
          (body.errors
            ? Object.values(body.errors).flat().join(". ")
            : "Error al enviar el pago.");
        throw new Error(msg);
      }

      toast.success(
        metodo === "efectivo"
          ? "Solicitud registrada. Paga en la administración para completar tu inscripción."
          : "Comprobante enviado. Espera la confirmación del administrador.",
      );
      onSuccess(body.pago || body);
      onClose();
    } catch (err: unknown) {
      console.error("Error al enviar pago:", err);
      toast.error(
        err instanceof Error ? err.message : "Error al enviar el pago.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setMetodo(null);
      setReferencia("");
      setBancoOrigen("");
      setArchivo(null);
      setPreview(null);
      setFormError("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif font-light text-2xl tight-tracking">
            {metodo === null
              ? "Inscripción al curso"
              : `${METODO_LABELS[metodo]} — Inscripción`}
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            {metodo === null
              ? "Selecciona el método con el que realizarás el pago de tu inscripción."
              : metodo === "efectivo"
                ? "Registra tu solicitud y paga en efectivo en la administración del instituto."
                : "Realiza el pago y adjunta la captura del comprobante junto con el número de referencia."}
          </DialogDescription>
        </DialogHeader>

        {/* Paso 1: selección de método de pago */}
        {metodo === null && (
          <div className="grid gap-2.5">
            {METODO_OPCIONES.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setMetodo(opt.id);
                    setFormError("");
                  }}
                  className="group flex items-center gap-4 text-left bg-surface-container-low hover:bg-primary-container/40 border border-outline-variant hover:border-primary/40 rounded-sm px-4 py-3.5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-on-primary-container" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold text-on-surface">
                      {opt.label}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-[background-color,border-color,color,box-shadow,transform,opacity] shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {metodo !== null && (
          <>
            <button
              onClick={() => {
                setMetodo(null);
                setFormError("");
              }}
              className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:opacity-70 transition-opacity self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cambiar método de pago
            </button>

            {/* Datos / instrucciones según el método */}
            <div className="bg-primary-container/40 rounded-sm px-4 py-3 space-y-1.5 text-sm font-sans">
              <p className="font-bold text-on-primary-container dark:text-accent-foreground text-[10px] tracking-[0.18em] uppercase mb-2">
                {metodo === "efectivo"
                  ? "Instrucciones de pago"
                  : "Datos para el pago"}
              </p>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Concepto</span>
                <span className="font-medium text-on-surface truncate max-w-[180px]">
                  {curso.nombre}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-mono font-bold text-primary tabular-nums">
                  {formatCurrency(parseFloat(curso.precio))}
                </span>
              </div>
              {metodo === "pago_movil" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banco</span>
                    <span className="font-medium text-on-surface">
                      Banco de Venezuela
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono</span>
                    <span className="font-mono font-medium text-on-surface tabular-nums">
                      0414-0000000
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cédula</span>
                    <span className="font-mono font-medium text-on-surface tabular-nums">
                      V-00.000.000
                    </span>
                  </div>
                </>
              )}
              {metodo === "transferencia" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banco</span>
                    <span className="font-medium text-on-surface">
                      Banco de Venezuela
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Cuenta</span>
                    <span className="font-mono font-medium text-on-surface tabular-nums">
                      0102-0000-00-0000000000
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Titular</span>
                    <span className="font-medium text-on-surface">IMAF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RIF</span>
                    <span className="font-mono font-medium text-on-surface tabular-nums">
                      J-00000000-0
                    </span>
                  </div>
                </>
              )}
              {metodo === "efectivo" && (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Lugar</span>
                    <span className="font-medium text-on-surface text-right">
                      Administración del instituto
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Horario</span>
                    <span className="font-medium text-on-surface text-right">
                      Lun a Vie, 8:00 am – 4:00 pm
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                    Al registrar tu solicitud quedarás{" "}
                    <span className="font-semibold">pendiente por pago</span>.
                    Tu inscripción se confirmará cuando la administración
                    verifique que recibió el pago en efectivo.
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-1">
              {formError && (
                <div
                  role="alert"
                  className="bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-sm font-sans"
                >
                  {formError}
                </div>
              )}
              {metodo !== "efectivo" && (
                <>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="referencia"
                      className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface/70"
                    >
                      Número de referencia *
                    </Label>
                    <Input
                      id="referencia"
                      value={referencia}
                      onChange={(e) =>
                        setReferencia(e.target.value.replace(/\D/g, ""))
                      }
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={30}
                      placeholder="Ej: 1234567890"
                      className="font-sans text-sm h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="banco"
                      className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface/70"
                    >
                      Banco origen (opcional)
                    </Label>
                    <Select value={bancoOrigen} onValueChange={setBancoOrigen}>
                      <SelectTrigger id="banco" className="font-sans text-sm h-10">
                        <SelectValue placeholder="Selecciona un banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {bancosData.map((b) => (
                          <SelectItem key={b.codigo} value={b.nombre}>
                            {b.codigo} - {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface/70">
                      Captura del comprobante *
                    </Label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-primary/2 rounded-sm transition-colors"
                    >
                      {preview ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt="Comprobante"
                            className="w-full max-h-48 object-contain rounded-sm"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-sm flex items-center justify-center">
                            <p className="font-sans text-white text-xs font-semibold">
                              Cambiar imagen
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
                          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                            <Upload className="w-4 h-4 text-on-primary-container" />
                          </div>
                          <div className="text-center">
                            <p className="font-sans text-sm text-on-surface font-medium">
                              Haz clic para subir
                            </p>
                            <p className="font-sans text-xs text-muted-foreground">
                              JPG, PNG, WEBP o PDF · Máx. 5 MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 font-sans text-sm h-10"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 font-sans text-sm h-10 text-white dark:text-[#1a1817]"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : metodo === "efectivo" ? (
                    <>
                      <Banknote className="w-4 h-4 mr-2" />
                      Registrar solicitud
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Enviar comprobante
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Page ── */

export default function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [miCursoId, setMiCursoId] = useState<number | null>(null);
  const [pagoActivo, setPagoActivo] = useState<Pago | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const headers = getAuthHeaders();

    Promise.all([
      fetch(`${process.env.API_URL}api/estudiante/cursos/${id}`, {
        headers,
      }).then((r) => {
        if (!r.ok) throw new Error("No encontrado");
        return r.json();
      }),
      fetch(`${process.env.API_URL}api/estudiante/perfil`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${process.env.API_URL}api/estudiante/pagos`, { headers }).then(
        (r) => r.json(),
      ),
    ])
      .then(([cursoData, perfil, pagos]) => {
        setCurso(cursoData);
        setMiCursoId(perfil?.curso?.id ?? null);
        const cursoId = Number(id);
        const pago = Array.isArray(pagos)
          ? (pagos.find((p: Pago) => p.curso_id === cursoId) ?? null)
          : null;
        setPagoActivo(pago);
      })
      .catch(() => toast.error("Error al cargar el curso"))
      .finally(() => setLoading(false));
  }, [id]);

  const esMiCurso = curso?.id === miCursoId;

  const handlePagoSuccess = (pago: Pago) => {
    setPagoActivo(pago);
  };

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 px-4 md:px-8 py-10 md:py-12 max-w-5xl mx-auto">
        {/* Back */}
        <Link
          href="/estudiante/cursos"
          className="group inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver al catálogo
        </Link>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-5">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        ) : curso ? (
          <div className="space-y-5">
            {/* Hero card */}
            <div className="relative bg-surface-container-lowest rounded-md overflow-hidden ambient-shadow">
              <div className="absolute inset-0 gradient-primary opacity-[0.05] pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

              <div className="relative p-7 md:p-9">
                <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-on-primary-container bg-primary-container/70 px-2 py-1 rounded-sm">
                      <Hash className="w-2.5 h-2.5" />
                      {curso.codigo}
                    </span>
                    {esMiCurso && (
                      <span className="inline-flex items-center gap-1.5 font-sans text-[10px] tracking-[0.22em] uppercase text-primary font-bold">
                        <Sparkles className="w-3 h-3" />
                        Mi curso
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={curso.estado as "activo" | "inactivo"}
                    className="gap-1.5 px-3 py-1 shrink-0"
                  >
                    {curso.estado === "activo" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-success dark:bg-success" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Inactivo
                      </>
                    )}
                  </Badge>
                </div>

                <h1 className="font-serif font-light text-3xl md:text-5xl tight-tracking text-on-surface leading-[1.05] mb-4">
                  {curso.nombre}
                </h1>

                {curso.descripcion && (
                  <p className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                    {curso.descripcion}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-outline-variant">
                  {curso.instructor && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-on-primary-container" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                          Instructor
                        </p>
                        <p className="font-sans text-sm font-semibold text-on-surface truncate">
                          {curso.instructor?.user?.name ||
                            curso.instructor?.name ||
                            "Sin asignar"}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-on-primary-container" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                        Estudiantes inscritos
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface tabular-nums">
                        {curso.estudiantes.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de inscripción / estado de pago — destacado arriba */}
            {esMiCurso ? (
              <div className="flex items-start gap-4 bg-success-container rounded-sm px-5 py-4 ambient-shadow">
                <div className="w-10 h-10 rounded-full bg-success-container flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-sans text-sm font-semibold text-on-success-container">
                    Ya estás inscrito en este curso
                  </p>
                  <p className="font-sans text-xs text-on-success-container dark:text-success mt-0.5">
                    Este es tu curso activo.
                  </p>
                </div>
              </div>
            ) : pagoActivo ? (
              (() => {
                const cfg = pagoEstadoConfig[pagoActivo.estado];
                const Icon = cfg.icon;
                return (
                  <div
                    className={`flex items-start gap-4 rounded-sm px-5 py-4 border ambient-shadow ${cfg.cls}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/40 dark:bg-black/20 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${cfg.iconCls}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-sans text-sm font-semibold ${cfg.titleCls}`}
                      >
                        {cfg.label}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground mt-0.5">
                        {cfg.description}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground mt-2">
                        Método:{" "}
                        <span className="font-semibold text-on-surface/80">
                          {
                            METODO_LABELS[
                              pagoActivo.metodo_pago ?? "pago_movil"
                            ]
                          }
                        </span>
                        {pagoActivo.referencia && (
                          <>
                            {" · "}Referencia:{" "}
                            <span className="font-mono font-semibold text-on-surface/80">
                              {pagoActivo.referencia}
                            </span>
                          </>
                        )}
                      </p>
                      {pagoActivo.nota_admin && (
                        <p className="font-sans text-xs text-muted-foreground mt-1 italic">
                          Nota: {pagoActivo.nota_admin}
                        </p>
                      )}
                      {pagoActivo.estado === "rechazado" && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="font-sans text-xs font-semibold text-primary underline underline-offset-2 mt-2 hover:opacity-70 transition-opacity"
                        >
                          Enviar nuevo comprobante
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-start gap-4 mb-5">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full gradient-primary opacity-30 blur-md" />
                    <div className="relative w-12 h-12 rounded-full bg-primary-container flex items-center justify-center ring-2 ring-primary/10">
                      <CreditCard className="w-5 h-5 text-on-primary-container" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif font-light text-xl text-on-surface tight-tracking">
                      Inscríbete en este curso
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground mt-1 max-w-md">
                      Paga por transferencia, pago móvil o efectivo y reporta tu
                      pago para formalizar tu inscripción.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setModalOpen(true)}
                  disabled={curso.estado !== "activo"}
                  className="font-sans text-sm h-10 text-white dark:text-[#1a1817] gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  Inscribirse al curso
                </Button>
                {curso.estado !== "activo" && (
                  <p className="font-sans text-xs text-muted-foreground mt-2">
                    Este curso no está activo para nuevas inscripciones.
                  </p>
                )}
              </div>
            )}

            {/* Temario */}
            {curso.temario?.length > 0 && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <BookMarked className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Temario · {curso.temario.length} módulos
                  </h3>
                </div>
                <ol className="space-y-1">
                  {[...curso.temario]
                    .sort((a, b) => a.orden - b.orden)
                    .map((item, idx) => (
                      <li
                        key={item.id}
                        className="group flex gap-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low/30 -mx-2 px-2 rounded-sm transition-colors"
                      >
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary-container flex items-center justify-center font-mono text-xs font-bold text-on-primary-container mt-0.5 group-hover:scale-105 transition-transform">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm font-semibold text-on-surface">
                            {item.titulo}
                          </p>
                          {item.descripcion && (
                            <p className="font-sans text-xs text-muted-foreground mt-1 leading-relaxed">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              </div>
            )}

            {/* Sesiones */}
            {curso.sesiones?.length > 0 && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarCheck className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Sesiones · {curso.sesiones.length}
                  </h3>
                </div>
                <div className="space-y-1">
                  {curso.sesiones.map((sesion) => {
                    const sesionEstado: Record<
                      SesionItem["estado"],
                      {
                        label: string;
                        variant: "programada" | "realizada" | "cancelada";
                        dot: string;
                      }
                    > = {
                      programada: {
                        label: "Programada",
                        variant: "programada",
                        dot: "bg-info",
                      },
                      realizada: {
                        label: "Realizada",
                        variant: "realizada",
                        dot: "bg-success",
                      },
                      cancelada: {
                        label: "Cancelada",
                        variant: "cancelada",
                        dot: "bg-danger",
                      },
                    };
                    const cfg =
                      sesionEstado[sesion.estado] ?? sesionEstado.programada;
                    return (
                      <div
                        key={sesion.id}
                        className="flex flex-col sm:flex-row sm:items-start gap-3 py-3.5 border-b border-outline-variant last:border-0"
                      >
                        <div className="sm:w-44 shrink-0">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <p className="font-sans text-xs font-semibold text-on-surface">
                              {formatDateLong(sesion.fecha)}
                            </p>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground mt-0.5 ml-5">
                            {sesion.hora_inicio} – {sesion.hora_fin}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold text-on-surface">
                            {sesion.titulo}
                          </p>
                          {sesion.descripcion && (
                            <p className="font-sans text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {sesion.descripcion}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={cfg.variant}
                          className="gap-1.5 px-2.5 py-1 text-[10px] shrink-0"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-low/50 rounded-sm p-12 md:p-16">
            <div className="flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-md" />
                <div className="relative w-16 h-16 rounded-full bg-primary-container/70 flex items-center justify-center ring-2 ring-primary/10">
                  <BookOpen className="w-7 h-7 text-on-primary-container" />
                </div>
              </div>
              <div className="text-center max-w-sm">
                <h3 className="font-serif font-light text-2xl tight-tracking text-on-surface mb-2">
                  Curso no encontrado
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  El curso que buscas no existe o no está disponible.
                </p>
              </div>
              <Link
                href="/estudiante/cursos"
                className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:gap-2 transition-[background-color,border-color,color,box-shadow,transform,opacity]"
              >
                Volver al catálogo
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {curso && (
        <PagoModal
          curso={curso}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handlePagoSuccess}
        />
      )}
    </div>
  );
}
