"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";

interface EstudiantePerfil {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  fecha_inscripcion: string;
  estado: string;
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

const estadoStyle: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-800",
  inactivo: "bg-amber-100 text-amber-800",
  graduado: "bg-primary-container text-on-primary-container",
};

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<EstudiantePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    telefono: "",
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
          fecha_nacimiento: data.fecha_nacimiento ?? "",
          genero: data.genero ?? "",
        });
      })
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!perfil) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.API_URL}api/estudiante/perfil`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          telefono: form.telefono || null,
          fecha_nacimiento: form.fecha_nacimiento || null,
          genero: form.genero || null,
        }),
      });
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

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary/70" />
            <span className="font-sans text-[12px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Mi perfil
            </span>
          </div>
          <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface">
            Información personal
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ) : perfil ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                    <span className="font-sans text-2xl font-bold text-on-primary-container">
                      {getInitials(perfil.nombre)}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-serif font-light text-2xl text-on-surface">
                      {perfil.nombre}
                    </h2>
                    <p className="font-sans text-sm text-muted-foreground">
                      {perfil.user.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full font-sans text-xs font-semibold ${
                      estadoStyle[perfil.estado] ??
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {perfil.estado.charAt(0).toUpperCase() +
                      perfil.estado.slice(1)}
                  </span>

                  <div className="w-full pt-4 border-t border-outline-variant/30 space-y-2.5 text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="font-mono text-muted-foreground">
                        {perfil.cedula}
                      </span>
                    </div>
                    {perfil.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="font-sans text-muted-foreground">
                          {perfil.telefono}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="font-sans text-muted-foreground text-xs break-all">
                        {perfil.user.email}
                      </span>
                    </div>
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
              ) : null}
            </div>
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
                      <Label htmlFor="fecha_nacimiento">
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
                    <Label>Género</Label>
                    <select
                      value={form.genero}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, genero: e.target.value }))
                      }
                      className="h-10 rounded-sm border-0 border-b border-b-outline-variant bg-surface-variant px-3 font-sans text-sm text-on-surface outline-none focus:border-b-primary"
                    >
                      <option value="">Sin especificar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
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

            {/* Datos de inscripción */}
            {!loading && perfil && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Datos de inscripción
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="font-sans text-xs text-muted-foreground mb-1">
                      Fecha de inscripción
                    </p>
                    <p className="font-sans text-sm text-on-surface font-medium">
                      {new Date(perfil.fecha_inscripcion).toLocaleDateString(
                        "es-VE",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  {perfil.fecha_nacimiento && (
                    <div>
                      <p className="font-sans text-xs text-muted-foreground mb-1">
                        Fecha de nacimiento
                      </p>
                      <p className="font-sans text-sm text-on-surface font-medium">
                        {new Date(perfil.fecha_nacimiento).toLocaleDateString(
                          "es-VE",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  )}
                  {perfil.genero && (
                    <div>
                      <p className="font-sans text-xs text-muted-foreground mb-1">
                        Género
                      </p>
                      <p className="font-sans text-sm text-on-surface font-medium capitalize">
                        {perfil.genero}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="font-sans text-xs text-muted-foreground mb-1">
                      Cédula
                    </p>
                    <p className="font-mono text-sm text-on-surface font-medium">
                      {perfil.cedula}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Credenciales */}
            {!loading && perfil && (
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Mail className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Credenciales de acceso
                  </h3>
                </div>
                <div className="grid gap-3">
                  <div>
                    <p className="font-sans text-xs text-muted-foreground mb-1">
                      Nombre de usuario
                    </p>
                    <p className="font-sans text-sm text-on-surface">
                      {perfil.user.name}
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-xs text-muted-foreground mb-1">
                      Correo electrónico
                    </p>
                    <p className="font-sans text-sm text-on-surface">
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
