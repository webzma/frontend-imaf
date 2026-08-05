import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "./page";

/* ── Mocks de Next.js ── */

// vi.hoisted permite compartir el mock de push entre el factory y los tests.
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

/* ── Helpers para llenar el formulario ── */

async function llenarDatosValidos(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Primer nombre"), "Juan");
  await user.type(screen.getByLabelText(/Segundo nombre/), "Pablo");
  await user.type(screen.getByLabelText("Primer apellido"), "Pérez");
  await user.type(screen.getByLabelText("Segundo apellido"), "Gómez");
  await user.type(
    screen.getByLabelText("Correo electrónico"),
    "juan@correo.com",
  );
  await user.type(screen.getByLabelText("Cédula"), "12345678");
  await user.type(screen.getByLabelText("Teléfono"), "04121234567");
  fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), {
    target: { value: "2000-01-01" },
  });

  // Selects de Radix: abrir el trigger y elegir una opción del portal.
  await user.click(screen.getByRole("combobox", { name: "Género" }));
  await user.click(await screen.findByRole("option", { name: "Masculino" }));

  await user.click(screen.getByRole("combobox", { name: "Municipio" }));
  await user.click(await screen.findByRole("option", { name: "San Felipe" }));

  await user.type(
    screen.getByLabelText("Dirección de habitación"),
    "Av. Principal, casa N° 5",
  );
}

/* ── Tests ── */

describe("Página de registro", () => {
  it("muestra los errores de los campos obligatorios al enviar vacío", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText("El primer nombre es obligatorio"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("El primer apellido es obligatorio"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("El segundo apellido es obligatorio"),
    ).toBeInTheDocument();
    expect(screen.getByText("El correo es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La cédula es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("El teléfono es obligatorio")).toBeInTheDocument();
    expect(
      screen.getByText("La fecha de nacimiento es obligatoria"),
    ).toBeInTheDocument();
    expect(screen.getByText("Selecciona un género")).toBeInTheDocument();
    expect(screen.getByText("Selecciona un municipio")).toBeInTheDocument();
    expect(screen.getByText("La dirección es obligatoria")).toBeInTheDocument();
    expect(
      screen.getByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
    expect(screen.getByText("Confirma tu contraseña")).toBeInTheDocument();

    // No debe haberse enviado nada al backend.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("muestra 'Las contraseñas no coinciden' al enviar contraseñas distintas", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await llenarDatosValidos(user);
    await user.type(screen.getByLabelText("Contraseña"), "clave12345");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "otra12345");

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText("Las contraseñas no coinciden"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sanitiza la cédula: elimina las letras mientras se escribe", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const cedula = screen.getByLabelText("Cédula");
    await user.type(cedula, "12ab34");

    expect(cedula).toHaveValue("1234");
  });

  it("envía los datos válidos al backend y redirige al rol estudiante", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { role: "estudiante" }, token: "tok-123" }),
    });

    render(<RegisterPage />);

    await llenarDatosValidos(user);
    await user.type(screen.getByLabelText("Contraseña"), "clave12345");
    await user.type(
      screen.getByLabelText("Confirmar contraseña"),
      "clave12345",
    );

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/register");
    expect((init as RequestInit).method).toBe("POST");

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      primer_nombre: "Juan",
      segundo_nombre: "Pablo",
      primer_apellido: "Pérez",
      segundo_apellido: "Gómez",
      email: "juan@correo.com",
      cedula: "12345678",
      telefono: "04121234567",
      genero: "masculino",
      municipio: "San Felipe",
      direccion: "Av. Principal, casa N° 5",
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/estudiante"));
  });
});
