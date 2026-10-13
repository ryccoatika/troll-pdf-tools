import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#ffb020", gap: 10 }}>
        <div style={{ width: 110, height: 18, background: "#111", borderRadius: 5 }} />
        <div style={{ width: 12, height: 26, background: "#111" }} />
        <div style={{ width: 110, height: 14, background: "#111", borderRadius: 5 }} />
        <div style={{ width: 96, height: 30, background: "#111", borderRadius: 5 }} />
      </div>
    ),
    size,
  );
}
