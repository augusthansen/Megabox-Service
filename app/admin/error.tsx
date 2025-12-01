"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("Admin section error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Dashboard Error
        </h2>
        <p className="text-gray-600 mb-6">
          An error occurred while loading this section. Your data is safe.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 px-3 py-1 rounded inline-block">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          <a
            href="/admin"
            className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            If this problem persists, please contact{" "}
            <a
              href="mailto:support@megaboxsupply.com"
              className="text-blue-600 hover:underline"
            >
              support@megaboxsupply.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
