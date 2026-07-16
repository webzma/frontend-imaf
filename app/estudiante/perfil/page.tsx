"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect, useRef } from "react";
import { formatDateLong } from "@/lib/format";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Hash,
  Pencil,
  Loader2,
  Check,
  X,
  CalendarDays,
  MapPin,
  Sparkles,
  IdCard,
  Camera,
} from "lucide-react";
import municipios from "@/data/municipios.json";
import { sanitizarDigitos } from "@/lib/validators";

interface EstudiantePerfil {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  municipio: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  fecha_inscripcion: string;
  estado: string;
  foto: string | null;
  user: { id: number; name: string; email: string };
}

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

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<EstudiantePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    telefono: "",
    municipio: "",
    fecha_nacimiento: "",
    genero: "",
  });

  useEffect(() => {
    fetch(`${process.env.API_URL}api/estudiante/perfil`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setPerfil(data);
        setForm({
          telefono: data.telefono ?? "",
          municipio: data.municipio ?? "",
          fecha_nacimiento: toDateInput(data.fecha_nacimiento),
          genero: data.genero ?? "",
        });
      })
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

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
        `${process.env.API_URL}api/estudiante/perfil/foto`,
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
      setPerfil(body);
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("Error al conectar con el servidor");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSave = async () => {
    if (!perfil) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.API_URL}api/estudiante/perfil`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          telefono: form.telefono || null,
          municipio: form.municipio || null,
          fecha_nacimiento: form.fecha_nacimiento || null,
          genero: form.genero || null,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        const msg =
          body?.message ??
          (body?.errors
            ? Object.values(body.errors as Record<string, string[]>)
                .flat()
                .join(". ")
            : "Error al guardar los cambios.");
        toast.error(msg);
        return;
      }

      setPerfil(body);
      setForm({
        telefono: body.telefono ?? "",
        municipio: body.municipio ?? "",
        fecha_nacimiento: toDateInput(body.fecha_nacimiento),
        genero: body.genero ?? "",
      });
      setEditing(false);
      toast.success("Perfil actualizado correctamente");
    } catch {
      toast.error("Error al conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[520px] h-[320px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[380px] h-[260px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 md:py-14 max-w-5xl mx-auto">
        <PageHeader
          icon={User}
          eyebrow="Mi perfil"
          title="Información personal"
          subtitle="Gestiona tus datos personales y de contacto. Mantén la información al día para una mejor experiencia."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile card */}
          <div className="lg:col-span-1">
            <div className="relative bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow">
              <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

              <div className="relative p-6">
                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ) : perfil ? (
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full gradient-primary opacity-30 blur-md" />
                      <div className="relative w-20 h-20 rounded-full bg-primary-container flex items-center justify-center ring-2 ring-primary/15 overflow-hidden">
                        {perfil.foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={perfil.foto}
                            alt={perfil.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-sans text-2xl font-bold text-on-primary-container">
                            {getInitials(perfil.nombre)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFoto}
                        aria-label="Cambiar foto de perfil"
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white dark:text-[#1a1817] flex items-center justify-center ring-2 ring-surface-container-lowest shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
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
                    <div>
                      <h2 className="font-serif font-light text-2xl tight-tracking text-on-surface leading-tight">
                        {perfil.nombre}
                      </h2>
                      <p className="font-sans text-xs text-muted-foreground break-all mt-1">
                        {perfil.user.email}
                      </p>
                    </div>
                    <Badge
                      variant={
                        perfil.estado as "activo" | "inactivo" | "graduado"
                      }
                      className="gap-1.5 px-3 py-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {perfil.estado.charAt(0).toUpperCase() +
                        perfil.estado.slice(1)}
                    </Badge>

                    <div className="w-full pt-5 mt-2 border-t border-outline-variant/30 space-y-3 text-left">
                      <div className="flex items-center gap-2.5">
                        <Hash className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold">
                            Cédula
                          </p>
                          <p className="font-mono text-sm text-on-surface tabular-nums">
                            {perfil.cedula}
                          </p>
                        </div>
                      </div>
                      {perfil.telefono && (
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold">
                              Teléfono
                            </p>
                            <p className="font-sans text-sm text-on-surface">
                              {perfil.telefono}
                            </p>
                          </div>
                        </div>
                      )}
                      {perfil.municipio && (
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold">
                              Municipio
                            </p>
                            <p className="font-sans text-sm text-on-surface">
                              {perfil.municipio}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant={editing ? "outline" : "default"}
                      size="sm"
                      className="w-full gap-2 mt-3"
                      onClick={() => setEditing(!editing)}
                    >
                      {editing ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          Cancelar edición
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3.5 h-3.5" />
                          Editar perfil
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Edit form */}
            {editing && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <Pencil className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Editar información
                  </h3>
                </div>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="telefono"
                        className="font-sans text-[11px] tracking-[0.12em] uppercase text-on-surface/70 font-semibold"
                      >
                        Teléfono
                      </Label>
                      <Input
                        id="telefono"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={20}
                        placeholder="04121234567"
                        value={form.telefono}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            telefono: sanitizarDigitos(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="fecha_nacimiento"
                        className="font-sans text-[11px] tracking-[0.12em] uppercase text-on-surface/70 font-semibold"
                      >
                        Fecha de nacimiento
                      </Label>
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
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-sans text-[11px] tracking-[0.12em] uppercase text-on-surface/70 font-semibold">
                      Género
                    </Label>
                    <Select
                      value={form.genero || undefined}
                      onValueChange={(value) =>
                        setForm((f) => ({ ...f, genero: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin especificar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="municipio"
                      className="font-sans text-[11px] tracking-[0.12em] uppercase text-on-surface/70 font-semibold"
                    >
                      Municipio
                    </Label>
                    <Select
                      value={form.municipio || undefined}
                      onValueChange={(value) =>
                        setForm((f) => ({ ...f, municipio: value }))
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
                  <div className="flex gap-2 justify-end pt-2">
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
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Datos de inscripción */}
            {!loading && perfil && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Datos de inscripción
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarDays className="w-3.5 h-3.5 text-on-primary-container" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold mb-1">
                        Fecha de inscripción
                      </p>
                      <p className="font-sans text-sm text-on-surface font-medium">
                        {formatDateLong(perfil.fecha_inscripcion)}
                      </p>
                    </div>
                  </div>
                  {perfil.fecha_nacimiento && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-on-primary-container" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold mb-1">
                          Fecha de nacimiento
                        </p>
                        <p className="font-sans text-sm text-on-surface font-medium">
                          {formatDateLong(perfil.fecha_nacimiento)}
                        </p>
                      </div>
                    </div>
                  )}
                  {perfil.genero && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-on-primary-container" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold mb-1">
                          Género
                        </p>
                        <p className="font-sans text-sm text-on-surface font-medium capitalize">
                          {perfil.genero}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center shrink-0 mt-0.5">
                      <IdCard className="w-3.5 h-3.5 text-on-primary-container" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold mb-1">
                        Cédula
                      </p>
                      <p className="font-mono text-sm text-on-surface font-medium tabular-nums">
                        {perfil.cedula}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credenciales */}
            {!loading && perfil && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <Mail className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Credenciales de acceso
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold mb-1.5">
                      Nombre de usuario
                    </p>
                    <p className="font-sans text-sm text-on-surface font-medium">
                      {perfil.user.name}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold mb-1.5">
                      Correo electrónico
                    </p>
                    <p className="font-sans text-sm text-on-surface font-medium break-all">
                      {perfil.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
