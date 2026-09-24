"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";

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
import { claveNombre, validarNombreCatalogo } from "@/lib/catalogo";
import { adminKeys } from "@/lib/query-keys";
import type { CatalogoSpec } from "@/lib/admin-nav";

interface CatalogoItem {
  id: number;
  nombre: string;
  /** Instructores que tienen asignada esta opción. */
  profesores_count?: number;
}

/** A partir de cuántos elementos aparece el buscador. */
const MINIMO_PARA_BUSCAR = 8;

const instructores = (n: number) =>
  `${n} ${n === 1 ? "instructor" : "instructores"}`;

/**
 * CRUD de un catálogo de instructores.
 *
 * Los cuatro catálogos son la misma pantalla con otro sustantivo. La caché de
 * react-query es la única copia de la lista y se invalida al terminar cada
 * mutación.
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

  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
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

  const items = useMemo(() => lista.data ?? [], [lista.data]);

  const visibles = useMemo(() => {
    const clave = claveNombre(busqueda);
    return clave
      ? items.filter((item) => claveNombre(item.nombre).includes(clave))
      : items;
  }, [items, busqueda]);

  // Concuerda con el género del sustantivo: "tipo de contrato creada" era la
  // clase de detalle que hace que el sistema se sienta ajeno.
  const vocal = articulo === "la" ? "a" : "o";
  const participio = (raiz: "cre" | "actualiz" | "elimin") =>
    `${raiz}ad${vocal}`;

  const capitalizar = (texto: string) =>
    texto.charAt(0).toUpperCase() + texto.slice(1);

  const duplicado = `Ya existe ${articulo === "la" ? "una" : "un"} ${singular} con ese nombre.`;

  // Se valida mientras se escribe con la misma regla que el backend: antes el
  // error solo llegaba al enviar y seguía en pantalla aunque se corrigiera.
  const errorNombre = validarNombreCatalogo(nombre, items, { duplicado });
  const errorEdicion = editando
    ? validarNombreCatalogo(editNombre, items, {
        excluirId: editando.id,
        duplicado,
      })
    : null;
  const sinCambios = !!editando && editNombre.trim() === editando.nombre.trim();

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
  };

  const errorAlta =
    errorNombre ??
    (crear.isError
      ? mensajeDeError(crear.error, `No se pudo crear ${articulo} ${singular}.`)
      : null);

  const enUsoAlBorrar = borrando?.profesores_count ?? 0;

  return (
    <div className={className}>
      {/* ── Alta ── */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (nombre.trim() && !errorNombre) crear.mutate(nombre.trim());
        }}
        className="mb-6 max-w-2xl"
      >
        <Label htmlFor={`nuevo-${slug}`} className="mb-2">
          Nombre
        </Label>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Input
              ref={inputRef}
              id={`nuevo-${slug}`}
              placeholder={`Nuev${vocal} ${singular}…`}
              value={nombre}
              maxLength={255}
              autoComplete="off"
              onChange={(e) => {
                setNombre(e.target.value);
                // El error del servidor era sobre el valor anterior.
                if (crear.isError) crear.reset();
              }}
              aria-invalid={!!errorAlta || undefined}
              aria-describedby={errorAlta ? `nuevo-${slug}-error` : undefined}
            />
            {errorAlta && (
              <p
                id={`nuevo-${slug}-error`}
                role="alert"
                className="mt-1.5 font-sans text-xs text-danger"
              >
                {errorAlta}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={crear.isPending || !nombre.trim() || !!errorNombre}
            className="h-10 shrink-0 gap-2"
          >
            {crear.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Guardar
          </Button>
        </div>
      </form>

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
                className="flex items-center justify-between px-6 py-3"
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
          className="max-w-2xl"
        />
      ) : (
        <div className="max-w-2xl overflow-hidden rounded-sm bg-surface-container-low ambient-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-6 py-3">
            <p
              aria-live="polite"
              className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground"
            >
              {busqueda
                ? `${visibles.length} de ${items.length} ${plural}`
                : `${items.length} ${items.length === 1 ? singular : plural}`}
            </p>
            {items.length > MINIMO_PARA_BUSCAR && (
              <div className="relative w-full sm:w-56">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder={`Buscar ${plural}…`}
                  aria-label={`Buscar ${plural}`}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            )}
          </div>

          {visibles.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Sin resultados"
              description={`Ningún${articulo === "la" ? "a" : ""} ${singular} coincide con "${busqueda}".`}
              action={
                <Button variant="outline" onClick={() => setBusqueda("")}>
                  Limpiar búsqueda
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-outline-variant">
              {visibles.map((item) => {
                const enUso = item.profesores_count ?? 0;
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-surface-container"
                  >
                    <div className="min-w-0">
                      <p className="font-sans text-sm break-words text-on-surface">
                        {item.nombre}
                      </p>
                      {item.profesores_count !== undefined && (
                        <p className="font-sans text-xs text-muted-foreground">
                          {enUso > 0
                            ? `En uso por ${instructores(enUso)}`
                            : "Sin uso"}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => abrirEdicion(item)}
                        aria-label={`Editar ${item.nombre}`}
                        title="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setBorrando(item)}
                        aria-label={`Eliminar ${item.nombre}`}
                        title="Eliminar"
                        className="hover:bg-danger-container hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
              {editando?.profesores_count
                ? `El cambio se verá en ${instructores(editando.profesores_count)} que ya l${vocal} tienen asignad${vocal}.`
                : "Modifica el nombre y guarda los cambios."}
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (
                editando &&
                editNombre.trim() &&
                !errorEdicion &&
                !sinCambios
              ) {
                actualizar.mutate({
                  id: editando.id,
                  valor: editNombre.trim(),
                });
              }
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor={`editar-${slug}`}>Nombre</Label>
              <Input
                id={`editar-${slug}`}
                value={editNombre}
                maxLength={255}
                autoComplete="off"
                onChange={(e) => {
                  setEditNombre(e.target.value);
                  if (actualizar.isError) actualizar.reset();
                }}
                aria-invalid={!!errorEdicion || actualizar.isError || undefined}
                aria-describedby={
                  errorEdicion ? `editar-${slug}-error` : undefined
                }
              />
              {errorEdicion && (
                <p
                  id={`editar-${slug}-error`}
                  role="alert"
                  className="font-sans text-xs text-danger"
                >
                  {errorEdicion}
                </p>
              )}
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
                disabled={
                  actualizar.isPending ||
                  !editNombre.trim() ||
                  !!errorEdicion ||
                  sinCambios
                }
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
            {enUsoAlBorrar > 0 && (
              <>
                {" "}
                <strong className="text-danger">
                  {instructores(enUsoAlBorrar)}{" "}
                  {enUsoAlBorrar === 1 ? "lo tiene" : "lo tienen"} asignad
                  {vocal} y {enUsoAlBorrar === 1 ? "quedará" : "quedarán"} sin{" "}
                  {singular}.
                </strong>
              </>
            )}{" "}
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
