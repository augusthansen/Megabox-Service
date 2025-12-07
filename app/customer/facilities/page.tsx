"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Customer Facilities Page
 * Lists all facilities (sites) for the customer's company with machine status overview
 */

interface Site {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  hasFloorPlan: boolean;
  machineStats: {
    total: number;
    active: number;
    down: number;
    maintenance: number;
  };
}

export default function CustomerFacilities() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const userData = sessionStorage.getItem("user");
        if (!userData) {
          setError("Please log in to view facilities");
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        if (!user.companyId) {
          setError("No company associated with your account");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/customer/sites?companyId=${user.companyId}`);
        if (response.ok) {
          const data = await response.json();
          setSites(data);
        } else {
          setError("Failed to load facilities");
        }
      } catch (err) {
        console.error("Error fetching sites:", err);
        setError("Failed to load facilities");
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading facilities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Calculate totals across all facilities
  const totalMachines = sites.reduce((sum, site) => sum + site.machineStats.total, 0);
  const activeMachines = sites.reduce((sum, site) => sum + site.machineStats.active, 0);
  const downMachines = sites.reduce((sum, site) => sum + site.machineStats.down, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Facilities
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            View your facilities and floor plans
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Facilities
            </h3>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {sites.length}
          </p>
        </div>

        <div className="card p-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Total Machines
            </h3>
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {totalMachines}
          </p>
        </div>

        <div className="card p-4 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Active
            </h3>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {activeMachines}
          </p>
        </div>

        <div className={`card p-4 dark:bg-slate-800 dark:border-slate-700 ${downMachines > 0 ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Down
            </h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${downMachines > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <svg className={`w-5 h-5 ${downMachines > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold mt-2 ${downMachines > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {downMachines}
          </p>
        </div>
      </div>

      {/* Facilities Grid */}
      {sites.length === 0 ? (
        <div className="card p-12 dark:bg-slate-800 dark:border-slate-700 text-center">
          <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Facilities Found
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            There are no facilities associated with your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <Link
              key={site.id}
              href={`/customer/facilities/${site.id}`}
              className={`card p-5 dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all group ${
                site.machineStats.down > 0
                  ? "border-red-300 dark:border-red-800"
                  : "hover:border-primary-300 dark:hover:border-primary-600"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {site.name}
                  </h3>
                  {(site.city || site.state) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {[site.city, site.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                {site.hasFloorPlan && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    Floor Plan
                  </span>
                )}
              </div>

              {/* Machine Status Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Machine Status</span>
                  <span>{site.machineStats.total} total</span>
                </div>
                {site.machineStats.total > 0 ? (
                  <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {site.machineStats.active > 0 && (
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(site.machineStats.active / site.machineStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {site.machineStats.maintenance > 0 && (
                      <div
                        className="bg-yellow-500"
                        style={{
                          width: `${(site.machineStats.maintenance / site.machineStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {site.machineStats.down > 0 && (
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${(site.machineStats.down / site.machineStats.total) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="text-slate-600 dark:text-slate-300">
                    {site.machineStats.active}
                  </span>
                </div>
                {site.machineStats.maintenance > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <span className="text-slate-600 dark:text-slate-300">
                      {site.machineStats.maintenance}
                    </span>
                  </div>
                )}
                {site.machineStats.down > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {site.machineStats.down} down
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Info (if available) */}
              {site.contactName && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contact: {site.contactName}
                  </p>
                </div>
              )}

              {/* View Arrow */}
              <div className="mt-4 flex items-center text-sm text-primary-600 dark:text-primary-400 font-medium">
                View Facility
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
