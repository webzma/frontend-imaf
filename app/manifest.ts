import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA, servido en `/manifest.webmanifest`.
 *
 * `start_url` es la raíz a propósito: `proxy.ts` ya lleva a cada usuario con
 * sesión a su panel, así que la app instalada abre en el lugar correcto para
 * cualquier rol sin necesidad de un manifest por rol.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "IMAF — Instituto de la Mujer, Atención a la Familia y Formación para el Trabajo",
    short_name: "IMAF",
    description:
      "Formación para el trabajo en modalidad presencial. Inscríbete en línea y asiste a clases en nuestra sede.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Colores fijos: el manifest no puede leer los tokens de `globals.css`.
    // Equivalen a `--background` y `--primary` del tema claro.
    background_color: "#faf8f7",
    theme_color: "#b52569",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
