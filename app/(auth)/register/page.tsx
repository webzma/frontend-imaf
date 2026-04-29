"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { Eye, EyeOff } from "lucide-react";
import logoImaf from "@/public/logo-imaf.webp";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    cedula: "",
    telefono: "",
    fecha_nacimiento: "",
    genero: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.API_URL}api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        const messages = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : data.message;
        setError(messages || "Error al registrar.");
        return;
      }

      const role = data.user.role;
      document.cookie = `role=${role}; path=/; SameSite=Lax`;
      document.cookie = `token=${data.token}; path=/; SameSite=Lax`;

      if (role === "admin") router.push("/admin");
      else if (role === "profesor") router.push("/instructor");
      else router.push("/estudiante");
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fieldLabel = (text: string) => (
    <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
      {text}
    </span>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Banda superior editorial ── */}
      <div className="bg-surface-container-low px-8 py-6 relative overflow-hidden">
        <div className="absolute -top-10 right-0 w-[360px] h-[180px] rounded-full bg-primary/8 blur-[60px] pointer-events-none" />
        <div className="max-w-2xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center ambient-shadow shrink-0">
              <Image src={logoImaf} alt="IMAF" width={32} height={32} />
            </div>
          </div>
          <p className="font-sans text-xs text-muted-foreground hidden sm:block">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:text-primary/70 transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="px-8 py-10 max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="mb-10">
          <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-primary/60 font-medium mb-3 block">
            Registro de Estudiante
          </span>
          <h1 className="font-serif font-light text-5xl tight-tracking text-on-surface mb-2">
            Crea tu <em className="text-primary">cuenta</em>
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Únete a IMAF y comienza a aprender hoy mismo
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-sm mb-8 font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1 */}
          <div className="space-y-2">
            <Label htmlFor="name">{fieldLabel("Nombre completo")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Juan Pérez"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{fieldLabel("Correo electrónico")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">{fieldLabel("Cédula")}</Label>
              <Input
                id="cedula"
                name="cedula"
                type="text"
                placeholder="0000000000"
                value={form.cedula}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">{fieldLabel("Teléfono")}</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="0999999999"
                value={form.telefono}
                onChange={handleChange}
                required
                maxLength={20}
              />
            </div>
          </div>

          {/* Fila 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">
                {fieldLabel("Fecha de nacimiento")}
              </Label>
              <Input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genero">{fieldLabel("Género")}</Label>
              <Select
                value={form.genero}
                onValueChange={(value) => setForm({ ...form, genero: value })}
                required
              >
                <SelectTrigger id="genero">
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

          {/* Contraseñas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">{fieldLabel("Contraseña")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-on-surface transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">
                {fieldLabel("Confirmar contraseña")}
              </Label>
              <Input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                placeholder="••••••••"
                value={form.password_confirmation}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 font-sans font-semibold tracking-wide"
              disabled={loading}
            >
              {loading ? (
                "Registrando..."
              ) : (
                <span className="flex items-center gap-2">
                  Crear cuenta
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-10 pt-8 flex items-center justify-between">
          <p className="font-sans text-sm text-muted-foreground sm:hidden">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:text-primary/70 transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>
          <div className="ml-auto flex gap-5 text-xs text-muted-foreground/50">
            <span className="hover:text-muted-foreground cursor-pointer transition-colors">
              Soporte
            </span>
            <span className="hover:text-muted-foreground cursor-pointer transition-colors">
              Privacidad
            </span>
            <span className="hover:text-muted-foreground cursor-pointer transition-colors">
              Términos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
