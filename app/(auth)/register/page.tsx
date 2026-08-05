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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import {
  sanitizarDigitos,
  sanitizarLetras,
  sanitizarTexto,
} from "@/lib/validators";
import { registroSchema, type RegistroForm } from "@/lib/schemas";
import logoImaf from "@/public/logo-imaf.webp";
import municipios from "@/data/municipios.json";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      email: "",
      cedula: "",
      telefono: "",
      fecha_nacimiento: "",
      genero: "",
      municipio: "",
      direccion: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: RegistroForm) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.API_URL}api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...data,
          // El backend guarda los 4 campos; vacío se envía como null.
          segundo_nombre: data.segundo_nombre || null,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        const messages = body.errors
          ? Object.values(body.errors).flat().join(" ")
          : body.message;
        setError(messages || "Error al registrar.");
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

  const fieldLabel = (text: string) => (
    <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
      {text}
    </span>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Banda superior editorial ── */}
      <div className="bg-surface-container-low px-8 py-6 relative overflow-hidden">
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

        <div role="alert" aria-live="assertive">
          {error && (
            <div className="bg-danger-container text-on-danger-container text-sm px-4 py-3 rounded-sm mb-8 font-sans">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          {/* Fila 1: nombres */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primer_nombre">
                {fieldLabel("Primer nombre")}
              </Label>
              <Input
                id="primer_nombre"
                autoComplete="given-name"
                placeholder="Juan"
                {...form.register("primer_nombre", {
                  onChange: (e) =>
                    form.setValue(
                      "primer_nombre",
                      sanitizarLetras(e.target.value),
                    ),
                })}
              />
              {form.formState.errors.primer_nombre && (
                <p className="text-sm text-danger">
                  {form.formState.errors.primer_nombre.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="segundo_nombre">
                {fieldLabel("Segundo nombre (opcional)")}
              </Label>
              <Input
                id="segundo_nombre"
                autoComplete="additional-name"
                placeholder="Pablo"
                {...form.register("segundo_nombre", {
                  onChange: (e) =>
                    form.setValue(
                      "segundo_nombre",
                      sanitizarLetras(e.target.value),
                    ),
                })}
              />
              {form.formState.errors.segundo_nombre && (
                <p className="text-sm text-danger">
                  {form.formState.errors.segundo_nombre.message}
                </p>
              )}
            </div>
          </div>

          {/* Fila 2: apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primer_apellido">
                {fieldLabel("Primer apellido")}
              </Label>
              <Input
                id="primer_apellido"
                autoComplete="family-name"
                placeholder="Pérez"
                {...form.register("primer_apellido", {
                  onChange: (e) =>
                    form.setValue(
                      "primer_apellido",
                      sanitizarLetras(e.target.value),
                    ),
                })}
              />
              {form.formState.errors.primer_apellido && (
                <p className="text-sm text-danger">
                  {form.formState.errors.primer_apellido.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="segundo_apellido">
                {fieldLabel("Segundo apellido")}
              </Label>
              <Input
                id="segundo_apellido"
                autoComplete="family-name"
                placeholder="Gómez"
                {...form.register("segundo_apellido", {
                  onChange: (e) =>
                    form.setValue(
                      "segundo_apellido",
                      sanitizarLetras(e.target.value),
                    ),
                })}
              />
              {form.formState.errors.segundo_apellido && (
                <p className="text-sm text-danger">
                  {form.formState.errors.segundo_apellido.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{fieldLabel("Correo electrónico")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-danger">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">{fieldLabel("Cédula")}</Label>
              <Input
                id="cedula"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="00000000"
                maxLength={8}
                {...form.register("cedula", {
                  onChange: (e) =>
                    form.setValue("cedula", sanitizarDigitos(e.target.value)),
                })}
              />
              {form.formState.errors.cedula && (
                <p className="text-sm text-danger">
                  {form.formState.errors.cedula.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">{fieldLabel("Teléfono")}</Label>
              <Input
                id="telefono"
                autoComplete="tel"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0999999999"
                maxLength={20}
                {...form.register("telefono", {
                  onChange: (e) =>
                    form.setValue("telefono", sanitizarDigitos(e.target.value)),
                })}
              />
              {form.formState.errors.telefono && (
                <p className="text-sm text-danger">
                  {form.formState.errors.telefono.message}
                </p>
              )}
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
                type="date"
                {...form.register("fecha_nacimiento")}
              />
              {form.formState.errors.fecha_nacimiento && (
                <p className="text-sm text-danger">
                  {form.formState.errors.fecha_nacimiento.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="genero">{fieldLabel("Género")}</Label>
              <Select
                value={form.watch("genero") || undefined}
                onValueChange={(value) =>
                  form.setValue("genero", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="genero">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.genero && (
                <p className="text-sm text-danger">
                  {form.formState.errors.genero.message}
                </p>
              )}
            </div>
          </div>

          {/* Fila 4 - Municipio y dirección */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="municipio">{fieldLabel("Municipio")}</Label>
              <Select
                value={form.watch("municipio") || undefined}
                onValueChange={(value) =>
                  form.setValue("municipio", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="municipio">
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
                <p className="text-sm text-danger">
                  {form.formState.errors.municipio.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">
                {fieldLabel("Dirección de habitación")}
              </Label>
              <Input
                id="direccion"
                autoComplete="street-address"
                placeholder="Av. Principal, casa N° 5"
                maxLength={255}
                {...form.register("direccion", {
                  onChange: (e) =>
                    form.setValue("direccion", sanitizarTexto(e.target.value)),
                })}
              />
              {form.formState.errors.direccion && (
                <p className="text-sm text-danger">
                  {form.formState.errors.direccion.message}
                </p>
              )}
            </div>
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">{fieldLabel("Contraseña")}</Label>
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
                <p className="text-sm text-danger">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">
                {fieldLabel("Confirmar contraseña")}
              </Label>
              <Input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...form.register("password_confirmation")}
              />
              {form.formState.errors.password_confirmation && (
                <p className="text-sm text-danger">
                  {form.formState.errors.password_confirmation.message}
                </p>
              )}
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
                <span className="flex items-center gap-2">Crear cuenta</span>
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
          <div className="ml-auto flex gap-5 text-xs text-muted-foreground">
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
