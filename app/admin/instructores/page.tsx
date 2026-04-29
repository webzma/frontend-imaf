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
  GraduationCap,
  BookOpen,
  Award,
  Plus,
  Loader2,
  Filter,
} from "lucide-react";

/* ── Types ── */

interface User {
  name: string;
  email: string;
}

interface Instructor {
  id: number;
  cedula: string;
  telefono: string | null;
  especialidad: string | null;
  titulo: "licenciatura" | "maestria" | "doctorado" | null;
  departamento: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  user: User;
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
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/* ── Styles ── */

const tituloStyle: Record<string, string> = {
  licenciatura: "bg-sky-100 text-sky-800 border border-sky-200",
  maestria: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  doctorado:
    "bg-primary-container text-on-primary-container border border-primary-container",
};

const tituloLabel: Record<string, string> = {
  licenciatura: "Licenciatura",
  maestria: "Maestría",
  doctorado: "Doctorado",
};

/* ── Zod Schema ── */

const instructorSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  cedula: z.string().min(1, "La cédula es obligatoria"),
  telefono: z.string().max(20).optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.enum(["masculino", "femenino", "otro"]).optional(),
  especialidad: z.string().max(255).optional(),
  titulo: z.enum(["licenciatura", "maestria", "doctorado"]).optional(),
  departamento: z.string().max(255).optional(),
});

type InstructorForm = z.infer<typeof instructorSchema>;

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
              <Skeleton className="h-3.5 w-20 self-center" />
              <Skeleton className="h-3.5 w-24 self-center" />
              <Skeleton className="h-6 w-24 rounded-full self-center" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ── */

