"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDate } from "@/lib/format";
import { sanitizarDigitos, sanitizarLetras } from "@/lib/validators";
import {
  instructorSchema,
  editInstructorSchema,
  type InstructorForm,
  type EditInstructorForm,
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
  GraduationCap,
  BookOpen,
  Award,
  Plus,
  Loader2,
  Filter,
  Pencil,
  SearchX,
  Eye,
} from "lucide-react";
import municipios from "@/data/municipios.json";

/* ── Types ── */

interface User {
  name: string;
  email: string;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
}

interface Instructor {
  id: number;
  cedula: string;
  telefono: string | null;
  especialidad: string | null;
  titulo: "licenciatura" | "maestria" | "doctorado" | null;
  departamento: string | null;
  municipio: string | null;
  tipo_contrato: { id: number; nombre: string } | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  user: User;
}

interface TipoContrato {
  id: number;
  nombre: string;
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

const generoLabel: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
  otro: "Otro",
};

const tituloLabel: Record<string, string> = {
  licenciatura: "Licenciatura",
  maestria: "Maestría",
  doctorado: "Doctorado",
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
  const [tiposContrato, setTiposContrato] = useState<TipoContrato[]>([]);
  const [search, setSearch] = useState("");
  const [filterTitulo, setFilterTitulo] = useState("todos");
  const [filterDepartamento, setFilterDepartamento] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalInstructores, setTotalInstructores] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingTiposContrato, setLoadingTiposContrato] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [viewTarget, setViewTarget] = useState<Instructor | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null,
  );
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState("");

  const form = useForm<InstructorForm>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      email: "",
      password: "",
      cedula: "",
      telefono: "",
      municipio: "",
      tipo_contrato_id: undefined,
      fecha_nacimiento: "",
      genero: undefined,
      especialidad: "",
      titulo: undefined,
      departamento: "",
    },
  });

  const editForm = useForm<EditInstructorForm>({
    resolver: zodResolver(editInstructorSchema),
    defaultValues: {
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      email: "",
      cedula: "",
      telefono: "",
      fecha_nacimiento: "",
      genero: undefined,
      especialidad: "",
      titulo: undefined,
      departamento: "",
      municipio: "",
      tipo_contrato_id: undefined,
    },
  });

  const fetchTiposContrato = async () => {
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/tipo-contratos`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setTiposContrato(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch {
      // Silently fail for contract types
    } finally {
      setLoadingTiposContrato(false);
    }
  };

  // Guarda contra respuestas fuera de orden al navegar rápido entre páginas.
  const latestPageRef = useRef(1);

  const fetchInstructores = async (pageNum = 1) => {
    latestPageRef.current = pageNum;
    try {
      const result = await fetchPage<Instructor>(
        `${process.env.API_URL}api/admin/profesores`,
        pageNum,
        getAuthHeaders(),
      );
      if (latestPageRef.current !== pageNum) return; // respuesta obsoleta
      setInstructores(result.items);
      setTotalInstructores(result.total);
      setTotalPages(result.totalPages);
      setError("");
    } catch {
      setError("No se pudo cargar la lista de instructores.");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (instructor: Instructor) => {
    setViewTarget(null);
    setEditingInstructor(instructor);
    setEditSubmitError("");
    editForm.reset({
      primer_nombre: instructor.user.primer_nombre ?? "",
      segundo_nombre: instructor.user.segundo_nombre ?? "",
      primer_apellido: instructor.user.primer_apellido ?? "",
      segundo_apellido: instructor.user.segundo_apellido ?? "",
      email: instructor.user.email,
      cedula: instructor.cedula,
      telefono: instructor.telefono ?? "",
      fecha_nacimiento: instructor.fecha_nacimiento
        ? instructor.fecha_nacimiento.slice(0, 10)
        : "",
      genero: (instructor.genero as EditInstructorForm["genero"]) ?? undefined,
      especialidad: instructor.especialidad ?? "",
      titulo: (instructor.titulo as EditInstructorForm["titulo"]) ?? undefined,
      departamento: instructor.departamento ?? "",
      municipio: instructor.municipio ?? "",
      tipo_contrato_id: instructor.tipo_contrato?.id ?? undefined,
    });
    setEditOpen(true);
  };

  const onEditSubmit = async (data: EditInstructorForm) => {
    if (!editingInstructor) return;
    setEditSubmitting(true);
    setEditSubmitError("");
    try {
      const body: Record<string, unknown> = {
        ...data,
        segundo_nombre: data.segundo_nombre || null,
        telefono: data.telefono || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        genero: data.genero || null,
        especialidad: data.especialidad || null,
        titulo: data.titulo || null,
        departamento: data.departamento || null,
        municipio: data.municipio || null,
        tipo_contrato_id: data.tipo_contrato_id || null,
      };
      const res = await fetch(
        `${process.env.API_URL}api/admin/profesores/${editingInstructor.id}`,
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
          : err.message || "Error al actualizar el instructor.";
        setEditSubmitError(messages as string);
        return;
      }
      const updated: Instructor = await res.json();
      setInstructores((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setEditOpen(false);
      toast.success("Instructor actualizado correctamente");
    } catch {
      setEditSubmitError("Error al conectar con el servidor.");
    } finally {
      setEditSubmitting(false);
    }
  };

  useEffect(() => {
    fetchInstructores(1);
    fetchTiposContrato();
  }, []);

  const onSubmit = async (data: InstructorForm) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const body: Record<string, unknown> = {
        ...data,
        segundo_nombre: data.segundo_nombre || null,
        telefono: data.telefono || null,
        municipio: data.municipio || null,
        tipo_contrato_id: data.tipo_contrato_id || null,
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
      form.reset();
      setOpen(false);
      setPage(1);
      fetchInstructores(1);
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
    total: totalInstructores,
    conTitulo: instructores.filter((p) => p.titulo).length,
    departamentos: new Set(
      instructores.map((p) => p.departamento).filter(Boolean),
    ).size,
  };

  const hasFilters =
    filterTitulo !== "todos" || filterDepartamento !== "todos" || search !== "";

  // Los filtros se aplican solo a lo cargado; si se está en otra página se
  // vuelve a la primera para no mostrar el número de página desincronizado.
  const safePage = Math.min(page, totalPages);

  const limpiarFiltros = () => {
    setSearch("");
    setFilterTitulo("todos");
    setFilterDepartamento("todos");
    if (page !== 1) {
      setPage(1);
      fetchInstructores(1);
    }
  };

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10 flex-col md:flex-row md:flex items-end justify-between">
          <PageHeader
            icon={GraduationCap}
            eyebrow="Gestión / Instructores"
            title="Instructores"
            subtitle="Todos los instructores registrados en la plataforma."
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primer_nombre">Primer nombre *</Label>
                    <Input
                      id="primer_nombre"
                      placeholder="María"
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
                    <Label htmlFor="segundo_nombre">Segundo nombre</Label>
                    <Input
                      id="segundo_nombre"
                      placeholder="José"
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
                      placeholder="López"
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
                      placeholder="García"
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

                <div className="grid gap-2">
                  <Label htmlFor="municipio">Municipio</Label>
                  <Select
                    value={form.watch("municipio") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("municipio", v as string)
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Select
                      value={form.watch("especialidad") ?? ""}
                      onValueChange={(v) => form.setValue("especialidad", v)}
                    >
                      <SelectTrigger id="especialidad" className="w-full">
                        <SelectValue placeholder="Seleccionar especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                        <SelectItem value="Física">Física</SelectItem>
                        <SelectItem value="Química">Química</SelectItem>
                        <SelectItem value="Biología">Biología</SelectItem>
                        <SelectItem value="Ciencias Naturales">
                          Ciencias Naturales
                        </SelectItem>
                        <SelectItem value="Lengua y Literatura">
                          Lengua y Literatura
                        </SelectItem>
                        <SelectItem value="Historia">Historia</SelectItem>
                        <SelectItem value="Geografía">Geografía</SelectItem>
                        <SelectItem value="Inglés">Inglés</SelectItem>
                        <SelectItem value="Arte y Cultura">
                          Arte y Cultura
                        </SelectItem>
                        <SelectItem value="Música">Música</SelectItem>
                        <SelectItem value="Educación Física">
                          Educación Física
                        </SelectItem>
                        <SelectItem value="Computación e Informática">
                          Computación e Informática
                        </SelectItem>
                        <SelectItem value="Administración">
                          Administración
                        </SelectItem>
                        <SelectItem value="Economía">Economía</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Select
                      value={form.watch("departamento") ?? ""}
                      onValueChange={(v) => form.setValue("departamento", v)}
                    >
                      <SelectTrigger id="departamento" className="w-full">
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ciencias Exactas">
                          Ciencias Exactas
                        </SelectItem>
                        <SelectItem value="Ciencias Naturales">
                          Ciencias Naturales
                        </SelectItem>
                        <SelectItem value="Ciencias Sociales">
                          Ciencias Sociales
                        </SelectItem>
                        <SelectItem value="Humanidades">Humanidades</SelectItem>
                        <SelectItem value="Idiomas">Idiomas</SelectItem>
                        <SelectItem value="Arte y Cultura">
                          Arte y Cultura
                        </SelectItem>
                        <SelectItem value="Tecnología">Tecnología</SelectItem>
                        <SelectItem value="Educación Física">
                          Educación Física
                        </SelectItem>
                        <SelectItem value="Administración y Economía">
                          Administración y Economía
                        </SelectItem>
                        <SelectItem value="Música">Música</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="licenciatura">
                          Licenciatura
                        </SelectItem>
                        <SelectItem value="maestria">Maestría</SelectItem>
                        <SelectItem value="doctorado">Doctorado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo de Contrato</Label>
                    {loadingTiposContrato ? (
                      <div className="h-10 w-full rounded-sm border border-outline-variant bg-surface-variant/50 animate-pulse" />
                    ) : (
                      <Select
                        value={form.watch("tipo_contrato_id")?.toString() ?? ""}
                        onValueChange={(v) =>
                          form.setValue(
                            "tipo_contrato_id",
                            v ? parseInt(v) : undefined,
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposContrato.map((tipo) => (
                            <SelectItem
                              key={tipo.id}
                              value={tipo.id.toString()}
                            >
                              {tipo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
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
              placeholder="Buscar instructor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (page !== 1) {
                  setPage(1);
                  fetchInstructores(1);
                }
              }}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select
              value={filterTitulo}
              onValueChange={(v) => {
                setFilterTitulo(v);
                if (page !== 1) {
                  setPage(1);
                  fetchInstructores(1);
                }
              }}
            >
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
              onValueChange={(v) => {
                setFilterDepartamento(v);
                if (page !== 1) {
                  setPage(1);
                  fetchInstructores(1);
                }
              }}
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
                {filtered.length} instructor{filtered.length !== 1 ? "es" : ""}
                {hasFilters
                  ? " encontrado" + (filtered.length !== 1 ? "s" : "")
                  : ""}
              </p>
            </div>
            {filtered.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={SearchX}
                  title="Ningún instructor coincide"
                  description="No hay instructores que cumplan los filtros aplicados. Prueba con otros criterios."
                  action={
                    <Button variant="outline" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title="Aún no hay instructores"
                  description="Registra al primer instructor para poder asignarle cursos y horarios."
                  action={
                    <Button className="gap-2" onClick={() => setOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Nuevo instructor
                    </Button>
                  }
                />
              )
            ) : (
              <>
                {/* Móvil: una tarjeta por instructor. */}
                <ul className="md:hidden">
                  {filtered.map((p) => (
                    <DataCard key={p.id}>
                      <DataCardHeader
                        aside={
                          p.titulo ? (
                            <Badge
                              variant={
                                p.titulo as
                                  | "licenciatura"
                                  | "maestria"
                                  | "doctorado"
                              }
                              className="font-sans text-xs font-semibold px-2.5 py-1"
                            >
                              {tituloLabel[p.titulo]}
                            </Badge>
                          ) : null
                        }
                      >
                        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                          <span className="font-sans text-sm font-bold text-on-primary-container">
                            {getInitials(p.user.name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans font-semibold text-on-surface text-sm truncate">
                            {p.user.name}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground truncate">
                            {p.user.email}
                          </p>
                        </div>
                      </DataCardHeader>
                      <DataCardFields>
                        <DataCardField label="Cédula">
                          <span className="font-mono tracking-wide">
                            {p.cedula}
                          </span>
                        </DataCardField>
                        <DataCardField label="Especialidad">
                          {p.especialidad ?? (
                            <span className="text-muted-foreground">
                              Sin especialidad
                            </span>
                          )}
                        </DataCardField>
                        <DataCardField label="Departamento">
                          {p.departamento ?? (
                            <span className="text-muted-foreground">
                              Sin departamento
                            </span>
                          )}
                        </DataCardField>
                      </DataCardFields>
                      <DataCardActions>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setViewTarget(p)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openEdit(p)}
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
                          "Instructor",
                          "Cédula",
                          "Especialidad",
                          "Departamento",
                          "Título",
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
                      {filtered.map((p, i) => (
                        <tr
                          key={p.id}
                          className={`hover:bg-surface-container transition-colors ${i < filtered.length - 1 ? "border-b border-outline-variant" : ""}`}
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
                              <span className="text-muted-foreground italic text-xs">
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
                              <span className="text-muted-foreground italic text-xs">
                                Sin departamento
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {p.titulo ? (
                              <Badge
                                variant={
                                  p.titulo as
                                    | "licenciatura"
                                    | "maestria"
                                    | "doctorado"
                                }
                                className="font-sans text-xs font-semibold px-3 py-1"
                              >
                                {tituloLabel[p.titulo]}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground font-sans text-sm">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewTarget(p)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Ver ficha de ${p.user.name}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEdit(p)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Editar a ${p.user.name}`}
                              >
                                <Pencil className="w-4 h-4" />
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
                  totalItems={totalInstructores}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => {
                    setPage(p);
                    fetchInstructores(p);
                  }}
                  itemLabel={["instructor", "instructores"]}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditSubmitError("");
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-2xl text-on-surface">
              Editar instructor
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Modifica los datos del instructor y guarda los cambios.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="grid gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-primer_nombre">Primer nombre *</Label>
                <Input
                  id="edit-primer_nombre"
                  placeholder="María"
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
                <Label htmlFor="edit-segundo_nombre">
                  Segundo nombre (opcional)
                </Label>
                <Input
                  id="edit-segundo_nombre"
                  placeholder="José"
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
                  placeholder="López"
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
                  placeholder="García"
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
                  placeholder="correo@ejemplo.com"
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

            <div className="grid gap-2">
              <Label>Género</Label>
              <Select
                value={editForm.watch("genero") ?? ""}
                onValueChange={(v) =>
                  editForm.setValue("genero", v as EditInstructorForm["genero"])
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Especialidad</Label>
                <Select
                  value={editForm.watch("especialidad") ?? ""}
                  onValueChange={(v) => editForm.setValue("especialidad", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                    <SelectItem value="Física">Física</SelectItem>
                    <SelectItem value="Química">Química</SelectItem>
                    <SelectItem value="Biología">Biología</SelectItem>
                    <SelectItem value="Ciencias Naturales">
                      Ciencias Naturales
                    </SelectItem>
                    <SelectItem value="Lengua y Literatura">
                      Lengua y Literatura
                    </SelectItem>
                    <SelectItem value="Historia">Historia</SelectItem>
                    <SelectItem value="Geografía">Geografía</SelectItem>
                    <SelectItem value="Inglés">Inglés</SelectItem>
                    <SelectItem value="Arte y Cultura">
                      Arte y Cultura
                    </SelectItem>
                    <SelectItem value="Música">Música</SelectItem>
                    <SelectItem value="Educación Física">
                      Educación Física
                    </SelectItem>
                    <SelectItem value="Computación e Informática">
                      Computación e Informática
                    </SelectItem>
                    <SelectItem value="Administración">
                      Administración
                    </SelectItem>
                    <SelectItem value="Economía">Economía</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Departamento</Label>
                <Select
                  value={editForm.watch("departamento") ?? ""}
                  onValueChange={(v) => editForm.setValue("departamento", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ciencias Exactas">
                      Ciencias Exactas
                    </SelectItem>
                    <SelectItem value="Ciencias Naturales">
                      Ciencias Naturales
                    </SelectItem>
                    <SelectItem value="Ciencias Sociales">
                      Ciencias Sociales
                    </SelectItem>
                    <SelectItem value="Humanidades">Humanidades</SelectItem>
                    <SelectItem value="Idiomas">Idiomas</SelectItem>
                    <SelectItem value="Arte y Cultura">
                      Arte y Cultura
                    </SelectItem>
                    <SelectItem value="Tecnología">Tecnología</SelectItem>
                    <SelectItem value="Educación Física">
                      Educación Física
                    </SelectItem>
                    <SelectItem value="Administración y Economía">
                      Administración y Economía
                    </SelectItem>
                    <SelectItem value="Música">Música</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Municipio</Label>
              <Select
                value={editForm.watch("municipio") ?? ""}
                onValueChange={(v) => editForm.setValue("municipio", v)}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Título académico</Label>
                <Select
                  value={editForm.watch("titulo") ?? ""}
                  onValueChange={(v) =>
                    editForm.setValue(
                      "titulo",
                      v as EditInstructorForm["titulo"],
                    )
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
              <div className="grid gap-2">
                <Label>Tipo de Contrato</Label>
                {loadingTiposContrato ? (
                  <div className="h-10 w-full rounded-sm border border-outline-variant bg-surface-variant/50 animate-pulse" />
                ) : (
                  <Select
                    value={editForm.watch("tipo_contrato_id")?.toString() ?? ""}
                    onValueChange={(v) =>
                      editForm.setValue(
                        "tipo_contrato_id",
                        v ? parseInt(v) : undefined,
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposContrato.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
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
              Ficha del instructor
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Datos registrados. Para cambiarlos, usa «Editar».
            </DialogDescription>
          </DialogHeader>

          {viewTarget && (
            <div className="space-y-6">
              <DetailHeader
                initials={getInitials(viewTarget.user.name)}
                name={viewTarget.user.name}
                email={viewTarget.user.email}
                badge={
                  viewTarget.titulo ? (
                    <Badge
                      variant={
                        viewTarget.titulo as
                          | "licenciatura"
                          | "maestria"
                          | "doctorado"
                      }
                      className="font-sans px-2.5 py-1"
                    >
                      {tituloLabel[viewTarget.titulo]}
                    </Badge>
                  ) : null
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
              </DetailSection>

              <DetailSection title="Datos profesionales">
                <DetailField label="Especialidad">
                  {viewTarget.especialidad}
                </DetailField>
                <DetailField label="Departamento">
                  {viewTarget.departamento}
                </DetailField>
                <DetailField label="Título">
                  {viewTarget.titulo && tituloLabel[viewTarget.titulo]}
                </DetailField>
                <DetailField label="Tipo de contrato">
                  {viewTarget.tipo_contrato?.nombre}
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
