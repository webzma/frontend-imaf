"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Loader2,
  Search,
  Users,
  FileText,
  GraduationCap,
  Filter,
  CalendarDays,
  DollarSign,
  MessageCircle,
  UsersRound,
} from "lucide-react";

/* ── Types ── */

interface Profesor {
  id: number;
  user_id: number;
  user: { id: number; name: string; email: string };
}

interface Estudiante {
  id: number;
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  limite_cupo: number;
  cupos_restantes: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  requisitos?: string | null;
  precio: number;
  whatsapp_url?: string | null;
  estado: "activo" | "inactivo";
  profesor?: {
    id: number;
    user_id: number;
    user: { id: number; name: string; email: string };
  } | null;
  estudiantes?: Estudiante[];
}

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

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const formatPrice = (precio: number): string => {
  if (precio === 0) return "Gratuito";
  return new Intl.NumberFormat("es-CR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(precio);
};

/* ── Zod Schema ── */

const cursoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(255),
  descripcion: z.string().max(1000).optional(),
  profesor_id: z.string().min(1, "Debes seleccionar un profesor"),
  limite_cupo: z.number().int().min(1, "Mínimo 1 participante"),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  requisitos: z.string().max(2000).optional(),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  whatsapp_url: z.string().url("URL inválida").optional().or(z.literal("")),
  estado: z.enum(["activo", "inactivo"]),
});

type CursoForm = z.infer<typeof cursoSchema>;

/* ── Skeletons ── */

function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow flex flex-col">
      <div className="h-1 bg-primary-container" />
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-sm" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40 mt-auto">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

/* ── Course Card ── */

