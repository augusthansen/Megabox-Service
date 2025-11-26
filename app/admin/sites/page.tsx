"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Sites Page
 * Enterprise view of all customer sites
 */

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
  };
  _count: {
    machines: number;
  };
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/sites");
      if (response.ok) {
        const data = await response.json();
        setSites(data);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading sites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sites</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage all customer locations
          </p>
        </div>
      </div>

      {/* Sites Table */}
      <div className="table-container">
        {sites.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-4">No sites found</p>
            <Link href="/admin/customers" className="btn-primary">
              Add a Customer First
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Machines</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id}>
                  <td>
                    <div className="font-medium text-slate-900">{site.name}</div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${site.company.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {site.company.name}
                    </Link>
                  </td>
                  <td className="text-slate-600">
                    {site.city && site.state ? (
                      <span>{site.city}, {site.state}</span>
                    ) : site.address ? (
                      <span>{site.address}</span>
                    ) : (
                      <span className="text-slate-400">No location</span>
                    )}
                  </td>
                  <td className="text-slate-600">
                    {site._count.machines} machine{site._count.machines !== 1 ? "s" : ""}
                  </td>
                  <td>
                    <Link
                      href={`/admin/sites/${site.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
