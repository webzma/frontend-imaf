"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Mail,
  Phone,
  Hash,
  Star,
  Users,
  Pencil,
  Loader2,
  LogOut,
  Check,
  X,
  GraduationCap,
  BadgeCheck,
  Building2,
} from "lucide-react";

/* ── Types ── */

interface EstudianteEnCurso {
  id: number;
  nombre: string;
  estado: string;
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  creditos: number;
  estado: string;
  estudiantes?: EstudianteEnCurso[];
}

interface ProfesorPerfil {
  id: number;
  cedula: string;
  telefono: string | null;
  especialidad: string | null;
  titulo: string | null;
  departamento: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  user: { id: number; name: string; email: string };
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

const tituloLabel: Record<string, string> = {
  licenciatura: "Licenciatura",
  maestria: "Maestría",
  doctorado: "Doctorado",
};

const tituloStyle: Record<string, string> = {
  licenciatura: "bg-sky-100 text-sky-800",
  maestria: "bg-emerald-100 text-emerald-800",
  doctorado: "bg-primary-container text-on-primary-container",
};

/* ── Page ── */

export default function ProfesorPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<ProfesorPerfil | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [form, setForm] = useState({
    telefono: "",
    especialidad: "",
    departamento: "",
  });

  useEffect(() => {
    const headers = getAuthHeaders();

    fetch(`${process.env.API_URL}api/me`, { headers })
      .then((r) => r.json())
      .then((me) => {
        setUserId(me.id);
        return Promise.all([
          fetch(`${process.env.API_URL}api/admin/profesores/${me.id}`, {
            headers,
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch(`${process.env.API_URL}api/cursos`, { headers })
            .then((r) => r.json())
            .catch(() => []),
        ]);
      })
      .then(([perfilData, cursosData]) => {
        if (perfilData) {
          setPerfil(perfilData);
          setForm({
            telefono: perfilData.telefono ?? "",
            especialidad: perfilData.especialidad ?? "",
            departamento: perfilData.departamento ?? "",
          });
        }
        // Filter courses taught by this professor
        const misCursos = Array.isArray(cursosData)
          ? cursosData.filter(
              (c: Curso & { profesor?: { id: number } }) =>
                c.profesor?.id === userId,
            )
          : [];
        setCursos(misCursos);
      })
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!perfil || !userId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/profesor/perfil/${userId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            telefono: form.telefono || null,
            especialidad: form.especialidad || null,
            departamento: form.departamento || null,
          }),
        },
      );
      if (!res.ok) {
        toast.error("Error al guardar los cambios");
        return;
      }
      const updated = await res.json();
      setPerfil(updated);
      setEditing(false);
      toast.success("Perfil actualizado correctamente");
    } catch {
      toast.error("Error al conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.API_URL}api/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } finally {
      document.cookie = "token=; path=/; max-age=0";
      document.cookie = "role=; path=/; max-age=0";
      router.push("/login");
    }
  };

  const totalEstudiantes = cursos.reduce(
    (s, c) => s + (c.estudiantes?.length ?? 0),
    0,
  );

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-8 py-5 flex items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center ambient-shadow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14M4 19h16M8 7h8M8 11h5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M15 15l2 2 4-4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-sans font-semibold text-on-surface tracking-tight">
            IMAF
          </span>
          <span className="font-sans text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase">
            Profesor
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 font-sans text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </header>

