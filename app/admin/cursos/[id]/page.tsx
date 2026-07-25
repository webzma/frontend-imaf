"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/empty-state";
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
  ToggleLeft,
  ToggleRight,
  Mail,
  BadgeCheck,
  Building2,
  CalendarDays,
  MessageCircle,
  UsersRound,
  ClipboardList,
  Plus,
  Trash2,
  ListChecks,
  Clock,
  CalendarClock,
  ClipboardCheck,
  SearchX,
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

interface InstructorUser {
  id: number;
  name: string;
  email: string;
}

interface InstructorFull {
  id: number;
  user_id: number;
  cedula: string | null;
  telefono: string | null;
  especialidad: string | null;
  titulo: string | null;
  departamento: string | null;
  user: InstructorUser;
}

interface CursoInstructor {
  id: number;
  user_id: number;
  cedula: string | null;
  especialidad: string | null;
  titulo: string | null;
  departamento: string | null;
  user: InstructorUser;
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  limite_cupo: number;
  minimo_estudiantes: number | null;
  cupos_restantes: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  requisitos: string | null;
  precio: number;
  whatsapp_url: string | null;
  estado: "activo" | "inactivo";
  instructor: CursoInstructor | null;
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

/* ── No more local badge styles — using <Badge> component variants ── */

interface Temario {
  id: number;
  curso_id: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
}

interface Sesion {
  id: number;
  curso_id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: "programada" | "realizada" | "cancelada";
}

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
  const [instructores, setInstructores] = useState<InstructorFull[]>([]);
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
    descripcion: "",
    limite_cupo: 30,
    minimo_estudiantes: "" as string | number,
    fecha_inicio: "",
    fecha_fin: "",
    requisitos: "",
    precio: 0,
    whatsapp_url: "",
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
  const [removeTarget, setRemoveTarget] = useState<EstudianteEnCurso | null>(
    null,
  );
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState("");

  // Cambio de estado por estudiante
  const [statusChanging, setStatusChanging] = useState<number | null>(null);

  // Temario
  const [temario, setTemario] = useState<Temario[]>([]);
  const [temarioOpen, setTemarioOpen] = useState(false);
  const [temarioEdit, setTemarioEdit] = useState<Temario | null>(null);
  const [temarioForm, setTemarioForm] = useState({
    titulo: "",
    descripcion: "",
    orden: 0,
  });
  const [temarioSubmitting, setTemarioSubmitting] = useState(false);
  const [temarioError, setTemarioError] = useState("");
  const [temarioDeleteTarget, setTemarioDeleteTarget] =
    useState<Temario | null>(null);
  const [temarioDeleting, setTemarioDeleting] = useState(false);

