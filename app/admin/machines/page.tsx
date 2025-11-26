"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Machines Page
 * Enterprise view of all machines
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

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading machines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Machines</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage all mail inserter machines
          </p>
        </div>
      </div>

      {/* Machines Table */}
      <div className="table-container">
        {machines.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-4">No machines found</p>
            <Link href="/admin/sites" className="btn-primary">
              Add Machines to a Site
            </Link>
          </div>
        ) : (
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
              {machines.map((machine) => (
                <tr key={machine.id}>
                  <td>
                    <div className="font-medium text-slate-900">{machine.name}</div>
                  </td>
                  <td className="text-slate-600">
                    {machine.serialNumber || <span className="text-slate-400">N/A</span>}
                  </td>
                  <td className="text-slate-600">
                    {machine.model || <span className="text-slate-400">N/A</span>}
                  </td>
                  <td>
                    <Link
                      href={`/admin/sites/${machine.site.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {machine.site.name}
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${machine.site.company.id}`}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      {machine.site.company.name}
                    </Link>
                  </td>
                  <td>
                    {machine.status ? (
                      <span className={`badge ${
                        machine.status.toLowerCase() === 'active' ? 'badge-success' :
                        machine.status.toLowerCase() === 'down' ? 'badge-danger' :
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
