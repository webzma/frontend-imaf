"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Landmark,
  Loader2,
  Smartphone,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import type { PagoMovilBankData, TransferenciaBankData } from "../tipos";

type Tipo = "pago_movil" | "transferencia";

interface CampoSpec {
  clave: string;
  label: string;
  hint?: string;
  placeholder: string;
}

/**
 * Los dos formularios eran cien líneas cada uno con la misma estructura y una
 * cadena de `if` para validar campo a campo. Declarados como datos, añadir un
 * campo es una línea y el mensaje de "obligatorio" sale del mismo sitio.
 */
const CAMPOS: Record<Tipo, CampoSpec[]> = {
  pago_movil: [
    {
      clave: "rif",
      label: "RIF",
      hint: "Ej.: J-12345678-9",
      placeholder: "J-00000000-0",
    },
    { clave: "banco", label: "Banco", placeholder: "Nombre del banco" },
    {
      clave: "telefono",
      label: "Teléfono",
      hint: "Ej.: 0414-1234567",
      placeholder: "0414-0000000",
    },
    {
      clave: "concepto",
      label: "Concepto",
      placeholder: "Descripción del concepto",
    },
  ],
  transferencia: [
    {
      clave: "rif",
      label: "RIF",
      hint: "Ej.: J-12345678-9",
      placeholder: "J-00000000-0",
    },
    { clave: "banco", label: "Banco", placeholder: "Nombre del banco" },
    {
      clave: "numero_cuenta",
      label: "Número de cuenta",
      placeholder: "0102-0000-00-0000000000",
    },
    {
      clave: "concepto",
      label: "Concepto",
      placeholder: "Descripción del concepto",
    },
    {
      clave: "nombre_titular",
      label: "Nombre del titular",
      placeholder: "Nombre completo del titular",
    },
  ],
};

const OPCIONES: {
  tipo: Tipo;
  titulo: string;
  detalle: string;
  icon: typeof Smartphone;
}[] = [
  {
    tipo: "pago_movil",
    titulo: "Pago Móvil",
    detalle: "RIF, banco, teléfono y concepto.",
    icon: Smartphone,
  },
  {
    tipo: "transferencia",
    titulo: "Transferencia",
    detalle: "RIF, número de cuenta, concepto y titular.",
    icon: Landmark,
  },
];

type Datos = {
  pago_movil: PagoMovilBankData | null;
  transferencia: TransferenciaBankData | null;
};

export function DatosBancariosDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey: ["admin", "datos-bancarios"],
    queryFn: async () => {
      // El endpoint devuelve una fila por tipo con los campos planos.
      const filas = await apiFetch<(Record<string, string> & { tipo: Tipo })[]>(
        "api/admin/datos-bancarios",
      );
      const mapa: Datos = { pago_movil: null, transferencia: null };

      for (const fila of Array.isArray(filas) ? filas : []) {
        if (fila.tipo !== "pago_movil" && fila.tipo !== "transferencia")
          continue;
        const campos = Object.fromEntries(
          CAMPOS[fila.tipo].map((campo) => [
            campo.clave,
            fila[campo.clave] ?? "",
          ]),
        );
        if (fila.tipo === "pago_movil") {
          mapa.pago_movil = campos as unknown as PagoMovilBankData;
        } else {
          mapa.transferencia = campos as unknown as TransferenciaBankData;
        }
      }

      return mapa;
    },
    enabled: open,
  });

  // Al elegir un tipo se precargan los datos guardados: editar el concepto no
  // debería obligar a reescribir el RIF y el banco. El ajuste va durante el
  // render, no en un efecto, para no pintar un formulario vacío y rellenarlo
  // después a la vista de quien ya empezó a escribir.
  const firma = `${tipo ?? ""}|${data ? "cargado" : "vacio"}`;
  const [firmaPrevia, setFirmaPrevia] = useState(firma);
  if (firma !== firmaPrevia) {
    setFirmaPrevia(firma);
    const guardado = (tipo ? (data?.[tipo] ?? {}) : {}) as Record<
      string,
      string
    >;
    setValores(
      tipo
        ? Object.fromEntries(
            CAMPOS[tipo].map((campo) => [
              campo.clave,
              guardado[campo.clave] ?? "",
            ]),
          )
        : {},
    );
    setError("");
  }

  const guardar = useMutation({
    mutationFn: (cuerpo: Record<string, string>) =>
      apiFetch("api/admin/datos-bancarios", {
        method: "POST",
        body: { tipo, ...cuerpo },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "datos-bancarios"] });
      toast.success("Datos bancarios guardados.");
      onOpenChange(false);
      setTipo(null);
    },
    onError: (err) =>
      setError(mensajeDeError(err, "No se pudieron guardar los datos.")),
  });

  const enviar = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tipo) return;

    const faltante = CAMPOS[tipo].find(
      (campo) => !(valores[campo.clave] ?? "").trim(),
    );
    if (faltante) {
      setError(`${faltante.label} es obligatorio.`);
      return;
    }

    setError("");
    guardar.mutate(
      Object.fromEntries(
        Object.entries(valores).map(([k, v]) => [k, v.trim()]),
      ),
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => {
        onOpenChange(abierto);
        if (!abierto) setTipo(null);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-light tight-tracking">
            Datos bancarios
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            {tipo === null
              ? "Son los datos que ve el estudiante al reportar su pago."
              : tipo === "pago_movil"
                ? "Datos de pago móvil de la institución."
                : "Datos de transferencia de la institución."}
          </DialogDescription>
        </DialogHeader>

        {tipo === null ? (
          <div className="grid gap-2.5">
            {OPCIONES.map((opcion) => (
              <button
                key={opcion.tipo}
                type="button"
                onClick={() => setTipo(opcion.tipo)}
                className="group flex items-center gap-4 rounded-sm border border-outline-variant bg-surface-container-low px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container">
                  <opcion.icon
                    aria-hidden="true"
                    className="size-4 text-on-primary-container"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-sans text-sm font-semibold text-on-surface">
                    {opcion.titulo}
                  </span>
                  <span className="mt-0.5 block font-sans text-xs text-muted-foreground">
                    {opcion.detalle}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                />
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <button
              type="button"
              onClick={() => setTipo(null)}
              className="inline-flex items-center gap-1.5 rounded-sm font-sans text-xs font-semibold text-primary transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              Cambiar tipo
            </button>

            {error && <Alert variant="danger">{error}</Alert>}

            {CAMPOS[tipo].map((campo) => (
              <Field key={campo.clave} label={campo.label} hint={campo.hint}>
                <Input
                  value={valores[campo.clave] ?? ""}
                  onChange={(e) =>
                    setValores((actual) => ({
                      ...actual,
                      [campo.clave]: e.target.value,
                    }))
                  }
                  placeholder={campo.placeholder}
                />
              </Field>
            ))}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1"
                onClick={() => setTipo(null)}
                disabled={guardar.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 flex-1"
                disabled={guardar.isPending}
              >
                {guardar.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Guardar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
