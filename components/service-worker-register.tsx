"use client";

import { useEffect } from "react";

/**
 * Registra el service worker en producción.
 *
 * En desarrollo no se registra: guardaría archivos de compilaciones anteriores
 * y confundiría al recargar.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // La app funciona igual sin service worker: un fallo aquí no debe molestar
    // al usuario, solo dejar rastro para diagnóstico.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
  }, []);

  return null;
}
