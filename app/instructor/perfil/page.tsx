"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateLong } from "@/lib/format";
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
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { PERFIL_INSTRUCTOR_KEY } from "@/lib/query-keys";
import { sanitizarDigitos } from "@/lib/validators";
import {
  perfilInstructorSchema,
  type PerfilInstructorForm,
} from "@/lib/schemas";
import { CedulaInput } from "@/components/cedula-input";
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Building2,
  BadgeCheck,
  Briefcase,
  User,
  Pencil,
  Loader2,
  Save,
  X,
  CalendarDays,
  Camera,
} from "lucide-react";
import municipios from "@/data/municipios.json";

/* ── Types ── */

interface Profesor {
  id: number;
  nacionalidad: string | null;
  cedula: string | null;
  telefono: string | null;
  municipio: string | null;
  especialidad: string | null;
  titulo: "licenciatura" | "maestria" | "doctorado" | null;
  departamento: string | null;
  fecha_nacimiento: string | null;
  genero: "masculino" | "femenino" | "otro" | null;
  foto: string | null;
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

/* ── Page ── */

export default function PerfilPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PerfilInstructorForm>({
    resolver: zodResolver(perfilInstructorSchema),
    defaultValues: {
      nacionalidad: "V",
      cedula: "",
      telefono: "",
      municipio: "",
      especialidad: "",
      titulo: undefined,
      departamento: "",
      fecha_nacimiento: "",
      genero: undefined,
    },
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
    // populateForm usa form.reset (referencia estable de react-hook-form);
    // el efecto solo debe correr una vez al montar el perfil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const populateForm = (p: Profesor) => {
    form.reset({
      nacionalidad:
        (p.nacionalidad as PerfilInstructorForm["nacionalidad"]) ?? "V",
      cedula: p.cedula ?? "",
      telefono: p.telefono ?? "",
      municipio: p.municipio ?? "",
      especialidad: p.especialidad ?? "",
      titulo: (p.titulo as PerfilInstructorForm["titulo"]) ?? undefined,
      departamento: p.departamento ?? "",
      fecha_nacimiento: toDateInput(p.fecha_nacimiento),
      genero: (p.genero as PerfilInstructorForm["genero"]) ?? undefined,
    });
  };

  const handleCancel = () => {
    if (me) populateForm(me.profesor);
    setEditing(false);
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2 MB.");
      return;
    }

    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      const res = await fetch(
        `${process.env.API_URL}api/profesor/perfil/foto`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getCookie("token")}`,
            Accept: "application/json",
          },
          body: formData,
        },
      );
      const body = await res.json();
      if (!res.ok) {
        toast.error(body?.message ?? "Error al subir la foto.");
        return;
      }
      setMe((prev) =>
        prev ? { ...prev, profesor: { ...prev.profesor, ...body } } : prev,
      );
      // El avatar de la barra lateral lee el perfil desde react-query; sin
      // esto seguiría mostrando las iniciales hasta recargar la página.
      queryClient.invalidateQueries({ queryKey: PERFIL_INSTRUCTOR_KEY });
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("Error al conectar con el servidor");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSave = async (data: PerfilInstructorForm) => {
    if (!me) return;
    setSaving(true);
    try {
      const body = {
        nacionalidad: data.nacionalidad || null,
        cedula: data.cedula || null,
        telefono: data.telefono || null,
        municipio: data.municipio || null,
        especialidad: data.especialidad || null,
        titulo: data.titulo || null,
        departamento: data.departamento || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        genero: data.genero || null,
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
        <p className="font-sans text-sm text-danger">{error}</p>
      </div>
    );
  }

  const p = me.profesor;

  return (
    <div className="relative min-h-full bg-surface">
      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        <PageHeader icon={User} eyebrow="Mi perfil" title="Mi Perfil" />

        {/* Avatar + identidad */}
        <div className="bg-surface-container-low rounded-sm ambient-shadow p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                {p.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto}
                    alt={me.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-sans text-xl font-bold text-primary">
                    {getInitials(me.name)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                aria-label="Cambiar foto de perfil"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white dark:text-[#1a1817] flex items-center justify-center ring-2 ring-surface-container-low shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {uploadingFoto ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFotoChange}
              />
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
                <Badge
                  variant={
                    p.titulo as "licenciatura" | "maestria" | "doctorado"
                  }
                  className="mt-2 gap-1"
                >
                  <BadgeCheck className="w-3 h-3" />
                  {tituloLabel[p.titulo]}
                </Badge>
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
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-6 md:p-7">
            {/* Información personal */}
            <div className="flex items-center gap-2 mb-5">
              <User className="w-3.5 h-3.5 text-primary/80" />
              <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                Información personal
              </h3>
            </div>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <CedulaInput
                  nacionalidad={form.watch("nacionalidad") ?? "V"}
                  onNacionalidadChange={(v) =>
                    form.setValue("nacionalidad", v as "V" | "E", {
                      shouldValidate: true,
                    })
                  }
                  cedula={form.watch("cedula") ?? ""}
                  onCedulaChange={(v) =>
                    form.setValue("cedula", v, { shouldValidate: true })
                  }
                  error={
                    form.formState.errors.cedula?.message
                      ? String(form.formState.errors.cedula.message)
                      : undefined
                  }
                  id="cedula"
                />
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={20}
                    placeholder="Ej: 04120000000"
                    {...form.register("telefono", {
                      onChange: (e) =>
                        form.setValue(
                          "telefono",
                          sanitizarDigitos(e.target.value),
                        ),
                    })}
                  />
                  {form.formState.errors.telefono && (
                    <p className="text-xs text-danger">
                      {form.formState.errors.telefono.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="municipio">Municipio</Label>
                  <Select
                    value={form.watch("municipio") || undefined}
                    onValueChange={(value) =>
                      form.setValue("municipio", value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="municipio" className="w-full">
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
                    <p className="text-xs text-danger">
                      {form.formState.errors.municipio.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="genero">Género</Label>
                  <Select
                    value={form.watch("genero") || undefined}
                    onValueChange={(v) =>
                      form.setValue(
                        "genero",
                        v as PerfilInstructorForm["genero"],
                        { shouldValidate: true },
                      )
                    }
                  >
                    <SelectTrigger id="genero">
                      <SelectValue placeholder="No especificado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  {...form.register("fecha_nacimiento")}
                />
              </div>
            </div>

            {/* Información profesional */}
            <div className="border-t border-outline-variant my-6" />
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-3.5 h-3.5 text-primary/80" />
              <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                Información profesional
              </h3>
            </div>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="titulo">Título académico</Label>
                  <Select
                    value={form.watch("titulo") || undefined}
                    onValueChange={(v) =>
                      form.setValue(
                        "titulo",
                        v as PerfilInstructorForm["titulo"],
                        { shouldValidate: true },
                      )
                    }
                  >
                    <SelectTrigger id="titulo">
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
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    placeholder="Ej: Artes Visuales"
                    {...form.register("departamento")}
                  />
                  {form.formState.errors.departamento && (
                    <p className="text-xs text-danger">
                      {form.formState.errors.departamento.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input
                  id="especialidad"
                  placeholder="Ej: Fotografía Digital"
                  {...form.register("especialidad")}
                />
                {form.formState.errors.especialidad && (
                  <p className="text-xs text-danger">
                    {form.formState.errors.especialidad.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 mt-6">
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
                onClick={() => form.handleSubmit(handleSave)()}
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
        ) : (
          /* ── View mode ── */
          <div className="bg-surface-container-low rounded-sm ambient-shadow p-6 md:p-7">
            {/* Información personal */}
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
                  <CalendarDays className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Fecha de nacimiento"
                value={formatDateLong(p.fecha_nacimiento)}
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

            {/* Información profesional */}
            <div className="border-t border-outline-variant my-6" />
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-3.5 h-3.5 text-primary/80" />
              <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                Información profesional
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <InfoRow
                icon={
                  <GraduationCap className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Título"
                value={p.titulo ? tituloLabel[p.titulo] : null}
              />
              <InfoRow
                icon={
                  <BadgeCheck className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Especialidad"
                value={p.especialidad}
              />
              <InfoRow
                icon={
                  <Building2 className="w-3.5 h-3.5 text-on-primary-container" />
                }
                label="Departamento"
                value={p.departamento}
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
        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-1">
          {label}
        </p>
        <p className="font-sans text-sm text-on-surface font-medium">
          {value && value !== "—" ? (
            value
          ) : (
            <span className="text-muted-foreground italic font-normal">
              Sin especificar
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
