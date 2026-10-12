// Central site + link config. No secrets here.
export const SITE = {
  name: "Main Store API Docs",
  shortName: "Main Store API",
  collection: "Ecommerce",
  description:
    "Production-grade documentation and live playground for the Main Store backend: auth, products, cart, orders, coupons, reviews and more.",
  youtube: "https://youtube.com/@masar1424",
  portfolio: "https://osama.osamaoriginal77.workers.dev/",
  feedback: "https://masar-fawn.vercel.app/",
  author: "Osama El-Gamal",
};

export function siteUrl() {
  const u = process.env.SITE_URL || "http://localhost:3000";
  return u.replace(/\/$/, "");
}

export function allowedBaseUrls() {
  // Defaults to every `url` found in the Bruno environments (Dev + Production).
  // The https variant of the Production host is included: Bruno stores http://
  // but the live backend serves https:// too (proxy matches by host).
  // Override via ALLOWED_BASE_URLS when needed.
  const raw =
    process.env.ALLOWED_BASE_URLS ||
    "https://ecommerce-backend-orpin-five.vercel.app,http://ecommerce-backend-orpin-five.vercel.app,http://localhost:3000";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}
