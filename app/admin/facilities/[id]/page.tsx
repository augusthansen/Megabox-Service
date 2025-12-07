"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import FloorPlanCanvas to avoid SSR issues with Konva
const FloorPlanCanvas = dynamic(
  () => import("@/components/floor-plan/FloorPlanCanvas"),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> }
);

/**
 * Facility Detail Page
 *
 * Shows facility information, machines, and floor plan.
 */

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  model: string | null;
  status: string | null;
  isCurrentlyDown: boolean;
}

interface Site {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  company: {
    id: string;
    name: string;
    pricingTier: string;
  };
  machines: Machine[];
  _count: {
    machines: number;
  };
}

type TabType = "overview" | "floor-plan";

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "overview"
  );
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchSite();
    // Get user role from session
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
  }, [siteId]);

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setSite(data);
      } else {
        router.push("/admin/facilities");
      }
    } catch (error) {
      console.error("Error fetching facility:", error);
      router.push("/admin/facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading facility...</p>
      </div>
    );
  }

  if (!site) {
    return null;
  }

  const isSuperAdmin = userRole === "super_admin";

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/admin/facilities"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          ← Back to Facilities
        </Link>
      </div>

      {/* Facility Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{site.name}</h2>
            {site.address && (
              <p className="text-gray-600 dark:text-gray-300">
                {site.address}
                {site.city && `, ${site.city}`}
                {site.state && `, ${site.state}`}
                {site.zipCode && ` ${site.zipCode}`}
              </p>
            )}
            <div className="mt-4">
              <Link
                href={`/admin/customers/${site.company.id}`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                Customer: {site.company.name}
              </Link>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pricing Tier: <span className="capitalize">{site.company.pricingTier}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Machines: <span className="text-2xl font-semibold text-gray-900 dark:text-white">{site._count.machines}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange("floor-plan")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "floor-plan"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Floor Plan
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        /* Machines Section */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Machines</h3>
            <button
              onClick={() => router.push(`/admin/machines?siteId=${site.id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + Add Machine
            </button>
          </div>

          <div className="p-6">
            {site.machines.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No machines yet</p>
                <button
                  onClick={() => router.push(`/admin/machines?siteId=${site.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Machine
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {site.machines.map((machine) => (
                  <div
                    key={machine.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {machine.model || machine.name}
                        </h4>
                        {machine.serialNumber && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Serial: {machine.serialNumber}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            machine.isCurrentlyDown
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : machine.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : machine.status === "maintenance"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                            {machine.isCurrentlyDown ? "Down" : machine.status || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/machines/${machine.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Floor Plan Section */
        <FloorPlanCanvas
          siteId={siteId}
          isEditMode={false}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}
