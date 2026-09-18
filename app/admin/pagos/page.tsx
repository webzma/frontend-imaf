"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Landmark,
  SearchX,
} from "lucide-react";

import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { BulkBar } from "@/components/bulk-bar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DataTable,
  DataTableCount,
  type Column,
} from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { ListToolbar } from "@/components/list-toolbar";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { StatRow } from "@/components/stat-row";
import { apiFetch, fetchAll, mensajeDeError } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/format";
import { TODOS, useResourceList } from "@/hooks/use-resource-list";
import { useSelection } from "@/hooks/use-selection";
import { DatosBancariosDialog } from "./_components/DatosBancarios";
import { PagoDetalle } from "./_components/PagoDetalle";
import {
  ESTADO_CONFIG,
  METODO_LABEL,
  type EstadoPago,
  type Pago,
} from "./tipos";

interface Resumen {
  total: number;
  pendiente: number;
  aprobado: number;
  rechazado: number;
}

interface CursoRef {
  id: number;
  nombre: string;
}

export default function PagosPage() {
  const queryClient = useQueryClient();
  const [viendo, setViendo] = useState<Pago | null>(null);
  const [bancos, setBancos] = useState(false);
  const [decisionMasiva, setDecisionMasiva] = useState<EstadoPago | null>(null);
  const [notaMasiva, setNotaMasiva] = useState("");

  const lista = useResourceList<Pago>({
    resource: "pagos",
    path: "api/admin/pagos",
    defaultFilters: { estado: TODOS, curso_id: TODOS },
    // Por defecto manda la prioridad del backend: pendientes primero.
    defaultSort: { column: "", direction: "asc" },
  });

  const { data: cursos = [] } = useQuery({
    queryKey: adminKeys.opciones("cursos"),
    queryFn: () => fetchAll<CursoRef>("api/admin/cursos"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ["admin", "pagos", "resumen"],
    queryFn: () => apiFetch<Resumen>("api/admin/pagos/resumen"),
  });

  const firmaSeleccion = `${lista.page}|${JSON.stringify(lista.params)}`;
  const seleccion = useSelection(lista.items, (p) => p.id, firmaSeleccion);

  const decidirVarios = useMutation({
    mutationFn: (estado: EstadoPago) =>
      apiFetch<{
        procesados: number;
        fallidos: { id: number; message: string }[];
      }>("api/admin/pagos/masivo", {
        method: "PATCH",
        body: {
          ids: seleccion.list,
          estado,
          nota_admin: estado === "rechazado" ? notaMasiva.trim() || null : null,
        },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      seleccion.clear();
      setDecisionMasiva(null);
      setNotaMasiva("");

      if (data.procesados > 0) {
        toast.success(
          `${data.procesados} ${data.procesados === 1 ? "pago procesado" : "pagos procesados"}`,
        );
      }
      // Los que no pasaron se dicen aparte: un "3 de 5" silencioso deja a la
      // persona creyendo que aprobó cinco.
      if (data.fallidos.length > 0) {
        toast.error(
          `${data.fallidos.length} sin procesar: ${data.fallidos[0].message}`,
        );
      }
    },
    onError: (error) => {
      setDecisionMasiva(null);
      toast.error(mensajeDeError(error, "No se pudieron procesar los pagos."));
    },
  });

  const columnas: Column<Pago>[] = useMemo(
    () => [
      {
        id: "estudiante",
        header: "Estudiante",
        primary: true,
        mobileLabel: null,
        className: "whitespace-nowrap",
        cell: (p) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={p.estudiante?.foto} name={p.estudiante?.nombre} />
            <div className="min-w-0">
              <p className="truncate font-sans text-sm font-semibold text-on-surface">
                {p.estudiante?.nombre ?? "Estudiante eliminado"}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {p.estudiante?.cedula}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "curso",
        header: "Curso",
        mobileLabel: "Curso",
        cell: (p) => p.curso?.nombre ?? "—",
      },
      {
        id: "metodo",
        header: "Método",
        mobileLabel: "Método",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (p) => METODO_LABEL[p.metodo_pago ?? "pago_movil"],
      },
      {
        id: "referencia",
        header: "Referencia",
        mobileLabel: "Referencia",
        cell: (p) => (
          <span className="font-mono text-sm text-muted-foreground">
            {p.referencia || "—"}
          </span>
        ),
      },
      {
        id: "fecha",
        header: "Fecha",
        sortKey: "fecha",
        mobileLabel: "Fecha",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (p) => formatDateTime(p.created_at),
      },
      {
        id: "estado",
        header: "Estado",
        sortKey: "estado",
        aside: true,
        cell: (p) => (
          <Badge variant={p.estado} className="px-3 py-1 font-sans">
            {ESTADO_CONFIG[p.estado].label}
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
        { value: "pendiente", label: "Pendiente" },
        { value: "aprobado", label: "Aprobado" },
        { value: "rechazado", label: "Rechazado" },
      ],
    },
    {
      key: "curso_id",
      label: "Filtrar por curso",
      options: [
        { value: TODOS, label: "Todos los cursos" },
        ...cursos.map((c) => ({ value: String(c.id), label: c.nombre })),
      ],
    },
  ];

  /** Solo tiene sentido decidir sobre pagos que siguen pendientes. */
  const seleccionPendiente = lista.items.filter(
    (p) => seleccion.ids.has(p.id) && p.estado === "pendiente",
  ).length;

  return (
    <PageShell>
      <PageHeader
        icon={CreditCard}
        eyebrow="Gestión / Pagos"
        title="Pagos"
        subtitle="Comprobantes reportados por los estudiantes, pendientes primero."
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBancos(true)}
          >
            <Landmark className="size-4" />
            Datos bancarios
          </Button>
        }
      />

      <StatRow
        className="mb-10"
        columns={4}
        loading={cargandoResumen}
        stats={[
          {
            label: "Total",
            value: resumen?.total ?? 0,
            icon: CreditCard,
            tone: "primary",
          },
          {
            label: "Pendientes",
            value: resumen?.pendiente ?? 0,
            sub: "esperan revisión",
            icon: Clock,
            tone: "warning",
          },
          {
            label: "Aprobados",
            value: resumen?.aprobado ?? 0,
            icon: CheckCircle2,
            tone: "success",
          },
          {
            label: "Rechazados",
            value: resumen?.rechazado ?? 0,
            icon: Ban,
            tone: "danger",
          },
        ]}
      />

      <ListToolbar
        search={lista.search}
        onSearchChange={lista.setSearch}
        searchLabel="Buscar pagos"
        searchPlaceholder="Estudiante, cédula, referencia o curso…"
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
          fallback="No se pudo cargar la lista de pagos."
        />
      ) : (
        <DataTable
          columns={columnas}
          rows={lista.items}
          rowKey={(p) => p.id}
          caption="Pagos reportados, con el estudiante, el curso, el método, la referencia, la fecha y su estado."
          loading={lista.isLoading}
          refreshing={lista.isFetching && !lista.isLoading}
          sort={lista.sort}
          onSort={lista.toggleSort}
          selection={{
            isSelected: seleccion.isSelected,
            toggle: seleccion.toggle,
            toggleAll: seleccion.toggleAll,
            allState: seleccion.allState,
            label: (p) =>
              `el pago de ${p.estudiante?.nombre ?? "un estudiante"}`,
          }}
          toolbar={
            seleccion.count > 0 ? (
              <div className="border-b border-outline-variant bg-primary-container/30 px-6 py-3">
                <BulkBar
                  count={seleccion.count}
                  label={["pago", "pagos"]}
                  onClear={seleccion.clear}
                >
                  <Button
                    size="sm"
                    disabled={seleccionPendiente === 0}
                    onClick={() => setDecisionMasiva("aprobado")}
                  >
                    <CheckCircle2 className="mr-1.5 size-3.5" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={seleccionPendiente === 0}
                    onClick={() => setDecisionMasiva("rechazado")}
                  >
                    <Ban className="mr-1.5 size-3.5" />
                    Rechazar
                  </Button>
                  {seleccionPendiente === 0 && (
                    <span className="font-sans text-xs text-muted-foreground">
                      Ninguno está pendiente
                    </span>
                  )}
                </BulkBar>
              </div>
            ) : (
              <DataTableCount
                total={lista.total}
                label={["pago", "pagos"]}
                filtered={lista.hasFilters}
              />
            )
          }
          empty={
            lista.hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="Ningún pago coincide"
                description="No hay pagos que cumplan los filtros aplicados. Prueba con otros criterios."
                action={
                  <Button variant="outline" onClick={lista.resetFilters}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={CreditCard}
                title="Todavía no hay pagos"
                description="Cuando un estudiante reporte su pago, su comprobante aparecerá aquí para revisión."
              />
            )
          }
          actions={(p) => (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setViendo(p)}
              aria-label={`Revisar el pago de ${p.estudiante?.nombre ?? "un estudiante"}`}
            >
              <Eye className="size-3.5" />
            </Button>
          )}
          pagination={{
            page: lista.page,
            totalPages: lista.totalPages,
            totalItems: lista.total,
            pageSize: lista.pageSize,
            onPageChange: lista.setPage,
            itemLabel: ["pago", "pagos"],
          }}
        />
      )}

      <PagoDetalle pago={viendo} onClose={() => setViendo(null)} />

      <DatosBancariosDialog open={bancos} onOpenChange={setBancos} />

      <ConfirmDialog
        open={decisionMasiva !== null}
        onOpenChange={(abierto) => !abierto && setDecisionMasiva(null)}
        title={
          decisionMasiva === "aprobado"
            ? "Aprobar los pagos seleccionados"
            : "Rechazar los pagos seleccionados"
        }
        description={
          decisionMasiva === "aprobado" ? (
            <>
              Se aprobarán {seleccionPendiente}{" "}
              {seleccionPendiente === 1 ? "pago pendiente" : "pagos pendientes"}
              . Cada estudiante quedará inscrito en su curso. Los que ya no
              tengan cupo se informarán al terminar.
            </>
          ) : (
            <>
              Se rechazarán {seleccionPendiente}{" "}
              {seleccionPendiente === 1 ? "pago pendiente" : "pagos pendientes"}
              . Esas personas no podrán entrar a su curso hasta reportar uno
              nuevo.
            </>
          )
        }
        confirmLabel={decisionMasiva === "aprobado" ? "Aprobar" : "Rechazar"}
        variant={decisionMasiva === "aprobado" ? "default" : "destructive"}
        loading={decidirVarios.isPending}
        onConfirm={() => decisionMasiva && decidirVarios.mutate(decisionMasiva)}
      >
        {decisionMasiva === "rechazado" && (
          <Field label="Motivo del rechazo" hint="Opcional, se envía a todos">
            <Input
              value={notaMasiva}
              onChange={(e) => setNotaMasiva(e.target.value)}
              maxLength={500}
              placeholder="Comprobante ilegible, monto incorrecto…"
            />
          </Field>
        )}
      </ConfirmDialog>
    </PageShell>
  );
}
