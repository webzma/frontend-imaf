"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroll,
} from "@/components/ui/table";
import {
  DataCard,
  DataCardActions,
  DataCardField,
  DataCardFields,
  DataCardHeader,
} from "@/components/data-card";
import type { SortState } from "@/hooks/use-resource-list";

export interface Column<T> {
  id: string;
  header: string;
  /** Clave de orden que entiende el backend. Sin ella la columna no ordena. */
  sortKey?: string;
  cell: (row: T) => React.ReactNode;
  /**
   * Etiqueta del par dato/valor en la tarjeta móvil. `null` oculta la columna
   * en móvil (útil para la que ya se muestra como identidad de la tarjeta).
   */
  mobileLabel?: string | null;
  /** Identidad de la fila: ocupa la cabecera de la tarjeta en móvil. */
  primary?: boolean;
  /** Se ancla a la derecha de la cabecera de la tarjeta (estados, badges). */
  aside?: boolean;
  className?: string;
  headClassName?: string;
}

export interface Selection<T> {
  isSelected: (row: T) => boolean;
  toggle: (row: T) => void;
  toggleAll: () => void;
  /** `true` todas, `false` ninguna, `"indeterminate"` algunas. */
  allState: boolean | "indeterminate";
  /** Descripción de la fila para el lector de pantalla. */
  label: (row: T) => string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  /** Resumen de la tabla para lectores de pantalla (WCAG: `<caption>`). */
  caption: string;
  actions?: (row: T) => React.ReactNode;
  selection?: Selection<T>;
  sort?: SortState;
  onSort?: (column: string) => void;
  loading?: boolean;
  /** Se pinta cuando `rows` está vacío y no hay carga en curso. */
  empty?: React.ReactNode;
  /** Cabecera del panel: conteo, acciones masivas… */
  toolbar?: React.ReactNode;
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    itemLabel?: [string, string];
  };
  /** Atenúa la tabla mientras llega una página nueva sin vaciarla. */
  refreshing?: boolean;
  className?: string;
}

