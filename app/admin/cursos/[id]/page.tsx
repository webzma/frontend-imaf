"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  GraduationCap,
  Hash,
  Star,
  Users,
  Search,
  UserPlus,
  UserMinus,
  Loader2,
  BookOpen,
  Pencil,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Mail,
  BadgeCheck,
  Building2,
} from "lucide-react";

/* ── Types ── */

interface EstudianteUser {
  id: number;
  name: string;
  email: string;
}

interface EstudianteEnCurso {
  id: number;
  nombre: string;
  cedula: string;
  fecha_inscripcion: string;
  estado: "activo" | "inactivo" | "graduado";
  user: EstudianteUser;
}

interface ProfesorUser {
  id: number;
  name: string;
  email: string;
}

interface ProfesorFull {
  id: number;
  user_id: number;
  cedula: string | null;
  telefono: string | null;
  especialidad: string | null;
  titulo: string | null;
  departamento: string | null;
  user: ProfesorUser;
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  creditos: number;
  estado: "activo" | "inactivo";
  profesor: ProfesorUser | null;
  estudiantes: EstudianteEnCurso[];
}

interface EstudianteSinCurso {
  id: number;
  nombre: string;
  cedula: string;
  user: EstudianteUser;
  curso: { id: number } | null;
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

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const estadoBadge: Record<string, string> = {
  activo:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  inactivo:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  graduado: "bg-primary-container text-on-primary-container",
};

const tituloBadge: Record<string, string> = {
  licenciatura:
    "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400",
  maestria:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  doctorado: "bg-primary-container text-on-primary-container",
};

type SortKey = "nombre" | "cedula" | "estado" | "fecha_inscripcion";

const PAGE_SIZE = 8;

/* ── Page ── */

export default function CursoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [sinCurso, setSinCurso] = useState<EstudianteSinCurso[]>([]);
  const [profesores, setProfesores] = useState<ProfesorFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, sort & pagination
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Edit course dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    creditos: 1,
    estado: "activo" as "activo" | "inactivo",
    profesor_id: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Toggle status confirmation
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleSubmitting, setToggleSubmitting] = useState(false);

  // Dialog añadir estudiante
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  // Dialog quitar estudiante
  const [removeTarget, setRemoveTarget] = useState<EstudianteEnCurso | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState("");

  // Cambio de estado por estudiante
  const [statusChanging, setStatusChanging] = useState<number | null>(null);

  /* ── Fetch ── */
  useEffect(() => {
    const headers = getAuthHeaders();

    Promise.all([
      fetch(`${process.env.API_URL}api/admin/cursos/${id}`, { headers }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/estudiantes`, { headers }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/profesores`, { headers }).then((r) => r.json()),
    ])
      .then(([cursoData, estudiantesData, profesoresData]) => {
        setCurso(cursoData);
        setSinCurso(
          estudiantesData.filter(
            (e: EstudianteSinCurso) =>
              e.curso === null || e.curso.id !== cursoData.id
          )
        );
        setProfesores(profesoresData);
      })
      .catch(() => setError("Error al cargar los datos del curso."))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Derived ── */

  const profesorFull = useMemo(() => {
    if (!curso?.profesor) return null;
    return profesores.find((p) => p.user_id === curso.profesor!.id) ?? null;
  }, [curso, profesores]);

  const stats = useMemo(() => {
    if (!curso) return { activo: 0, inactivo: 0, graduado: 0 };
    return curso.estudiantes.reduce(
      (acc, e) => { acc[e.estado]++; return acc; },
      { activo: 0, inactivo: 0, graduado: 0 }
    );
  }, [curso]);

  const filtered = useMemo(() => {
    if (!curso) return [];
    const q = search.toLowerCase();
    return curso.estudiantes.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.cedula.includes(q) ||
        e.user.email.toLowerCase().includes(q)
    );
  }, [curso, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number = a[sortKey] ?? "";
      let vb: string | number = b[sortKey] ?? "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Handlers ── */

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!curso) return;
    const rows = [
      ["Nombre", "Cédula", "Email", "Estado", "Fecha Inscripción"],
      ...curso.estudiantes.map((e) => [
        e.nombre,
        e.cedula,
        e.user.email,
        e.estado,
        e.fecha_inscripcion,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${curso.codigo}-estudiantes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = () => {
    if (!curso) return;
    setEditForm({
      nombre: curso.nombre,
      codigo: curso.codigo,
      descripcion: curso.descripcion ?? "",
      creditos: curso.creditos,
      estado: curso.estado,
      profesor_id: curso.profesor ? String(curso.profesor.id) : "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!curso) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch(`${process.env.API_URL}api/admin/cursos/${curso.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: editForm.nombre,
          codigo: editForm.codigo,
          descripcion: editForm.descripcion || null,
          creditos: Number(editForm.creditos),
          estado: editForm.estado,
          profesor_id: editForm.profesor_id ? Number(editForm.profesor_id) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setEditError(err.message || "Error al actualizar el curso.");
        return;
      }
      const updated = await res.json();
      setCurso((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditOpen(false);
      toast.success("Curso actualizado correctamente");
    } catch {
      setEditError("Error al conectar con el servidor.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggle = async () => {
    if (!curso) return;
    setToggleSubmitting(true);
    try {
      const newEstado = curso.estado === "activo" ? "inactivo" : "activo";
      const res = await fetch(`${process.env.API_URL}api/admin/cursos/${curso.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: newEstado }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setCurso((prev) => (prev ? { ...prev, ...updated } : prev));
      setToggleOpen(false);
      toast.success(`Curso ${newEstado === "activo" ? "activado" : "desactivado"} correctamente`);
    } finally {
      setToggleSubmitting(false);
    }
  };

  const handleStudentStatus = async (
    estudiante: EstudianteEnCurso,
    newEstado: "activo" | "inactivo" | "graduado"
  ) => {
    setStatusChanging(estudiante.id);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/estudiantes/${estudiante.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado: newEstado }),
        }
      );
      if (!res.ok) return;
      setCurso((prev) =>
        prev
          ? {
              ...prev,
              estudiantes: prev.estudiantes.map((e) =>
                e.id === estudiante.id ? { ...e, estado: newEstado } : e
              ),
            }
          : prev
      );
    } finally {
      setStatusChanging(null);
    }
  };

  const handleAdd = async () => {
    if (!selectedId || !curso) return;
    setAddSubmitting(true);
    setAddError("");
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/estudiantes/${selectedId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ curso_id: curso.id }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        setAddError(err.message || "Error al inscribir al estudiante.");
        return;
      }
      const updated: EstudianteEnCurso = await res.json();
      setCurso((prev) =>
        prev ? { ...prev, estudiantes: [...prev.estudiantes, updated] } : prev
      );
      setSinCurso((prev) => prev.filter((e) => e.id !== updated.id));
      setSelectedId("");
      setAddOpen(false);
      toast.success("Estudiante inscrito correctamente");
    } catch {
      setAddError("Error al conectar con el servidor.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveSubmitting(true);
    setRemoveError("");
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/estudiantes/${removeTarget.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ curso_id: null }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        setRemoveError(err.message || "Error al desinscribir al estudiante.");
        return;
      }
      const updated = await res.json();
      setCurso((prev) =>
        prev
          ? {
              ...prev,
              estudiantes: prev.estudiantes.filter((e) => e.id !== removeTarget.id),
            }
          : prev
      );
      setSinCurso((prev) => [...prev, updated]);
      setRemoveTarget(null);
      toast.success("Estudiante desinscrito correctamente");
    } catch {
      setRemoveError("Error al conectar con el servidor.");
    } finally {
      setRemoveSubmitting(false);
    }
  };

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground font-sans text-sm">
        Cargando curso...
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="px-10 py-10">
        <p className="text-destructive font-sans text-sm">
          {error || "Curso no encontrado."}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-10 py-10 max-w-8xl">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a cursos
        </button>

        {/* ── Course header ── */}
        <div className="bg-surface-container-low rounded-sm p-8 ambient-shadow mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-3 h-3 text-primary/70" />
                <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
                  Gestión / Cursos / Detalle
                </span>
              </div>

              {/* Name */}
              <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface mb-2">
                {curso.nombre}
              </h1>

              {/* Profesor */}
              {curso.profesor && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="font-sans text-xs font-bold text-on-secondary-container">
                      {getInitials(curso.profesor.name)}
                    </span>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-on-surface flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-primary/70" />
                      {curso.profesor.name}
                      {profesorFull?.titulo && (
                        <span
                          className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full font-sans text-[10px] font-semibold capitalize ${
                            tituloBadge[profesorFull.titulo] ?? ""
                          }`}
                        >
                          {profesorFull.titulo}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {curso.profesor.email}
                      </span>
                      {profesorFull?.especialidad && (
                        <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          {profesorFull.especialidad}
                        </span>
                      )}
                      {profesorFull?.departamento && (
                        <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {profesorFull.departamento}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full font-sans text-sm font-semibold ${
                  curso.estado === "activo"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
                }`}
              >
                {curso.estado === "activo" ? "Activo" : "Inactivo"}
              </span>
              <button
                onClick={() => setToggleOpen(true)}
                title={curso.estado === "activo" ? "Desactivar curso" : "Activar curso"}
                className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                {curso.estado === "activo" ? (
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-amber-500" />
                )}
              </button>
              <button
                onClick={openEdit}
                title="Editar curso"
                className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-6 pt-5 border-t border-outline-variant/40">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span className="font-mono text-sm font-bold">{curso.codigo}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-4 h-4" />
              <span className="font-sans text-sm">{curso.creditos} créditos</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="font-sans text-sm">
                <strong className="text-on-surface">{curso.estudiantes.length}</strong>{" "}
                {curso.estudiantes.length === 1
                  ? "estudiante inscrito"
                  : "estudiantes inscritos"}
              </span>
            </div>
          </div>

          {curso.descripcion && (
            <p className="font-sans text-sm text-muted-foreground mt-4 pt-4 border-t border-outline-variant/40">
              {curso.descripcion}
            </p>
          )}
        </div>

        {/* ── Stats bar ── */}
        {curso.estudiantes.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(["activo", "inactivo", "graduado"] as const).map((est) => {
              const count = stats[est];
              const pct =
                curso.estudiantes.length > 0
                  ? Math.round((count / curso.estudiantes.length) * 100)
                  : 0;
              const colors = {
                activo: {
                  bar: "bg-emerald-500",
                  text: "text-emerald-700 dark:text-emerald-400",
                  bg: "bg-emerald-50 dark:bg-emerald-500/10",
                },
                inactivo: {
                  bar: "bg-amber-400",
                  text: "text-amber-700 dark:text-amber-400",
                  bg: "bg-amber-50 dark:bg-amber-500/10",
                },
                graduado: {
                  bar: "bg-primary",
                  text: "text-primary",
                  bg: "bg-primary/5",
                },
              }[est];
              return (
                <div key={est} className={`${colors.bg} rounded-sm p-4`}>
                  <p className="font-sans text-sm tracking-[0.24em] text-muted-foreground font-medium mb-1 capitalize">
                    {est}
                  </p>
                  <p className={`font-sans text-3xl font-light ${colors.text}`}>
                    {count}
                  </p>
                  <div className="mt-2 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="font-sans text-xs text-muted-foreground mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Estudiantes inscritos ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-on-surface/55 font-medium">
              Estudiantes inscritos
            </p>
            <div className="flex items-center gap-2">
              {curso.estudiantes.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              )}
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setAddOpen(true);
                  setAddError("");
                  setSelectedId("");
                }}
                disabled={sinCurso.length === 0}
              >
                <UserPlus className="w-4 h-4" />
                Añadir estudiante
              </Button>
            </div>
          </div>

          {/* Search */}
          {curso.estudiantes.length > 0 && (
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input
                placeholder="Buscar en este curso..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 font-sans text-sm"
              />
            </div>
          )}

          <div className="bg-surface-container-low rounded-sm overflow-hidden ambient-shadow">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                  <Users className="w-5 h-5 text-on-primary-container" />
                </div>
                <p className="font-sans text-sm text-muted-foreground text-center">
                  {search
                    ? "Sin resultados para tu búsqueda."
                    : "No hay estudiantes inscritos en este curso."}
                </p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/40">
                      {(
                        [
                          { key: "nombre", label: "Estudiante" },
                          { key: "cedula", label: "Cédula" },
                          { key: "fecha_inscripcion", label: "Inscripción" },
                          { key: "estado", label: "Estado" },
                        ] as { key: SortKey; label: string }[]
                      ).map(({ key, label }) => (
                        <th
                          key={key}
                          className="text-left px-6 py-3.5 font-sans text-xs tracking-[0.15em] uppercase text-on-surface/55 font-semibold"
                        >
                          <button
                            onClick={() => handleSort(key)}
                            className="flex items-center gap-1 hover:text-on-surface transition-colors"
                          >
                            {label}
                            {sortKey === key ? (
                              sortDir === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )
                            ) : (
                              <ChevronsUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                        </th>
                      ))}
                      <th className="px-4 py-3.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((e, i) => (
                      <tr
                        key={e.id}
                        className={`hover:bg-surface-container transition-colors ${
                          i < paginated.length - 1
                            ? "border-b border-outline-variant/30"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                              <span className="font-sans text-xs font-bold text-on-primary-container">
                                {getInitials(e.nombre)}
                              </span>
                            </div>
                            <div>
                              <p className="font-sans font-semibold text-on-surface text-sm">
                                {e.nombre}
                              </p>
                              <p className="font-sans text-xs text-muted-foreground">
                                {e.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-sm text-muted-foreground">
                          {e.cedula}
                        </td>
                        <td className="px-6 py-3.5 font-sans text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(e.fecha_inscripcion).toLocaleDateString("es-VE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          {statusChanging === e.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Select
                              value={e.estado}
                              onValueChange={(v) =>
                                handleStudentStatus(
                                  e,
                                  v as "activo" | "inactivo" | "graduado"
                                )
                              }
                            >
                              <SelectTrigger
                                className={`w-32 h-7 text-xs font-semibold border-0 px-2.5 rounded-full ${estadoBadge[e.estado]}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo">Activo</SelectItem>
                                <SelectItem value="inactivo">Inactivo</SelectItem>
                                <SelectItem value="graduado">Graduado</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => {
                              setRemoveTarget(e);
                              setRemoveError("");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-sans text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/40">
                    <p className="font-sans text-xs text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + 1}–
                      {Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`w-7 h-7 rounded-md font-sans text-xs transition-colors ${
                            n === page
                              ? "bg-primary text-on-primary font-semibold"
                              : "text-muted-foreground hover:text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialog: Editar curso ── */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) setEditOpen(false); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              Editar curso
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Modifica los datos del curso <strong>{curso.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Nombre
                </label>
                <Input
                  value={editForm.nombre}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  className="font-sans text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Código
                </label>
                <Input
                  value={editForm.codigo}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, codigo: e.target.value }))
                  }
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Créditos
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={editForm.creditos}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, creditos: Number(e.target.value) }))
                  }
                  className="font-sans text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Estado
                </label>
                <Select
                  value={editForm.estado}
                  onValueChange={(v) =>
                    setEditForm((f) => ({
                      ...f,
                      estado: v as "activo" | "inactivo",
                    }))
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

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Profesor
              </label>
              <Select
                value={editForm.profesor_id}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, profesor_id: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin profesor asignado" />
                </SelectTrigger>
                <SelectContent>
                  {profesores.map((p) => (
                    <SelectItem key={p.user_id} value={String(p.user_id)}>
                      <span className="font-sans">
                        {p.user.name}
                        {p.especialidad && (
                          <span className="text-muted-foreground text-xs ml-2">
                            {p.especialidad}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Descripción
              </label>
              <textarea
                value={editForm.descripcion}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                rows={3}
                placeholder="Descripción del curso (opcional)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {editError && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive text-sm px-3 py-2 rounded-sm">
                {editError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={editSubmitting}>
              {editSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Toggle estado ── */}
      <Dialog open={toggleOpen} onOpenChange={(v) => { if (!v) setToggleOpen(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              {curso.estado === "activo" ? "Desactivar curso" : "Activar curso"}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              ¿Deseas {curso.estado === "activo" ? "desactivar" : "activar"} el curso{" "}
              <strong>{curso.nombre}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleToggle}
              disabled={toggleSubmitting}
              variant={curso.estado === "activo" ? "destructive" : "default"}
            >
              {toggleSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {curso.estado === "activo" ? "Sí, desactivar" : "Sí, activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Añadir estudiante ── */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) setAddOpen(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              Añadir estudiante
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              Selecciona el estudiante que deseas inscribir en{" "}
              <strong>{curso.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Buscar estudiante..." />
              </SelectTrigger>
              <SelectContent>
                {sinCurso.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    <span className="font-sans">
                      {e.nombre}
                      <span className="text-muted-foreground text-xs ml-2">
                        {e.cedula}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {addError && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive text-sm px-3 py-2 rounded-sm">
                {addError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedId || addSubmitting}
            >
              {addSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Inscribir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar quitar ── */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              Quitar del curso
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              ¿Deseas desinscribir a{" "}
              <strong>{removeTarget?.nombre}</strong> de este curso?
            </DialogDescription>
          </DialogHeader>

          {removeError && (
            <div className="bg-destructive/10 border border-destructive/25 text-destructive text-sm px-3 py-2 rounded-sm">
              {removeError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeSubmitting}
            >
              {removeSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Sí, quitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
