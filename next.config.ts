import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // El navegador siempre habla con el BFF del mismo origen. El BFF reenvía a
    // BACKEND_URL e inyecta el token HttpOnly; así el token nunca llega al JS.
    API_URL: "/",
  },
  async headers() {
    return [
      {
        // Sin caché HTTP: de lo contrario, un service worker con errores
        // seguiría activo en los teléfonos después de publicar la corrección.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
