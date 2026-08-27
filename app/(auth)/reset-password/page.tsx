"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordForm } from "@/lib/schemas";
import logoImaf from "@/public/logo-imaf.webp";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  if (!token || !email) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="font-serif font-light text-3xl tight-tracking text-on-surface mb-3">
          Enlace inválido
        </h2>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-8">
          El enlace de restablecimiento no es válido o está incompleto.
          Solicita un nuevo enlace desde la página de inicio de sesión.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full h-11 font-sans font-semibold">
            Solicitar nuevo enlace
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (data: ResetPasswordForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.API_URL}api/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            token,
            email,
            password: data.password,
            password_confirmation: data.password_confirmation,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        setError(body.message || "Error al restablecer la contraseña.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success ? (
        /* ── Estado de éxito ── */
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif font-light text-3xl tight-tracking text-on-surface mb-3">
            Contraseña actualizada
          </h2>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-8">
            Tu contraseña ha sido restablecida correctamente. Ya puedes
            iniciar sesión con tu nueva contraseña.
          </p>
          <Button
            className="w-full h-11 font-sans font-semibold"
            onClick={() => router.push("/login")}
          >
            Iniciar sesión
          </Button>
        </div>
      ) : (
        /* ── Formulario ── */
        <>
          <div className="mb-10">
            <h2 className="font-serif font-light text-5xl tight-tracking text-on-surface mb-2">
              Nueva contraseña
            </h2>
            <p className="font-sans text-sm text-muted-foreground">
              Ingresa tu nueva contraseña para{" "}
              <span className="text-on-surface font-medium">{email}</span>
            </p>
          </div>

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
                htmlFor="password"
                className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
              >
                Nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

            <div className="space-y-2">
              <Label
                htmlFor="password_confirmation"
                className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
              >
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pr-10"
                  {...form.register("password_confirmation")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={
                    showConfirm
                      ? "Ocultar confirmación"
                      : "Mostrar confirmación"
                  }
                  aria-pressed={showConfirm}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password_confirmation && (
                <p className="font-sans text-xs text-danger">
                  {form.formState.errors.password_confirmation.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-1 font-sans font-semibold tracking-wide"
              disabled={loading}
            >
              <span className="flex items-center gap-2">
                {loading ? "Restableciendo..." : "Restablecer contraseña"}
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              </span>
            </Button>
          </form>

          <p className="font-sans text-sm text-muted-foreground mt-6 text-center">
            <Link
              href="/login"
              className="text-primary hover:text-primary/70 font-medium transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Volver al inicio de sesión
            </Link>
          </p>
        </>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr] bg-surface">
      {/* ── Panel izquierdo: editorial branding ── */}
      <div className="hidden lg:flex flex-col justify-between px-14 py-14 bg-surface-container-low relative overflow-hidden">
        <div className="flex items-center relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center ambient-shadow shrink-0">
            <Image src={logoImaf} alt="IMAF" width={40} height={40} />
          </div>
        </div>

        <div className="relative z-10">
          <span className="font-sans text-sm tracking-[0.25em] uppercase text-primary font-semibold mb-5 block">
            Plataforma Educativa
          </span>
          <h1 className="font-serif font-bold text-[clamp(3.5rem,7vw,7.5rem)] leading-[0.9] tight-tracking text-on-surface mb-6">
            Seguridad
            <br />
            <span className="text-primary">primero.</span>
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-[18rem]">
            Elige una contraseña segura que no hayas utilizado antes en
            esta plataforma.
          </p>
        </div>

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
          <Suspense
            fallback={
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

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
