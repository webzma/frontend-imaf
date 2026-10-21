import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEMA_OTRO, TemaSelect, temaInicial } from "@/components/tema-select";

const TEMAS = [
  { id: 2, titulo: "Color y luz", orden: 2 },
  { id: 1, titulo: "Introducción", orden: 1 },
];

describe("temaInicial", () => {
  it("usa el tema enlazado", () => {
    expect(temaInicial({ temario_id: 2, titulo: "x" }, TEMAS)).toBe("2");
  });
  it("encuentra el tema de una sesión antigua por su título", () => {
    expect(temaInicial({ titulo: "  introducción " }, TEMAS)).toBe("1");
  });
  it("sin coincidencia, título libre", () => {
    expect(temaInicial({ titulo: "Evaluación final" }, TEMAS)).toBe(TEMA_OTRO);
  });
});

describe("TemaSelect", () => {
  it("sin temario avisa y deja escribir el título", async () => {
    const onChange = vi.fn();
    render(
      <TemaSelect temas={[]} temarioId="" titulo="" onChange={onChange} />,
    );

    expect(screen.getByText(/aún no tiene temario/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Título de la sesión"), "R");
    expect(onChange).toHaveBeenLastCalledWith({
      temario_id: TEMA_OTRO,
      titulo: "R",
    });
  });

  it("con temario muestra el selector y el tema elegido", () => {
    render(
      <TemaSelect
        temas={TEMAS}
        temarioId="1"
        titulo="Introducción"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Introducción");
    expect(screen.queryByLabelText("Título de la sesión")).toBeNull();
  });
});