  // Sesiones
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [sesionOpen, setSesionOpen] = useState(false);
  const [sesionEdit, setSesionEdit] = useState<Sesion | null>(null);
  const [sesionForm, setSesionForm] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    estado: "programada" as Sesion["estado"],
  });
  const [sesionSubmitting, setSesionSubmitting] = useState(false);
  const [sesionError, setSesionError] = useState("");
  const [sesionDeleteTarget, setSesionDeleteTarget] = useState<Sesion | null>(
    null,
  );
  const [sesionDeleting, setSesionDeleting] = useState(false);

  /* ── Fetch ── */
  useEffect(() => {
    const headers = getAuthHeaders();

    Promise.all([
      fetch(`${process.env.API_URL}api/admin/cursos/${id}`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${process.env.API_URL}api/admin/estudiantes?per_page=1000`, {
        headers,
      }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/profesores`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${process.env.API_URL}api/admin/cursos/${id}/temario`, {
        headers,
      }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/cursos/${id}/sesiones`, {
        headers,
      }).then((r) => r.json()),
    ])
      .then(
        ([
          cursoData,
          estudiantesData,
          instructoresData,
          temarioData,
          sesionesData,
        ]) => {
          setCurso(cursoData);
          const listaEstudiantes = Array.isArray(estudiantesData)
            ? estudiantesData
            : (estudiantesData.data ?? []);
          setSinCurso(
            listaEstudiantes.filter(
              (e: EstudianteSinCurso) =>
                e.curso === null || e.curso.id !== cursoData.id,
            ),
          );
          setInstructores(instructoresData);
          setTemario(Array.isArray(temarioData) ? temarioData : []);
          setSesiones(Array.isArray(sesionesData) ? sesionesData : []);
        },
      )
      .catch(() => setError("Error al cargar los datos del curso."))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Derived ── */

  const instructorFull = useMemo(() => {
    if (!curso?.instructor) return null;
    return instructores.find((p) => p.id === curso.instructor!.id) ?? null;
  }, [curso, instructores]);

  const stats = useMemo(() => {
    if (!curso) return { activo: 0, inactivo: 0, graduado: 0 };
    return curso.estudiantes.reduce(
      (acc, e) => {
        acc[e.estado]++;
        return acc;
      },
      { activo: 0, inactivo: 0, graduado: 0 },
    );
  }, [curso]);

  const filtered = useMemo(() => {
    if (!curso) return [];
    const q = search.toLowerCase();
    return curso.estudiantes.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.cedula.includes(q) ||
        e.user.email.toLowerCase().includes(q),
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
    a.download = `${curso.nombre.replace(/\s+/g, "-").toLowerCase()}-estudiantes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = () => {
    if (!curso) return;
    setEditForm({
      nombre: curso.nombre,
      descripcion: curso.descripcion ?? "",
      limite_cupo: curso.limite_cupo,
      minimo_estudiantes: curso.minimo_estudiantes ?? "",
      fecha_inicio: curso.fecha_inicio ?? "",
      fecha_fin: curso.fecha_fin ?? "",
      requisitos: curso.requisitos ?? "",
      precio: curso.precio,
      whatsapp_url: curso.whatsapp_url ?? "",
      estado: curso.estado,
      profesor_id: curso.instructor ? String(curso.instructor.id) : "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!curso) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/cursos/${curso.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            nombre: editForm.nombre,
            descripcion: editForm.descripcion || null,
            limite_cupo: Number(editForm.limite_cupo),
            minimo_estudiantes:
              editForm.minimo_estudiantes === ""
                ? null
                : Number(editForm.minimo_estudiantes),
            fecha_inicio: editForm.fecha_inicio || null,
            fecha_fin: editForm.fecha_fin || null,
            requisitos: editForm.requisitos || null,
            precio: Number(editForm.precio),
            whatsapp_url: editForm.whatsapp_url || null,
            estado: editForm.estado,
            profesor_id: editForm.profesor_id
              ? Number(editForm.profesor_id)
              : null,
          }),
        },
      );
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
      const res = await fetch(
        `${process.env.API_URL}api/admin/cursos/${curso.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado: newEstado }),
        },
      );
      if (!res.ok) return;
      const updated = await res.json();
      setCurso((prev) => (prev ? { ...prev, ...updated } : prev));
      setToggleOpen(false);
      toast.success(
        `Curso ${newEstado === "activo" ? "activado" : "desactivado"} correctamente`,
      );
    } finally {
      setToggleSubmitting(false);
    }
  };

  const handleStudentStatus = async (
    estudiante: EstudianteEnCurso,
    newEstado: "activo" | "inactivo" | "graduado",
  ) => {
    setStatusChanging(estudiante.id);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/admin/estudiantes/${estudiante.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado: newEstado }),
        },
      );
      if (!res.ok) return;
      setCurso((prev) =>
        prev
          ? {
              ...prev,
              estudiantes: prev.estudiantes.map((e) =>
                e.id === estudiante.id ? { ...e, estado: newEstado } : e,
              ),
            }
          : prev,
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
        },
      );
      if (!res.ok) {
        const err = await res.json();
        setAddError(err.message || "Error al inscribir al estudiante.");
        return;
      }
      const updated: EstudianteEnCurso = await res.json();
      setCurso((prev) =>
        prev ? { ...prev, estudiantes: [...prev.estudiantes, updated] } : prev,
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
        },
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
              estudiantes: prev.estudiantes.filter(
                (e) => e.id !== removeTarget.id,
              ),
            }
          : prev,
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

  /* ── Temario handlers ── */

  const openTemarioCreate = () => {
    setTemarioEdit(null);
    setTemarioForm({ titulo: "", descripcion: "", orden: temario.length });
    setTemarioError("");
    setTemarioOpen(true);
  };

  const openTemarioEdit = (t: Temario) => {
    setTemarioEdit(t);
    setTemarioForm({
      titulo: t.titulo,
      descripcion: t.descripcion ?? "",
      orden: t.orden,
    });
    setTemarioError("");
    setTemarioOpen(true);
  };

  const handleTemarioSubmit = async () => {
    if (!temarioForm.titulo.trim()) {
      setTemarioError("El título es obligatorio.");
      return;
    }
    setTemarioSubmitting(true);
    setTemarioError("");
    try {
      const url = temarioEdit
        ? `${process.env.API_URL}api/admin/cursos/${id}/temario/${temarioEdit.id}`
        : `${process.env.API_URL}api/admin/cursos/${id}/temario`;
      const res = await fetch(url, {
        method: temarioEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          titulo: temarioForm.titulo,
          descripcion: temarioForm.descripcion || null,
          orden: Number(temarioForm.orden),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setTemarioError(err.message || "Error al guardar el tema.");
        return;
      }
      const saved: Temario = await res.json();
      setTemario((prev) =>
        (temarioEdit
          ? prev.map((t) => (t.id === saved.id ? saved : t))
          : [...prev, saved]
        ).sort((a, b) => a.orden - b.orden),
      );
      setTemarioOpen(false);
      toast.success(temarioEdit ? "Tema actualizado" : "Tema agregado");
    } catch {
      setTemarioError("Error al conectar con el servidor.");
    } finally {
      setTemarioSubmitting(false);
    }
  };

  const handleTemarioDelete = async () => {
    if (!temarioDeleteTarget) return;
    setTemarioDeleting(true);
    try {
      await fetch(
        `${process.env.API_URL}api/admin/cursos/${id}/temario/${temarioDeleteTarget.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      setTemario((prev) => prev.filter((t) => t.id !== temarioDeleteTarget.id));
      setTemarioDeleteTarget(null);
      toast.success("Tema eliminado");
    } finally {
      setTemarioDeleting(false);
    }
  };

  /* ── Sesiones handlers ── */

  const openSesionCreate = () => {
    setSesionEdit(null);
    setSesionForm({
      titulo: "",
      descripcion: "",
      fecha: "",
      hora_inicio: "",
      hora_fin: "",
      estado: "programada",
    });
    setSesionError("");
    setSesionOpen(true);
  };

  const openSesionEdit = (s: Sesion) => {
    setSesionEdit(s);
    setSesionForm({
      titulo: s.titulo,
      descripcion: s.descripcion ?? "",
      fecha: s.fecha,
      hora_inicio: s.hora_inicio ?? "",
      hora_fin: s.hora_fin ?? "",
      estado: s.estado,
    });
    setSesionError("");
    setSesionOpen(true);
  };

  const handleSesionSubmit = async () => {
    if (!sesionForm.titulo.trim()) {
      setSesionError("El título es obligatorio.");
      return;
    }
    if (!sesionForm.fecha) {
      setSesionError("La fecha es obligatoria.");
      return;
    }
    setSesionSubmitting(true);
    setSesionError("");
    try {
      const url = sesionEdit
        ? `${process.env.API_URL}api/admin/cursos/${id}/sesiones/${sesionEdit.id}`
        : `${process.env.API_URL}api/admin/cursos/${id}/sesiones`;
      const res = await fetch(url, {
        method: sesionEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          titulo: sesionForm.titulo,
          descripcion: sesionForm.descripcion || null,
          fecha: sesionForm.fecha,
          hora_inicio: sesionForm.hora_inicio || null,
          hora_fin: sesionForm.hora_fin || null,
          estado: sesionForm.estado,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSesionError(err.message || "Error al guardar la sesión.");
        return;
      }
      const saved: Sesion = await res.json();
      setSesiones((prev) =>
        (sesionEdit
          ? prev.map((s) => (s.id === saved.id ? saved : s))
          : [...prev, saved]
        ).sort((a, b) =>
          a.fecha !== b.fecha
            ? a.fecha.localeCompare(b.fecha)
            : (a.hora_inicio ?? "").localeCompare(b.hora_inicio ?? ""),
        ),
      );
      setSesionOpen(false);
      toast.success(sesionEdit ? "Sesión actualizada" : "Sesión agregada");
    } catch {
      setSesionError("Error al conectar con el servidor.");
    } finally {
      setSesionSubmitting(false);
    }
  };

  const handleSesionDelete = async () => {
    if (!sesionDeleteTarget) return;
    setSesionDeleting(true);
    try {
      await fetch(
        `${process.env.API_URL}api/admin/cursos/${id}/sesiones/${sesionDeleteTarget.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      setSesiones((prev) => prev.filter((s) => s.id !== sesionDeleteTarget.id));
      setSesionDeleteTarget(null);
      toast.success("Sesión eliminada");
    } finally {
      setSesionDeleting(false);
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
        <p className="text-danger font-sans text-sm">
          {error || "Curso no encontrado."}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
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
              <div className="hidden md:flex items-center gap-2 mb-3">
                <BookOpen className="w-3 h-3 text-primary/70" />
                <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
                  Gestión / Cursos / Detalle
                </span>
              </div>

              {/* Name */}
              <h1 className="font-serif font-light text-4xl md:text-[2.8rem] tight-tracking leading-[1.08] text-on-surface mb-2">
                {curso.nombre}
              </h1>

              {/* Instructor */}
              {curso.instructor?.user && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-9 h-9 rounded-full bg-secondary-container md:flex items-center justify-center shrink-0 hidden">
                    <span className="font-sans text-xs font-bold text-on-secondary-container">
                      {getInitials(curso.instructor.user.name)}
                    </span>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-on-surface flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-primary/70" />
                      {curso.instructor.user.name}
                      {instructorFull?.titulo && (
                        <Badge
                          variant={
                            instructorFull.titulo as
                              | "licenciatura"
                              | "maestria"
                              | "doctorado"
                          }
                          className="font-sans text-[10px] px-1.5 py-0 capitalize"
                        >
                          {instructorFull.titulo}
                        </Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {curso.instructor.user.email}
                      </span>
                      {instructorFull?.especialidad && (
                        <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          {instructorFull.especialidad}
                        </span>
                      )}
                      {instructorFull?.departamento && (
                        <span className="font-sans text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {instructorFull.departamento}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <Badge
                variant={curso.estado === "activo" ? "activo" : "inactivo"}
                className="font-sans text-sm font-semibold px-3 py-1"
              >
                {curso.estado === "activo" ? "Activo" : "Inactivo"}
              </Badge>
              <button
                onClick={() => setToggleOpen(true)}
                title={
                  curso.estado === "activo"
                    ? "Desactivar curso"
                    : "Activar curso"
                }
                className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                {curso.estado === "activo" ? (
                  <ToggleRight className="w-5 h-5 text-success" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-warning" />
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
          <div className="flex items-center flex-wrap gap-x-6 gap-y-2 pt-5 border-t border-outline-variant">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span className="font-mono text-sm font-bold">
                {curso.codigo}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <UsersRound className="w-4 h-4" />
              <span className="font-sans text-sm">
                <strong className="text-on-surface">
                  {curso.estudiantes.length}
                </strong>
                {" / "}
                {curso.limite_cupo} participantes
                {" · "}
                <span
                  className={
                    curso.cupos_restantes <= 0
                      ? "text-danger font-semibold"
                      : curso.cupos_restantes <= 5
                        ? "text-warning font-semibold"
                        : "text-success font-semibold"
                  }
                >
                  {curso.cupos_restantes <= 0
                    ? "Sin cupo"
                    : `${curso.cupos_restantes} disponibles`}
                </span>
              </span>
            </div>
            {(curso.fecha_inicio || curso.fecha_fin) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span className="font-sans text-sm">
                  {formatDate(curso.fecha_inicio)}
                  {curso.fecha_fin && " → " + formatDate(curso.fecha_fin)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <b>Bs.</b>
              <span className="font-sans text-sm font-semibold text-on-surface">
                {formatPrice(curso.precio)}
              </span>
            </div>
            {curso.whatsapp_url && (
              <a
                href={curso.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-sans text-sm text-success hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                Grupo WhatsApp
              </a>
            )}
          </div>

          {curso.descripcion && (
            <p className="font-sans text-sm text-muted-foreground mt-4 pt-4 border-t border-outline-variant">
              {curso.descripcion}
            </p>
          )}

          {curso.requisitos && (
            <div className="mt-4 pt-4 border-t border-outline-variant">
              <p className="flex items-center gap-1.5 font-sans text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-1">
                <ClipboardList className="w-3.5 h-3.5" />
                Requisitos / Materiales
              </p>
              <p className="font-sans text-sm text-muted-foreground whitespace-pre-line">
                {curso.requisitos}
              </p>
            </div>
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
                  bar: "bg-success",
                  text: "text-on-success-container",
                  bg: "bg-success-container",
                },
                inactivo: {
                  bar: "bg-warning",
                  text: "text-on-warning-container",
                  bg: "bg-warning-container",
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
                      className={`h-full ${colors.bar} rounded-full transition-[background-color,border-color,color,box-shadow,transform,opacity]`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="font-sans text-xs text-muted-foreground mt-1">
                    {pct}%
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Estudiantes inscritos ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-medium">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              search ? (
                <EmptyState
                  icon={SearchX}
                  title="Sin resultados"
                  description={`Ningún estudiante de este curso coincide con "${search}".`}
                  action={
                    <Button variant="outline" onClick={() => setSearch("")}>
                      Limpiar búsqueda
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="Sin estudiantes inscritos"
                  description="Inscribe al primer estudiante en este curso para empezar a registrar asistencia."
                />
              )
            ) : (
              <>
                <div className="table-scroll">
                  <table className="w-full table-sticky-first">
                    <thead>
                      <tr className="border-b border-outline-variant">
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
                            className="text-left px-6 py-3.5 font-sans text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold"
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
                              ? "border-b border-outline-variant"
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
                            {formatDate(e.fecha_inscripcion)}
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
                                    v as "activo" | "inactivo" | "graduado",
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={`w-32 h-7 text-xs font-semibold border-0 px-2.5 rounded-full ${
                                    e.estado === "activo"
                                      ? "bg-success-container text-on-success-container dark:bg-success-container dark:text-success"
                                      : e.estado === "inactivo"
                                        ? "bg-warning-container text-on-warning-container dark:bg-warning-container dark:text-warning"
                                        : "bg-primary-container text-on-primary-container"
                                  }`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="activo">Activo</SelectItem>
                                  <SelectItem value="inactivo">
                                    Inactivo
                                  </SelectItem>
                                  <SelectItem value="graduado">
                                    Graduado
                                  </SelectItem>
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-sans text-xs text-muted-foreground hover:text-danger hover:bg-danger-container transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={sorted.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel={["estudiante", "estudiantes"]}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Temario ── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-medium">
                Temario del curso
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={openTemarioCreate}>
              <Plus className="w-3.5 h-3.5" />
              Agregar tema
            </Button>
          </div>

          {temario.length === 0 ? (
            <div className="bg-surface-container-low rounded-sm p-8 ambient-shadow flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-on-primary-container" />
              </div>
              <p className="font-sans text-sm text-muted-foreground">
                No hay temas en el temario. Agrega el primero.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-sm ambient-shadow overflow-hidden">
              {temario.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-start gap-4 px-6 py-4 hover:bg-surface-container transition-colors ${
                    i < temario.length - 1
                      ? "border-b border-outline-variant"
                      : ""
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-mono text-xs font-bold text-on-primary-container">
                      {t.orden}
                    </span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold text-on-surface">
                      {t.titulo}
                    </p>
                    {t.descripcion && (
                      <p className="font-sans text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {t.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openTemarioEdit(t)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTemarioDeleteTarget(t)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger-container transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sesiones ── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary/70" />
              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-medium">
                Sesiones / Clases
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={openSesionCreate}>
              <Plus className="w-3.5 h-3.5" />
              Agregar sesión
            </Button>
          </div>

          {sesiones.length === 0 ? (
            <div className="bg-surface-container-low rounded-sm p-8 ambient-shadow flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-on-primary-container" />
              </div>
              <p className="font-sans text-sm text-muted-foreground">
                No hay sesiones programadas. Agrega la primera clase.
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-sm ambient-shadow overflow-hidden">
              {sesiones.map((s, i) => {
                const sesionEstadoVariant = {
                  programada: "programada" as const,
                  realizada: "realizada" as const,
                  cancelada: "cancelada" as const,
                }[s.estado];
                const fechaFmt = formatDate(s.fecha, {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-4 px-6 py-4 hover:bg-surface-container transition-colors ${
                      i < sesiones.length - 1
                        ? "border-b border-outline-variant"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <CalendarDays className="w-4 h-4 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-sans text-xs text-muted-foreground font-medium">
                          {fechaFmt}
                        </span>
                        {(s.hora_inicio || s.hora_fin) && (
                          <span className="flex items-center gap-1 font-sans text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {s.hora_inicio ?? ""}
                            {s.hora_fin && ` – ${s.hora_fin}`}
                          </span>
                        )}
                        <Badge
                          variant={sesionEstadoVariant}
                          className="font-sans text-[10px] font-semibold capitalize px-1.5 py-0"
                        >
                          {s.estado}
                        </Badge>
                      </div>
                      <p className="font-sans text-sm font-semibold text-on-surface">
                        {s.titulo}
                      </p>
                      {s.descripcion && (
                        <p className="font-sans text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {s.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          router.push(`/admin/sesiones/${s.id}/asistencia`)
                        }
                        title="Tomar asistencia"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-sans text-xs text-primary hover:bg-primary/10 transition-colors"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Asistencia
                      </button>
                      <button
                        onClick={() => openSesionEdit(s)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSesionDeleteTarget(s)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger-container transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog: Editar curso ── */}
      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          if (!v) setEditOpen(false);
        }}
      >
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
            {/* Nombre */}
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

            {/* Instructor + Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Instructor
                </label>
                <Select
                  value={editForm.profesor_id}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, profesor_id: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin instructor asignado" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
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

            {/* Límite de cupo + Precio */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Límite de cupo
                </label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.limite_cupo}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      limite_cupo: Number(e.target.value),
                    }))
                  }
                  className="font-sans text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Mínimo de estudiantes
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Para aperturar el curso"
                  value={editForm.minimo_estudiantes}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      minimo_estudiantes: e.target.value,
                    }))
                  }
                  className="font-sans text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Precio
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editForm.precio}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      precio: Number(e.target.value),
                    }))
                  }
                  className="font-sans text-sm"
                />
              </div>
            </div>

            {/* Fecha inicio + Fecha fin */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Fecha de inicio
                </label>
                <Input
                  type="date"
                  value={editForm.fecha_inicio}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fecha_inicio: e.target.value }))
                  }
                  className="font-sans text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Fecha de fin
                </label>
                <Input
                  type="date"
                  value={editForm.fecha_fin}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fecha_fin: e.target.value }))
                  }
                  className="font-sans text-sm"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Enlace grupo WhatsApp{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <Input
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={editForm.whatsapp_url}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, whatsapp_url: e.target.value }))
                }
                className="font-sans text-sm"
              />
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Descripción{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                value={editForm.descripcion}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                rows={3}
                placeholder="Descripción del curso..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Requisitos */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Requisitos / Materiales{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                value={editForm.requisitos}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, requisitos: e.target.value }))
                }
                rows={3}
                placeholder="Ej: Cuaderno, lápices de colores..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {editError && (
              <div className="bg-danger-container border border-danger/25 text-danger text-sm px-3 py-2 rounded-sm">
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
      <Dialog
        open={toggleOpen}
        onOpenChange={(v) => {
          if (!v) setToggleOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              {curso.estado === "activo" ? "Desactivar curso" : "Activar curso"}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              ¿Deseas {curso.estado === "activo" ? "desactivar" : "activar"} el
              curso <strong>{curso.nombre}</strong>?
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
      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          if (!v) setAddOpen(false);
        }}
      >
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
              <div className="bg-danger-container border border-danger/25 text-danger text-sm px-3 py-2 rounded-sm">
                {addError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!selectedId || addSubmitting}>
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
        onOpenChange={(v) => {
          if (!v) setRemoveTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              Quitar del curso
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              ¿Deseas desinscribir a <strong>{removeTarget?.nombre}</strong> de
              este curso?
            </DialogDescription>
          </DialogHeader>

          {removeError && (
            <div className="bg-danger-container border border-danger/25 text-danger text-sm px-3 py-2 rounded-sm">
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

      {/* ── Dialog: Temario crear / editar ── */}
      <Dialog
        open={temarioOpen}
        onOpenChange={(v) => {
          if (!v) setTemarioOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              {temarioEdit ? "Editar tema" : "Agregar tema"}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              {temarioEdit
                ? "Modifica los datos del tema."
                : "Agrega un nuevo tema al temario del curso."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Título *
              </label>
              <Input
                placeholder="Ej: Introducción al curso"
                value={temarioForm.titulo}
                onChange={(e) =>
                  setTemarioForm((f) => ({ ...f, titulo: e.target.value }))
                }
                className="font-sans text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Descripción{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Contenido o descripción del tema..."
                value={temarioForm.descripcion}
                onChange={(e) =>
                  setTemarioForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Orden
              </label>
              <Input
                type="number"
                min={0}
                value={temarioForm.orden}
                onChange={(e) =>
                  setTemarioForm((f) => ({
                    ...f,
                    orden: Number(e.target.value),
                  }))
                }
                className="font-sans text-sm w-24"
              />
            </div>
            {temarioError && (
              <div className="bg-danger-container border border-danger/25 text-danger text-sm px-3 py-2 rounded-sm">
                {temarioError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemarioOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTemarioSubmit} disabled={temarioSubmitting}>
              {temarioSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {temarioEdit ? "Guardar cambios" : "Agregar tema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Temario eliminar ── */}
      <Dialog
        open={!!temarioDeleteTarget}
        onOpenChange={(v) => {
          if (!v) setTemarioDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              Eliminar tema
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              ¿Deseas eliminar el tema{" "}
              <strong>{temarioDeleteTarget?.titulo}</strong>? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemarioDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleTemarioDelete}
              disabled={temarioDeleting}
            >
              {temarioDeleting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Sesión crear / editar ── */}
      <Dialog
        open={sesionOpen}
        onOpenChange={(v) => {
          if (!v) setSesionOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              {sesionEdit ? "Editar sesión" : "Agregar sesión"}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              {sesionEdit
                ? "Modifica los datos de la sesión."
                : "Agrega una nueva clase al calendario del curso."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Título *
              </label>
              <Input
                placeholder="Ej: Clase 1 – Introducción"
                value={sesionForm.titulo}
                onChange={(e) =>
                  setSesionForm((f) => ({ ...f, titulo: e.target.value }))
                }
                className="font-sans text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Fecha *
                </label>
                <Input
                  type="date"
                  value={sesionForm.fecha}
                  onChange={(e) =>
                    setSesionForm((f) => ({ ...f, fecha: e.target.value }))
                  }
                  className="font-sans text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Estado
                </label>
                <Select
                  value={sesionForm.estado}
                  onValueChange={(v) =>
                    setSesionForm((f) => ({
                      ...f,
                      estado: v as Sesion["estado"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full font-sans text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Hora inicio{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </label>
                <Input
                  type="time"
                  value={sesionForm.hora_inicio}
                  onChange={(e) =>
                    setSesionForm((f) => ({
                      ...f,
                      hora_inicio: e.target.value,
                    }))
                  }
                  className="font-sans text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs font-medium text-on-surface">
                  Hora fin{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </label>
                <Input
                  type="time"
                  value={sesionForm.hora_fin}
                  onChange={(e) =>
                    setSesionForm((f) => ({ ...f, hora_fin: e.target.value }))
                  }
                  className="font-sans text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-medium text-on-surface">
                Descripción{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Temas a tratar, materiales necesarios..."
                value={sesionForm.descripcion}
                onChange={(e) =>
                  setSesionForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {sesionError && (
              <div className="bg-danger-container border border-danger/25 text-danger text-sm px-3 py-2 rounded-sm">
                {sesionError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSesionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSesionSubmit} disabled={sesionSubmitting}>
              {sesionSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {sesionEdit ? "Guardar cambios" : "Agregar sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Sesión eliminar ── */}
      <Dialog
        open={!!sesionDeleteTarget}
        onOpenChange={(v) => {
          if (!v) setSesionDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif font-semibold text-xl text-on-surface">
              Eliminar sesión
            </DialogTitle>
            <DialogDescription className="font-sans text-sm text-muted-foreground">
              ¿Deseas eliminar la sesión{" "}
              <strong>{sesionDeleteTarget?.titulo}</strong>? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSesionDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleSesionDelete}
              disabled={sesionDeleting}
            >
              {sesionDeleting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
