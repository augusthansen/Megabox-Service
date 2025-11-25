import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";

/**
 * NextAuth API Route
 * 
 * This file creates the API endpoint that handles authentication.
 * NextAuth automatically creates routes like:
 * - /api/auth/signin (login)
 * - /api/auth/signout (logout)
 * - /api/auth/session (get current session)
 * 
 * The [nextauth] folder name is special - NextAuth looks for it.
 */

const handler = NextAuth(authOptions);

// Export GET and POST handlers
// GET is needed for session checks, POST for signin/signout
export { handler as GET, handler as POST };