export default function InstructoresPage() {
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [search, setSearch] = useState("");
  const [filterTitulo, setFilterTitulo] = useState("todos");
  const [filterDepartamento, setFilterDepartamento] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<InstructorForm>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      cedula: "",
      telefono: "",
      fecha_nacimiento: "",
      genero: undefined,
      especialidad: "",
      titulo: undefined,
      departamento: "",
    },
  });

  const fetchInstructores = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/profesores`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setError("No se pudo cargar la lista de instructores.");
        return;
      }
      setInstructores(await res.json());
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructores();
  }, []);

  const onSubmit = async (data: InstructorForm) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, unknown> = {
        ...data,
        telefono: data.telefono || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        genero: data.genero || null,
        especialidad: data.especialidad || null,
        titulo: data.titulo || null,
        departamento: data.departamento || null,
      };
      const res = await fetch(`${process.env.API_URL}api/admin/profesores`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        const messages = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || "Error al crear el instructor.";
        setSubmitError(messages as string);
        return;
      }
      const created = await res.json();
      setInstructores((prev) => [...prev, created]);
      form.reset();
      setOpen(false);
      toast.success("Instructor registrado correctamente");
    } catch {
      setSubmitError("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Unique departments from data
  const departamentos = useMemo(() => {
    const set = new Set(
      instructores.map((p) => p.departamento).filter(Boolean) as string[],
    );
    return Array.from(set).sort();
  }, [instructores]);

  const filtered = useMemo(() => {
    return instructores.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.user.name.toLowerCase().includes(q) ||
        p.cedula.includes(q) ||
        p.user.email.toLowerCase().includes(q) ||
        (p.especialidad?.toLowerCase().includes(q) ?? false) ||
        (p.departamento?.toLowerCase().includes(q) ?? false);
      const matchTitulo = filterTitulo === "todos" || p.titulo === filterTitulo;
      const matchDept =
        filterDepartamento === "todos" ||
        (filterDepartamento === "sin_departamento"
          ? !p.departamento
          : p.departamento === filterDepartamento);
      return matchSearch && matchTitulo && matchDept;
    });
  }, [instructores, search, filterTitulo, filterDepartamento]);

  const counts = {
    total: instructores.length,
    conTitulo: instructores.filter((p) => p.titulo).length,
    departamentos: new Set(
      instructores.map((p) => p.departamento).filter(Boolean),
    ).size,
  };

  const hasFilters =
    filterTitulo !== "todos" || filterDepartamento !== "todos" || search !== "";

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10 flex-col md:flex-row md:flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="size-6 md:size-10 text-primary/70" />
              <span className="font-sans text-xs md:text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
                Gestión / Instructores
              </span>
            </div>
            <h1 className="font-serif font-light text-[3.2rem] tight-tracking leading-[1.08] text-on-surface mb-2">
              Instructores
            </h1>
            <p className="font-sans text-sm text-muted-foreground max-w-md">
              Todos los instructores registrados en la plataforma.
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
                Nuevo instructor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
                  Registrar instructor
                </DialogTitle>
                <DialogDescription className="font-sans text-sm text-muted-foreground">
                  Completa los datos para crear un nuevo instructor.
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
                    placeholder="Ej: María López"
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
                        form.setValue("genero", v as InstructorForm["genero"])
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
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Input
                      id="especialidad"
                      placeholder="Ej: Matemáticas"
                      {...form.register("especialidad")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      placeholder="Ej: Ciencias"
                      {...form.register("departamento")}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Título académico</Label>
                  <Select
                    value={form.watch("titulo") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("titulo", v as InstructorForm["titulo"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar título" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="licenciatura">Licenciatura</SelectItem>
                      <SelectItem value="maestria">Maestría</SelectItem>
                      <SelectItem value="doctorado">Doctorado</SelectItem>
                    </SelectContent>
                  </Select>
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
                    Crear instructor
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
              icon: GraduationCap,
              color: "text-on-primary-container",
              glow: "bg-primary-container",
            },
            {
              label: "Con título",
              value: counts.conTitulo,
              icon: Award,
              color: "text-on-primary-container",
              glow: "bg-primary-container/70",
            },
            {
              label: "Departamentos",
              value: counts.departamentos,
              icon: BookOpen,
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
              <p className="font-sans text-xs truncate tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
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
              placeholder="Buscar instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
            <Select value={filterTitulo} onValueChange={setFilterTitulo}>
              <SelectTrigger className="h-10 w-42 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los títulos</SelectItem>
                <SelectItem value="licenciatura">Licenciatura</SelectItem>
                <SelectItem value="maestria">Maestría</SelectItem>
                <SelectItem value="doctorado">Doctorado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterDepartamento}
              onValueChange={setFilterDepartamento}
            >
              <SelectTrigger className="h-10 w-44 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los departamentos</SelectItem>
                <SelectItem value="sin_departamento">
                  Sin departamento
                </SelectItem>
                {departamentos.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterTitulo("todos");
                  setFilterDepartamento("todos");
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
                {filtered.length} instructor{filtered.length !== 1 ? "es" : ""}
                {hasFilters
                  ? " encontrado" + (filtered.length !== 1 ? "s" : "")
                  : ""}
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-16 font-sans text-sm text-muted-foreground">
                {hasFilters
                  ? "No hay instructores con esos filtros."
                  : "No hay instructores registrados."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/40">
                      {[
                        "Instructor",
                        "Cédula",
                        "Especialidad",
                        "Departamento",
                        "Título",
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
                    {filtered.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-surface-container transition-colors ${i < filtered.length - 1 ? "border-b border-outline-variant/30" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                              <span className="font-sans text-sm font-bold text-on-primary-container">
                                {getInitials(p.user.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-sans font-semibold text-on-surface text-sm">
                                {p.user.name}
                              </p>
                              <p className="font-sans text-xs text-muted-foreground">
                                {p.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-muted-foreground tracking-wide">
                          {p.cedula}
                        </td>
                        <td className="px-6 py-4 font-sans text-sm">
                          {p.especialidad ? (
                            <span className="text-on-surface">
                              {p.especialidad}
                            </span>
                          ) : (
                            <span className="text-on-surface/40 italic text-xs">
                              Sin especialidad
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-sans text-sm">
                          {p.departamento ? (
                            <span className="text-on-surface">
                              {p.departamento}
                            </span>
                          ) : (
                            <span className="text-on-surface/40 italic text-xs">
                              Sin departamento
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {p.titulo ? (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full font-sans text-xs font-semibold ${tituloStyle[p.titulo]}`}
                            >
                              {tituloLabel[p.titulo]}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 font-sans text-sm">
                              —
                            </span>
                          )}
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
    </div>
  );
}
