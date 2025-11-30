"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Session Provider
 *
 * This component wraps your app and provides session data
 * to all components. We need this for NextAuth to work.
 */

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
