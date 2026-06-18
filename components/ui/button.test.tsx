import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renderiza su contenido", () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("dispara onClick al hacer click", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Enviar</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("no dispara onClick cuando está deshabilitado", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Bloqueado
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Bloqueado" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("aplica el variant via data-attribute", () => {
    render(<Button variant="destructive">Eliminar</Button>);
    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });
});
