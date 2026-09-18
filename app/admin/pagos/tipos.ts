import { Ban, CheckCircle2, Clock, type LucideIcon } from "lucide-react";

export type MetodoPago = "transferencia" | "pago_movil" | "efectivo";
export type EstadoPago = "pendiente" | "aprobado" | "rechazado";

export const METODO_LABEL: Record<MetodoPago, string> = {
  transferencia: "Transferencia",
  pago_movil: "Pago Móvil",
  efectivo: "Efectivo",
};

export const ESTADO_CONFIG: Record<
  EstadoPago,
  { label: string; icon: LucideIcon }
> = {
  pendiente: { label: "Pendiente", icon: Clock },
  aprobado: { label: "Aprobado", icon: CheckCircle2 },
  rechazado: { label: "Rechazado", icon: Ban },
};

export interface Pago {
  id: number;
  metodo_pago?: MetodoPago;
  referencia: string | null;
  banco_origen: string | null;
  comprobante: string | null;
  comprobante_url: string | null;
  estado: EstadoPago;
  nota_admin: string | null;
  created_at: string;
  estudiante: {
    id: number;
    nombre: string;
    cedula: string;
    foto: string | null;
    user: { name: string; email: string };
  } | null;
  curso: { id: number; nombre: string; codigo: string } | null;
}

export interface PagoMovilBankData {
  rif: string;
  banco: string;
  telefono: string;
  concepto: string;
}

export interface TransferenciaBankData {
  rif: string;
  banco: string;
  numero_cuenta: string;
  concepto: string;
  nombre_titular: string;
}
