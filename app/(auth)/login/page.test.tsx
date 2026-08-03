import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

/* ── Mocks de Next.js ── */

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  default: (props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src}
      alt={props.alt}
      width={props.width}
      height={props.height}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

/* ── Mock de fetch ── */

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  pushMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  // Restaura el fetch global para no filtrar el stub a otros archivos.
  vi.unstubAllGlobals();
});

/* ── Helpers ── */

const credencialesValidas = { email: "admin@imaf.com", password: "clave12345" };

async function llenarCredenciales(
  user: ReturnType<typeof userEvent.setup>,
  { email, password }: { email: string; password: string },
) {
  await user.type(screen.getByLabelText("Correo electrónico"), email);
  await user.type(screen.getByLabelText("Contraseña"), password);
}

/* ── Tests ── */

describe("Página de login", () => {
  it("muestra los errores de campos obligatorios al enviar vacío", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(
      await screen.findByText("El correo es obligatorio"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("La contraseña es obligatoria"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza un correo sin formato válido", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await llenarCredenciales(user, {
      email: "correo-invalido",
      password: "clave12345",
    });
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByText("Correo inválido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza contraseñas de menos de 8 caracteres", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await llenarCredenciales(user, {
      email: "admin@imaf.com",
      password: "1234567",
    });
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["admin", "/admin"],
    ["profesor", "/instructor"],
    ["estudiante", "/estudiante"],
  ])("redirige al panel de %s tras iniciar sesión", async (role, ruta) => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { role }, token: "tok-123" }),
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await llenarCredenciales(user, credencialesValidas);
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/login");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(ruta));
  });

  it("muestra el mensaje del servidor cuando las credenciales son incorrectas", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Credenciales incorrectas." }),
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await llenarCredenciales(user, credencialesValidas);
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(
      await screen.findByText("Credenciales incorrectas."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
