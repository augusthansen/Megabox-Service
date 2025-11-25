"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Machine Detail Page
 * 
 * Shows machine information and recent tickets.
 */

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface Machine {
  id: string;
  serialNumber: string;
  model: string;
  status: string;
  site: {
    id: string;
    name: string;
    company: {
      id: string;
      name: string;
      pricingTier: string;
    };
  };
  tickets: Ticket[];
}

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachine();
  }, [machineId]);

  const fetchMachine = async () => {
    try {
      const response = await fetch(`/api/machines/${machineId}`);
      if (response.ok) {
        const data = await response.json();
        setMachine(data);
      } else {
        router.push("/admin/machines");
      }
    } catch (error) {
      console.error("Error fetching machine:", error);
      router.push("/admin/machines");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading machine...</p>
      </div>
    );
  }

  if (!machine) {
    return null;
  }

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/admin/machines"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Machines
        </Link>
      </div>

      {/* Machine Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{machine.model}</h2>
            <p className="text-gray-600">Serial Number: {machine.serialNumber}</p>
            <div className="mt-4 flex gap-4">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                machine.status === "active"
                  ? "bg-green-100 text-green-800"
                  : machine.status === "maintenance"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {machine.status}
              </span>
            </div>
            <div className="mt-4">
              <Link
                href={`/admin/sites/${machine.site.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Site: {machine.site.name}
              </Link>
              <span className="mx-2 text-gray-400">•</span>
              <Link
                href={`/admin/customers/${machine.site.company.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Customer: {machine.site.company.name}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
          <button
            onClick={() => router.push(`/admin/tickets?machineId=${machine.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Create Ticket
          </button>
        </div>

        <div className="p-6">
          {machine.tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No tickets yet</p>
              <button
                onClick={() => router.push(`/admin/tickets?machineId=${machine.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {machine.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{ticket.title}</h4>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.status === "open"
                            ? "bg-blue-100 text-blue-800"
                            : ticket.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : ticket.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
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


