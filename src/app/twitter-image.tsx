import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#f2f0ea",
          background: "radial-gradient(circle at 85% 0%, rgba(255,176,32,0.35), transparent 55%), radial-gradient(circle at 0% 100%, rgba(169,116,255,0.3), transparent 55%), #0a0b0f",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#ffb020" }} />
          <span>literally.pdf</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>PDF tools that do</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>
            <span style={{ color: "#ffb020", transform: "scaleY(0.6)", transformOrigin: "bottom", marginRight: 24 }}>exactly</span>
            what they say.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
          {[
            ["Compress", "#ffb020"],
            ["Split", "#5ef0ff"],
            ["Merge", "#a974ff"],
          ].map(([t, c]) => (
            <div key={t} style={{ display: "flex", whiteSpace: "nowrap", padding: "12px 26px", borderRadius: 999, border: `2px solid ${c}`, color: c }}>
              {`${t} PDF`}
            </div>
          ))}
          <div style={{ display: "flex", padding: "12px 0", color: "#9a9aa6", marginLeft: 12 }}>Free · In your browser · Literally</div>
        </div>
      </div>
    ),
    size,
  );
}
