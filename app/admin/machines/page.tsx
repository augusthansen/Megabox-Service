"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Admin Machines Page
 * Enterprise view with search and filter capabilities
 */

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  model: string | null;
  status: string | null;
  isCurrentlyDown: boolean;
  site: {
    id: string;
    name: string;
    company: {
      id: string;
      name: string;
    };
  };
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await fetch("/api/machines");
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error("Error fetching machines:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter machines
  const filteredMachines = machines.filter((machine) => {
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "down" && !machine.isCurrentlyDown && machine.status?.toLowerCase() !== "down") return false;
      if (statusFilter === "active" && (machine.isCurrentlyDown || machine.status?.toLowerCase() !== "active")) return false;
      if (statusFilter === "maintenance" && machine.status?.toLowerCase() !== "maintenance") return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = machine.name.toLowerCase().includes(query);
      const matchesSerial = machine.serialNumber?.toLowerCase().includes(query);
      const matchesModel = machine.model?.toLowerCase().includes(query);
      const matchesSite = machine.site.name.toLowerCase().includes(query);
      const matchesCompany = machine.site.company.name.toLowerCase().includes(query);
      if (!matchesName && !matchesSerial && !matchesModel && !matchesSite && !matchesCompany) return false;
    }

    return true;
  });

  // Count stats
  const activeCount = machines.filter(m => m.status?.toLowerCase() === "active" && !m.isCurrentlyDown).length;
  const downCount = machines.filter(m => m.isCurrentlyDown || m.status?.toLowerCase() === "down").length;
  const maintenanceCount = machines.filter(m => m.status?.toLowerCase() === "maintenance").length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading machines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Machines</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage all mail inserter machines
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{machines.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Machines</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          className={`bg-white dark:bg-slate-800 rounded-lg shadow border p-4 text-left transition-all ${
            statusFilter === "active" ? "border-green-500 ring-2 ring-green-500/20" : "border-slate-200 dark:border-slate-700 hover:border-green-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "down" ? "all" : "down")}
          className={`bg-white dark:bg-slate-800 rounded-lg shadow border p-4 text-left transition-all ${
            statusFilter === "down" ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${downCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-slate-100 dark:bg-slate-700"}`}>
              <svg className={`w-5 h-5 ${downCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className={`text-2xl font-bold ${downCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>{downCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Down</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "maintenance" ? "all" : "maintenance")}
          className={`bg-white dark:bg-slate-800 rounded-lg shadow border p-4 text-left transition-all ${
            statusFilter === "maintenance" ? "border-yellow-500 ring-2 ring-yellow-500/20" : "border-slate-200 dark:border-slate-700 hover:border-yellow-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${maintenanceCount > 0 ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-slate-100 dark:bg-slate-700"}`}>
              <svg className={`w-5 h-5 ${maintenanceCount > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-2xl font-bold ${maintenanceCount > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-900 dark:text-white"}`}>{maintenanceCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Maintenance</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, serial, model, site, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {(statusFilter !== "all" || searchQuery) && (
            <button
              onClick={() => { setStatusFilter("all"); setSearchQuery(""); }}
              className="btn-secondary whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter summary */}
        {(statusFilter !== "all" || searchQuery) && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredMachines.length} of {machines.length} machines
            {statusFilter !== "all" && <span className="ml-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">{statusFilter}</span>}
            {searchQuery && <span className="ml-1"> matching "{searchQuery}"</span>}
          </p>
        )}
      </div>

      {/* Machines Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
        {filteredMachines.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No machines found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery || statusFilter !== "all"
                ? "No machines match your current filters"
                : "No machines have been added yet"}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => { setStatusFilter("all"); setSearchQuery(""); }}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Machine Name</th>
                  <th>Serial Number</th>
                  <th>Model</th>
                  <th>Site</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    className={`cursor-pointer transition-colors ${
                      machine.isCurrentlyDown ? "bg-red-50 dark:bg-red-900/10" : ""
                    }`}
                    onClick={() => window.location.href = `/admin/machines/${machine.id}`}
                  >
                    <td>
                      <Link
                        href={`/admin/machines/${machine.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {machine.name}
                      </Link>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300 font-mono text-sm">
                      {machine.serialNumber || <span className="text-slate-400 dark:text-slate-500">N/A</span>}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {machine.model || <span className="text-slate-400 dark:text-slate-500">N/A</span>}
                    </td>
                    <td>
                      <span className="text-slate-700 dark:text-slate-300">{machine.site.name}</span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/customers/${machine.site.company.id}`}
                        className="text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {machine.site.company.name}
                      </Link>
                    </td>
                    <td>
                      {machine.isCurrentlyDown ? (
                        <span className="badge badge-danger flex items-center gap-1 w-fit">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                          </svg>
                          Down
                        </span>
                      ) : machine.status ? (
                        <span className={`badge ${
                          machine.status.toLowerCase() === 'active' ? 'badge-success' :
                          machine.status.toLowerCase() === 'down' ? 'badge-danger' :
                          machine.status.toLowerCase() === 'maintenance' ? 'badge-warning' :
                          'badge-neutral'
                        }`}>
                          {machine.status}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Unknown</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/machines/${machine.id}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
