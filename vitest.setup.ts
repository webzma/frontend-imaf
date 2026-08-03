import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpia el DOM renderizado después de cada test.
afterEach(() => {
  cleanup();
});

/* ── Polyfills para jsdom ──
   Los componentes de Radix UI (Select, Dialog, etc.) requieren APIs del
   navegador que jsdom no implementa. Estos stubs evitan que se rompan
   en los tests de componentes. */

// ResizeObserver: lo usan algunos componentes de Radix para medir el layout.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
}

// scrollIntoView: jsdom no lo implementa y Radix lo llama al abrir un Select
// para centrar la opción seleccionada.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Pointer capture: Radix Select lo usa al hacer click y jsdom no lo implementa.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
