"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordForm } from "@/lib/schemas";
import logoImaf from "@/public/logo-imaf.webp";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (data: ForgotPasswordForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.API_URL}api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message || "Error al procesar la solicitud.");
        return;
      }
      setSubmitted(true);
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
            Recupera
            <br />
            tu acceso.
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-[18rem]">
            Te enviaremos un enlace seguro a tu correo electrónico para
            restablecer tu contraseña.
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
          {submitted ? (
            /* ── Estado de éxito ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif font-light text-3xl tight-tracking text-on-surface mb-3">
                Correo enviado
              </h2>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-8">
                Si el correo{" "}
                <span className="text-on-surface font-medium">
                  {form.getValues("email")}
                </span>{" "}
                está registrado en nuestra plataforma, recibirás un enlace para
                restablecer tu contraseña.
              </p>
              <p className="font-sans text-xs text-muted-foreground mb-6">
                ¿No lo encontraste? Revisa tu carpeta de spam o correo no
                deseado.
              </p>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full h-11 font-sans font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <div className="mb-10">
                <h2 className="font-serif font-light text-5xl tight-tracking text-on-surface mb-2">
                  Recuperar
                </h2>
                <p className="font-sans text-sm text-muted-foreground">
                  Ingresa tu correo electrónico y te enviaremos un enlace para
                  restablecer tu contraseña
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

                <Button
                  type="submit"
                  className="w-full h-11 mt-1 font-sans font-semibold tracking-wide"
                  disabled={loading}
                >
                  <span className="flex items-center gap-2">
                    {loading ? "Enviando..." : "Enviar enlace de recuperación"}
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
