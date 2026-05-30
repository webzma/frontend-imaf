"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Building2,
  BadgeCheck,
  User,
  Pencil,
  Loader2,
  Save,
  X,
  CalendarDays,
} from "lucide-react";

/* ── Types ── */

interface Profesor {
  id: number;
  cedula: string | null;
  telefono: string | null;
  municipio: string | null;
  especialidad: string | null;
  titulo: "licenciatura" | "maestria" | "doctorado" | null;
  departamento: string | null;
  fecha_nacimiento: string | null;
  genero: "masculino" | "femenino" | "otro" | null;
}

interface MeResponse {
  id: number;
  name: string;
  email: string;
  profesor: Profesor;
}

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function getAuthHeaders(contentType = true) {
  const h: Record<string, string> = {
    Authorization: `Bearer ${getCookie("token")}`,
    Accept: "application/json",
  };
  if (contentType) h["Content-Type"] = "application/json";
  return h;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const tituloLabel: Record<string, string> = {
  licenciatura: "Licenciatura",
  maestria: "Maestría",
  doctorado: "Doctorado",
};

const tituloStyle: Record<string, string> = {
  licenciatura: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400",
  maestria:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  doctorado: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const ymd = value.slice(0, 10);
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ── Page ── */

export default function PerfilPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    cedula: "",
    telefono: "",
    municipio: "",
    especialidad: "",
    titulo: "",
    departamento: "",
    fecha_nacimiento: "",
    genero: "",
  });

  useEffect(() => {
    fetch(`${process.env.API_URL}api/me`, {
      headers: getAuthHeaders(false),
    })
      .then((r) => r.json())
      .then((data: MeResponse) => {
        setMe(data);
        populateForm(data.profesor);
      })
      .catch(() => setError("Error al cargar el perfil."))
      .finally(() => setLoading(false));
  }, []);

  const populateForm = (p: Profesor) => {
    setForm({
      cedula: p.cedula ?? "",
      telefono: p.telefono ?? "",
      municipio: p.municipio ?? "",
      especialidad: p.especialidad ?? "",
      titulo: p.titulo ?? "",
      departamento: p.departamento ?? "",
      fecha_nacimiento: toDateInput(p.fecha_nacimiento),
      genero: p.genero ?? "",
    });
  };

  const handleCancel = () => {
    if (me) populateForm(me.profesor);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!me) return;
    setSaving(true);
    try {
      const body = {
        cedula: form.cedula || null,
        telefono: form.telefono || null,
        municipio: form.municipio || null,
        especialidad: form.especialidad || null,
        titulo: form.titulo || null,
        departamento: form.departamento || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        genero: form.genero || null,
      };
      const res = await fetch(
        `${process.env.API_URL}api/profesor/perfil/${me.profesor.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        const msgs = err.errors
          ? Object.values(err.errors).flat().join(", ")
          : err.message || "Error al guardar.";
        toast.error(msgs as string);
        return;
      }
      const updated = await res.json();
      setMe((prev) =>
        prev ? { ...prev, profesor: { ...prev.profesor, ...updated } } : prev,
      );
      setEditing(false);
      toast.success("Perfil actualizado correctamente.");
    } catch {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground font-sans text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando perfil...
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="px-10 py-10">
        <p className="font-sans text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const p = me.profesor;

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[520px] h-[320px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[380px] h-[260px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Mi Perfil
            </span>
          </div>
          <h1 className="font-serif font-light text-4xl tight-tracking text-on-surface">
            Mi Perfil
          </h1>
        </div>

        {/* Avatar + identidad */}
        <div className="bg-surface-container-low rounded-sm ambient-shadow p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/20 flex items-center justify-center shrink-0">
              <span className="font-sans text-xl font-bold text-primary">
                {getInitials(me.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif font-light text-2xl text-on-surface">
                {me.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-sans text-sm text-muted-foreground">
                  {me.email}
                </span>
              </div>
              {p.titulo && (
                <span
                  className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full font-sans text-xs font-semibold ${tituloStyle[p.titulo]}`}
                >
                  <BadgeCheck className="w-3 h-3" />
                  {tituloLabel[p.titulo]}
                </span>
              )}
            </div>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </Button>
            )}
          </div>
        </div>

        {editing ? (
          /* ── Edit form ── */
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-6">
            <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold mb-5">
              Editar información
            </h3>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input
                    id="cedula"
                    value={form.cedula}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cedula: e.target.value }))
                    }
                    placeholder="Ej: 12345678"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, telefono: e.target.value }))
                    }
                    placeholder="Ej: 0412-0000000"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="municipio">Municipio</Label>
                  <Input
                    id="municipio"
                    value={form.municipio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, municipio: e.target.value }))
                    }
                    placeholder="Ej: Caracas"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={form.departamento}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        departamento: e.target.value,
                      }))
                    }
                    placeholder="Ej: Artes Visuales"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input
                  id="especialidad"
                  value={form.especialidad}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, especialidad: e.target.value }))
                  }
                  placeholder="Ej: Fotografía Digital"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Título académico</Label>
                  <Select
                    value={form.titulo}
                    onValueChange={(v) => setForm((f) => ({ ...f, titulo: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin título" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="licenciatura">Licenciatura</SelectItem>
                      <SelectItem value="maestria">Maestría</SelectItem>
                      <SelectItem value="doctorado">Doctorado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Género</Label>
                  <Select
                    value={form.genero}
                    onValueChange={(v) => setForm((f) => ({ ...f, genero: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No especificado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fecha_nacimiento: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-6 md:p-7">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-3.5 h-3.5 text-primary/80" />
              <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                Información personal
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <InfoRow
                icon={
                  <BadgeCheck className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Cédula"
                value={p.cedula}
              />
              <InfoRow
                icon={
                  <Phone className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Teléfono"
                value={p.telefono}
              />
              <InfoRow
                icon={
                  <MapPin className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Municipio"
                value={p.municipio}
              />
              <InfoRow
                icon={
                  <Building2 className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Departamento"
                value={p.departamento}
              />
              <InfoRow
                icon={
                  <GraduationCap className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Especialidad"
                value={p.especialidad}
              />
              <InfoRow
                icon={
                  <BadgeCheck className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Título"
                value={p.titulo ? tituloLabel[p.titulo] : null}
              />
              <InfoRow
                icon={
                  <CalendarDays className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Fecha de nacimiento"
                value={formatDate(p.fecha_nacimiento)}
              />
              <InfoRow
                icon={
                  <User className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Género"
                value={
                  p.genero
                    ? p.genero.charAt(0).toUpperCase() + p.genero.slice(1)
                    : null
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold mb-1">
          {label}
        </p>
        <p className="font-sans text-sm text-on-surface font-medium">
          {value && value !== "—" ? (
            value
          ) : (
            <span className="text-muted-foreground/50 italic font-normal">
              Sin especificar
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
