"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CedulaInputProps {
  /** Valor actual de la nacionalidad ("V" o "E"). */
  nacionalidad: string;
  /** Callback al cambiar la nacionalidad. */
  onNacionalidadChange: (value: string) => void;
  /** Valor actual de la cédula (solo dígitos). */
  cedula: string;
  /** Callback al cambiar la cédula. Recibe solo dígitos. */
  onCedulaChange: (value: string) => void;
  /** Mensaje de error de validación (opcional). */
  error?: string;
  /** Si es true, muestra el asterisco de obligatorio. */
  required?: boolean;
  /** ID base para los inputs (default: "cedula"). */
  id?: string;
  /** Si es true, los campos están deshabilitados. */
  disabled?: boolean;
}

/**
 * Campo de cédula estandarizado: selector de nacionalidad (V/E)
 * seguido de un input numérico para el número de cédula.
 *
 * Envía al backend dos campos separados: `nacionalidad` ("V" | "E")
 * y `cedula` (solo dígitos, 7–8 caracteres).
 */
export function CedulaInput({
  nacionalidad,
  onNacionalidadChange,
  cedula,
  onCedulaChange,
  error,
  required,
  id = "cedula",
  disabled,
}: CedulaInputProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        Cédula{required && " *"}
      </Label>
      <div className="flex gap-2">
        <Select
          value={nacionalidad}
          onValueChange={onNacionalidadChange}
          disabled={disabled}
        >
          <SelectTrigger
            className="w-16 font-sans text-sm shrink-0"
            aria-label="Nacionalidad"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="V">V</SelectItem>
            <SelectItem value="E">E</SelectItem>
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          placeholder="00000000"
          value={cedula}
          onChange={(e) => {
            const onlyDigits = e.target.value.replace(/\D/g, "");
            onCedulaChange(onlyDigits);
          }}
          className="font-sans text-sm flex-1"
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
