import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // `next.config.ts` inyecta `API_URL` al compilar, pero vitest no pasa por
    // Next: sin esto las pantallas construían URLs como "undefinedapi/login" y
    // cinco tests fallaban por la configuración, no por el código.
    env: { API_URL: "http://localhost:8000/" },
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    // Los tests de componentes (React + Radix UI en jsdom) tardan más que
    // los 5s por defecto al correr la suite completa en paralelo.
    testTimeout: 15000,
  },
});
