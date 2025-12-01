import { getSession as getJWTSession, JWTPayload } from "./jwt";

/**
 * Helper function to get the current user's session
 *
 * Use this in server components or API routes to check:
 * - If someone is logged in
 * - Who is logged in
 * - What their role is
 *
 * Example:
 *   const session = await getSession();
 *   if (session) {
 *     console.log("User is logged in:", session.email);
 *   }
 */
export async function getSession(): Promise<JWTPayload | null> {
  return await getJWTSession();
}

// Re-export types for convenience
export type { JWTPayload };
