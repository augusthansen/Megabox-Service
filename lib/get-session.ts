import { getServerSession } from "next-auth";
import { authOptions } from "./auth-config";

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
 *     console.log("User is logged in:", session.user.email);
 *   }
 */
export async function getSession() {
  return await getServerSession(authOptions);
}


