import "next-auth";
import "next-auth/jwt";

/**
 * Type definitions for NextAuth
 * 
 * This file extends NextAuth's types so TypeScript knows
 * about the extra fields we're adding (like 'role' and 'id').
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}


