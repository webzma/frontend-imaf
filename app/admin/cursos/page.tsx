"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, SearchX, Users, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ListToolbar } from "@/components/list-toolbar";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Pagination } from "@/components/ui/pagination";
import { StatRow } from "@/components/stat-row";
import { apiFetch, fetchAll } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { TODOS, useResourceList } from "@/hooks/use-resource-list";
import { useUrlState } from "@/hooks/use-url-state";
import { CursoCard, CursoCardSkeleton } from "./_components/CursoCard";
import { CursoPanel } from "./_components/CursoPanel";
import type { Curso, InstructorRef } from "./tipos";

interface Resumen {
  total: number;
  activos: number;
  inactivos: number;
  estudiantes: number;
  con_estudiantes: number;
}

export default function CursosPage() {
  const { get, set } = useUrlState();
  const creando = get("nuevo") === "1";

  const lista = useResourceList<Curso>({
    resource: "cursos",
    path: "api/admin/cursos",
    defaultFilters: { estado: TODOS, profesor_id: TODOS },
    defaultSort: { column: "nombre", direction: "asc" },
    pageSize: 9,
  });

  const { data: instructores = [] } = useQuery({
    queryKey: adminKeys.opciones("profesores"),
    queryFn: () => fetchAll<InstructorRef>("api/admin/profesores"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ["admin", "cursos", "resumen"],
    queryFn: () => apiFetch<Resumen>("api/admin/cursos/resumen"),
  });

  const filtros = [
    {
      key: "estado",
      label: "Filtrar por estado",
      options: [
        { value: TODOS, label: "Todos los estados" },
        { value: "activo", label: "Activo" },
        { value: "inactivo", label: "Inactivo" },
      ],
    },
    {
      key: "profesor_id",
      label: "Filtrar por instructor",
      options: [
        { value: TODOS, label: "Todos los instructores" },
        { value: "sin_instructor", label: "Sin instructor" },
        ...instructores.map((i) => ({
          value: String(i.id),
          label: i.user.name,
        })),
      ],
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={BookOpen}
        eyebrow="Gestión / Cursos"
        title="Cursos"
        subtitle="La oferta formativa del instituto y su ocupación."
        actions={
          <Button className="gap-2" onClick={() => set("nuevo", "1")}>
            <Plus className="size-4" />
            Nuevo curso
          </Button>
        }
      />

      <StatRow
        className="mb-10 max-w-3xl"
        loading={cargandoResumen}
        stats={[
          {
            label: "Cursos",
            value: resumen?.total ?? 0,
            sub: `${resumen?.activos ?? 0} activos`,
            icon: BookOpen,
            tone: "primary",
          },
          {
            label: "Inscripciones",
            value: resumen?.estudiantes ?? 0,
            sub: "estudiantes con curso",
            icon: Users,
            tone: "info",
          },
          {
            label: "Con estudiantes",
            value: resumen?.con_estudiantes ?? 0,
            sub: "cursos que ya arrancaron",
            icon: UsersRound,
            tone: "success",
          },
        ]}
      />

      <ListToolbar
        search={lista.search}
        onSearchChange={lista.setSearch}
        searchLabel="Buscar cursos"
        searchPlaceholder="Nombre, código, descripción o instructor…"
        filters={filtros}
        values={lista.filters}
        onFilterChange={lista.setFilter}
        onReset={lista.resetFilters}
        hasFilters={lista.hasFilters}
        busy={lista.isFetching && !lista.isLoading}
      />

      {lista.error ? (
        <ErrorState
          error={lista.error}
          onRetry={lista.refetch}
          fallback="No se pudo cargar la lista de cursos."
        />
      ) : (
        <>
          <p
            aria-live="polite"
            className="mb-4 font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground"
          >
            {lista.isLoading
              ? "Cargando…"
              : `${lista.total} ${lista.total === 1 ? "curso" : "cursos"}${
                  lista.hasFilters
                    ? lista.total === 1
                      ? " encontrado"
                      : " encontrados"
                    : ""
                }`}
          </p>

          {lista.isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CursoCardSkeleton key={i} />
              ))}
            </div>
          ) : lista.items.length === 0 ? (
            lista.hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="Ningún curso coincide"
                description="No hay cursos que cumplan los filtros aplicados. Prueba con otros criterios."
                action={
                  <Button variant="outline" onClick={lista.resetFilters}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Aún no hay cursos"
                description="Crea el primer curso para que los estudiantes puedan inscribirse."
                action={
                  <Button className="gap-2" onClick={() => set("nuevo", "1")}>
                    <Plus className="size-4" />
                    Crear curso
                  </Button>
                }
              />
            )
          ) : (
            <div
              className={
                lista.isFetching
                  ? "grid grid-cols-1 gap-5 opacity-60 transition-opacity sm:grid-cols-2 lg:grid-cols-3"
                  : "grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {lista.items.map((curso) => (
                <CursoCard key={curso.id} curso={curso} />
              ))}
            </div>
          )}

          {lista.items.length > 0 && (
            <Pagination
              className="mt-6 rounded-sm border-t-0 bg-surface-container-low"
              page={lista.page}
              totalPages={lista.totalPages}
              totalItems={lista.total}
              pageSize={lista.pageSize}
              onPageChange={lista.setPage}
              itemLabel={["curso", "cursos"]}
            />
          )}
        </>
      )}

      <CursoPanel
        open={creando}
        onOpenChange={(abierto) => set("nuevo", abierto ? "1" : null)}
        instructores={instructores}
      />
    </PageShell>
  );
}
