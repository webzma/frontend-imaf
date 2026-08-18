"use client";

import { useState } from "react";

/**
 * Avatar de persona: foto si existe, iniciales si no.
 *
 * Antes cada pantalla dibujaba su propio círculo con iniciales y repetía su
 * propia copia de `getInitials`, de modo que la foto que el usuario sube en su
 * perfil solo se veía en esa misma pantalla. Este componente es el único lugar
 * donde se decide cómo se ve una persona en la interfaz.
 *
 * Las fotos viven en Cloudinary (URL absoluta en `foto`). Si la URL falla —
 * imagen borrada, red caída — cae a las iniciales en vez de dejar el hueco
 * roto.
 */

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || "?";
}

/* La talla es el paso de la escala de Tailwind, no una etiqueta abstracta: el
   marcado que se reemplazó ya venía en esos pasos y así cada llamada conserva
   el tamaño que tenía. Las clases van escritas enteras porque Tailwind no
   compila nombres construidos en tiempo de ejecución. */
const SIZES = {
  7: { box: "size-7", text: "text-[10px]" },
  8: { box: "size-8", text: "text-xs" },
  9: { box: "size-9", text: "text-sm" },
  10: { box: "size-10", text: "text-sm" },
  11: { box: "size-11", text: "text-sm" },
  12: { box: "size-12", text: "text-base" },
  14: { box: "size-14", text: "text-lg" },
  16: { box: "size-16", text: "text-xl" },
  20: { box: "size-20", text: "text-2xl" },
} as const;

const TONES = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  /* Pase de lista: el círculo se tiñe según la asistencia. Sigue siendo un
     refuerzo, no el único canal — la fila entera cambia de fondo y el control
     de presente/ausente lleva su propia etiqueta. */
  success: "bg-success-container text-on-success-container",
  muted: "bg-surface-container text-muted-foreground",
  /* La barra lateral tiene su propia paleta y un contraste ya verificado
     contra el fondo del sidebar; no usa los contenedores de la página. */
  sidebar: "bg-primary/20 border border-primary/30 text-primary",
} as const;

export type AvatarSize = keyof typeof SIZES;
export type AvatarTone = keyof typeof TONES;

export function Avatar({
  src,
  name,
  size = 9,
  tone = "primary",
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div
      className={`${SIZES[size].box} shrink-0 flex items-center justify-center overflow-hidden rounded-full ${TONES[tone]} ${className}`}
    >
      {showPhoto ? (
        /* Decorativa: el nombre de la persona siempre acompaña al avatar en el
           marcado, así que anunciarlo otra vez sería ruido para el lector de
           pantalla (WCAG 1.1.1, imagen redundante). */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`font-sans font-bold ${SIZES[size].text}`}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
