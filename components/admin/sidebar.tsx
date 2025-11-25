"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Admin Sidebar Navigation
 * 
 * This is the main navigation sidebar for the admin panel.
 * It shows all the admin features and highlights the current page.
 */

interface NavItem {
  name: string;
  href: string;
  icon: string; // We'll use emoji for now, can upgrade to icons later
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Customers", href: "/admin/customers", icon: "🏢" },
  { name: "Sites", href: "/admin/sites", icon: "📍" },
  { name: "Machines", href: "/admin/machines", icon: "⚙️" },
  { name: "Tickets", href: "/admin/tickets", icon: "🎫" },
  { name: "Users", href: "/admin/users", icon: "👥" },
  { name: "Invoices", href: "/admin/invoices", icon: "💰" },
  { name: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white min-h-screen">
      {/* Logo/Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Megabox Service</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          Megabox Service Portal
        </p>
      </div>
    </div>
  );
}


