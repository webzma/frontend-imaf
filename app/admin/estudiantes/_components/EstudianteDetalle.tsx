"use client";

import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DetailField,
  DetailHeader,
  DetailSection,
} from "@/components/detail-fields";
import { formatCedula, formatDate } from "@/lib/format";
import { ESTADO_LABEL, GENERO_LABEL, type Estudiante } from "../tipos";

/** Ficha de solo lectura. Consultar un dato no debería exigir abrir el editor. */
export function EstudianteDetalle({
  estudiante,
  onClose,
  onEditar,
}: {
  estudiante: Estudiante | null;
  onClose: () => void;
  onEditar: (estudiante: Estudiante) => void;
}) {
  return (
    <Dialog
      open={estudiante !== null}
      onOpenChange={(abierto) => !abierto && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-on-surface">
            Ficha del estudiante
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            Datos registrados. Para cambiarlos, usa «Editar».
          </DialogDescription>
        </DialogHeader>

        {estudiante && (
          <div className="space-y-6">
            <DetailHeader
              foto={estudiante.foto}
              name={estudiante.user.name}
              email={estudiante.user.email}
              badge={
                <Badge
                  variant={estudiante.estado}
                  className="px-2.5 py-1 font-sans"
                >
                  {ESTADO_LABEL[estudiante.estado]}
                </Badge>
              }
            />

            <DetailSection title="Datos personales">
              <DetailField label="Cédula">
                <span className="font-mono tracking-wide">
                  {formatCedula(estudiante.cedula, estudiante.nacionalidad)}
                </span>
              </DetailField>
              <DetailField label="Teléfono">
                {estudiante.telefono && (
                  <span className="font-mono tracking-wide">
                    {estudiante.telefono}
                  </span>
                )}
              </DetailField>
              <DetailField label="Fecha de nacimiento">
                {estudiante.fecha_nacimiento &&
                  formatDate(estudiante.fecha_nacimiento)}
              </DetailField>
              <DetailField label="Género">
                {estudiante.genero && GENERO_LABEL[estudiante.genero]}
              </DetailField>
              <DetailField label="Municipio">
                {estudiante.municipio}
              </DetailField>
              <DetailField label="Dirección de habitación">
                {estudiante.direccion}
              </DetailField>
            </DetailSection>

            <DetailSection title="Formación">
              <DetailField label="Curso" empty="Sin curso asignado">
                {estudiante.curso?.nombre}
              </DetailField>
              <DetailField label="Código del curso">
                {estudiante.curso && (
                  <span className="font-mono tracking-wide">
                    {estudiante.curso.codigo}
                  </span>
                )}
              </DetailField>
              <DetailField label="Fecha de inscripción">
                {formatDate(estudiante.fecha_inscripcion)}
              </DetailField>
            </DetailSection>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            className="gap-2"
            onClick={() => estudiante && onEditar(estudiante)}
          >
            <Pencil className="size-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
