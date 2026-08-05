"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/format";
import { cursoSchema, type CursoForm } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { fetchPage, PAGE_SIZE } from "@/lib/api";
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
  MessageCircle,
  UsersRound,
  SearchX,
} from "lucide-react";

/* ── Types ── */

interface Instructor {
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
  instructor?: {
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

/* ── Zod Schema ──
   El esquema vive en lib/schemas.ts para compartirlo con la edición de
   curso en app/admin/cursos/[id]/page.tsx y no duplicar validaciones. */

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
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant mt-auto">
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
    <div className="group bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow hover:-translate-y-0.5 hover:shadow-lg transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 flex flex-col">
      <div className="h-1 gradient-primary" />
      <div className="p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-xs font-bold text-on-primary-container bg-primary-container px-2.5 py-1 rounded-sm">
            {curso.codigo}
          </span>
          <Badge variant={curso.estado}>
            {curso.estado === "activo" ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Name */}
        <h3 className="font-serif font-light text-2xl tight-tracking text-on-surface mb-1 leading-tight">
          {curso.nombre}
        </h3>

        {/* Instructor */}
        {curso.instructor?.user?.name && (
          <p className="font-sans text-xs text-primary/70 font-medium mb-2 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {curso.instructor.user.name}
          </p>
        )}

        {/* Descripción */}
        <p className="font-sans text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
          {curso.descripcion || (
            <span className="italic text-muted-foreground">
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
                  ? "text-danger"
                  : cuposRestantes <= 5
                    ? "text-warning"
                    : "text-success"
              }`}
            >
              {sinCupo ? "Sin cupo" : `${cuposRestantes} disponibles`}
            </span>
          </div>
          <div className="h-1.5 bg-outline-variant rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-[background-color,border-color,color,box-shadow,transform,opacity] ${
                sinCupo
                  ? "bg-danger"
                  : cuposPct >= 80
                    ? "bg-warning"
                    : "bg-success"
              }`}
              style={{ width: `${Math.min(100, cuposPct)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-1 font-sans text-sm font-semibold text-muted-foreground">
            <b>Bs.</b>
            {formatPrice(curso.precio)}
          </div>
          {curso.whatsapp_url && (
            <div className="flex items-center gap-1 font-sans text-xs text-success">
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

/* ── Page ── */

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterInstructor, setFilterInstructor] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalCursos, setTotalCursos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
      minimo_estudiantes: undefined,
      fecha_inicio: "",
      fecha_fin: "",
      requisitos: "",
      precio: 0,
      whatsapp_url: "",
      estado: "inactivo",
    },
  });

  // Guarda contra respuestas fuera de orden al navegar rápido entre páginas.
  const latestPageRef = useRef(1);

  const fetchCursos = async (pageNum = 1) => {
    latestPageRef.current = pageNum;
    try {
      const result = await fetchPage<Curso>(
        `${process.env.API_URL}api/admin/cursos`,
        pageNum,
        getAuthHeaders(),
      );
      if (latestPageRef.current !== pageNum) return; // respuesta obsoleta
      setCursos(result.items);
      setTotalCursos(result.total);
      setTotalPages(result.totalPages);
      setError("");
    } catch {
      setError("No se pudo cargar la lista de cursos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructores = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/profesores`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setInstructores(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchCursos(1);
    fetchInstructores();
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
        minimo_estudiantes: data.minimo_estudiantes ?? null,
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
      form.reset();
      setOpen(false);
      setPage(1);
      fetchCursos(1);
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
        (c.instructor?.user.name.toLowerCase().includes(q) ?? false);
      const matchEstado = filterEstado === "todos" || c.estado === filterEstado;
      const matchInstructor =
        filterInstructor === "todos" ||
        (filterInstructor === "sin_instructor"
          ? !c.instructor
          : String(c.instructor?.id) === filterInstructor);
      return matchSearch && matchEstado && matchInstructor;
    });
  }, [cursos, search, filterEstado, filterInstructor]);

  const totalEstudiantes = cursos.reduce(
    (sum, c) => sum + (c.estudiantes?.length ?? 0),
    0,
  );
  const conEstudiantes = cursos.filter(
    (c) => (c.estudiantes?.length ?? 0) > 0,
  ).length;
  const hasFilters =
    filterEstado !== "todos" || filterInstructor !== "todos" || search !== "";

  // Los filtros se aplican solo a lo cargado; si se está en otra página se
  // vuelve a la primera para no mostrar el número de página desincronizado.
  const safePage = Math.min(page, totalPages);

  const limpiarFiltros = () => {
    setSearch("");
    setFilterEstado("todos");
    setFilterInstructor("todos");
    if (page !== 1) {
      setPage(1);
      fetchCursos(1);
    }
  };

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10 flex-col md:flex-row md:flex items-end justify-between">
          <PageHeader
            icon={BookOpen}
            eyebrow="Gestión / Cursos"
            title="Cursos"
            subtitle="Catálogo de cursos disponibles en la plataforma."
            className="mb-0 md:mb-0"
          />

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
                    <p className="text-sm text-danger">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>

