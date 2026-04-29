"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Mail,
  CreditCard,
  Upload,
  Clock,
  Ban,
  ImageIcon,
  Loader2,
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

interface CursoDetalle {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: "activo" | "inactivo";
  instructor: Instructor | null;
  estudiantes: Estudiante[];
}

interface Pago {
  id: number;
  curso_id: number;
  referencia: string;
  banco_origen: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  nota_admin: string | null;
  created_at: string;
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

const estadoStyle: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-800",
  inactivo: "bg-amber-100 text-amber-800",
  graduado: "bg-primary-container text-on-primary-container",
};

const pagoEstadoConfig = {
  pendiente: {
    label: "Pago en revisión",
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  },
  aprobado: {
    label: "Inscripción aprobada",
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  rechazado: {
    label: "Pago rechazado",
    icon: Ban,
    cls: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  },
};

/* ── Modal de Pago Móvil ── */

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
  const [referencia, setReferencia] = useState("");
  const [bancoOrigen, setBancoOrigen] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!archivo) {
      toast.error("Debes adjuntar el comprobante de pago.");
      return;
    }
    if (!referencia.trim()) {
      toast.error("Ingresa el número de referencia.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("curso_id", String(curso.id));
      formData.append("referencia", referencia.trim());
      if (bancoOrigen.trim())
        formData.append("banco_origen", bancoOrigen.trim());
      formData.append("comprobante", archivo);

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
        "Comprobante enviado. Espera la confirmación del administrador.",
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

  // Reset on close
  useEffect(() => {
    if (!open) {
      setReferencia("");
      setBancoOrigen("");
      setArchivo(null);
      setPreview(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif font-light text-2xl tight-tracking">
            Pago móvil — Inscripción
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            Realiza el pago móvil y adjunta la captura del comprobante junto con
            el número de referencia.
          </DialogDescription>
        </DialogHeader>

        {/* Datos de pago */}
        <div className="bg-primary-container/40 rounded-sm px-4 py-3 space-y-1 text-sm font-sans border border-primary/10">
          <p className="font-semibold text-on-primary-container dark:text-accent-foreground text-xs tracking-[0.15em] uppercase mb-2">
            Datos para el pago
          </p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Concepto</span>
            <span className="font-medium text-on-surface truncate max-w-[180px]">
              {curso.nombre}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Banco</span>
            <span className="font-medium text-on-surface">
              Banco de Venezuela
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Teléfono</span>
            <span className="font-medium text-on-surface">0414-0000000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cédula</span>
            <span className="font-medium text-on-surface">V-00.000.000</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label
              htmlFor="referencia"
              className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-surface/70"
            >
              Número de referencia *
            </Label>
            <Input
              id="referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: 1234567890"
              className="font-sans text-sm h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="banco"
              className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-surface/70"
            >
              Banco origen (opcional)
            </Label>
            <Input
              id="banco"
              value={bancoOrigen}
              onChange={(e) => setBancoOrigen(e.target.value)}
              placeholder="Ej: Banesco"
              className="font-sans text-sm h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-surface/70">
              Captura del comprobante *
            </Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-outline-variant/50 hover:border-primary/40 rounded-sm transition-colors"
            >
              {preview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Comprobante"
                    className="w-full max-h-48 object-contain rounded-sm"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-sm flex items-center justify-center">
                    <p className="font-sans text-white text-xs font-medium">
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
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Enviar comprobante
                </>
              )}
            </Button>
          </div>
        </form>
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
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 max-w-5xl mx-auto">
        {/* Back */}
        <Link
          href="/estudiante/cursos"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : curso ? (
          <div className="space-y-6">
            {/* Header card */}
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
              <div className="h-1 gradient-primary" />
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-on-primary-container bg-primary-container px-3 py-1 rounded-sm">
                        <Hash className="w-3 h-3" />
                        {curso.codigo}
                      </span>
                      {esMiCurso && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-white bg-primary px-2.5 py-1 rounded-full uppercase tracking-wide">
                          Mi curso
                        </span>
                      )}
                    </div>
                    <h1 className="font-serif font-light text-4xl tight-tracking text-on-surface leading-tight">
                      {curso.nombre}
                    </h1>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-sm font-semibold shrink-0 ${
                      curso.estado === "activo"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {curso.estado === "activo" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Inactivo
                      </>
                    )}
                  </span>
                </div>

                {curso.descripcion && (
                  <p className="font-sans text-base text-muted-foreground leading-relaxed mb-6">
                    {curso.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-8 pt-6 border-t border-outline-variant/30">
                  {curso.instructor && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground/60" />
                      <div>
                        <p className="font-sans text-xs text-muted-foreground">
                          Instructor
                        </p>
                        <p className="font-sans text-sm font-semibold text-on-surface">
                          {curso.instructor?.user?.name ||
                            curso.instructor?.name ||
                            "Sin asignar"}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground/60" />
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">
                        Estudiantes
                      </p>
                      <p className="font-sans text-sm font-semibold text-on-surface">
                        {curso.estudiantes.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Instructor */}
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-5">
                  <GraduationCap className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Instructor
                  </h3>
                </div>
                {curso.instructor?.user ? (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                      <span className="font-sans text-base font-bold text-on-primary-container">
                        {getInitials(curso.instructor.user.name ?? "")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-light text-xl text-on-surface">
                        {curso.instructor.user.name ?? "Sin nombre"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="w-3 h-3 text-muted-foreground/60" />
                        <p className="font-sans text-sm text-muted-foreground truncate">
                          {curso.instructor.user.email ?? ""}
                        </p>
                      </div>
                      {curso.instructor.especialidad && (
                        <p className="font-sans text-xs text-primary/70 mt-2 font-medium">
                          {curso.instructor.especialidad}
                        </p>
                      )}
                      {curso.instructor.titulo && (
                        <p className="font-sans text-xs text-muted-foreground mt-1 capitalize">
                          {curso.instructor.titulo}
                        </p>
                      )}
                      {curso.instructor.departamento && (
                        <p className="font-sans text-xs text-muted-foreground mt-1">
                          Depto. {curso.instructor.departamento}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary-container/60 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-on-primary-container" />
                    </div>
                    <p className="font-sans text-sm text-muted-foreground">
                      Sin instructor asignado
                    </p>
                  </div>
                )}
              </div>

              {/* Estudiantes */}
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary/70" />
                    <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                      Estudiantes
                    </h3>
                  </div>
                  <span className="font-sans text-xs text-muted-foreground bg-surface-container px-2 py-0.5 rounded-full">
                    {curso.estudiantes.length}
                  </span>
                </div>

                {curso.estudiantes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary-container/60 flex items-center justify-center">
                      <Users className="w-4 h-4 text-on-primary-container" />
                    </div>
                    <p className="font-sans text-sm text-muted-foreground">
                      Sin estudiantes matriculados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {curso.estudiantes.map((est) => (
                      <div
                        key={est.id}
                        className="flex items-center gap-3 py-2 border-b border-outline-variant/20 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                          <span className="font-sans text-[10px] font-bold text-on-secondary-container">
                            {getInitials(est.nombre)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm text-on-surface truncate">
                            {est.nombre}
                          </p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full font-sans text-[10px] font-semibold shrink-0 ${estadoStyle[est.estado] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {est.estado.charAt(0).toUpperCase() +
                            est.estado.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sección de inscripción / estado de pago */}
            {esMiCurso ? (
              <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-sm px-4 py-4 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-sans text-sm font-semibold text-emerald-800 dark:text-emerald-400">
                    Ya estás inscrito en este curso
                  </p>
                  <p className="font-sans text-xs text-emerald-700/70 dark:text-emerald-500/70 mt-0.5">
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
                    className={`flex items-start gap-3 rounded-sm px-4 py-4 border ${pagoActivo.estado === "pendiente" ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" : pagoActivo.estado === "aprobado" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20"}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${pagoActivo.estado === "pendiente" ? "text-amber-600" : pagoActivo.estado === "aprobado" ? "text-emerald-600" : "text-red-600"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-sans text-sm font-semibold ${pagoActivo.estado === "pendiente" ? "text-amber-800 dark:text-amber-400" : pagoActivo.estado === "aprobado" ? "text-emerald-800 dark:text-emerald-400" : "text-red-800 dark:text-red-400"}`}
                      >
                        {cfg.label}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground mt-0.5">
                        Referencia:{" "}
                        <span className="font-mono font-semibold">
                          {pagoActivo.referencia}
                        </span>
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
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-on-primary-container" />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-on-surface">
                      Inscríbete en este curso
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground">
                      Realiza un pago móvil y envía tu comprobante para
                      inscribirte.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setModalOpen(true)}
                  disabled={curso.estado !== "activo"}
                  className="font-sans text-sm h-10 text-white dark:text-[#1a1817]"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Enviar pago móvil
                </Button>
                {curso.estado !== "activo" && (
                  <p className="font-sans text-xs text-muted-foreground mt-2">
                    Este curso no está activo para nuevas inscripciones.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/60 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-on-primary-container" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-light text-2xl text-on-surface mb-2">
                  Curso no encontrado
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  El curso que buscas no existe o no está disponible.
                </p>
              </div>
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
