"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Facilities Page
 * Enterprise view of all customer facilities
 */

interface Site {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  primaryContact: {
    id: string;
    name: string;
    email: string;
  } | null;
  company: {
    id: string;
    name: string;
  };
  _count: {
    machines: number;
  };
}

export default function FacilitiesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sites");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched facilities:", data);
        setSites(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch facilities:", response.status, errorData);
        alert(`Failed to load facilities: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching facilities:", error);
      alert("Error loading facilities. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading facilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Facilities</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage all customer locations
          </p>
        </div>
      </div>

      {/* Facilities Table */}
      <div className="table-container">
        {sites.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">No facilities found</p>
            <Link href="/admin/customers" className="btn-primary">
              Add a Customer First
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Facility Name</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Main Contact</th>
                <th>Machines</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id}>
                  <td>
                    <div className="font-medium text-slate-900 dark:text-white">{site.name}</div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${site.company.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {site.company.name}
                    </Link>
                  </td>
                  <td className="text-slate-600 dark:text-slate-300">
                    {site.city && site.state ? (
                      <span>{site.city}, {site.state}</span>
                    ) : site.address ? (
                      <span>{site.address}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">No location</span>
                    )}
                  </td>
                  <td className="text-slate-600 dark:text-slate-300">
                    {site.primaryContact ? (
                      <div>
                        <div className="font-medium dark:text-white">{site.primaryContact.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{site.primaryContact.email}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">No contact assigned</span>
                    )}
                  </td>
                  <td className="text-slate-600 dark:text-slate-300">
                    {site._count.machines} machine{site._count.machines !== 1 ? "s" : ""}
                  </td>
                  <td>
                    <Link
                      href={`/admin/facilities/${site.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
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
