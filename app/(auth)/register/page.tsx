"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  RotateCcw,
  User,
  Phone,
  Calendar,
  CreditCard,
} from "lucide-react";

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
      const res = await fetch("http://localhost:8000/api/register", {
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
      else if (role === "profesor") router.push("/profesor");
      else router.push("/estudiante");
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden py-10">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.25_0.08_316/0.3)_0%,transparent_70%)] pointer-events-none" />

      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-3 z-10">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_24px_oklch(0.64_0.29_316/0.5)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Crea tu <span className="text-primary">cuenta</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Únete a EduFlow y comienza a aprender
          </p>
        </div>
      </div>

      {/* Card */}
      <Card className="w-full max-w-md border-border/50 shadow-2xl z-10">
        <CardHeader className="pb-2">
          <p className="text-center text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            Registro de Estudiante
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="pl-9 bg-input border-border/50"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="pl-9 bg-input border-border/50"
                />
              </div>
            </div>

            {/* Cédula + Teléfono */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cedula">Cédula</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cedula"
                    name="cedula"
                    type="text"
                    placeholder="0000000000"
                    value={form.cedula}
                    onChange={handleChange}
                    required
                    className="pl-9 bg-input border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="0999999999"
                    value={form.telefono}
                    onChange={handleChange}
                    required
                    maxLength={20}
                    className="pl-9 bg-input border-border/50"
                  />
                </div>
              </div>
            </div>

            {/* Fecha de nacimiento + Género */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={form.fecha_nacimiento}
                    onChange={handleChange}
                    required
                    className="pl-9 bg-input border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genero">Género</Label>
                <Select
                  value={form.genero}
                  onValueChange={(value) =>
                    setForm({ ...form, genero: value })
                  }
                  required
                >
                  <SelectTrigger
                    id="genero"
                    className="bg-input border-border/50"
                  >
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

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="pl-9 pr-10 bg-input border-border/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password_confirmation">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  required
                  className="pl-9 bg-input border-border/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_oklch(0.64_0.29_316/0.4)] hover:shadow-[0_0_28px_oklch(0.64_0.29_316/0.6)] transition-shadow"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Registrarse"}
              {!loading && (
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="mt-8 flex gap-6 text-xs text-muted-foreground z-10">
        <span className="hover:text-foreground cursor-pointer transition-colors">
          Soporte
        </span>
        <span className="hover:text-foreground cursor-pointer transition-colors">
          Privacidad
        </span>
        <span className="hover:text-foreground cursor-pointer transition-colors">
          Términos
        </span>
      </footer>
    </div>
  );
}
