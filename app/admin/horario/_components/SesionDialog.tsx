"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { sesionHorarioSchema, type SesionHorarioForm } from "@/lib/schemas";
import type { CursoRef, Sesion } from "./types";
import { normalizeDate, normalizeTime } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cursos: CursoRef[];
  initial?: Sesion | null;
  defaultDate?: string;
  defaultHora?: string;
  onSaved: (s: Sesion) => void;
  onDeleted: (id: number) => void;
  getAuthHeaders: () => Record<string, string>;
  apiUrl: string;
}

export default function SesionDialog({
  open,
  onOpenChange,
  cursos,
  initial,
  defaultDate,
  defaultHora,
  onSaved,
  onDeleted,
  getAuthHeaders,
  apiUrl,
}: Props) {
  const isEdit = !!initial;
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<SesionHorarioForm>({
    resolver: zodResolver(sesionHorarioSchema),
    defaultValues: {
      curso_id: "",
      titulo: "",
      descripcion: "",
      fecha: "",
      hora_inicio: "",
      hora_fin: "",
      estado: "programada",
    },
  });

  useEffect(() => {
    if (!open) return;
    setSubmitError("");
    if (initial) {
      form.reset({
        curso_id: String(initial.curso_id),
        titulo: initial.titulo,
        descripcion: initial.descripcion ?? "",
        fecha: normalizeDate(initial.fecha),
        hora_inicio: normalizeTime(initial.hora_inicio),
        hora_fin: normalizeTime(initial.hora_fin),
        estado: initial.estado,
      });
    } else {
      const hi = defaultHora ?? "";
      // Si hay hora de inicio sugerida, proponemos +1h como fin.
      let hf = "";
      if (hi) {
        const [h, m] = hi.split(":").map(Number);
        const endH = Math.min(23, h + 1);
        hf = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
      form.reset({
        curso_id: "",
        titulo: "",
        descripcion: "",
        fecha: defaultDate ?? "",
        hora_inicio: hi,
        hora_fin: hf,
        estado: "programada",
      });
    }
  }, [open, initial, defaultDate, defaultHora, form]);

  const onSubmit = async (data: SesionHorarioForm) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const body = {
        curso_id: Number(data.curso_id),
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio || null,
        hora_fin: data.hora_fin || null,
        estado: data.estado,
      };
      const url = isEdit
        ? `${apiUrl}api/admin/sesiones/${initial!.id}`
        : `${apiUrl}api/admin/sesiones`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const messages = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || "Error al guardar la sesión.";
        setSubmitError(messages as string);
        return;
      }
      const saved: Sesion = await res.json();
      toast.success(isEdit ? "Sesión actualizada" : "Sesión creada");
      onSaved(saved);
      onOpenChange(false);
    } catch {
      setSubmitError("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!initial) return;
    if (!confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer."))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}api/admin/sesiones/${initial.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        toast.error("No se pudo eliminar la sesión.");
        return;
      }
      toast.success("Sesión eliminada");
      onDeleted(initial.id);
      onOpenChange(false);
    } catch {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
            {isEdit ? "Editar sesión" : "Nueva sesión"}
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            {isEdit
              ? "Actualiza los detalles de la sesión planificada."
              : "Programa una nueva sesión asignada a un curso."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 pt-1"
        >
          <div className="grid gap-2">
            <Label>Curso *</Label>
            <Select
              value={form.watch("curso_id")}
              onValueChange={(v) =>
                form.setValue("curso_id", v, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No hay cursos disponibles
                  </SelectItem>
                ) : (
                  cursos.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.codigo} — {c.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.curso_id && (
              <p className="text-sm text-danger">
                {form.formState.errors.curso_id.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Ej: Introducción al curso"
              {...form.register("titulo")}
            />
            {form.formState.errors.titulo && (
              <p className="text-sm text-danger">
                {form.formState.errors.titulo.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input id="fecha" type="date" {...form.register("fecha")} />
              {form.formState.errors.fecha && (
                <p className="text-sm text-danger">
                  {form.formState.errors.fecha.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Estado *</Label>
              <Select
                value={form.watch("estado")}
                onValueChange={(v) =>
                  form.setValue("estado", v as SesionHorarioForm["estado"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="hora_inicio">Hora inicio</Label>
              <Input
                id="hora_inicio"
                type="time"
                {...form.register("hora_inicio")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hora_fin">Hora fin</Label>
              <Input id="hora_fin" type="time" {...form.register("hora_fin")} />
              {form.formState.errors.hora_fin && (
                <p className="text-sm text-danger">
                  {form.formState.errors.hora_fin.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descripcion">
              Descripción{" "}
              <span className="text-muted-foreground font-normal ml-1">
                (opcional)
              </span>
            </Label>
            <textarea
              id="descripcion"
              rows={3}
              placeholder="Notas, temas a cubrir, materiales..."
              className="w-full rounded-sm border-0 border-b border-b-outline-variant bg-surface-variant px-3 py-2 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color] outline-none placeholder:text-muted-foreground focus-visible:bg-surface-container-high focus-visible:border-b-primary resize-none"
              {...form.register("descripcion")}
            />
            {form.formState.errors.descripcion && (
              <p className="text-sm text-danger">
                {form.formState.errors.descripcion.message}
              </p>
            )}
          </div>

          {submitError && (
            <div className="bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-sm">
              {submitError}
            </div>
          )}

          <DialogFooter className="flex sm:justify-between gap-2">
            {isEdit ? (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                disabled={deleting || submitting}
                className="text-danger hover:bg-danger-container hover:text-danger border-danger/30"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Eliminar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {isEdit ? "Guardar" : "Crear sesión"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
