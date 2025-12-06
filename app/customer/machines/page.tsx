"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Customer Machines Page
 * View machines associated with the customer's company
 */

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  model: string | null;
  status: string | null;
  site: {
    id: string;
    name: string;
    company: {
      id: string;
      name: string;
    };
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
}

export default function CustomerMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user from sessionStorage
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchMachines(parsedUser.companyId);
      } catch (e) {
        console.error("Error parsing user from sessionStorage:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMachines = async (companyId?: string) => {
    try {
      const url = companyId
        ? `/api/machines?companyId=${companyId}`
        : "/api/machines";
      const response = await fetch(url);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading machines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Machines</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View all mail inserter machines at your sites
        </p>
      </div>

      {/* Machines Grid/Table */}
      {machines.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No machines found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No machines are currently registered for your company. Contact your service representative to add machines.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Machine Name</th>
                  <th>Serial Number</th>
                  <th>Model</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id} className="cursor-pointer" onClick={() => window.location.href = `/customer/machines/${machine.id}`}>
                    <td>
                      <Link
                        href={`/customer/machines/${machine.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {machine.name}
                      </Link>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {machine.serialNumber || <span className="text-slate-400 dark:text-slate-500">N/A</span>}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {machine.model || <span className="text-slate-400 dark:text-slate-500">N/A</span>}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {machine.site.name}
                    </td>
                    <td>
                      {machine.status ? (
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
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/customer/machines/${machine.id}`}
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                        <Link
                          href={`/customer/tickets/new?machineId=${machine.id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Create Ticket
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {machines.map((machine) => (
              <Link
                key={machine.id}
                href={`/customer/machines/${machine.id}`}
                className="block bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-primary-600 dark:text-primary-400">{machine.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{machine.site.name}</p>
                  </div>
                  {machine.status ? (
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
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Serial:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">
                      {machine.serialNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Model:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">
                      {machine.model || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center">
                    View Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Quick Stats */}
      {machines.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-4">
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

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {machines.filter(m => m.status?.toLowerCase() === 'active').length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {machines.filter(m => m.status?.toLowerCase() === 'maintenance').length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Maintenance</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {machines.filter(m => m.status?.toLowerCase() === 'down').length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Down</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
