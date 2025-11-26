"use client";

import { SignOutButton } from "@/components/sign-out-button";

/**
 * Admin Top Bar
 * Enterprise-grade header with user info and actions
 */

interface TopBarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left side - could add breadcrumbs or page title here */}
        <div className="flex-1">
          {/* Placeholder for future breadcrumbs */}
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications icon */}
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200"></div>

          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
            
            {/* User avatar */}
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Sign out button */}
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
