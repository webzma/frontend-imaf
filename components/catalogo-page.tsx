"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  SearchX,
  type LucideIcon,
} from "lucide-react";

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
    "Content-Type": "application/json",
  };
}

/* ── Types ── */

interface CatalogoItem {
  id: number;
  nombre: string;
}

interface CatalogoPageProps {
  /** Título del encabezado (e.g. "Especialidades"). */
  title: string;
  /** Subtítulo del encabezado. */
  subtitle: string;
  /** Nombre en singular para mensajes (e.g. "especialidad"). */
  singular: string;
  /** Slug del endpoint API (e.g. "especialidades"). */
  apiSlug: string;
  /** Icono de lucide-react para el header. */
  icon: LucideIcon;
  /** Eyebrow breadcrumb. */
  eyebrow?: string;
}

/* ── Page ── */

export default function CatalogoPage({
  title,
  subtitle,
  singular,
  apiSlug,
  icon,
  eyebrow,
}: CatalogoPageProps) {
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState("");

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CatalogoItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.API_URL || "";

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}api/admin/${apiSlug}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch {
      setError(`No se pudieron cargar los ${singular}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ── Create ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_URL}api/admin/${apiSlug}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        const msg = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || `Error al crear ${singular}.`;
        setSubmitError(msg as string);
        return;
      }
      const newItem: CatalogoItem = await res.json();
      setItems((prev) =>
        [...prev, newItem].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setNombre("");
      toast.success(
        `${singular.charAt(0).toUpperCase() + singular.slice(1)} creada correctamente`,
      );
      inputRef.current?.focus();
    } catch {
      setSubmitError("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──
  const openEdit = (item: CatalogoItem) => {
    setEditingItem(item);
    setEditNombre(item.nombre);
    setEditSubmitError("");
    setEditOpen(true);
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editNombre.trim()) return;
    setEditSubmitting(true);
    setEditSubmitError("");
    try {
      const res = await fetch(
        `${API_URL}api/admin/${apiSlug}/${editingItem.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ nombre: editNombre.trim() }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        const msg = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || "Error al actualizar.";
        setEditSubmitError(msg as string);
        return;
      }
      const updated: CatalogoItem = await res.json();
      setItems((prev) =>
        prev
          .map((i) => (i.id === updated.id ? updated : i))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setEditOpen(false);
      toast.success(
        `${singular.charAt(0).toUpperCase() + singular.slice(1)} actualizada correctamente`,
      );
    } catch {
      setEditSubmitError("Error al conectar con el servidor.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete ──
  const openDelete = (item: CatalogoItem) => {
    setDeletingItem(item);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}api/admin/${apiSlug}/${deletingItem.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Error al eliminar.");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setDeleteOpen(false);
      toast.success(
        `${singular.charAt(0).toUpperCase() + singular.slice(1)} eliminada correctamente`,
      );
    } catch {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-surface">
      <div className="mx-auto max-w-8xl px-4 md:px-10 py-10">
        <PageHeader
          icon={icon}
          eyebrow={eyebrow ?? `Gestión / ${title}`}
          title={title}
          subtitle={subtitle}
        />

        {/* ── Create form ── */}
        <form
          onSubmit={handleCreate}
          className="mt-8 mb-8 flex items-end gap-3 max-w-lg"
        >
          <div className="grid gap-2 flex-1">
            <Label htmlFor={`new-${apiSlug}`}>Nombre</Label>
            <Input
              ref={inputRef}
              id={`new-${apiSlug}`}
              placeholder={`Nueva ${singular}...`}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || !nombre.trim()}
            className="gap-2 h-10"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Guardar
          </Button>
        </form>

        {submitError && (
          <div className="mb-6 bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-sm max-w-lg">
            {submitError}
          </div>
        )}

        {/* ── List ── */}
        {loading ? (
          <div className="bg-surface-container-low rounded-sm overflow-hidden ambient-shadow max-w-2xl">
            <div className="px-6 py-3.5 border-b border-outline-variant">
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="divide-y divide-outline-variant">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-danger-container text-on-danger-container text-sm px-4 py-3 rounded-sm font-sans">
            {error}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={icon}
            title={`Aún no hay ${title.toLowerCase()}`}
            description={`Crea la primera ${singular} para poder usarla al registrar instructores.`}
          />
        ) : (
          <div className="bg-surface-container-low rounded-sm overflow-hidden ambient-shadow max-w-2xl">
            <div className="px-6 py-3.5 border-b border-outline-variant">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                {items.length} {items.length === 1 ? singular : `${singular}s`}
              </p>
            </div>
            <ul className="divide-y divide-outline-variant">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-container transition-colors"
                >
                  <span className="font-sans text-sm text-on-surface">
                    {item.nombre}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Editar ${item.nombre}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDelete(item)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Eliminar ${item.nombre}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
              Editar {singular}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Modifica el nombre y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                ref={editInputRef}
                id="edit-nombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
              />
            </div>
            {editSubmitError && (
              <div className="bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-sm">
                {editSubmitError}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={editSubmitting || !editNombre.trim()}
              >
                {editSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
              Eliminar {singular}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar{" "}
              <strong>{deletingItem?.nombre}</strong>? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
