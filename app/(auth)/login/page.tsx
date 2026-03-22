"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
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
      const res = await fetch(`${process.env.API_URL}api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Credenciales incorrectas.");
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
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr] bg-surface">
      {/* ── Panel izquierdo: editorial branding ── */}
      <div className="hidden lg:flex flex-col justify-between px-14 py-14 bg-surface-container-low relative overflow-hidden">
        {/* Blobs decorativos */}
        <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-[320px] h-[320px] rounded-full bg-secondary-container/50 blur-[70px] pointer-events-none" />

        {/* Logotipo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center ambient-shadow shrink-0">
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
          <span className="font-sans font-semibold text-on-surface tracking-tight text-lg">
            IMAF
          </span>
        </div>

        {/* Headline editorial */}
        <div className="relative z-10">
          <span className="font-sans text-xl tracking-[0.25em] uppercase text-primary/60 font-medium mb-5 block">
            Plataforma Educativa
          </span>
          <h1 className="font-serif font-bold text-[7.5rem] leading-[0.9] tight-tracking text-on-surface mb-6">
            Aprende
            <br />
            sin <em className="text-primary">límites.</em>
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-[18rem]">
            Accede a tu contenido, sigue tu progreso y conecta con tus
            profesores desde un solo lugar.
          </p>
        </div>

        {/* Cita al pie */}
        <p className="font-serif italic text-2xl text-white leading-relaxed relative z-10 max-w-120">
          &ldquo;La educación es el arma más poderosa que puedes usar para
          cambiar el mundo.&rdquo;
        </p>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex flex-col items-center justify-center px-8 py-14 bg-surface relative min-h-screen">
        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center ambient-shadow">
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
          <span className="font-sans font-semibold text-on-surface tracking-tight text-lg">
            IMAF
          </span>
        </div>

        <div className="w-full max-w-sm">
          {/* Encabezado del form */}
          <div className="mb-10">
            <h2 className="font-serif font-light text-5xl tight-tracking text-on-surface mb-2">
              Bienvenido
            </h2>
            <p className="font-sans text-sm text-muted-foreground">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-sm mb-6 font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
              >
                Correo electrónico
              </Label>
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

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
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

            <Button
              type="submit"
              className="w-full h-11 mt-1 font-sans font-semibold tracking-wide"
              disabled={loading}
            >
              {loading ? (
                "Ingresando..."
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="font-sans text-sm text-muted-foreground mt-10 text-center">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary/70 font-medium transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </div>

        <footer className="absolute bottom-8 flex gap-6 text-xs text-muted-foreground/50">
          <span className="hover:text-muted-foreground cursor-pointer transition-colors">
            Soporte
          </span>
          <span className="hover:text-muted-foreground cursor-pointer transition-colors">
            Privacidad
          </span>
          <span className="hover:text-muted-foreground cursor-pointer transition-colors">
            Términos
          </span>
        </footer>
      </div>
    </div>
  );
}
