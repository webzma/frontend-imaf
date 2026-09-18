"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Building2,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  SearchX,
} from "lucide-react";

import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableCount,
  type Column,
} from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ListToolbar } from "@/components/list-toolbar";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { StatRow } from "@/components/stat-row";
import { apiFetch } from "@/lib/api-client";
import { formatCedula } from "@/lib/format";
import { TODOS, useResourceList } from "@/hooks/use-resource-list";
import { useCatalogos } from "@/hooks/use-catalogos";
import { useUrlState } from "@/hooks/use-url-state";
import municipios from "@/data/municipios.json";
import { InstructorDetalle } from "./_components/InstructorDetalle";
import { InstructorPanel } from "./_components/InstructorPanel";
import type { Instructor } from "./tipos";

interface Resumen {
  total: number;
  con_titulo: number;
  departamentos: number;
  con_contrato: number;
}

export default function InstructoresPage() {
  const { get, set } = useUrlState();
  const [viendo, setViendo] = useState<Instructor | null>(null);
  const [editando, setEditando] = useState<Instructor | null>(null);
  const creando = get("nuevo") === "1";

  const catalogos = useCatalogos();

  const lista = useResourceList<Instructor>({
    resource: "instructores",
    path: "api/admin/profesores",
    defaultFilters: {
      titulo_id: TODOS,
      departamento_id: TODOS,
      municipio: TODOS,
    },
    defaultSort: { column: "nombre", direction: "asc" },
  });

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ["admin", "instructores", "resumen"],
    queryFn: () => apiFetch<Resumen>("api/admin/profesores/resumen"),
  });

  const columnas: Column<Instructor>[] = useMemo(
    () => [
      {
        id: "instructor",
        header: "Instructor",
        sortKey: "nombre",
        primary: true,
        mobileLabel: null,
        className: "whitespace-nowrap",
        cell: (p) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={p.foto} name={p.user.name} />
            <div className="min-w-0">
              <p className="truncate font-sans text-sm font-semibold text-on-surface">
                {p.user.name}
              </p>
              <p className="truncate font-sans text-xs text-muted-foreground">
                {p.user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "cedula",
        header: "Cédula",
        sortKey: "cedula",
        mobileLabel: "Cédula",
        cell: (p) => (
          <span className="font-mono text-sm tracking-wide text-muted-foreground">
            {formatCedula(p.cedula, p.nacionalidad)}
          </span>
        ),
      },
      {
        id: "especialidad",
        header: "Especialidad",
        mobileLabel: "Especialidad",
        cell: (p) =>
          p.especialidad?.nombre ?? (
            <span className="font-sans text-xs text-muted-foreground">
              Sin especialidad
            </span>
          ),
      },
      {
        id: "departamento",
        header: "Departamento",
        mobileLabel: "Departamento",
        cell: (p) =>
          p.departamento?.nombre ?? (
            <span className="font-sans text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "contrato",
        header: "Contrato",
        mobileLabel: "Contrato",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (p) => p.tipo_contrato?.nombre ?? "—",
      },
      {
        id: "titulo",
        header: "Título",
        aside: true,
        cell: (p) =>
          p.titulo ? (
            <Badge variant="neutral" className="px-3 py-1 font-sans">
              {p.titulo.nombre}
            </Badge>
          ) : null,
      },
    ],
    [],
  );

  const filtros = [
    {
      key: "titulo_id",
      label: "Filtrar por título",
      options: [
        { value: TODOS, label: "Todos los títulos" },
        ...catalogos.titulos.map((t) => ({
          value: String(t.id),
          label: t.nombre,
        })),
      ],
    },
    {
      key: "departamento_id",
      label: "Filtrar por departamento",
      options: [
        { value: TODOS, label: "Todos los departamentos" },
        { value: "sin_departamento", label: "Sin departamento" },
        ...catalogos.departamentos.map((d) => ({
          value: String(d.id),
          label: d.nombre,
        })),
      ],
    },
    {
      key: "municipio",
      label: "Filtrar por municipio",
      options: [
        { value: TODOS, label: "Todos los municipios" },
        { value: "sin_municipio", label: "Sin municipio" },
        ...municipios.map((m) => ({ value: m, label: m })),
      ],
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={GraduationCap}
        eyebrow="Gestión / Instructores"
        title="Instructores"
        subtitle="El personal docente registrado en la plataforma."
        actions={
          <Button className="gap-2" onClick={() => set("nuevo", "1")}>
            <Plus className="size-4" />
            Nuevo instructor
          </Button>
        }
      />

      <StatRow
        className="mb-10 max-w-3xl"
        loading={cargandoResumen}
        stats={[
          {
            label: "Total",
            value: resumen?.total ?? 0,
            icon: GraduationCap,
            tone: "primary",
          },
          {
            label: "Con título",
            value: resumen?.con_titulo ?? 0,
            icon: Award,
            tone: "secondary",
          },
          {
            label: "Departamentos",
            value: resumen?.departamentos ?? 0,
            icon: Building2,
            tone: "info",
          },
        ]}
      />

      <ListToolbar
        search={lista.search}
        onSearchChange={lista.setSearch}
        searchLabel="Buscar instructores"
        searchPlaceholder="Nombre, cédula, correo o especialidad…"
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
          fallback="No se pudo cargar la lista de instructores."
        />
      ) : (
        <DataTable
          columns={columnas}
          rows={lista.items}
          rowKey={(p) => p.id}
          caption="Instructores registrados, con su cédula, especialidad, departamento, contrato y título."
          loading={lista.isLoading}
          refreshing={lista.isFetching && !lista.isLoading}
          sort={lista.sort}
          onSort={lista.toggleSort}
          toolbar={
            <DataTableCount
              total={lista.total}
              label={["instructor", "instructores"]}
              filtered={lista.hasFilters}
            />
          }
          empty={
            lista.hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="Ningún instructor coincide"
                description="No hay instructores que cumplan los filtros aplicados. Prueba con otros criterios."
                action={
                  <Button variant="outline" onClick={lista.resetFilters}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="Aún no hay instructores"
                description="Registra al primer instructor para poder asignarle cursos y horarios."
                action={
                  <Button className="gap-2" onClick={() => set("nuevo", "1")}>
                    <Plus className="size-4" />
                    Registrar instructor
                  </Button>
                }
              />
            )
          }
          actions={(p) => (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setViendo(p)}
                aria-label={`Ver ficha de ${p.user.name}`}
              >
                <Eye className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditando(p)}
                aria-label={`Editar a ${p.user.name}`}
              >
                <Pencil className="size-3.5" />
              </Button>
            </>
          )}
          pagination={{
            page: lista.page,
            totalPages: lista.totalPages,
            totalItems: lista.total,
            pageSize: lista.pageSize,
            onPageChange: lista.setPage,
            itemLabel: ["instructor", "instructores"],
          }}
        />
      )}

      <InstructorPanel
        open={creando}
        onOpenChange={(abierto) => set("nuevo", abierto ? "1" : null)}
        catalogos={catalogos}
      />

      <InstructorPanel
        open={editando !== null}
        onOpenChange={(abierto) => !abierto && setEditando(null)}
        instructor={editando}
        catalogos={catalogos}
      />

      <InstructorDetalle
        instructor={viendo}
        onClose={() => setViendo(null)}
        onEditar={(p) => {
          setViendo(null);
          setEditando(p);
        }}
      />
    </PageShell>
  );
}
