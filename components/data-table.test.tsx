import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type Column } from "@/components/data-table";

interface Fila {
  id: number;
  nombre: string;
  cedula: string;
}

const FILAS: Fila[] = [
  { id: 1, nombre: "Ana Rivas", cedula: "11111111" },
  { id: 2, nombre: "Beto Sosa", cedula: "22222222" },
];

const COLUMNAS: Column<Fila>[] = [
  {
    id: "nombre",
    header: "Nombre",
    sortKey: "nombre",
    primary: true,
    mobileLabel: null,
    cell: (f) => f.nombre,
  },
  {
    id: "cedula",
    header: "Cédula",
    mobileLabel: "Cédula",
    cell: (f) => f.cedula,
  },
];

function renderTabla(
  props: Partial<Parameters<typeof DataTable<Fila>>[0]> = {},
) {
  return render(
    <DataTable
      columns={COLUMNAS}
      rows={FILAS}
      rowKey={(f) => f.id}
      caption="Personas registradas"
      {...props}
    />,
  );
}

describe("DataTable", () => {
  it("pinta la tabla de escritorio y las tarjetas móviles con la misma definición", () => {
    renderTabla();

    // Una sola definición de columnas alimenta las dos formas, así que el
    // nombre aparece dos veces: en la fila y en la tarjeta.
    expect(screen.getAllByText("Ana Rivas")).toHaveLength(2);
    expect(screen.getAllByText("11111111")).toHaveLength(2);

    // "Cédula" sale tres veces: la cabecera de la tabla más la etiqueta del
    // par dato/valor de cada tarjeta.
    expect(screen.getAllByText("Cédula")).toHaveLength(3);
  });

  it("describe la tabla con un caption para lectores de pantalla", () => {
    renderTabla();
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Personas registradas",
    );
  });

  it("marca las cabeceras como columnas", () => {
    renderTabla();
    const cabeceras = screen.getAllByRole("columnheader");
    expect(cabeceras.length).toBeGreaterThan(0);
    cabeceras.forEach((th) => expect(th).toHaveAttribute("scope", "col"));
  });

  it("anuncia el estado de orden con aria-sort y avisa al pulsarlo", async () => {
    const onSort = vi.fn();
    renderTabla({ sort: { column: "nombre", direction: "asc" }, onSort });

    const cabecera = screen
      .getAllByRole("columnheader")
      .find((th) => within(th).queryByRole("button"))!;
    expect(cabecera).toHaveAttribute("aria-sort", "ascending");

    await userEvent.click(within(cabecera).getByRole("button"));
    expect(onSort).toHaveBeenCalledWith("nombre");
  });

  it("una columna sin clave de orden no es pulsable", () => {
    renderTabla({
      sort: { column: "nombre", direction: "asc" },
      onSort: vi.fn(),
    });

    const cedula = screen
      .getAllByRole("columnheader")
      .find((th) => th.textContent?.startsWith("Cédula"))!;
    expect(within(cedula).queryByRole("button")).toBeNull();
    expect(cedula).not.toHaveAttribute("aria-sort");
  });

  it("muestra el estado vacío en lugar de una tabla sin filas", () => {
    renderTabla({ rows: [], empty: <p>Nada por aquí</p> });

    expect(screen.getByText("Nada por aquí")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("no pinta filas mientras carga", () => {
    renderTabla({ loading: true });
    expect(screen.queryByText("Ana Rivas")).toBeNull();
  });

  it("cada casilla de selección dice a qué fila pertenece", async () => {
    const toggle = vi.fn();
    renderTabla({
      selection: {
        isSelected: () => false,
        toggle,
        toggleAll: vi.fn(),
        allState: false,
        label: (f: Fila) => f.nombre,
      },
    });

    const casillas = screen.getAllByRole("checkbox", {
      name: "Seleccionar Ana Rivas",
    });
    await userEvent.click(casillas[0]);
    expect(toggle).toHaveBeenCalledWith(FILAS[0]);
  });
});
