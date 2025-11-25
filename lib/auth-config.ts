import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { verifyPassword } from "./auth";

/**
 * NextAuth Configuration
 * 
 * This file configures how users log in to your app.
 * We're using "Credentials" which means email + password login.
 */
export const authOptions: NextAuthOptions = {
  // Use "credentials" provider (email + password)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // This function runs when someone tries to log in
        
        try {
          if (!credentials?.email || !credentials?.password) {
            // If email or password is missing, reject login
            console.log("❌ Missing email or password");
            return null;
          }

          console.log("🔍 Looking for user:", credentials.email);

          // Find the user in the database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            // User doesn't exist
            console.log("❌ User not found:", credentials.email);
            return null;
          }

          console.log("✅ User found:", user.email);

          // Check if the password is correct
          const isValid = await verifyPassword(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            // Wrong password
            console.log("❌ Invalid password for:", credentials.email);
            return null;
          }

          console.log("✅ Password is valid! Logging in:", user.email);

          // Password is correct! Return user info (this creates the session)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          // Log any errors that occur
          console.error("❌ Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  
  // Session configuration
  session: {
    strategy: "jwt", // Store session in a JWT token (not in database)
    maxAge: 24 * 60 * 60, // Session lasts 24 hours
  },

  // Pages configuration - set error page to prevent GET redirects
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors back to login instead of using GET
  },
  
  // Secret for JWT encoding (required)
  secret: process.env.NEXTAUTH_SECRET || "RMH3SXdTxpVR3g3bC3XXSTAPQjbBJCZGcllz15s49kY=",
  
  // Use relative URLs to avoid port mismatch issues
  // This way it works on any port
  useSecureCookies: process.env.NODE_ENV === "production",
  
  // Debug mode to see what's happening
  debug: process.env.NODE_ENV === "development",

  // Callbacks - run when session is created or accessed
  callbacks: {
    async jwt({ token, user }) {
      // When user logs in, add their info to the token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // When we get the session, add user info from token
      try {
        if (session.user && token) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        // Return session even if there's an error
        return session;
      }
    },
  },
};

