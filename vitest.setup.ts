import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpia el DOM renderizado después de cada test.
afterEach(() => {
  cleanup();
});
