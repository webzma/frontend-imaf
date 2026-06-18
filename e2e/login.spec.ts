import { test, expect } from "@playwright/test";

// La petición de login (a la API real) se intercepta para que el E2E
// sea determinista y NO toque el backend de producción.
const LOGIN_ENDPOINT = /api\/login$/;

test.describe("Login", () => {
  test("muestra el formulario de acceso", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Bienvenido" }),
    ).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: /Ingresar/ })).toBeVisible();
  });

  test("login exitoso de admin redirige al panel de administración", async ({
    page,
  }) => {
    await page.route(LOGIN_ENDPOINT, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, email: "admin@imaf.com", role: "admin" },
          token: "fake-test-token",
        }),
      }),
    );

    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("admin@imaf.com");
    await page.getByLabel("Contraseña").fill("password123");
    await page.getByRole("button", { name: /Ingresar/ }).click();

    await expect(page).toHaveURL(/\/admin/);
  });

  test("credenciales incorrectas muestran un mensaje de error", async ({
    page,
  }) => {
    await page.route(LOGIN_ENDPOINT, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ message: "Las credenciales son incorrectas." }),
      }),
    );

    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("admin@imaf.com");
    await page.getByLabel("Contraseña").fill("wrong-password");
    await page.getByRole("button", { name: /Ingresar/ }).click();

    await expect(
      page.getByText("Las credenciales son incorrectas."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
