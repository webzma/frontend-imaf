"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

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
      const res = await fetch("http://localhost:8000/api/login", {
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
      // Cookie readable by middleware (Edge runtime can't access localStorage)
      document.cookie = `role=${role}; path=/; SameSite=Lax`;

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
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
            Bienvenido a <span className="text-primary">EduFlow</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Inicia sesión para continuar aprendiendo
          </p>
        </div>
      </div>

      {/* Card */}
      <Card className="w-full max-w-md border-border/50 shadow-2xl z-10">
        <CardHeader className="pb-2">
          <p className="text-center text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            Iniciar sesión
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_oklch(0.64_0.29_316/0.4)] hover:shadow-[0_0_28px_oklch(0.64_0.29_316/0.6)] transition-shadow"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Regístrate
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
