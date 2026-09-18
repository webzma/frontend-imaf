"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, mensajeDeError } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import type { CatalogoSpec } from "@/lib/admin-nav";

interface CatalogoItem {
  id: number;
  nombre: string;
}

/**
 * CRUD de un catálogo de instructores.
 *
 * Los cuatro catálogos son la misma pantalla con otro sustantivo. La versión
 * anterior mantenía la lista en `useState` y la sincronizaba a mano tras cada
 * operación; aquí la caché de react-query es la única copia y la lista se
 * invalida al terminar cada mutación.
 */
export default function CatalogoPage({
  spec,
  className,
}: {
  spec: CatalogoSpec;
  className?: string;
}) {
  const { slug, title, singular, plural, articulo, icon: Icon } = spec;
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState<CatalogoItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [borrando, setBorrando] = useState<CatalogoItem | null>(null);

  const listaKey = adminKeys.opciones(slug);

  const lista = useQuery({
    queryKey: listaKey,
    queryFn: async () => {
      const body = await apiFetch<CatalogoItem[] | { data: CatalogoItem[] }>(
        `api/admin/${slug}`,
      );
      return Array.isArray(body) ? body : (body.data ?? []);
    },
  });

  const items = lista.data ?? [];

  // Concuerda con el género del sustantivo: "tipo de contrato creada" era la
  // clase de detalle que hace que el sistema se sienta ajeno.
  const vocal = articulo === "la" ? "a" : "o";
  const participio = (raiz: "cre" | "actualiz" | "elimin") =>
    `${raiz}ad${vocal}`;

  const capitalizar = (texto: string) =>
    texto.charAt(0).toUpperCase() + texto.slice(1);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: listaKey });

  const crear = useMutation({
    mutationFn: (valor: string) =>
      apiFetch<CatalogoItem>(`api/admin/${slug}`, {
        method: "POST",
        body: { nombre: valor },
      }),
    onSuccess: () => {
      setNombre("");
      invalidar();
      toast.success(`${capitalizar(singular)} ${participio("cre")}`);
      inputRef.current?.focus();
    },
  });

  const actualizar = useMutation({
    mutationFn: ({ id, valor }: { id: number; valor: string }) =>
      apiFetch<CatalogoItem>(`api/admin/${slug}/${id}`, {
        method: "PUT",
        body: { nombre: valor },
      }),
    onSuccess: () => {
      setEditando(null);
      invalidar();
      toast.success(`${capitalizar(singular)} ${participio("actualiz")}`);
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`api/admin/${slug}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setBorrando(null);
      invalidar();
      toast.success(`${capitalizar(singular)} ${participio("elimin")}`);
    },
    onError: (error) =>
      toast.error(
        mensajeDeError(error, `No se pudo eliminar ${articulo} ${singular}.`),
      ),
  });

  const abrirEdicion = (item: CatalogoItem) => {
    setEditando(item);
    setEditNombre(item.nombre);
    actualizar.reset();
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  return (
    <div className={className}>
      {/* ── Alta ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nombre.trim()) crear.mutate(nombre.trim());
        }}
        className="mb-6 flex max-w-lg items-end gap-3"
      >
        <div className="grid flex-1 gap-2">
          <Label htmlFor={`nuevo-${slug}`}>Nombre</Label>
          <Input
            ref={inputRef}
            id={`nuevo-${slug}`}
            placeholder={`Nuev${vocal} ${singular}…`}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={crear.isError || undefined}
          />
        </div>
        <Button
          type="submit"
          disabled={crear.isPending || !nombre.trim()}
          className="h-10 gap-2"
        >
          {crear.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Guardar
        </Button>
      </form>

      {crear.isError && (
        <Alert variant="danger" className="mb-6 max-w-lg">
          {mensajeDeError(
            crear.error,
            `No se pudo crear ${articulo} ${singular}.`,
          )}
        </Alert>
      )}

      {/* ── Lista ── */}
      {lista.isLoading ? (
        <div className="max-w-2xl overflow-hidden rounded-sm bg-surface-container-low ambient-shadow">
          <div className="border-b border-outline-variant px-6 py-3.5">
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="divide-y divide-outline-variant">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4"
              >
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : lista.error ? (
        <ErrorState
          error={lista.error}
          onRetry={lista.refetch}
          fallback={`No se pudieron cargar ${articulo === "la" ? "las" : "los"} ${title.toLowerCase()}.`}
          className="max-w-2xl"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`Aún no hay ${title.toLowerCase()}`}
          description={`Crea ${articulo} primer${articulo === "la" ? "a" : ""} ${singular} para poder usarl${vocal} al registrar instructores.`}
        />
      ) : (
        <div className="max-w-2xl overflow-hidden rounded-sm bg-surface-container-low ambient-shadow">
          <div className="border-b border-outline-variant px-6 py-3.5">
            <p
              aria-live="polite"
              className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground"
            >
              {items.length} {items.length === 1 ? singular : plural}
            </p>
          </div>
          <ul className="divide-y divide-outline-variant">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-surface-container"
              >
                <span className="font-sans text-sm text-on-surface">
                  {item.nombre}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => abrirEdicion(item)}
                    aria-label={`Editar ${item.nombre}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setBorrando(item)}
                    aria-label={`Eliminar ${item.nombre}`}
                    className="hover:bg-danger-container hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Edición ── */}
      <Dialog
        open={editando !== null}
        onOpenChange={(abierto) => !abierto && setEditando(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-semibold text-on-surface">
              Editar {singular}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Modifica el nombre y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editando && editNombre.trim()) {
                actualizar.mutate({
                  id: editando.id,
                  valor: editNombre.trim(),
                });
              }
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="editar-nombre">Nombre</Label>
              <Input
                ref={editInputRef}
                id="editar-nombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                aria-invalid={actualizar.isError || undefined}
              />
            </div>
            {actualizar.isError && (
              <Alert variant="danger">
                {mensajeDeError(actualizar.error, "No se pudo actualizar.")}
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditando(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={actualizar.isPending || !editNombre.trim()}
              >
                {actualizar.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Borrado ── */}
      <ConfirmDialog
        open={borrando !== null}
        onOpenChange={(abierto) => !abierto && setBorrando(null)}
        title={`Eliminar ${singular}`}
        description={
          <>
            ¿Seguro que quieres eliminar <strong>{borrando?.nombre}</strong>?
            Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        loading={eliminar.isPending}
        onConfirm={() => borrando && eliminar.mutate(borrando.id)}
      />
    </div>
  );
}
