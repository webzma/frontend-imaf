import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };

export function createOgImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#faf8f7",
        padding: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: 14,
            height: 56,
            marginRight: 20,
            backgroundColor: "#b52569",
          }}
        />
        <div style={{ fontSize: 40, fontWeight: 700, color: "#1f1a1c" }}>
          IMAF
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            marginBottom: 12,
            color: "#b52569",
          }}
        >
          Inscríbete en línea.
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#1f1a1c",
          }}
        >
          Aprende presencialmente.
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 28, color: "#5f565a" }}>
        Cursos en Independencia, Yaracuy · Certificación oficial
      </div>
    </div>,
    ogImageSize,
  );
}
