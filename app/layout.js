import { ThemeProvider } from "@/components/layout/theme-provider";
import { ApiProvider } from "@/components/api/api-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SITE, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} — ${SITE.collection} REST API`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ApiProvider>
            <a
              href="#main"
              className="mica-btn mica-btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
            >
              Skip to content
            </a>
            <Header />
            <div id="main" className="min-w-0">{children}</div>
            <Footer />
          </ApiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
