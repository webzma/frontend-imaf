"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, GraduationCap, Pencil, Plus, SearchX, Users } from "lucide-react";

import { Avatar } from "@/components/avatar";
import { BulkBar } from "@/components/bulk-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, fetchAll, mensajeDeError } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { formatCedula, formatDate } from "@/lib/format";
import { TODOS, useResourceList } from "@/hooks/use-resource-list";
import { useSelection } from "@/hooks/use-selection";
import { useUrlState } from "@/hooks/use-url-state";
import municipios from "@/data/municipios.json";
import { EstudianteDetalle } from "./_components/EstudianteDetalle";
import { EstudiantePanel } from "./_components/EstudiantePanel";
import { ESTADO_LABEL, type Curso, type Estudiante } from "./tipos";

interface Resumen {
  total: number;
  activos: number;
  inactivos: number;
  graduados: number;
}

export default function EstudiantesPage() {
  const queryClient = useQueryClient();
  const { get, set } = useUrlState();

  const [viendo, setViendo] = useState<Estudiante | null>(null);
  const [editando, setEditando] = useState<Estudiante | null>(null);
  const [estadoMasivo, setEstadoMasivo] = useState<Estudiante["estado"] | null>(
    null,
  );

  // El panel de alta se abre por URL (`?nuevo=1`), así que los accesos rápidos
  // del panel de inicio pueden enlazar directamente al formulario.
  const creando = get("nuevo") === "1";

  const lista = useResourceList<Estudiante>({
    resource: "estudiantes",
    path: "api/admin/estudiantes",
    defaultFilters: {
      estado: TODOS,
      curso_id: TODOS,
      municipio: TODOS,
    },
    defaultSort: { column: "nombre", direction: "asc" },
  });

  /**
   * Los desplegables necesitan el catálogo completo.
   *
   * Pedían `api/admin/cursos` sin `per_page`, que responde la primera página:
   * el filtro y el formulario solo ofrecían diez cursos y no había manera de
   * asignar el undécimo.
   */
  const { data: cursos = [] } = useQuery({
    queryKey: adminKeys.opciones("cursos"),
    queryFn: () => fetchAll<Curso>("api/admin/cursos"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ["admin", "estudiantes", "resumen"],
    queryFn: () => apiFetch<Resumen>("api/admin/estudiantes/resumen"),
  });

  const firmaSeleccion = `${lista.page}|${JSON.stringify(lista.params)}`;
  const seleccion = useSelection(lista.items, (e) => e.id, firmaSeleccion);

  const cambiarEstado = useMutation({
    mutationFn: (estado: Estudiante["estado"]) =>
      apiFetch<{ actualizados: number }>(
        "api/admin/estudiantes/estado-masivo",
        {
          method: "PATCH",
          body: { ids: seleccion.list, estado },
        },
      ),
    onSuccess: (data, estado) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      seleccion.clear();
      setEstadoMasivo(null);
      toast.success(
        `${data.actualizados} ${data.actualizados === 1 ? "estudiante marcado" : "estudiantes marcados"} como ${ESTADO_LABEL[estado].toLowerCase()}`,
      );
    },
    onError: (error) =>
      toast.error(mensajeDeError(error, "No se pudo cambiar el estado.")),
  });

  const columnas: Column<Estudiante>[] = useMemo(
    () => [
      {
        id: "estudiante",
        header: "Estudiante",
        sortKey: "nombre",
        primary: true,
        mobileLabel: null,
        className: "whitespace-nowrap",
        cell: (e) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={e.foto} name={e.user.name} />
            <div className="min-w-0">
              <p className="truncate font-sans text-sm font-semibold text-on-surface">
                {e.user.name}
              </p>
              <p className="truncate font-sans text-xs text-muted-foreground">
                {e.user.email}
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
        cell: (e) => (
          <span className="font-mono text-sm tracking-wide text-muted-foreground">
            {formatCedula(e.cedula, e.nacionalidad)}
          </span>
        ),
      },
      {
        id: "curso",
        header: "Curso",
        mobileLabel: "Curso",
        cell: (e) =>
          e.curso ? (
            <span className="text-on-surface">{e.curso.nombre}</span>
          ) : (
            <span className="font-sans text-xs text-muted-foreground">
              Sin curso
            </span>
          ),
      },
      {
        id: "inscripcion",
        header: "Inscripción",
        sortKey: "fecha_inscripcion",
        mobileLabel: "Inscripción",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (e) => formatDate(e.fecha_inscripcion),
      },
      {
        id: "estado",
        header: "Estado",
        sortKey: "estado",
        aside: true,
        cell: (e) => (
          <Badge variant={e.estado} className="px-3 py-1 font-sans">
            {ESTADO_LABEL[e.estado]}
          </Badge>
        ),
      },
    ],
    [],
  );

  const filtros = [
    {
      key: "estado",
      label: "Filtrar por estado",
      options: [
        { value: TODOS, label: "Todos los estados" },
        { value: "activo", label: "Activo" },
        { value: "inactivo", label: "Inactivo" },
        { value: "graduado", label: "Graduado" },
      ],
    },
    {
      key: "curso_id",
      label: "Filtrar por curso",
      options: [
        { value: TODOS, label: "Todos los cursos" },
        { value: "sin_curso", label: "Sin curso" },
        ...cursos.map((c) => ({ value: String(c.id), label: c.nombre })),
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
        icon={Users}
        eyebrow="Gestión / Estudiantes"
        title="Estudiantes"
        subtitle="Todos los estudiantes registrados en la plataforma."
        actions={
          <Button className="gap-2" onClick={() => set("nuevo", "1")}>
            <Plus className="size-4" />
            Nuevo estudiante
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
            icon: Users,
            tone: "primary",
          },
          {
            label: "Activos",
            value: resumen?.activos ?? 0,
            icon: Users,
            tone: "success",
          },
          {
            label: "Graduados",
            value: resumen?.graduados ?? 0,
            icon: GraduationCap,
            tone: "secondary",
          },
        ]}
      />

      <ListToolbar
        search={lista.search}
        onSearchChange={lista.setSearch}
        searchLabel="Buscar estudiantes"
        searchPlaceholder="Nombre, cédula, correo o curso…"
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
          fallback="No se pudo cargar la lista de estudiantes."
        />
      ) : (
        <DataTable
          columns={columnas}
          rows={lista.items}
          rowKey={(e) => e.id}
          caption="Estudiantes registrados, con su cédula, curso, fecha de inscripción y estado."
          loading={lista.isLoading}
          refreshing={lista.isFetching && !lista.isLoading}
          sort={lista.sort}
          onSort={lista.toggleSort}
          selection={{
            isSelected: seleccion.isSelected,
            toggle: seleccion.toggle,
            toggleAll: seleccion.toggleAll,
            allState: seleccion.allState,
            label: (e) => e.user.name,
          }}
          toolbar={
            seleccion.count > 0 ? (
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-primary-container/30 px-6 py-3">
                <BulkBar
                  count={seleccion.count}
                  label={["estudiante", "estudiantes"]}
                  onClear={seleccion.clear}
                >
                  <Select
                    value=""
                    onValueChange={(v) =>
                      setEstadoMasivo(v as Estudiante["estado"])
                    }
                  >
                    <SelectTrigger
                      aria-label="Cambiar el estado de la selección"
                      className="h-8 w-44 text-xs"
                    >
                      <SelectValue placeholder="Cambiar estado…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Marcar activo</SelectItem>
                      <SelectItem value="inactivo">Marcar inactivo</SelectItem>
                      <SelectItem value="graduado">Marcar graduado</SelectItem>
                    </SelectContent>
                  </Select>
                </BulkBar>
              </div>
            ) : (
              <DataTableCount
                total={lista.total}
                label={["estudiante", "estudiantes"]}
                filtered={lista.hasFilters}
              />
            )
          }
          empty={
            lista.hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="Ningún estudiante coincide"
                description="No hay estudiantes que cumplan los filtros aplicados. Prueba con otros criterios."
                action={
                  <Button variant="outline" onClick={lista.resetFilters}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Users}
                title="Aún no hay estudiantes"
                description="Registra al primer estudiante para empezar a gestionar inscripciones y asistencia."
                action={
                  <Button className="gap-2" onClick={() => set("nuevo", "1")}>
                    <Plus className="size-4" />
                    Registrar estudiante
                  </Button>
                }
              />
            )
          }
          actions={(e) => (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setViendo(e)}
                aria-label={`Ver ficha de ${e.user.name}`}
              >
                <Eye className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditando(e)}
                aria-label={`Editar a ${e.user.name}`}
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
            itemLabel: ["estudiante", "estudiantes"],
          }}
        />
      )}

      <EstudiantePanel
        open={creando}
        onOpenChange={(abierto) => set("nuevo", abierto ? "1" : null)}
        cursos={cursos}
      />

      <EstudiantePanel
        open={editando !== null}
        onOpenChange={(abierto) => !abierto && setEditando(null)}
        estudiante={editando}
        cursos={cursos}
      />

      <EstudianteDetalle
        estudiante={viendo}
        onClose={() => setViendo(null)}
        onEditar={(e) => {
          setViendo(null);
          setEditando(e);
        }}
      />

      <ConfirmDialog
        open={estadoMasivo !== null}
        onOpenChange={(abierto) => !abierto && setEstadoMasivo(null)}
        title="Cambiar estado"
        description={
          <>
            {seleccion.count}{" "}
            {seleccion.count === 1
              ? "estudiante pasará"
              : "estudiantes pasarán"}{" "}
            a <strong>{estadoMasivo && ESTADO_LABEL[estadoMasivo]}</strong>.
          </>
        }
        confirmLabel="Cambiar estado"
        variant="default"
        loading={cambiarEstado.isPending}
        onConfirm={() => estadoMasivo && cambiarEstado.mutate(estadoMasivo)}
      />
    </PageShell>
  );
}
