"use client";

import { SignOutButton } from "@/components/sign-out-button";
import NotificationBell from "@/components/notifications/NotificationBell";

/**
 * Admin Top Bar
 * Enterprise-grade header with user info and actions
 */

interface TopBarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onMenuClick?: () => void;
}

export function TopBar({ user, onMenuClick }: TopBarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center space-x-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {/* Placeholder for future breadcrumbs */}
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          <NotificationBell userId={user.id} />

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-600"></div>

          {/* User info - hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
            
            {/* User avatar */}
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Mobile: Just avatar */}
          <div className="md:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Sign out button */}
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
