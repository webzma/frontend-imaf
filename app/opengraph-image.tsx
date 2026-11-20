import { createOgImage, ogImageSize } from "@/lib/og-image";

export const alt =
  "IMAF — Inscríbete en línea, aprende presencialmente en Independencia, Yaracuy";
export const size = ogImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOgImage();
}
