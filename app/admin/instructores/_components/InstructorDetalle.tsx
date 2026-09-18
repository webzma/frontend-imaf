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
import { GENERO_LABEL, type Instructor } from "../tipos";

export function InstructorDetalle({
  instructor,
  onClose,
  onEditar,
}: {
  instructor: Instructor | null;
  onClose: () => void;
  onEditar: (instructor: Instructor) => void;
}) {
  return (
    <Dialog
      open={instructor !== null}
      onOpenChange={(abierto) => !abierto && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-on-surface">
            Ficha del instructor
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
            Datos registrados. Para cambiarlos, usa «Editar».
          </DialogDescription>
        </DialogHeader>

        {instructor && (
          <div className="space-y-6">
            <DetailHeader
              foto={instructor.foto}
              name={instructor.user.name}
              email={instructor.user.email}
              badge={
                instructor.titulo ? (
                  <Badge variant="default" className="px-2.5 py-1 font-sans">
                    {instructor.titulo.nombre}
                  </Badge>
                ) : null
              }
            />

            <DetailSection title="Datos personales">
              <DetailField label="Cédula">
                <span className="font-mono tracking-wide">
                  {formatCedula(instructor.cedula, instructor.nacionalidad)}
                </span>
              </DetailField>
              <DetailField label="Teléfono">
                {instructor.telefono && (
                  <span className="font-mono tracking-wide">
                    {instructor.telefono}
                  </span>
                )}
              </DetailField>
              <DetailField label="Fecha de nacimiento">
                {instructor.fecha_nacimiento &&
                  formatDate(instructor.fecha_nacimiento)}
              </DetailField>
              <DetailField label="Género">
                {instructor.genero && GENERO_LABEL[instructor.genero]}
              </DetailField>
              <DetailField label="Municipio">
                {instructor.municipio}
              </DetailField>
            </DetailSection>

            <DetailSection title="Datos profesionales">
              <DetailField label="Especialidad">
                {instructor.especialidad?.nombre}
              </DetailField>
              <DetailField label="Departamento">
                {instructor.departamento?.nombre}
              </DetailField>
              <DetailField label="Título">
                {instructor.titulo?.nombre}
              </DetailField>
              <DetailField label="Tipo de contrato">
                {instructor.tipo_contrato?.nombre}
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
            onClick={() => instructor && onEditar(instructor)}
          >
            <Pencil className="size-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