function CursoCard({ curso }: { curso: Curso }) {
  const participantes = curso.estudiantes?.length ?? 0;
  const cuposRestantes =
    curso.cupos_restantes ?? curso.limite_cupo - participantes;
  const cuposPct = Math.round((participantes / curso.limite_cupo) * 100);
  const sinCupo = cuposRestantes <= 0;

  return (
    <div className="group bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex flex-col">
      <div className="h-1 gradient-primary" />
      <div className="p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-bold text-on-primary-container bg-primary-container px-2.5 py-1 rounded-sm">
            {curso.codigo}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-semibold ${
              curso.estado === "activo"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
            }`}
          >
            {curso.estado === "activo" ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-serif font-light text-2xl tight-tracking text-on-surface mb-1 leading-tight">
          {curso.nombre}
        </h3>

        {/* Profesor */}
        {curso.profesor?.user?.name && (
          <p className="font-sans text-xs text-primary/70 font-medium mb-2 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {curso.profesor.user.name}
          </p>
        )}

        {/* Descripción */}
        <p className="font-sans text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
          {curso.descripcion || (
            <span className="italic text-muted-foreground/50">
              Sin descripción
            </span>
          )}
        </p>

        {/* Fechas */}
        {(curso.fecha_inicio || curso.fecha_fin) && (
          <div className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground mb-3">
            <CalendarDays className="w-3 h-3 shrink-0" />
            <span>
              {formatDate(curso.fecha_inicio)}
              {curso.fecha_fin && ` → ${formatDate(curso.fecha_fin)}`}
            </span>
          </div>
        )}

        {/* Cupos bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
              <UsersRound className="w-3 h-3" />
              <span>
                <span className="font-semibold text-on-surface">
                  {participantes}
                </span>
                {" / "}
                {curso.limite_cupo} participantes
              </span>
            </div>
            <span
              className={`font-sans text-xs font-semibold ${
                sinCupo
                  ? "text-destructive"
                  : cuposRestantes <= 5
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {sinCupo ? "Sin cupo" : `${cuposRestantes} disponibles`}
            </span>
          </div>
          <div className="h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                sinCupo
                  ? "bg-destructive"
                  : cuposPct >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, cuposPct)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
          <div className="flex items-center gap-1 font-sans text-sm font-semibold text-on-surface">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground/60" />
            {formatPrice(curso.precio)}
          </div>
          {curso.whatsapp_url && (
            <div className="flex items-center gap-1 font-sans text-xs text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ── */

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
        <BookOpen className="w-6 h-6 text-on-primary-container" />
      </div>
      <div className="text-center">
        <p className="font-serif font-light text-2xl text-on-surface mb-1">
          {hasFilters ? "Sin resultados" : "Aún no hay cursos"}
        </p>
        <p className="font-sans text-sm text-muted-foreground">
          {hasFilters
            ? "Ningún curso coincide con los filtros aplicados."
            : "Crea el primer curso para comenzar."}
        </p>
      </div>
    </div>
  );
}

/* ── Page ── */

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterProfesor, setFilterProfesor] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<CursoForm>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      profesor_id: "",
      limite_cupo: 30,
      fecha_inicio: "",
      fecha_fin: "",
      requisitos: "",
      precio: 0,
      whatsapp_url: "",
      estado: "activo",
    },
  });

  const fetchCursos = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/cursos`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setError("No se pudo cargar la lista de cursos.");
        return;
      }
      const data = await res.json();
      setCursos(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesores = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/profesores`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProfesores(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchCursos();
    fetchProfesores();
  }, []);

  const onSubmit = async (data: CursoForm) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const body = {
        ...data,
        descripcion: data.descripcion || null,
        requisitos: data.requisitos || null,
        fecha_inicio: data.fecha_inicio || null,
        fecha_fin: data.fecha_fin || null,
        whatsapp_url: data.whatsapp_url || null,
        profesor_id: Number(data.profesor_id),
      };
      const res = await fetch(`${process.env.API_URL}api/admin/cursos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        const messages = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || "Error al crear el curso.";
        setSubmitError(messages as string);
        return;
      }
      const created = await res.json();
      setCursos((prev) => [...prev, created]);
      form.reset();
      setOpen(false);
      toast.success("Curso creado correctamente");
    } catch {
      setSubmitError("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return cursos.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        c.nombre.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        (c.descripcion?.toLowerCase().includes(q) ?? false) ||
        (c.profesor?.user.name.toLowerCase().includes(q) ?? false);
      const matchEstado = filterEstado === "todos" || c.estado === filterEstado;
      const matchProfesor =
        filterProfesor === "todos" ||
        (filterProfesor === "sin_profesor"
          ? !c.profesor
          : String(c.profesor?.id) === filterProfesor);
      return matchSearch && matchEstado && matchProfesor;
    });
  }, [cursos, search, filterEstado, filterProfesor]);

  const totalEstudiantes = cursos.reduce(
    (sum, c) => sum + (c.estudiantes?.length ?? 0),
    0,
  );
  const conEstudiantes = cursos.filter(
    (c) => (c.estudiantes?.length ?? 0) > 0,
  ).length;
  const hasFilters =
    filterEstado !== "todos" || filterProfesor !== "todos" || search !== "";

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10 flex-col md:flex-row md:flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="size-6 md:size-10 text-primary/70" />
              <span className="font-sans text-xs md:text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
                Gestión / Cursos
              </span>
            </div>
            <h1 className="font-serif font-light text-[3.2rem] tight-tracking leading-[1.08] text-on-surface mb-2">
              Cursos
            </h1>
            <p className="font-sans text-sm text-muted-foreground max-w-md">
              Catálogo de cursos disponibles en la plataforma.
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) {
                form.reset();
                setSubmitError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 mt-6 md:mt-0">
                <Plus className="w-4 h-4" />
                Nuevo curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
                  Crear curso
                </DialogTitle>
                <DialogDescription className="font-sans text-sm text-muted-foreground">
                  El código se genera automáticamente. Completa los datos del
                  curso.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4 pt-1"
              >
                {/* Nombre */}
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre del curso *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Fotografía Básica"
                    {...form.register("nombre")}
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>

                {/* Profesor + Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Profesor *</Label>
                    <Select
                      value={form.watch("profesor_id")}
                      onValueChange={(v) =>
                        form.setValue("profesor_id", v, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {profesores.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No hay profesores registrados
                          </SelectItem>
                        ) : (
                          profesores.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.profesor_id && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.profesor_id.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Estado *</Label>
                    <Select
                      value={form.watch("estado")}
                      onValueChange={(v) =>
                        form.setValue("estado", v as CursoForm["estado"])
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Límite de cupo + Precio */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="limite_cupo">Límite de cupo *</Label>
                    <Input
                      id="limite_cupo"
                      type="number"
                      min={1}
                      placeholder="Ej: 20"
                      {...form.register("limite_cupo", { valueAsNumber: true })}
                    />
                    {form.formState.errors.limite_cupo && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.limite_cupo.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0 = gratuito"
                      {...form.register("precio", { valueAsNumber: true })}
                    />
                    {form.formState.errors.precio && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.precio.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fecha inicio + Fecha fin */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      {...form.register("fecha_inicio")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha_fin">Fecha de fin</Label>
                    <Input
                      id="fecha_fin"
                      type="date"
                      {...form.register("fecha_fin")}
                    />
                    {form.formState.errors.fecha_fin && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.fecha_fin.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp_url">
                    Enlace grupo WhatsApp{" "}
                    <span className="text-muted-foreground/60 font-normal ml-1">
                      (opcional)
                    </span>
                  </Label>
                  <Input
                    id="whatsapp_url"
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    {...form.register("whatsapp_url")}
                  />
                  {form.formState.errors.whatsapp_url && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.whatsapp_url.message}
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div className="grid gap-2">
                  <Label htmlFor="descripcion">
                    Descripción{" "}
                    <span className="text-muted-foreground/60 font-normal ml-1">
                      (opcional)
                    </span>
                  </Label>
                  <textarea
                    id="descripcion"
                    rows={3}
                    placeholder="Breve descripción del contenido del curso..."
                    className="w-full rounded-sm border-0 border-b border-b-outline-variant bg-surface-variant px-3 py-2 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color] outline-none placeholder:text-muted-foreground/50 focus-visible:bg-surface-container-high focus-visible:border-b-primary resize-none"
                    {...form.register("descripcion")}
                  />
                </div>

                {/* Requisitos */}
                <div className="grid gap-2">
                  <Label htmlFor="requisitos">
                    Requisitos / Materiales{" "}
                    <span className="text-muted-foreground/60 font-normal ml-1">
                      (opcional)
                    </span>
                  </Label>
                  <textarea
                    id="requisitos"
                    rows={3}
                    placeholder="Ej: Cuaderno, lápices de colores, cámara..."
                    className="w-full rounded-sm border-0 border-b border-b-outline-variant bg-surface-variant px-3 py-2 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color] outline-none placeholder:text-muted-foreground/50 focus-visible:bg-surface-container-high focus-visible:border-b-primary resize-none"
                    {...form.register("requisitos")}
                  />
                </div>

                {submitError && (
                  <div className="bg-destructive/10 border border-destructive/25 text-destructive text-sm px-4 py-3 rounded-sm">
                    {submitError}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Crear curso
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5 mb-10 max-w-3xl">
          {[
            {
              label: "Total",
              value: cursos.length,
              icon: BookOpen,
              color: "text-on-primary-container",
              glow: "bg-primary-container",
            },
            {
              label: "Con estudiantes",
              value: conEstudiantes,
              icon: Users,
              color: "text-on-primary-container",
              glow: "bg-primary-container/70",
            },
            {
              label: "Matriculados",
              value: totalEstudiantes,
              icon: FileText,
              color: "text-on-secondary-container",
              glow: "bg-secondary-container",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low rounded-sm p-5 ambient-shadow"
            >
              <div
                className={`w-9 md:w-10 h-9 md:h-10 rounded-md flex items-center justify-center ${s.glow} mb-4`}
              >
                <s.icon className={`w-4 md:w-5 h-4 md:h-5 ${s.color}`} />
              </div>
              {loading ? (
                <Skeleton className="h-9 w-16 mb-1" />
              ) : (
                <p className="font-sans text-2xl md:text-4xl font-light tight-tracking text-on-surface tabular-nums mb-1">
                  {s.value}
                </p>
              )}
              <p className="font-sans text-xs truncate tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              placeholder="Buscar por nombre, código o profesor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-10 w-42 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProfesor} onValueChange={setFilterProfesor}>
              <SelectTrigger className="h-10 w-44 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los profesores</SelectItem>
                <SelectItem value="sin_profesor">Sin profesor</SelectItem>
                {profesores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterEstado("todos");
                  setFilterProfesor("todos");
                }}
                className="font-sans text-xs text-muted-foreground hover:text-on-surface transition-colors underline underline-offset-2"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-sm font-sans">
            {error}
          </div>
        ) : (
          <>
            {filtered.length > 0 && (
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface/55 font-medium mb-5">
                {filtered.length} curso{filtered.length !== 1 ? "s" : ""}
                {hasFilters
                  ? ` encontrado${filtered.length !== 1 ? "s" : ""}`
                  : ""}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.length === 0 ? (
                <EmptyState hasFilters={hasFilters} />
              ) : (
                filtered.map((curso) => (
                  <Link key={curso.id} href={`/admin/cursos/${curso.id}`}>
                    <CursoCard curso={curso} />
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
