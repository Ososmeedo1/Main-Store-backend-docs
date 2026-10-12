"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

// Default to the system preference (falls back to light). Explicit System /
// Light / Dark choice lives in the header theme selector.
export function ThemeProvider({ children }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemeProvider>
  );
}
