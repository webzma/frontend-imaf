import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Tabla del panel.
 *
 * `<th>` lleva `scope="col"` siempre: sin él un lector de pantalla no puede
 * asociar una celda con su encabezado y la tabla se lee como una lista plana
 * de valores sueltos.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom", className)}
      {...props}
    />
  );
}

/** Envoltorio con scroll horizontal y la primera columna fija en móvil. */
function TableScroll({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-scroll"
      className={cn("table-scroll", className)}
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={className} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-outline-variant transition-colors last:border-b-0 hover:bg-surface-container data-[state=selected]:bg-primary-container/40",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "px-6 py-3.5 text-left font-sans text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-6 py-4 font-sans text-sm text-on-surface", className)}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("sr-only", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableScroll,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