                {/* Instructor + Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Instructor *</Label>
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
                        {instructores.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No hay instructores registrados
                          </SelectItem>
                        ) : (
                          instructores.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.profesor_id && (
                      <p className="text-sm text-danger">
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
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="activo">Activo</SelectItem>
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
                      <p className="text-sm text-danger">
                        {form.formState.errors.limite_cupo.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minimo_estudiantes">
                      Mínimo de estudiantes
                    </Label>
                    <Input
                      id="minimo_estudiantes"
                      type="number"
                      min={1}
                      placeholder="Para aperturar el curso"
                      {...form.register("minimo_estudiantes", {
                        valueAsNumber: true,
                      })}
                    />
                    {form.formState.errors.minimo_estudiantes && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.minimo_estudiantes.message}
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
                      <p className="text-sm text-danger">
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
                      {...form.register("fecha_inicio", {
                        onChange: () => form.trigger("fecha_inicio"),
                      })}
                    />
                    {form.formState.errors.fecha_inicio && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.fecha_inicio.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha_fin">Fecha de fin</Label>
                    <Input
                      id="fecha_fin"
                      type="date"
                      {...form.register("fecha_fin", {
                        onChange: () => form.trigger("fecha_fin"),
                      })}
                    />
                    {form.formState.errors.fecha_fin && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.fecha_fin.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp_url">
                    Enlace grupo WhatsApp{" "}
                    <span className="text-muted-foreground font-normal ml-1">
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
                    <p className="text-sm text-danger">
                      {form.formState.errors.whatsapp_url.message}
                    </p>
                  )}
                </div>

                {/* Descripción */}
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
                    placeholder="Breve descripción del contenido del curso..."
                    className="w-full rounded-sm border-0 border-b border-b-outline-variant bg-surface-variant px-3 py-2 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color] outline-none placeholder:text-muted-foreground focus-visible:bg-surface-container-high focus-visible:border-b-primary resize-none"
                    {...form.register("descripcion")}
                  />
                </div>

                {/* Requisitos */}
                <div className="grid gap-2">
                  <Label htmlFor="requisitos">
                    Requisitos / Materiales{" "}
                    <span className="text-muted-foreground font-normal ml-1">
                      (opcional)
                    </span>
                  </Label>
                  <textarea
                    id="requisitos"
                    rows={3}
                    placeholder="Ej: Cuaderno, lápices de colores, cámara..."
                    className="w-full rounded-sm border-0 border-b border-b-outline-variant bg-surface-variant px-3 py-2 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color] outline-none placeholder:text-muted-foreground focus-visible:bg-surface-container-high focus-visible:border-b-primary resize-none"
                    {...form.register("requisitos")}
                  />
                </div>

                {submitError && (
                  <div className="bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-sm">
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
              value: totalCursos,
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
              <p className="font-sans text-xs truncate tracking-[0.15em] uppercase text-muted-foreground font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o instructor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (page !== 1) {
                  setPage(1);
                  fetchCursos(1);
                }
              }}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select
              value={filterEstado}
              onValueChange={(v) => {
                setFilterEstado(v);
                if (page !== 1) {
                  setPage(1);
                  fetchCursos(1);
                }
              }}
            >
              <SelectTrigger className="h-10 w-42 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterInstructor}
              onValueChange={(v) => {
                setFilterInstructor(v);
                if (page !== 1) {
                  setPage(1);
                  fetchCursos(1);
                }
              }}
            >
              <SelectTrigger className="h-10 w-44 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los instructores</SelectItem>
                <SelectItem value="sin_instructor">Sin instructor</SelectItem>
                {instructores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <button
                onClick={limpiarFiltros}
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
          <div className="bg-danger-container text-on-danger-container text-sm px-4 py-3 rounded-sm font-sans">
            {error}
          </div>
        ) : (
          <>
            {filtered.length > 0 && (
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium mb-5">
                {filtered.length} curso{filtered.length !== 1 ? "s" : ""}
                {hasFilters
                  ? ` encontrado${filtered.length !== 1 ? "s" : ""}`
                  : ""}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.length === 0 ? (
                hasFilters ? (
                  <EmptyState
                    className="col-span-full"
                    icon={SearchX}
                    title="Ningún curso coincide"
                    description="No hay cursos que cumplan los filtros aplicados. Prueba con otros criterios."
                    action={
                      <Button variant="outline" onClick={limpiarFiltros}>
                        Limpiar filtros
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    className="col-span-full"
                    icon={BookOpen}
                    title="Aún no hay cursos"
                    description="Crea el primer curso para poder inscribir estudiantes y asignar instructores."
                    action={
                      <Button className="gap-2" onClick={() => setOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Nuevo curso
                      </Button>
                    }
                  />
                )
              ) : (
                filtered.map((curso) => (
                  <Link key={curso.id} href={`/admin/cursos/${curso.id}`}>
                    <CursoCard curso={curso} />
                  </Link>
                ))
              )}
            </div>

            {filtered.length > 0 && totalPages > 1 && (
              <div className="mt-6 bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={totalCursos}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => {
                    setPage(p);
                    fetchCursos(p);
                  }}
                  itemLabel={["curso", "cursos"]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