      <div className="relative z-10 px-8 py-10 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Mi perfil
            </span>
          </div>
          <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface">
            Panel del profesor
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ) : perfil ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="font-sans text-2xl font-bold text-on-secondary-container">
                      {getInitials(perfil.user.name)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-serif font-light text-2xl text-on-surface">
                      {perfil.user.name}
                    </h2>
                    <p className="font-sans text-sm text-muted-foreground">
                      {perfil.user.email}
                    </p>
                  </div>
                  {perfil.titulo && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full font-sans text-xs font-semibold ${tituloStyle[perfil.titulo] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {tituloLabel[perfil.titulo] ?? perfil.titulo}
                    </span>
                  )}

                  <div className="w-full pt-4 border-t border-outline-variant/30 space-y-2.5 text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="font-mono text-muted-foreground text-xs">
                        {perfil.cedula}
                      </span>
                    </div>
                    {perfil.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="font-sans text-muted-foreground text-sm">
                          {perfil.telefono}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="font-sans text-muted-foreground text-xs break-all">
                        {perfil.user.email}
                      </span>
                    </div>
                    {perfil.especialidad && (
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="font-sans text-muted-foreground text-sm">
                          {perfil.especialidad}
                        </span>
                      </div>
                    )}
                    {perfil.departamento && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="font-sans text-muted-foreground text-sm">
                          {perfil.departamento}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-2"
                    onClick={() => setEditing(!editing)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar perfil
                  </Button>
                </div>
              ) : (
                <p className="font-sans text-sm text-muted-foreground text-center">
                  No se pudo cargar el perfil.
                </p>
              )}
            </div>

            {/* Mini stats */}
            {!loading && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-4 text-center">
                  <p className="font-sans text-2xl font-semibold text-on-surface">
                    {cursos.length}
                  </p>
                  <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-0.5">
                    Cursos
                  </p>
                </div>
                <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-4 text-center">
                  <p className="font-sans text-2xl font-semibold text-on-surface">
                    {totalEstudiantes}
                  </p>
                  <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-0.5">
                    Alumnos
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit form */}
            {editing && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <h3 className="font-serif font-light text-xl text-on-surface mb-5">
                  Editar información
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        placeholder="0412-1234567"
                        value={form.telefono}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, telefono: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="especialidad">Especialidad</Label>
                      <Input
                        id="especialidad"
                        placeholder="Ej: Matemáticas"
                        value={form.especialidad}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            especialidad: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      placeholder="Ej: Ciencias"
                      value={form.departamento}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, departamento: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(false)}
                      className="gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-1.5"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Courses */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-3.5 h-3.5 text-primary/70" />
                <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                  Mis cursos
                </h3>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-surface-container-lowest rounded-sm ambient-shadow p-5"
                    >
                      <Skeleton className="h-6 w-40 mb-2" />
                      <Skeleton className="h-3 w-24 mb-4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : cursos.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-sm ambient-shadow flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-container/60 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-on-primary-container" />
                  </div>
                  <p className="font-sans text-sm text-muted-foreground">
                    No tienes cursos asignados aún.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cursos.map((curso) => {
                    const activos =
                      curso.estudiantes?.filter((e) => e.estado === "activo")
                        .length ?? 0;
                    const total = curso.estudiantes?.length ?? 0;
                    return (
                      <div
                        key={curso.id}
                        className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden"
                      >
                        <div className="h-1 gradient-primary" />
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-serif font-light text-xl text-on-surface">
                                {curso.nombre}
                              </h4>
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-on-primary-container bg-primary-container px-2 py-0.5 rounded-sm mt-1">
                                <Hash className="w-2.5 h-2.5" />
                                {curso.codigo}
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-semibold ${
                                curso.estado === "activo"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {curso.estado === "activo"
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </div>

                          {curso.descripcion && (
                            <p className="font-sans text-sm text-muted-foreground line-clamp-2 mb-3">
                              {curso.descripcion}
                            </p>
                          )}

                          <div className="flex items-center gap-5 pt-3 border-t border-outline-variant/30">
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                              <Star className="w-3.5 h-3.5" />
                              <span className="font-sans">
                                {curso.creditos} créditos
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                              <Users className="w-3.5 h-3.5" />
                              <span className="font-sans">
                                <span className="font-semibold text-on-surface">
                                  {total}
                                </span>{" "}
                                estudiantes
                                {total > 0 && (
                                  <span className="text-emerald-600 ml-1">
                                    ({activos} activos)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
