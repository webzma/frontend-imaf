"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { tasaAprobacion } from "../metricas";
import type { PagoCurso, PagoUsuario } from "../tipos";

const FILAS_INICIALES = 10;

const normalizar = (t: string) =>
  t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** Tasa de aprobación como medidor compacto: número + barra. */
function Tasa({
  aprobados,
  rechazados,
}: {
  aprobados: number;
  rechazados: number;
}) {
  const tasa = tasaAprobacion(aprobados, rechazados);
  if (tasa === null)
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center justify-end gap-2">
      <Progress
        value={tasa}
        aria-hidden="true"
        className="h-1.5 w-14 bg-surface-container-high [&>[data-slot=progress-indicator]]:bg-chart-aprobado"
      />
      <span className="w-9 text-right tabular-nums">{tasa}%</span>
    </div>
  );
}

function Pendientes({ n }: { n: number }) {
  return n > 0 ? (
    <Badge variant="pendiente" className="tabular-nums">
      {n}
    </Badge>
  ) : (
    <span className="text-muted-foreground tabular-nums">0</span>
  );
}

/**
 * Vista de datos de las gráficas: las mismas cifras, exactas y buscables.
 * Antes eran dos tablas apiladas, la segunda recortada a 20 filas sin avisar.
 */
export function TablasDetalle({
  porCurso,
  porUsuario,
}: {
  porCurso: PagoCurso[];
  porUsuario: PagoUsuario[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [todas, setTodas] = useState(false);
  const clave = normalizar(busqueda);

  const cursos = useMemo(
    () =>
      porCurso.filter(
        (c) =>
          !clave ||
          normalizar(c.nombre).includes(clave) ||
          normalizar(c.codigo).includes(clave),
      ),
    [porCurso, clave],
  );
  const usuarios = useMemo(
    () =>
      porUsuario.filter((u) => !clave || normalizar(u.nombre).includes(clave)),
    [porUsuario, clave],
  );

  const ingresoTotal = porCurso.reduce((s, c) => s + c.total_ingreso, 0);

  const recortar = <T,>(filas: T[]) =>
    todas || clave ? filas : filas.slice(0, FILAS_INICIALES);

  const verMas = (total: number) =>
    !clave && total > FILAS_INICIALES ? (
      <Button
        variant="ghost"
        size="sm"
        className="mt-3"
        onClick={() => setTodas((v) => !v)}
      >
        {todas ? "Mostrar menos" : `Mostrar las ${total} filas`}
      </Button>
    ) : null;

  const sinResultados = (
    <EmptyState
      icon={SearchX}
      title="Sin resultados"
      description={`Nada coincide con "${busqueda}".`}
      action={
        <Button variant="outline" onClick={() => setBusqueda("")}>
          Limpiar búsqueda
        </Button>
      }
    />
  );

  return (
    <Tabs
      defaultValue="cursos"
      onValueChange={() => setTodas(false)}
      className="gap-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <TabsList className="w-auto border-b-0">
          <TabsTrigger value="cursos">
            Por curso
            <Badge variant="neutral" className="tabular-nums">
              {porCurso.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="estudiantes">
            Por estudiante
            <Badge variant="neutral" className="tabular-nums">
              {porUsuario.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="relative w-full sm:w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar curso o estudiante…"
            aria-label="Buscar en las tablas"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      <TabsContent value="cursos">
        {cursos.length === 0 ? (
          sinResultados
        ) : (
          <>
            <TableScroll>
              <Table className="table-sticky-first [--table-sticky-bg:var(--surface-container-lowest)]">
                <TableCaption className="sr-only">
                  Pagos de cada curso por estado, tasa de aprobación e ingreso.
                </TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Curso</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Aprobados</TableHead>
                    <TableHead className="text-right">Pendientes</TableHead>
                    <TableHead className="text-right">Rechazados</TableHead>
                    <TableHead className="text-right">Aprobación</TableHead>
                    <TableHead className="text-right">Ingreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recortar(cursos).map((c) => (
                    <TableRow key={c.curso_id}>
                      <TableCell className="max-w-64">
                        <Link
                          href={`/admin/cursos/${c.curso_id}`}
                          className="font-medium hover:underline"
                        >
                          {c.nombre}
                        </Link>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {c.codigo}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums text-muted-foreground">
                        {c.precio === 0 ? "Gratuito" : formatCurrency(c.precio)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.aprobados}
                      </TableCell>
                      <TableCell className="text-right">
                        <Pendientes n={c.pendientes} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.rechazados}
                      </TableCell>
                      <TableCell>
                        <Tasa
                          aprobados={c.aprobados}
                          rechazados={c.rechazados}
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(c.total_ingreso)}
                        </span>
                        {ingresoTotal > 0 && c.total_ingreso > 0 && (
                          <span className="block text-[11px] text-muted-foreground tabular-nums">
                            {Math.round((c.total_ingreso / ingresoTotal) * 100)}
                            % del total
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroll>
            {verMas(cursos.length)}
          </>
        )}
      </TabsContent>

      <TabsContent value="estudiantes">
        {usuarios.length === 0 ? (
          sinResultados
        ) : (
          <>
            <TableScroll>
              <Table className="table-sticky-first [--table-sticky-bg:var(--surface-container-lowest)]">
                <TableCaption className="sr-only">
                  Pagos de cada estudiante por estado e ingreso aportado.
                </TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Estudiante</TableHead>
                    <TableHead className="text-right">Pagos</TableHead>
                    <TableHead className="text-right">Aprobados</TableHead>
                    <TableHead className="text-right">Pendientes</TableHead>
                    <TableHead className="text-right">Rechazados</TableHead>
                    <TableHead className="text-right">Ingreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recortar(usuarios).map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.nombre}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.total_pagos}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.aprobados}
                      </TableCell>
                      <TableCell className="text-right">
                        <Pendientes n={u.pendientes} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.rechazados}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">
                        {formatCurrency(u.total_ingreso)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroll>
            {verMas(usuarios.length)}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
