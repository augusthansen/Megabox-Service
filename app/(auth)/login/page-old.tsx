"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Login Page
 * 
 * This is the page users see when they need to log in.
 * It has a form with email and password fields.
 */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // This function runs when the form is submitted
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page refresh
    setError(""); // Clear any previous errors

    startTransition(async () => {
      try {
        // Use NextAuth's signIn function with proper error handling
        const result = await signIn("credentials", {
          email: email.trim(),
          password: password,
          redirect: false,
        });

        // Check the result
        if (result?.error) {
          // Login failed - show specific error if available
          const errorMessage = result.error === "CredentialsSignin" 
            ? "Invalid email or password. Please try again."
            : "Something went wrong. Please try again.";
          setError(errorMessage);
        } else if (result?.ok) {
          // Login successful! Redirect to admin dashboard
          window.location.href = "/admin";
        } else if (result === undefined) {
          // Sometimes NextAuth returns undefined on success
          // Wait a moment then redirect
          setTimeout(() => {
            window.location.href = "/admin";
          }, 100);
        } else {
          // Unexpected result
          console.log("Unexpected result:", result);
          setError("Something went wrong. Please try again.");
        }
      } catch (error) {
        // Something went wrong - log the full error for debugging
        console.error("Login error:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setError(`Something went wrong: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Megabox Service Portal
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} method="post">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@megaboxsupply.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Default admin credentials:</p>
          <p className="font-mono text-xs mt-1">
            admin@megaboxsupply.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}

