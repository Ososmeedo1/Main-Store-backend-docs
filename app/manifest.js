import { SITE } from "@/lib/site";

export default function manifest() {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    start_url: "/",
    display: "standalone",
    background_color: "#f3f3f5",
    theme_color: "#0067c0",
    icons: [{ src: "/icon.png", sizes: "500x500", type: "image/png" }],
  };
}
