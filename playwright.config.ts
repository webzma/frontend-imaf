import { defineConfig, devices } from "@playwright/test";

const MOCK_BACKEND = "http://127.0.0.1:4100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Levanta un backend falso y el server de Next apuntando a él.
  webServer: [
    {
      command: "node e2e/mock-backend.mjs",
      url: `${MOCK_BACKEND}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // Se compila y arranca en producción: en `next dev` la primera
      // compilación de cada ruta puede tardar más que el timeout de las
      // aserciones y volver el test intermitente.
      command: "pnpm build && pnpm start",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 180_000,
      env: { BACKEND_URL: MOCK_BACKEND },
    },
  ],
});