/**
 * Tabla del panel en sus dos formas.
 *
 * Cada pantalla escribía a mano la tabla de escritorio y, aparte, la lista de
 * tarjetas para móvil. Al ser dos marcados independientes ya habían empezado a
 * divergir en qué campos mostraba cada uno. Aquí una sola definición de
 * columnas genera las dos, junto con el esqueleto de carga, el estado vacío y
 * la paginación.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  actions,
  selection,
  sort,
  onSort,
  loading = false,
  empty,
  toolbar,
  pagination,
  refreshing = false,
  className,
}: DataTableProps<T>) {
  const principal = columns.find((c) => c.primary) ?? columns[0];
  const lateral = columns.find((c) => c.aside);
  const campos = columns.filter(
    (c) => c !== principal && c !== lateral && c.mobileLabel !== null,
  );

  if (loading) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-sm bg-surface-container-low ambient-shadow",
          className,
        )}
      >
        {toolbar}
        <TableSkeleton columns={columns.length + (actions ? 1 : 0)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm bg-surface-container-low ambient-shadow",
        className,
      )}
    >
      {toolbar}

      {rows.length === 0 ? (
        empty
      ) : (
        <div
          // Mientras llega la página siguiente la tabla anterior sigue en
          // pantalla, atenuada: cambiar de página no debe mover el layout.
          className={cn(
            "transition-opacity",
            refreshing && "opacity-60 pointer-events-none",
          )}
          aria-busy={refreshing || undefined}
        >
          {/* ── Móvil: una tarjeta por registro ── */}
          <ul className="md:hidden">
            {rows.map((row) => (
              <DataCard key={rowKey(row)}>
                <DataCardHeader aside={lateral ? lateral.cell(row) : undefined}>
                  {selection && (
                    <Checkbox
                      checked={selection.isSelected(row)}
                      onCheckedChange={() => selection.toggle(row)}
                      aria-label={`Seleccionar ${selection.label(row)}`}
                    />
                  )}
                  {principal?.cell(row)}
                </DataCardHeader>
                {campos.length > 0 && (
                  <DataCardFields>
                    {campos.map((col) => (
                      <DataCardField
                        key={col.id}
                        label={col.mobileLabel ?? col.header}
                      >
                        {col.cell(row)}
                      </DataCardField>
                    ))}
                  </DataCardFields>
                )}
                {actions && <DataCardActions>{actions(row)}</DataCardActions>}
              </DataCard>
            ))}
          </ul>

          {/* ── Escritorio: tabla ── */}
          <TableScroll className="hidden md:block">
            <Table className="table-sticky-first">
              <TableCaption>{caption}</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {selection && (
                    <TableHead className="w-10 pr-0">
                      <Checkbox
                        checked={selection.allState}
                        onCheckedChange={selection.toggleAll}
                        aria-label="Seleccionar todas las filas de esta página"
                      />
                    </TableHead>
                  )}
                  {columns.map((col) => (
                    <SortableHead
                      key={col.id}
                      column={col}
                      sort={sort}
                      onSort={onSort}
                    />
                  ))}
                  {actions && (
                    <TableHead className="px-4">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={rowKey(row)}
                    data-state={
                      selection?.isSelected(row) ? "selected" : undefined
                    }
                  >
                    {selection && (
                      <TableCell className="w-10 pr-0">
                        <Checkbox
                          checked={selection.isSelected(row)}
                          onCheckedChange={() => selection.toggle(row)}
                          aria-label={`Seleccionar ${selection.label(row)}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="px-4">
                        <div className="flex items-center justify-end gap-1">
                          {actions(row)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroll>
        </div>
      )}

      {pagination && rows.length > 0 && <Pagination {...pagination} />}
    </div>
  );
}

function SortableHead<T>({
  column,
  sort,
  onSort,
}: {
  column: Column<T>;
  sort?: SortState;
  onSort?: (column: string) => void;
}) {
  const ordenable = Boolean(column.sortKey && onSort);
  const activa = ordenable && sort?.column === column.sortKey;
  const direccion = activa ? sort?.direction : undefined;

  if (!ordenable) {
    return (
      <TableHead className={column.headClassName}>{column.header}</TableHead>
    );
  }

  const Icono = !activa
    ? ChevronsUpDown
    : direccion === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead
      // `aria-sort` es lo que anuncia el estado de orden; el icono solo lo
      // refuerza visualmente.
      aria-sort={
        activa ? (direccion === "asc" ? "ascending" : "descending") : "none"
      }
      className={cn("p-0", column.headClassName)}
    >
      <button
        type="button"
        onClick={() => onSort?.(column.sortKey!)}
        className="group flex w-full items-center gap-1.5 px-6 py-3.5 text-left uppercase transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {column.header}
        <Icono
          aria-hidden="true"
          className={cn(
            "size-3 shrink-0 transition-colors",
            activa
              ? "text-primary"
              : "text-muted-foreground/50 group-hover:text-muted-foreground",
          )}
        />
        <span className="sr-only">
          {activa
            ? direccion === "asc"
              ? "(orden ascendente, activar para invertir)"
              : "(orden descendente, activar para invertir)"
            : "(activar para ordenar)"}
        </span>
      </button>
    </TableHead>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      <div className="border-b border-outline-variant px-6 py-3.5">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-outline-variant">
        {Array.from({ length: 6 }).map((_, fila) => (
          <div key={fila} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            {Array.from({ length: Math.max(1, columns - 1) }).map(
              (_, celda) => (
                <Skeleton
                  key={celda}
                  className={cn("h-4", celda === 0 ? "w-40" : "w-24")}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/** Cabecera del panel con el conteo, anunciada al filtrar. */
export function DataTableCount({
  total,
  label,
  filtered,
  children,
}: {
  total: number;
  label: [string, string];
  filtered?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-6 py-3.5">
      <p
        // Al filtrar, el conteo cambiaba en silencio: quien no ve la pantalla
        // no tenía forma de saber cuántos resultados quedaron.
        aria-live="polite"
        className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground"
      >
        {total} {total === 1 ? label[0] : label[1]}
        {filtered ? (total === 1 ? " encontrado" : " encontrados") : ""}
      </p>
      {children}
    </div>
  );
}
