import { test, expect } from "@playwright/test";

// El login pasa por el BFF, que habla con e2e/mock-backend.mjs. Así se
// ejercitan el BFF, la cookie HttpOnly y el guard proxy.ts sin tocar un
// backend real.

test.describe("Login", () => {
  test("muestra el formulario de acceso", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Bienvenido" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Correo electrónico" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Contraseña" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Ingresar/ })).toBeVisible();
  });

  test("login exitoso de admin redirige al panel de administración", async ({
    page,
  }) => {
    await page.goto("/login");
    await page
      .getByRole("textbox", { name: "Correo electrónico" })
      .fill("admin@imaf.com");
    await page.getByRole("textbox", { name: "Contraseña" }).fill("password123");
    await page.getByRole("button", { name: /Ingresar/ }).click();

    await expect(page).toHaveURL(/\/admin/);
  });

  test("el token de sesión no es legible por JavaScript", async ({ page }) => {
    await page.goto("/login");
    await page
      .getByRole("textbox", { name: "Correo electrónico" })
      .fill("admin@imaf.com");
    await page.getByRole("textbox", { name: "Contraseña" }).fill("password123");
    await page.getByRole("button", { name: /Ingresar/ }).click();

    await expect(page).toHaveURL(/\/admin/);

    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain("e2e-token-admin");
    expect(cookies).toContain("role=admin");
  });

  test("credenciales incorrectas muestran un mensaje de error", async ({
    page,
  }) => {
    await page.goto("/login");
    await page
      .getByRole("textbox", { name: "Correo electrónico" })
      .fill("admin@imaf.com");
    await page
      .getByRole("textbox", { name: "Contraseña" })
      .fill("wrong-password");
    await page.getByRole("button", { name: /Ingresar/ }).click();

    await expect(
      page.getByText("Las credenciales son incorrectas."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
