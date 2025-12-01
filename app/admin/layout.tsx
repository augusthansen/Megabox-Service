import { AdminSidebar } from "@/components/admin/sidebar";
import { TopBar } from "@/components/admin/top-bar";
import { getSession } from "@/lib/jwt";
import { redirect } from "next/navigation";

/**
 * Admin Layout (Server Component)
 *
 * This layout wraps all admin pages with:
 * - Sidebar navigation
 * - Top bar with user info
 * - Main content area
 * - Server-side authentication check
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session check
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar user={session} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
