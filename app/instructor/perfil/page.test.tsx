import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithQuery } from "@/lib/test-utils";
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

function mockCatalogs() {
  // Mock the catalog fetch calls that happen on mount
  fetchMock
    .mockResolvedValueOnce(ok([])) // especialidades
    .mockResolvedValueOnce(ok([])) // departamentos
    .mockResolvedValueOnce(ok([])); // titulos
}

// Default mock: /api/me + 3 catalogs
function mockMeAndCatalogs() {
  fetchMock.mockResolvedValueOnce(ok(meMock));
  mockCatalogs();
}

const meMock = {
  id: 1,
  name: "María García",
  email: "maria@correo.com",
  profesor: {
    id: 7,
    cedula: null,
    telefono: null,
    municipio: null,
    especialidad: null,
    titulo: null,
    departamento: null,
    fecha_nacimiento: null,
    genero: null,
    foto: null,
  },
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

/* ── Helpers ── */

async function abrirEdicion(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Editar" }));
}

/* ── Tests ── */

describe("Perfil de instructor", () => {
  it("carga y muestra los datos del perfil", async () => {
    mockMeAndCatalogs();
    renderWithQuery(<PerfilPage />);

    expect(await screen.findByText("María García")).toBeInTheDocument();
    expect(screen.getByText("maria@correo.com")).toBeInTheDocument();
  });

  it("sanitiza cédula y teléfono al escribir", async () => {
    mockMeAndCatalogs();
    const user = userEvent.setup();
    renderWithQuery(<PerfilPage />);

    await abrirEdicion(user);

    const cedula = screen.getByLabelText("Cédula");
    await user.type(cedula, "12ab34");
    expect(cedula).toHaveValue("1234");

    const telefono = screen.getByLabelText("Teléfono");
    await user.type(telefono, "0412xx00");
    expect(telefono).toHaveValue("041200");

    // Ingresa un teléfono válido de 11 dígitos y verifica que se acepte
    await user.clear(telefono);
    await user.type(telefono, "04121234567");
    expect(telefono).toHaveValue("04121234567");
  });

  it("muestra los selects de catálogos vacíos cuando no hay datos", async () => {
    mockMeAndCatalogs();
    renderWithQuery(<PerfilPage />);

    const user = userEvent.setup();
    await abrirEdicion(user);

    // The selects should be present
    expect(
      screen.getAllByText("No especificado").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("guarda los cambios, envía el PUT al profesor y muestra el toast", async () => {
    mockMeAndCatalogs();
    fetchMock
      // PUT de actualización
      .mockResolvedValueOnce(ok({ telefono: "04121234567" }));

    const user = userEvent.setup();
    renderWithQuery(<PerfilPage />);

    await abrirEdicion(user);

    await user.type(screen.getByLabelText("Teléfono"), "04121234567");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    // Busca la llamada PUT (la primera es el GET inicial de /api/me)
    const llamadaPut = await waitFor(() => {
      const llamada = fetchMock.mock.calls.find(
        ([, init]) => (init as RequestInit).method === "PUT",
      );
      expect(llamada).toBeDefined();
      return llamada!;
    });
    const [url, init] = llamadaPut;
    expect(String(url)).toContain("api/profesor/perfil/7");

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      telefono: "04121234567",
      cedula: null,
      especialidad_id: null,
      titulo_id: null,
    });

    expect(toastMock.success).toHaveBeenCalledWith(
      "Perfil actualizado correctamente.",
    );

    // Vuelve al modo vista (botón "Editar").
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Editar" }),
      ).toBeInTheDocument(),
    );
  });
});
