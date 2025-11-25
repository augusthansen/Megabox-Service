"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Site Detail Page
 * 
 * Shows site information and its machines.
 */

interface Machine {
  id: string;
  serialNumber: string;
  model: string;
  status: string;
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

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSite();
  }, [siteId]);

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setSite(data);
      } else {
        router.push("/admin/sites");
      }
    } catch (error) {
      console.error("Error fetching site:", error);
      router.push("/admin/sites");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading site...</p>
      </div>
    );
  }

  if (!site) {
    return null;
  }

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/admin/sites"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Sites
        </Link>
      </div>

      {/* Site Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{site.name}</h2>
            {site.address && (
              <p className="text-gray-600">
                {site.address}
                {site.city && `, ${site.city}`}
                {site.state && `, ${site.state}`}
                {site.zipCode && ` ${site.zipCode}`}
              </p>
            )}
            <div className="mt-4">
              <Link
                href={`/admin/customers/${site.company.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Customer: {site.company.name}
              </Link>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                Pricing Tier: <span className="capitalize">{site.company.pricingTier}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Total Machines: <span className="text-2xl font-semibold text-gray-900">{site._count.machines}</span>
          </p>
        </div>
      </div>

      {/* Machines Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Machines</h3>
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
              <p className="text-gray-500 mb-4">No machines yet</p>
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
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{machine.model}</h4>
                      <p className="text-sm text-gray-600">Serial: {machine.serialNumber}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        machine.status === "active"
                          ? "bg-green-100 text-green-800"
                          : machine.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {machine.status}
                      </span>
                    </div>
                    <Link
                      href={`/admin/machines/${machine.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
    </div>
  );
}


