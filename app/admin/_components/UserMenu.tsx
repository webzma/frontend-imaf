"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, Moon, Sun, UserRound } from "lucide-react";

import { Avatar } from "@/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { apiFetch } from "@/lib/api-client";
import { clearSession } from "@/lib/session";

/**
 * Cuenta, tema y cierre de sesión en la cabecera.
 *
 * Estaban al fondo de la barra lateral, que en móvil hay que abrir a propósito
 * y en escritorio se colapsa a iconos. Son acciones de la persona, no de la
 * sección, así que viven junto a su nombre.
 */
export function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { dark, toggle: toggleDark } = useTheme();
  const { data: perfil } = useAdminProfile();

  const nombre = perfil?.name ?? "Administrador";
  const email = perfil?.email ?? "";

  const cerrarSesion = async () => {
    try {
      await apiFetch("api/logout", { method: "POST", skipAuthRedirect: true });
    } catch {
      // Un fallo al revocar el token en el servidor no debe dejar la sesión
      // abierta en este equipo.
    } finally {
      clearSession();
      queryClient.clear();
      router.push("/login");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar name={nombre} size={7} />
        <span className="hidden max-w-32 truncate font-sans text-xs font-medium text-on-surface sm:block">
          {nombre}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-3 text-muted-foreground"
        />
        <span className="sr-only">Abrir menú de cuenta</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Sesión</DropdownMenuLabel>
        <div className="px-2.5 pb-2">
          <p className="truncate font-sans text-sm font-semibold text-on-surface">
            {nombre}
          </p>
          {email && (
            <p className="truncate font-sans text-xs text-muted-foreground">
              {email}
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/admin/perfil">
            <UserRound />
            Mi cuenta
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(e) => {
            // Cambiar el tema no debe cerrar el menú: se ve el efecto al vuelo.
            e.preventDefault();
            toggleDark();
          }}
        >
          {dark ? <Sun /> : <Moon />}
          {dark ? "Modo claro" : "Modo oscuro"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={cerrarSesion}>
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
