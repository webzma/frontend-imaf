"use client";

import { useState, useEffect, useMemo } from "react";
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
  Search,
  Users,
  BookOpen,
  GraduationCap,
  Plus,
  Loader2,
  Filter,
  Pencil,
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
}

interface Estudiante {
  id: number;
  cedula: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
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

function getInitials(name: string): string {
  console.log(name);
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/* ── Styles ── */

const estadoStyle: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  inactivo: "bg-amber-100 text-amber-800 border border-amber-200",
  graduado:
    "bg-primary-container text-on-primary-container border border-primary-container",
};

const estadoLabel: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  graduado: "Graduado",
};

/* ── Zod Schema ── */

const editEstudianteSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  cedula: z.string().min(1, "La cédula es obligatoria"),
  telefono: z.string().max(20).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
  curso_id: z.string().optional(),
  fecha_inscripcion: z
    .string()
    .min(1, "La fecha de inscripción es obligatoria"),
  estado: z.enum(["activo", "inactivo", "graduado"]),
});

type EditEstudianteForm = z.infer<typeof editEstudianteSchema>;

const estudianteSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  cedula: z.string().min(1, "La cédula es obligatoria"),
  telefono: z.string().max(20).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
  curso_id: z.string().optional(),
  fecha_inscripcion: z
    .string()
    .min(1, "La fecha de inscripción es obligatoria"),
  estado: z.enum(["activo", "inactivo", "graduado"]),
});

type EstudianteForm = z.infer<typeof estudianteSchema>;

/* ── Table Skeleton ── */

function TableSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
      <div className="px-6 py-3.5 border-b border-outline-variant/50">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-outline-variant/30">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Edit
  const [editTarget, setEditTarget] = useState<Estudiante | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const editForm = useForm<EditEstudianteForm>({
    resolver: zodResolver(editEstudianteSchema),
  });

  const form = useForm<EstudianteForm>({
    resolver: zodResolver(estudianteSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      cedula: "",
      telefono: "",
      fecha_nacimiento: "",
      genero: undefined,
      curso_id: undefined,
      fecha_inscripcion: new Date().toISOString().split("T")[0],
      estado: "activo",
    },
  });

  const fetchEstudiantes = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/estudiantes`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setError("No se pudo cargar la lista de estudiantes.");
        return;
      }
      setEstudiantes(await res.json());
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCursos = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/cursos`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setCursos(await res.json());
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchEstudiantes();
    fetchCursos();
  }, []);

  const onSubmit = async (data: EstudianteForm) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, unknown> = {
        ...data,
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
      const created = await res.json();
      setEstudiantes((prev) => [...prev, created]);
      form.reset();
      setOpen(false);
      toast.success("Estudiante registrado correctamente");
    } catch {
      setSubmitError("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (e: Estudiante) => {
    setEditTarget(e);
    setEditError("");
    editForm.reset({
      name: e.user.name,
      email: e.user.email,
      cedula: e.cedula,
      telefono: e.telefono ?? "",
      fecha_nacimiento: e.fecha_nacimiento ?? "",
      genero: (e.genero as EditEstudianteForm["genero"]) ?? undefined,
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
        name: data.name,
        email: data.email,
        cedula: data.cedula,
        telefono: data.telefono || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        genero: data.genero || null,
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
    total: estudiantes.length,
    activos: estudiantes.filter((e) => e.estado === "activo").length,
    graduados: estudiantes.filter((e) => e.estado === "graduado").length,
  };

  const hasFilters =
    filterEstado !== "todos" || filterCurso !== "todos" || search !== "";

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="size-10 text-primary/70" />
              <span className="font-sans text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
                Gestión / Estudiantes
              </span>
            </div>
            <h1 className="font-serif font-light text-[3.2rem] tight-tracking leading-[1.08] text-on-surface mb-2">
              Estudiantes
            </h1>
            <p className="font-sans text-sm text-muted-foreground max-w-md">
              Todos los estudiantes registrados en la plataforma.
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
              <Button className="gap-2">
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
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Juan Pérez"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
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
                      <p className="text-sm text-destructive">
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
                      <p className="text-sm text-destructive">
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
                      placeholder="V-12345678"
                      {...form.register("cedula")}
                    />
                    {form.formState.errors.cedula && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.cedula.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      placeholder="0412-1234567"
                      {...form.register("telefono")}
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
                    <p className="text-sm text-destructive">
                      {form.formState.errors.fecha_inscripcion.message}
                    </p>
                  )}
                </div>

                {submitError && (
                  <div className="bg-destructive/12 border border-destructive/25 text-destructive text-sm px-4 py-3 rounded-lg">
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
              className="bg-surface-container-low rounded-sm p-5 ambient-shadow"
            >
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center ${s.glow} mb-4`}
              >
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              {loading ? (
                <Skeleton className="h-9 w-16 mb-1" />
              ) : (
                <p className="font-sans text-4xl font-light tight-tracking text-on-surface tabular-nums mb-1">
                  {s.value}
                </p>
              )}
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              placeholder="Buscar estudiante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-10 w-36 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="graduado">Graduado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCurso} onValueChange={setFilterCurso}>
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
                onClick={() => {
                  setSearch("");
                  setFilterEstado("todos");
                  setFilterCurso("todos");
                }}
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
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-sm font-sans">
            {error}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
            <div className="px-6 py-3.5 border-b border-outline-variant/50">
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface/55 font-medium">
                {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}
                {hasFilters
                  ? " encontrado" + (filtered.length !== 1 ? "s" : "")
                  : ""}
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-16 font-sans text-sm text-muted-foreground">
                {hasFilters
                  ? "No hay estudiantes con esos filtros."
                  : "No hay estudiantes registrados."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/40">
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
                          className="text-left px-6 py-3.5 font-sans text-xs tracking-[0.15em] uppercase text-on-surface/55 font-semibold"
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
                        className={`hover:bg-surface-container transition-colors ${i < filtered.length - 1 ? "border-b border-outline-variant/30" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                              <span className="font-sans text-sm font-bold text-on-primary-container">
                                {getInitials(e.user.name)}
                              </span>
                            </div>
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
                            <span className="text-on-surface/40 italic text-xs">
                              Sin curso
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-sans text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(e.fecha_inscripcion).toLocaleDateString(
                            "es-VE",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full font-sans text-xs font-semibold ${estadoStyle[e.estado]}`}
                          >
                            {estadoLabel[e.estado]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openEdit(e)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
                            title="Editar estudiante"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre completo *</Label>
              <Input id="edit-name" {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
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
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cedula">Cédula *</Label>
                <Input id="edit-cedula" {...editForm.register("cedula")} />
                {editForm.formState.errors.cedula && (
                  <p className="text-sm text-destructive">
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
                  placeholder="0412-1234567"
                  {...editForm.register("telefono")}
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
                    <SelectItem value="otro">Otro</SelectItem>
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
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.fecha_inscripcion.message}
                  </p>
                )}
              </div>
            </div>

            {editError && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive text-sm px-4 py-3 rounded-sm">
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
    </div>
  );
}
