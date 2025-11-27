"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Customer Portal Layout
 * Clean, simple layout for customer users
 */

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Check if user is a customer (not admin/tech)
    if (!["customer_admin", "customer_tech"].includes(parsedUser.role)) {
      router.push("/admin");
      return;
    }

    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  const handleSignOut = () => {
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/customer" className="flex items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Megabox Service</h1>
                  <p className="text-xs text-slate-500">Customer Portal</p>
                </div>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/customer"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/customer/tickets"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                My Tickets
              </Link>
              <Link
                href="/customer/machines"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Machines
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-4 pb-3">
            <Link
              href="/customer"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/customer/tickets"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Tickets
            </Link>
            <Link
              href="/customer/machines"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Machines
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-slate-500">
              © 2024 Megabox Supply. Need help? Contact support@megaboxsupply.com
            </p>
            <p className="text-xs text-slate-400 mt-2 sm:mt-0">
              Service Portal v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

