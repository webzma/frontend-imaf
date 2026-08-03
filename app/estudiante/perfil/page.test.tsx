import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PerfilPage from "./page";

/* ── Mock de sonner (toasts) ── */

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: toastMock }));

/* ── Mock de fetch ── */

const fetchMock = vi.fn();

function ok(body: unknown) {
  return Promise.resolve({ ok: true, json: async () => body });
}

const perfilMock = {
  id: 1,
  nombre: "Juan Pérez",
  cedula: "12345678",
  telefono: null,
  municipio: null,
  fecha_nacimiento: null,
  genero: null,
  fecha_inscripcion: "2026-01-15",
  estado: "activo",
  foto: null,
  user: { id: 1, name: "Juan Pérez", email: "juan@correo.com" },
};

beforeEach(() => {
  fetchMock.mockReset();
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ── Tests ── */

describe("Perfil de estudiante", () => {
  it("carga y muestra los datos del perfil", async () => {
    fetchMock.mockResolvedValueOnce(ok(perfilMock));
    render(<PerfilPage />);

    // El nombre aparece dos veces (tarjeta y credenciales): se apunta al heading
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" }),
    ).toBeInTheDocument();
    // El email y la cédula se repiten (tarjeta + secciones de datos)
    expect(screen.getAllByText("juan@correo.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("12345678").length).toBeGreaterThan(0);
  });

  it("sanitiza el teléfono: elimina las letras mientras se escribe", async () => {
    fetchMock.mockResolvedValueOnce(ok(perfilMock));
    const user = userEvent.setup();
    render(<PerfilPage />);

    await user.click(
      await screen.findByRole("button", { name: /editar perfil/i }),
    );

    const telefono = screen.getByLabelText("Teléfono");
    await user.type(telefono, "0412ab34");

    expect(telefono).toHaveValue("041234");
  });

  it("guarda los cambios, envía el PUT y cierra el formulario", async () => {
    fetchMock
      // GET inicial del perfil
      .mockResolvedValueOnce(ok(perfilMock))
      // PUT con el perfil actualizado
      .mockResolvedValueOnce(
        ok({ ...perfilMock, telefono: "041234", genero: "masculino" }),
      );

    const user = userEvent.setup();
    render(<PerfilPage />);

    await user.click(
      await screen.findByRole("button", { name: /editar perfil/i }),
    );

    await user.type(screen.getByLabelText("Teléfono"), "041234");

    // Género es el Select de Radix cuyo placeholder es "Sin especificar"
    const comboboxGenero = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("Sin especificar"));
    expect(comboboxGenero).toBeDefined();
    await user.click(comboboxGenero!);
    await user.click(await screen.findByRole("option", { name: "Masculino" }));

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    // Busca la llamada PUT (la primera es el GET inicial del perfil)
    const llamadaPut = await waitFor(() => {
      const llamada = fetchMock.mock.calls.find(
        ([, init]) => (init as RequestInit).method === "PUT",
      );
      expect(llamada).toBeDefined();
      return llamada!;
    });
    const [url, init] = llamadaPut;
    expect(String(url)).toContain("/api/estudiante/perfil");

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      telefono: "041234",
      genero: "masculino",
      municipio: null,
    });

    expect(toastMock.success).toHaveBeenCalledWith(
      "Perfil actualizado correctamente",
    );

    // El formulario de edición se cierra y vuelve el botón "Editar perfil".
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /editar perfil/i }),
      ).toBeInTheDocument(),
    );
  });
});
