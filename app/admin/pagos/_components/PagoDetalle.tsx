"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, CheckCircle2, FileText, Loader2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, mensajeDeError } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import {
  ESTADO_CONFIG,
  METODO_LABEL,
  type EstadoPago,
  type Pago,
} from "../tipos";

function Dato({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm bg-surface-container-low p-3">
      <p className="mb-1 font-sans text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
        {label}
      </p>
      <div className="font-sans text-sm text-on-surface">{children}</div>
    </div>
  );
}

/**
 * Ficha de un pago con la decisión de aprobar o rechazar.
 *
 * El diálogo de confirmación es hermano de este, no hijo: antes se montaba
 * dentro del propio `DialogContent`, y dos trampas de foco de Radix apiladas
 * hacían que al cerrar la interior el foco se escapara del diálogo que seguía
 * abierto, y que `Esc` cerrara las dos a la vez.
 */
export function PagoDetalle({
  pago,
  onClose,
}: {
  pago: Pago | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [nota, setNota] = useState("");
  const [decision, setDecision] = useState<EstadoPago | null>(null);

  // La nota se vacía al cambiar de pago. Se ajusta durante el render y no en
  // un efecto, para que no haya un fotograma con la nota del pago anterior.
  const [pagoPrevio, setPagoPrevio] = useState(pago?.id ?? null);
  if ((pago?.id ?? null) !== pagoPrevio) {
    setPagoPrevio(pago?.id ?? null);
    setNota("");
  }

  const decidir = useMutation({
    mutationFn: (estado: EstadoPago) =>
      apiFetch(`api/admin/pagos/${pago!.id}`, {
        method: "PUT",
        body: {
          estado,
          nota_admin: estado === "rechazado" ? nota.trim() || null : null,
        },
      }),
    onSuccess: (_data, estado) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      setDecision(null);
      onClose();
      toast.success(
        estado === "aprobado"
          ? "Pago aprobado; el estudiante ya tiene acceso a su curso."
          : "Pago rechazado.",
      );
    },
    onError: (error) => {
      setDecision(null);
      toast.error(mensajeDeError(error, "No se pudo procesar el pago."));
    },
  });

  if (!pago) return null;

  const cfg = ESTADO_CONFIG[pago.estado];
  const esPdf = pago.comprobante?.endsWith(".pdf") ?? false;

  return (
    <>
      <Dialog
        open={pago !== null && decision === null}
        onOpenChange={(abierto) => !abierto && onClose()}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light tight-tracking">
              Comprobante de pago
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Revisa los datos y el comprobante antes de aprobar o rechazar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Dato label="Estudiante">
              <p className="font-medium">{pago.estudiante?.nombre ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {pago.estudiante?.cedula}
              </p>
            </Dato>
            <Dato label="Curso">
              <p className="truncate font-medium">
                {pago.curso?.nombre ?? "—"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {pago.curso?.codigo}
              </p>
            </Dato>
            <Dato label="Método de pago">
              {METODO_LABEL[pago.metodo_pago ?? "pago_movil"]}
            </Dato>
            <Dato label="Referencia">
              <span className="font-mono font-semibold">
                {pago.referencia || "—"}
              </span>
            </Dato>
            <div className="col-span-2">
              <Dato label="Banco de origen">{pago.banco_origen || "—"}</Dato>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={pago.estado}
              className="px-2.5 py-1 font-sans text-xs font-semibold"
            >
              {cfg.label}
            </Badge>
            <span className="font-sans text-xs text-muted-foreground">
              {formatDateTime(pago.created_at)}
            </span>
          </div>

          <div>
            <p className="mb-2 font-sans text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
              Comprobante adjunto
            </p>
            {!pago.comprobante_url ? (
              <Alert variant="warning">
                Sin comprobante: pago reportado en efectivo. Verifica en caja
                antes de aprobar.
              </Alert>
            ) : esPdf ? (
              <a
                href={pago.comprobante_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm font-sans text-sm text-primary underline underline-offset-2 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FileText className="size-4" />
                Ver PDF del comprobante
              </a>
            ) : (
              <a
                href={pago.comprobante_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pago.comprobante_url}
                  alt={`Comprobante del pago con referencia ${pago.referencia ?? "sin referencia"}`}
                  className="max-h-64 w-full cursor-zoom-in rounded-sm border border-outline-variant object-contain transition-opacity hover:opacity-90"
                />
              </a>
            )}
          </div>

          {pago.estado === "pendiente" && (
            <Field label="Nota para el estudiante" hint="Opcional">
              <Input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                maxLength={500}
                placeholder="Motivo del rechazo, observaciones…"
              />
            </Field>
          )}

          {pago.nota_admin && pago.estado !== "pendiente" && (
            <div className="rounded-sm bg-surface-container-low px-3 py-2">
              <p className="font-sans text-xs text-muted-foreground">
                <span className="font-semibold text-on-surface">Nota: </span>
                {pago.nota_admin}
              </p>
            </div>
          )}

          {pago.estado === "pendiente" && (
            <div className="flex gap-3 pt-1">
              <Button
                variant="destructive"
                className="h-10 flex-1"
                onClick={() => setDecision("rechazado")}
                disabled={decidir.isPending}
              >
                <Ban className="mr-2 size-4" />
                Rechazar
              </Button>
              <Button
                className="h-10 flex-1"
                onClick={() => setDecision("aprobado")}
                disabled={decidir.isPending}
              >
                {decidir.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Aprobar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(abierto) => !abierto && setDecision(null)}
        title={decision === "aprobado" ? "Aprobar pago" : "Rechazar pago"}
        description={
          decision === "aprobado" ? (
            <>
              {pago.estudiante?.nombre} quedará inscrito en{" "}
              <strong>{pago.curso?.nombre}</strong> y tendrá acceso al curso.
            </>
          ) : (
            <>
              El pago quedará rechazado y {pago.estudiante?.nombre} no podrá
              entrar al curso hasta que reporte uno nuevo.
            </>
          )
        }
        confirmLabel={decision === "aprobado" ? "Aprobar" : "Rechazar"}
        variant={decision === "aprobado" ? "default" : "destructive"}
        loading={decidir.isPending}
        onConfirm={() => decision && decidir.mutate(decision)}
      />
    </>
  );
}
