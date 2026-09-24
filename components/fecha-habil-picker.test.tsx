import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FechaHabilPicker } from "@/components/fecha-habil-picker";

/** Botón de un día del calendario abierto (octubre de 2026). */
const dia = (n: number) =>
  screen.getByRole("button", { name: new RegExp(`^\\S+ ${n} de octubre`) });

async function abrirOctubre(onChange = vi.fn(), min?: string) {
  render(<FechaHabilPicker value="2026-10-14" onChange={onChange} min={min} />);
  await userEvent.click(screen.getByRole("button", { name: /oct/i }));
  return onChange;
}

describe("FechaHabilPicker", () => {
  it("no deja elegir sábados ni domingos", async () => {
    await abrirOctubre();
    expect(dia(10)).toBeDisabled(); // sábado
    expect(dia(11)).toBeDisabled(); // domingo
  });

  it("no deja elegir feriados", async () => {
    await abrirOctubre();
    expect(dia(12)).toBeDisabled(); // Día de la Resistencia Indígena
  });

  it("devuelve la fecha al elegir un día hábil", async () => {
    const onChange = await abrirOctubre();
    await userEvent.click(dia(13));
    expect(onChange).toHaveBeenCalledWith("2026-10-13");
  });

  it("no deja elegir días anteriores al mínimo", async () => {
    await abrirOctubre(vi.fn(), "2026-10-14");
    expect(dia(13)).toBeDisabled();
    expect(dia(15)).toBeEnabled();
  });
});
