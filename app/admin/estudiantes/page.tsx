"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDate } from "@/lib/format";
import {
  sanitizarDigitos,
  sanitizarLetras,
  sanitizarTexto,
} from "@/lib/validators";
import municipios from "@/data/municipios.json";
import {
  estudianteSchema,
  editEstudianteSchema,
  type EstudianteForm,
  type EditEstudianteForm,
} from "@/lib/schemas";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { fetchPage, PAGE_SIZE } from "@/lib/api";
import { EmptyState } from "@/components/empty-state";
import { Avatar } from "@/components/avatar";
import {
  DetailHeader,
  DetailSection,
  DetailField,
} from "@/components/detail-fields";
import {
  DataCard,
  DataCardHeader,
  DataCardFields,
  DataCardField,
  DataCardActions,
} from "@/components/data-card";
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
  Search,
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  Loader2,
  Filter,
  Pencil,
  SearchX,
  Eye,
} from "lucide-react";

/* ── Types ── */

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
}

interface User {
  name: string;
  email: string;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
}

interface Estudiante {
  id: number;
  cedula: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  municipio: string | null;
  direccion: string | null;
  foto: string | null;
  fecha_inscripcion: string;
  estado: "activo" | "inactivo" | "graduado";
  user: User;
  curso: Curso | null;
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

/* ── Labels ── */

const generoLabel: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  otro: "Otro",
};

const estadoLabel: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  graduado: "Graduado",
};

/* ── Table Skeleton ── */

function TableSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
      <div className="px-6 py-3.5 border-b border-outline-variant">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-outline-variant">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3.5 w-24 self-center" />
              <Skeleton className="h-3.5 w-28 self-center" />
              <Skeleton className="h-6 w-20 rounded-full self-center" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ── */

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterCurso, setFilterCurso] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Edit
  const [viewTarget, setViewTarget] = useState<Estudiante | null>(null);
  const [editTarget, setEditTarget] = useState<Estudiante | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const editForm = useForm<EditEstudianteForm>({
    resolver: zodResolver(editEstudianteSchema),
  });

  const form = useForm<EstudianteForm>({
    resolver: zodResolver(estudianteSchema),
    defaultValues: {
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      email: "",
      password: "",
      cedula: "",
      telefono: "",
      fecha_nacimiento: "",
      genero: undefined,
      municipio: "",
      direccion: "",
      curso_id: undefined,
      fecha_inscripcion: new Date().toISOString().split("T")[0],
      estado: "activo",
    },
  });

  // Guarda contra respuestas fuera de orden al navegar rápido entre páginas.
  const latestPageRef = useRef(1);

  const fetchEstudiantes = async (pageNum = 1) => {
    latestPageRef.current = pageNum;
    try {
      const result = await fetchPage<Estudiante>(
        `${process.env.API_URL}api/admin/estudiantes`,
        pageNum,
        getAuthHeaders(),
      );
      if (latestPageRef.current !== pageNum) return; // respuesta obsoleta
      setEstudiantes(result.items);
      setTotalEstudiantes(result.total);
      setTotalPages(result.totalPages);
      setError("");
    } catch {
      setError("No se pudo cargar la lista de estudiantes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCursos = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/cursos`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCursos(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchEstudiantes(1);
    fetchCursos();
  }, []);

  const onSubmit = async (data: EstudianteForm) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, unknown> = {
        ...data,
        segundo_nombre: data.segundo_nombre || null,
        telefono: data.telefono || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        genero: data.genero || null,
        curso_id: data.curso_id ? Number(data.curso_id) : null,
      };
      const res = await fetch(`${process.env.API_URL}api/admin/estudiantes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        const messages = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || "Error al crear el estudiante.";
        setSubmitError(messages as string);
        return;
      }
      form.reset();
      setOpen(false);
      setPage(1);
      fetchEstudiantes(1);
      toast.success("Estudiante registrado correctamente");
    } catch {
      setSubmitError("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (e: Estudiante) => {
    setViewTarget(null);
    setEditTarget(e);
    setEditError("");
    editForm.reset({
      primer_nombre: e.user.primer_nombre ?? "",
      segundo_nombre: e.user.segundo_nombre ?? "",
      primer_apellido: e.user.primer_apellido ?? "",
      segundo_apellido: e.user.segundo_apellido ?? "",
      email: e.user.email,
      cedula: e.cedula,
      telefono: e.telefono ?? "",
      fecha_nacimiento: e.fecha_nacimiento ?? "",
      genero: (e.genero as EditEstudianteForm["genero"]) ?? undefined,
      municipio: e.municipio ?? "",
      direccion: e.direccion ?? "",
      curso_id: e.curso ? String(e.curso.id) : "",
      fecha_inscripcion: e.fecha_inscripcion,
      estado: e.estado,
    });
  };

  const onEdit = async (data: EditEstudianteForm) => {
    if (!editTarget) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const body: Record<string, unknown> = {
        primer_nombre: data.primer_nombre,
        segundo_nombre: data.segundo_nombre || null,
        primer_apellido: data.primer_apellido,
        segundo_apellido: data.segundo_apellido,
        email: data.email,
        cedula: data.cedula,
        telefono: data.telefono || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        genero: data.genero || null,
        municipio: data.municipio,
        direccion: data.direccion,
        curso_id: data.curso_id ? Number(data.curso_id) : null,
        fecha_inscripcion: data.fecha_inscripcion,
        estado: data.estado,
      };
      const res = await fetch(
        `${process.env.API_URL}api/admin/estudiantes/${editTarget.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        const messages = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || "Error al actualizar el estudiante.";
        setEditError(messages as string);
        return;
      }
      const updated = await res.json();
      setEstudiantes((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e)),
      );
      setEditTarget(null);
      toast.success("Estudiante actualizado correctamente");
    } catch {
      setEditError("Error al conectar con el servidor.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return estudiantes.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        e.user.name.toLowerCase().includes(q) ||
        e.cedula.includes(q) ||
        e.user.email.toLowerCase().includes(q) ||
        (e.curso?.nombre.toLowerCase().includes(q) ?? false);
      const matchEstado = filterEstado === "todos" || e.estado === filterEstado;
      const matchCurso =
        filterCurso === "todos" ||
        (filterCurso === "sin_curso"
          ? !e.curso
          : String(e.curso?.id) === filterCurso);
      return matchSearch && matchEstado && matchCurso;
    });
  }, [estudiantes, search, filterEstado, filterCurso]);

  const counts = {
    total: totalEstudiantes,
    activos: estudiantes.filter((e) => e.estado === "activo").length,
    graduados: estudiantes.filter((e) => e.estado === "graduado").length,
  };

  const hasFilters =
    filterEstado !== "todos" || filterCurso !== "todos" || search !== "";

  // Los filtros se aplican solo a lo cargado; si se está en otra página se
  // vuelve a la primera para no mostrar el número de página desincronizado.
  const safePage = Math.min(page, totalPages);

  const limpiarFiltros = () => {
    setSearch("");
    setFilterEstado("todos");
    setFilterCurso("todos");
    if (page !== 1) {
      setPage(1);
      fetchEstudiantes(1);
    }
  };

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10 flex-col md:flex-row md:flex items-end justify-between">
          <PageHeader
            icon={Users}
            eyebrow="Gestión / Estudiantes"
            title="Estudiantes"
            subtitle="Todos los estudiantes registrados en la plataforma."
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
                Nuevo estudiante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
                  Registrar estudiante
                </DialogTitle>
                <DialogDescription className="font-sans text-sm text-muted-foreground">
                  Completa los datos para crear un nuevo estudiante.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primer_nombre">Primer nombre *</Label>
                    <Input
                      id="primer_nombre"
                      placeholder="Juan"
                      {...form.register("primer_nombre", {
                        onChange: (e) =>
                          form.setValue(
                            "primer_nombre",
                            sanitizarLetras(e.target.value),
                          ),
                      })}
                    />
                    {form.formState.errors.primer_nombre && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.primer_nombre.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="segundo_nombre">
                      Segundo nombre (opcional)
                    </Label>
                    <Input
                      id="segundo_nombre"
                      placeholder="Pablo"
                      {...form.register("segundo_nombre", {
                        onChange: (e) =>
                          form.setValue(
                            "segundo_nombre",
                            sanitizarLetras(e.target.value),
                          ),
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primer_apellido">Primer apellido *</Label>
                    <Input
                      id="primer_apellido"
                      placeholder="Pérez"
                      {...form.register("primer_apellido", {
                        onChange: (e) =>
                          form.setValue(
                            "primer_apellido",
                            sanitizarLetras(e.target.value),
                          ),
                      })}
                    />
                    {form.formState.errors.primer_apellido && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.primer_apellido.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="segundo_apellido">Segundo apellido *</Label>
                    <Input
                      id="segundo_apellido"
                      placeholder="Gómez"
                      {...form.register("segundo_apellido", {
                        onChange: (e) =>
                          form.setValue(
                            "segundo_apellido",
                            sanitizarLetras(e.target.value),
                          ),
                      })}
                    />
                    {form.formState.errors.segundo_apellido && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.segundo_apellido.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      {...form.register("password")}
                    />
                    {form.formState.errors.password && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cedula">Cédula *</Label>
                    <Input
                      id="cedula"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      placeholder="12345678"
                      {...form.register("cedula", {
                        onChange: (e) =>
                          form.setValue(
                            "cedula",
                            sanitizarDigitos(e.target.value),
                          ),
                      })}
                    />
                    {form.formState.errors.cedula && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.cedula.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="04121234567"
                      {...form.register("telefono", {
                        onChange: (e) =>
                          form.setValue(
                            "telefono",
                            sanitizarDigitos(e.target.value),
                          ),
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fecha_nacimiento">
                      Fecha de nacimiento
                    </Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      {...form.register("fecha_nacimiento")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Género</Label>
                    <Select
                      value={form.watch("genero") ?? ""}
                      onValueChange={(v) =>
                        form.setValue("genero", v as EstudianteForm["genero"])
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Municipio *</Label>
                    <Select
                      value={form.watch("municipio") || undefined}
                      onValueChange={(v) =>
                        form.setValue("municipio", v, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar municipio" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipios.map((municipio) => (
                          <SelectItem key={municipio} value={municipio}>
                            {municipio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.municipio && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.municipio.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="direccion">Dirección de habitación *</Label>
                    <Input
                      id="direccion"
                      placeholder="Av. Principal, casa N° 5"
                      maxLength={255}
                      {...form.register("direccion", {
                        onChange: (e) =>
                          form.setValue(
                            "direccion",
                            sanitizarTexto(e.target.value),
                          ),
                      })}
                    />
                    {form.formState.errors.direccion && (
                      <p className="text-sm text-danger">
                        {form.formState.errors.direccion.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Curso</Label>
                    <Select
                      value={form.watch("curso_id") || "none"}
                      onValueChange={(v) =>
                        form.setValue("curso_id", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin curso</SelectItem>
                        {cursos.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Estado *</Label>
                    <Select
                      value={form.watch("estado")}
                      onValueChange={(v) =>
                        form.setValue("estado", v as EstudianteForm["estado"])
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="graduado">Graduado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fecha_inscripcion">
                    Fecha de inscripción *
                  </Label>
                  <Input
                    id="fecha_inscripcion"
                    type="date"
                    {...form.register("fecha_inscripcion")}
                  />
                  {form.formState.errors.fecha_inscripcion && (
                    <p className="text-sm text-danger">
                      {form.formState.errors.fecha_inscripcion.message}
                    </p>
                  )}
                </div>

                {submitError && (
                  <div className="bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-lg">
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
                    Crear estudiante
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
              value: counts.total,
              icon: Users,
              color: "text-on-primary-container",
              glow: "bg-primary-container",
            },
            {
              label: "Activos",
              value: counts.activos,
              icon: BookOpen,
              color: "text-on-primary-container",
              glow: "bg-primary-container/70",
            },
            {
              label: "Graduados",
              value: counts.graduados,
              icon: GraduationCap,
              color: "text-on-secondary-container",
              glow: "bg-secondary-container",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low rounded-sm p-4 md:p-5 ambient-shadow"
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

        {/* Filters row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estudiante..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (page !== 1) {
                  setPage(1);
                  fetchEstudiantes(1);
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
                  fetchEstudiantes(1);
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
                <SelectItem value="graduado">Graduado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterCurso}
              onValueChange={(v) => {
                setFilterCurso(v);
                if (page !== 1) {
                  setPage(1);
                  fetchEstudiantes(1);
                }
              }}
            >
              <SelectTrigger className="h-10 w-44 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cursos</SelectItem>
                <SelectItem value="sin_curso">Sin curso</SelectItem>
                {cursos.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
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

        {/* Table */}
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="bg-danger-container text-on-danger-container text-sm px-4 py-3 rounded-sm font-sans">
            {error}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
            <div className="px-6 py-3.5 border-b border-outline-variant">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}
                {hasFilters
                  ? " encontrado" + (filtered.length !== 1 ? "s" : "")
                  : ""}
              </p>
            </div>
            {filtered.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={SearchX}
                  title="Ningún estudiante coincide"
                  description="No hay estudiantes que cumplan los filtros aplicados. Prueba con otros criterios."
                  action={
                    <Button variant="outline" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="Aún no hay estudiantes"
                  description="Registra al primer estudiante para empezar a gestionar inscripciones y asistencia."
                  action={
                    <Button className="gap-2" onClick={() => setOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Nuevo estudiante
                    </Button>
                  }
                />
              )
            ) : (
              <>
                {/* Móvil: una tarjeta por estudiante. La tabla de 6 columnas
                    obligaba a desplazarse en horizontal para leer un registro. */}
                <ul className="md:hidden">
                  {filtered.map((e) => (
                    <DataCard key={e.id}>
                      <DataCardHeader
                        aside={
                          <Badge
                            variant={
                              e.estado as "activo" | "inactivo" | "graduado"
                            }
                            className="font-sans px-2.5 py-1"
                          >
                            {estadoLabel[e.estado]}
                          </Badge>
                        }
                      >
                        <Avatar src={e.foto} name={e.user.name} />
                        <div className="min-w-0">
                          <p className="font-sans font-semibold text-on-surface text-sm truncate">
                            {e.user.name}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground truncate">
                            {e.user.email}
                          </p>
                        </div>
                      </DataCardHeader>
                      <DataCardFields>
                        <DataCardField label="Cédula">
                          <span className="font-mono tracking-wide">
                            {e.cedula}
                          </span>
                        </DataCardField>
                        <DataCardField label="Curso">
                          {e.curso ? (
                            e.curso.nombre
                          ) : (
                            <span className="text-muted-foreground">
                              Sin curso
                            </span>
                          )}
                        </DataCardField>
                        <DataCardField label="Inscripción">
                          {formatDate(e.fecha_inscripcion)}
                        </DataCardField>
                      </DataCardFields>
                      <DataCardActions>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setViewTarget(e)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openEdit(e)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                      </DataCardActions>
                    </DataCard>
                  ))}
                </ul>

                <div className="hidden md:block table-scroll">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        {[
                          "Estudiante",
                          "Cédula",
                          "Curso",
                          "Inscripción",
                          "Estado",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-6 py-3.5 font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e, i) => (
                        <tr
                          key={e.id}
                          className={`hover:bg-surface-container transition-colors ${i < filtered.length - 1 ? "border-b border-outline-variant" : ""}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar src={e.foto} name={e.user.name} />
                              <div>
                                <p className="font-sans font-semibold text-on-surface text-sm">
                                  {e.user.name}
                                </p>
                                <p className="font-sans text-xs text-muted-foreground">
                                  {e.user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-muted-foreground tracking-wide">
                            {e.cedula}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm">
                            {e.curso ? (
                              <span className="text-on-surface">
                                {e.curso.nombre}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">
                                Sin curso
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(e.fecha_inscripcion)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                e.estado as "activo" | "inactivo" | "graduado"
                              }
                              className="font-sans px-3 py-1"
                            >
                              {estadoLabel[e.estado]}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewTarget(e)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Ver ficha de ${e.user.name}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEdit(e)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Editar a ${e.user.name}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={totalEstudiantes}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => {
                    setPage(p);
                    fetchEstudiantes(p);
                  }}
                  itemLabel={["estudiante", "estudiantes"]}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Dialog: Editar estudiante ── */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
              Editar estudiante
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Modifica los datos de <strong>{editTarget?.user.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editForm.handleSubmit(onEdit)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-primer_nombre">Primer nombre *</Label>
                <Input
                  id="edit-primer_nombre"
                  placeholder="Juan"
                  {...editForm.register("primer_nombre", {
                    onChange: (e) =>
                      editForm.setValue(
                        "primer_nombre",
                        sanitizarLetras(e.target.value),
                      ),
                  })}
                />
                {editForm.formState.errors.primer_nombre && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.primer_nombre.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-segundo_nombre">Segundo nombre</Label>
                <Input
                  id="edit-segundo_nombre"
                  placeholder="Pablo"
                  {...editForm.register("segundo_nombre", {
                    onChange: (e) =>
                      editForm.setValue(
                        "segundo_nombre",
                        sanitizarLetras(e.target.value),
                      ),
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-primer_apellido">Primer apellido *</Label>
                <Input
                  id="edit-primer_apellido"
                  placeholder="Pérez"
                  {...editForm.register("primer_apellido", {
                    onChange: (e) =>
                      editForm.setValue(
                        "primer_apellido",
                        sanitizarLetras(e.target.value),
                      ),
                  })}
                />
                {editForm.formState.errors.primer_apellido && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.primer_apellido.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-segundo_apellido">
                  Segundo apellido *
                </Label>
                <Input
                  id="edit-segundo_apellido"
                  placeholder="Gómez"
                  {...editForm.register("segundo_apellido", {
                    onChange: (e) =>
                      editForm.setValue(
                        "segundo_apellido",
                        sanitizarLetras(e.target.value),
                      ),
                  })}
                />
                {editForm.formState.errors.segundo_apellido && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.segundo_apellido.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Correo *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...editForm.register("email")}
                />
                {editForm.formState.errors.email && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cedula">Cédula *</Label>
                <Input
                  id="edit-cedula"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="12345678"
                  {...editForm.register("cedula", {
                    onChange: (e) =>
                      editForm.setValue(
                        "cedula",
                        sanitizarDigitos(e.target.value),
                      ),
                  })}
                />
                {editForm.formState.errors.cedula && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.cedula.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="04121234567"
                  {...editForm.register("telefono", {
                    onChange: (e) =>
                      editForm.setValue(
                        "telefono",
                        sanitizarDigitos(e.target.value),
                      ),
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fecha_nacimiento">
                  Fecha de nacimiento
                </Label>
                <Input
                  id="edit-fecha_nacimiento"
                  type="date"
                  {...editForm.register("fecha_nacimiento")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Género</Label>
                <Select
                  value={editForm.watch("genero") ?? ""}
                  onValueChange={(v) =>
                    editForm.setValue(
                      "genero",
                      v as EditEstudianteForm["genero"],
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Estado *</Label>
                <Select
                  value={editForm.watch("estado")}
                  onValueChange={(v) =>
                    editForm.setValue(
                      "estado",
                      v as EditEstudianteForm["estado"],
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="graduado">Graduado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Municipio *</Label>
                <Select
                  value={editForm.watch("municipio") || undefined}
                  onValueChange={(v) =>
                    editForm.setValue("municipio", v, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((municipio) => (
                      <SelectItem key={municipio} value={municipio}>
                        {municipio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editForm.formState.errors.municipio && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.municipio.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-direccion">
                  Dirección de habitación *
                </Label>
                <Input
                  id="edit-direccion"
                  placeholder="Av. Principal, casa N° 5"
                  maxLength={255}
                  {...editForm.register("direccion", {
                    onChange: (e) =>
                      editForm.setValue(
                        "direccion",
                        sanitizarTexto(e.target.value),
                      ),
                  })}
                />
                {editForm.formState.errors.direccion && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.direccion.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Curso</Label>
                <Select
                  value={editForm.watch("curso_id") || "none"}
                  onValueChange={(v) =>
                    editForm.setValue("curso_id", v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin curso</SelectItem>
                    {cursos.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fecha_inscripcion">
                  Fecha de inscripción *
                </Label>
                <Input
                  id="edit-fecha_inscripcion"
                  type="date"
                  {...editForm.register("fecha_inscripcion")}
                />
                {editForm.formState.errors.fecha_inscripcion && (
                  <p className="text-sm text-danger">
                    {editForm.formState.errors.fecha_inscripcion.message}
                  </p>
                )}
              </div>
            </div>

            {editError && (
              <div className="bg-danger-container border border-danger/25 text-danger text-sm px-4 py-3 rounded-sm">
                {editError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Ficha de solo lectura ── */}
      <Dialog
        open={viewTarget !== null}
        onOpenChange={(v) => !v && setViewTarget(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-on-surface">
              Ficha del estudiante
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Datos registrados. Para cambiarlos, usa «Editar».
            </DialogDescription>
          </DialogHeader>

          {viewTarget && (
            <div className="space-y-6">
              <DetailHeader
                foto={viewTarget.foto}
                name={viewTarget.user.name}
                email={viewTarget.user.email}
                badge={
                  <Badge
                    variant={
                      viewTarget.estado as "activo" | "inactivo" | "graduado"
                    }
                    className="font-sans px-2.5 py-1"
                  >
                    {estadoLabel[viewTarget.estado]}
                  </Badge>
                }
              />

              <DetailSection title="Datos personales">
                <DetailField label="Cédula">
                  <span className="font-mono tracking-wide">
                    {viewTarget.cedula}
                  </span>
                </DetailField>
                <DetailField label="Teléfono">
                  {viewTarget.telefono && (
                    <span className="font-mono tracking-wide">
                      {viewTarget.telefono}
                    </span>
                  )}
                </DetailField>
                <DetailField label="Fecha de nacimiento">
                  {viewTarget.fecha_nacimiento &&
                    formatDate(viewTarget.fecha_nacimiento)}
                </DetailField>
                <DetailField label="Género">
                  {viewTarget.genero && generoLabel[viewTarget.genero]}
                </DetailField>
                <DetailField label="Municipio">
                  {viewTarget.municipio}
                </DetailField>
                <DetailField label="Dirección de habitación">
                  {viewTarget.direccion}
                </DetailField>
              </DetailSection>

              <DetailSection title="Formación">
                <DetailField label="Curso" empty="Sin curso asignado">
                  {viewTarget.curso?.nombre}
                </DetailField>
                <DetailField label="Código del curso">
                  {viewTarget.curso && (
                    <span className="font-mono tracking-wide">
                      {viewTarget.curso.codigo}
                    </span>
                  )}
                </DetailField>
                <DetailField label="Fecha de inscripción">
                  {formatDate(viewTarget.fecha_inscripcion)}
                </DetailField>
              </DetailSection>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              Cerrar
            </Button>
            <Button
              className="gap-2"
              onClick={() => viewTarget && openEdit(viewTarget)}
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
