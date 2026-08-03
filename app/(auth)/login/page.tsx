"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { loginSchema, type LoginForm } from "@/lib/schemas";
import logoImaf from "@/public/logo-imaf.webp";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = async (data: LoginForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.API_URL}api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message || "Credenciales incorrectas.");
        return;
      }
      const role = body.user.role;
      document.cookie = `role=${role}; path=/; SameSite=Lax`;
      document.cookie = `token=${body.token}; path=/; SameSite=Lax`;
      if (role === "admin") router.push("/admin");
      else if (role === "profesor") router.push("/instructor");
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
        {/* Logotipo */}
        <div className="flex items-center relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center ambient-shadow shrink-0">
            <Image src={logoImaf} alt="IMAF" width={40} height={40} />
          </div>
        </div>

        {/* Headline editorial */}
        <div className="relative z-10">
          <span className="font-sans text-sm tracking-[0.25em] uppercase text-primary font-semibold mb-5 block">
            Plataforma Educativa
          </span>
          {/* clamp(): con 7.5rem fijos "Aprende" se desbordaba de la columna
              en el propio breakpoint lg (~512px de ancho). */}
          <h1 className="font-serif font-bold text-[clamp(3.5rem,7vw,7.5rem)] leading-[0.9] tight-tracking text-on-surface mb-6">
            Aprende
            <br />
            sin <span className="text-primary">límites.</span>
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-[18rem]">
            Accede a tu contenido, sigue tu progreso y conecta con tus
            instructores desde un solo lugar.
          </p>
        </div>

        {/* Cita al pie */}
        <blockquote className="font-serif text-2xl text-on-surface leading-relaxed relative z-10 max-w-120">
          &ldquo;La educación es el arma más poderosa que puedes usar para
          cambiar el mundo.&rdquo;
        </blockquote>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex flex-col items-center justify-center px-8 py-14 bg-surface relative min-h-screen">
        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-3 mb-14">
          <div className="w-18 h-18 flex items-center justify-center ambient-shadow">
            <Image src={logoImaf} alt="IMAF" width={88} height={88} />
          </div>
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

          {/* role="alert" para que un lector de pantalla anuncie el fallo de
              login. Antes el error aparecía en silencio. */}
          <div role="alert" aria-live="assertive">
            {error && (
              <div className="bg-danger-container text-on-danger-container text-sm px-4 py-3 rounded-sm mb-6 font-sans">
                {error}
              </div>
            )}
          </div>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="space-y-7"
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
              >
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="font-sans text-xs text-danger">
                  {form.formState.errors.email.message}
                </p>
              )}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="font-sans text-xs text-danger">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* El icono no desaparece al cargar: se sustituye por el spinner,
                así el botón no cambia de ancho a mitad del envío. */}
            <Button
              type="submit"
              className="w-full h-11 mt-1 font-sans font-semibold tracking-wide"
              disabled={loading}
            >
              <span className="flex items-center gap-2">
                {loading ? "Ingresando..." : "Ingresar"}
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </span>
            </Button>
          </form>

          {/* No existe endpoint de reseteo, así que la vía de recuperación real
              es el canal de soporte de la institución. Mejor eso que un enlace
              a una ruta inexistente — o que no ofrecer ninguna salida. */}
          <p className="font-sans text-sm text-muted-foreground mt-6 text-center">
            <a
              href="https://wa.me/584121512141?text=Hola%2C%20necesito%20recuperar%20el%20acceso%20a%20mi%20cuenta%20IMAF"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover font-medium transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </p>

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

        {/* Antes eran tres <span> con cursor-pointer que no llevaban a ningún
            sitio ni recibían foco. Ahora es un solo enlace real. */}
        <footer className="absolute bottom-8 text-xs text-muted-foreground">
          <a
            href="https://wa.me/584121512141"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-on-surface transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Soporte por WhatsApp
          </a>
        </footer>
      </div>
    </div>
  );
}
