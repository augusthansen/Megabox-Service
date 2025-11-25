"use client";

import { signOut } from "next-auth/react";

/**
 * Sign Out Button Component
 * 
 * A simple button that signs the user out when clicked.
 */

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-blue-600 hover:text-blue-800"
    >
      Sign out
    </button>
  );
}


