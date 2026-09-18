"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PERFIL_ADMIN_KEY } from "@/lib/query-keys";

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  role: string;
}

/**
 * Perfil de quien tiene la sesión abierta.
 *
 * La barra lateral del panel escribía "Administrador / admin" y una "A" fija:
 * el mismo encabezado para cualquier persona que entrara. Las barras de
 * estudiante e instructor sí consultaban `/api/me`, así que el panel era el
 * único rol donde la aplicación no sabía quién estaba dentro.
 */
export function useAdminProfile() {
  return useQuery({
    queryKey: PERFIL_ADMIN_KEY,
    queryFn: () => apiFetch<AdminProfile>("api/me"),
    staleTime: 5 * 60 * 1000,
  });
}
