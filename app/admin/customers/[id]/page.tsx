"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Customer Detail Page
 * 
 * Shows customer information and their sites.
 * Allows adding new sites to the customer.
 */

interface Site {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  _count: {
    machines: number;
  };
}

interface Customer {
  id: string;
  name: string;
  pricingTier: string;
  pricePerMachine: number;
  hourlyRate: number;
  sites: Site[];
  _count: {
    sites: number;
    users: number;
    machines: number;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSiteForm, setShowAddSiteForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      } else {
        router.push("/admin/customers");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      router.push("/admin/customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          companyId: customer.id,
        }),
      });

      if (response.ok) {
        // Success! Refresh customer data and reset form
        setShowAddSiteForm(false);
        setFormData({
          name: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
        });
        fetchCustomer(); // Refresh to show new site
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create site");
      }
    } catch (error) {
      console.error("Error creating site:", error);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/admin/customers"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Customers
        </Link>
      </div>

      {/* Customer Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{customer.name}</h2>
            <div className="flex gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Pricing Tier:</span>{" "}
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold capitalize">
                  {customer.pricingTier}
                </span>
              </div>
              <div>
                <span className="font-medium">Monthly Rate:</span> ${customer.pricePerMachine}/machine
              </div>
              <div>
                <span className="font-medium">Hourly Rate:</span> ${customer.hourlyRate}/hour
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Total Sites</p>
            <p className="text-2xl font-semibold text-gray-900">{customer._count.sites}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Machines</p>
            <p className="text-2xl font-semibold text-gray-900">{customer._count.machines}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-2xl font-semibold text-gray-900">{customer._count.users}</p>
          </div>
        </div>
      </div>

      {/* Sites Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Sites</h3>
          <button
            onClick={() => setShowAddSiteForm(!showAddSiteForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {showAddSiteForm ? "Cancel" : "+ Add Site"}
          </button>
        </div>

        {/* Add Site Form */}
        {showAddSiteForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h4 className="text-md font-semibold mb-4">Add New Site</h4>
            <form onSubmit={handleAddSite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Site Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Main Office"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Main St"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Los Angeles"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="90001"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Site
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSiteForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sites List */}
        <div className="p-6">
          {customer.sites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No sites yet</p>
              <button
                onClick={() => setShowAddSiteForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Site
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customer.sites.map((site) => (
                <div
                  key={site.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{site.name}</h4>
                      {site.address && (
                        <p className="text-sm text-gray-600">
                          {site.address}
                          {site.city && `, ${site.city}`}
                          {site.state && `, ${site.state}`}
                          {site.zipCode && ` ${site.zipCode}`}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {site._count.machines} machine{site._count.machines !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Link
                      href={`/admin/sites/${site.id}`}
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


