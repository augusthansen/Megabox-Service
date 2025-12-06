"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme-context";

/**
 * App Providers
 *
 * This component wraps your app with all necessary providers:
 * - SessionProvider: NextAuth session management
 * - ThemeProvider: Light/Dark mode theme management
 */

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
