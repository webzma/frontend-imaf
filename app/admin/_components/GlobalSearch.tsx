"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CornerDownLeft,
  GraduationCap,
  Loader2,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ADMIN_NAV } from "@/lib/admin-nav";

interface Resultado {
  id: string;
  grupo: string;
  titulo: string;
  detalle?: string;
  href: string;
  icon: LucideIcon;
}

interface ListaApi<T> {
  data?: T[];
}

interface EstudianteHit {
  id: number;
  cedula: string;
  user?: { name?: string; email?: string } | null;
}

interface ProfesorHit {
  id: number;
  cedula: string;
  user?: { name?: string; email?: string } | null;
}

interface CursoHit {
  id: number;
  nombre: string;
  codigo: string;
}

async function buscar(termino: string): Promise<Resultado[]> {
  const params = { search: termino, per_page: 5 };

  // Las tres listas se piden a la vez: en serie, el resultado tardaba el
  // triple en aparecer mientras la persona sigue escribiendo.
  const [estudiantes, profesores, cursos] = await Promise.all([
    apiFetch<ListaApi<EstudianteHit>>("api/admin/estudiantes", {
      params,
    }).catch(() => ({ data: [] })),
    apiFetch<ListaApi<ProfesorHit>>("api/admin/profesores", { params }).catch(
      () => ({ data: [] }),
    ),
    apiFetch<ListaApi<CursoHit>>("api/admin/cursos", { params }).catch(() => ({
      data: [],
    })),
  ]);

  return [
    ...(estudiantes.data ?? []).map((e) => ({
      id: `estudiante-${e.id}`,
      grupo: "Estudiantes",
      titulo: e.user?.name ?? "Sin nombre",
      detalle: `C.I. ${e.cedula}`,
      href: `/admin/estudiantes?q=${encodeURIComponent(e.cedula)}`,
      icon: Users,
    })),
    ...(profesores.data ?? []).map((p) => ({
      id: `instructor-${p.id}`,
      grupo: "Instructores",
      titulo: p.user?.name ?? "Sin nombre",
      detalle: `C.I. ${p.cedula}`,
      href: `/admin/instructores?q=${encodeURIComponent(p.cedula)}`,
      icon: GraduationCap,
    })),
    ...(cursos.data ?? []).map((c) => ({
      id: `curso-${c.id}`,
      grupo: "Cursos",
      titulo: c.nombre,
      detalle: c.codigo,
      href: `/admin/cursos/${c.id}`,
      icon: BookOpen,
    })),
  ];
}

const SECCIONES: Resultado[] = ADMIN_NAV.flatMap((grupo) =>
  grupo.items.map((item) => ({
    id: `seccion-${item.href}`,
    grupo: "Ir a",
    titulo: item.label,
    href: item.href,
    icon: item.icon,
  })),
);

/**
 * Búsqueda global del panel.
 *
 * Para encontrar una cédula había que adivinar primero en qué sección estaba
 * la persona y navegar hasta su lista. Aquí se busca desde cualquier pantalla
 * y contra la base completa, no contra lo que hubiera cargado en memoria.
 */
export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [termino, setTermino] = useState("");
  const [activo, setActivo] = useState(0);
  const listaRef = useRef<HTMLUListElement>(null);
  const debounced = useDebouncedValue(termino, 300);

  const { data: remotos = [], isFetching } = useQuery({
    queryKey: ["admin", "busqueda-global", debounced],
    queryFn: () => buscar(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const resultados = useMemo(() => {
    const filtro = termino.trim().toLowerCase();
    const secciones = filtro
      ? SECCIONES.filter((s) => s.titulo.toLowerCase().includes(filtro))
      : SECCIONES;
    return [...remotos, ...secciones];
  }, [remotos, termino]);

  // La opción resaltada vuelve al principio con cada juego de resultados; si
  // no, el índice seguía apuntando a un resultado que ya no existe. Se ajusta
  // durante el render y no en un efecto: así no hay un fotograma intermedio
  // con el resaltado en una fila equivocada.
  const firma = `${debounced}|${resultados.length}`;
  const [firmaPrevia, setFirmaPrevia] = useState(firma);
  if (firma !== firmaPrevia) {
    setFirmaPrevia(firma);
    setActivo(0);
  }

  const cerrar = (abierto: boolean) => {
    if (!abierto) setTermino("");
    onOpenChange(abierto);
  };

  const ir = (resultado: Resultado) => {
    cerrar(false);
    router.push(resultado.href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActivo((i) => (i + 1) % Math.max(1, resultados.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActivo(
        (i) => (i - 1 + resultados.length) % Math.max(1, resultados.length),
      );
    } else if (event.key === "Enter" && resultados[activo]) {
      event.preventDefault();
      ir(resultados[activo]);
    }
  };

  let grupoAnterior = "";

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent
        showCloseButton={false}
        className="top-24 max-w-xl translate-y-0 gap-0 p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Búsqueda global</DialogTitle>

        <div className="flex items-center gap-3 border-b border-outline-variant px-4">
          <Search
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <input
            autoFocus
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar personas, cursos o secciones…"
            aria-label="Buscar en todo el panel"
            aria-controls="resultados-busqueda-global"
            className="h-12 w-full bg-transparent font-sans text-sm text-on-surface outline-none placeholder:text-muted-foreground"
          />
          {isFetching && (
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin text-muted-foreground"
            />
          )}
        </div>

        <ul
          ref={listaRef}
          id="resultados-busqueda-global"
          role="listbox"
          aria-label="Resultados"
          className="max-h-80 overflow-y-auto p-2"
        >
          {resultados.length === 0 && (
            <li className="px-3 py-8 text-center font-sans text-sm text-muted-foreground">
              {debounced.trim().length >= 2
                ? "Sin coincidencias."
                : "Escribe al menos dos caracteres."}
            </li>
          )}

          {resultados.map((resultado, i) => {
            const nuevoGrupo = resultado.grupo !== grupoAnterior;
            grupoAnterior = resultado.grupo;
            const Icon = resultado.icon;

            return (
              <li key={resultado.id}>
                {nuevoGrupo && (
                  <p className="px-3 pt-3 pb-1 font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
                    {resultado.grupo}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activo}
                  onClick={() => ir(resultado)}
                  onMouseEnter={() => setActivo(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    i === activo
                      ? "bg-surface-container"
                      : "hover:bg-surface-container/60",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-sm text-on-surface">
                      {resultado.titulo}
                    </span>
                    {resultado.detalle && (
                      <span className="block truncate font-sans text-xs text-muted-foreground">
                        {resultado.detalle}
                      </span>
                    )}
                  </span>
                  {i === activo && (
                    <CornerDownLeft
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
