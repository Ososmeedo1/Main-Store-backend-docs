import { ImageResponse } from "next/og";
import { getEndpoint } from "@/lib/api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// High Contrast card: solid white sheet, thick black border, bold black
// method tag, near-black title. No gradients, no decoration.
export default async function OgImage({ params }) {
  const { group, endpoint } = await params;
  const ep = getEndpoint(group, endpoint);
  const method = ep?.method || "API";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          background: "#ffffff", fontFamily: "sans-serif",
          border: "16px solid #000000",
        }}
      >
        <div
          style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: 80, width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ background: "#000000", padding: "8px 24px", fontSize: 36, fontWeight: 700, color: "#ffffff" }}>
              {method}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#333a44", textDecoration: "underline" }}>{ep?.group || "Main Store API"}</div>
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, marginTop: 24, color: "#000000" }}>
            {ep?.name || "Main Store API Docs"}
          </div>
          <div style={{ fontSize: 32, marginTop: 12, color: "#000000", fontFamily: "monospace", textDecoration: "underline" }}>
            {method} {ep?.path || ""}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
