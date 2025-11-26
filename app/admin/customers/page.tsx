"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Customers Page
 * 
 * Shows a list of all customers and allows adding new ones.
 */

interface Customer {
  id: string;
  name: string;
  pricingTier: string;
  pricePerMachine: number;
  hourlyRate: number;
  _count: {
    sites: number;
    users: number;
  };
}

interface SiteFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    pricingTier: "basic",
    pricePerMachine: 40,
    hourlyRate: 180,
  });
  const [sites, setSites] = useState<SiteFormData[]>([]);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sites: sites, // Include sites in the request
        }),
      });

      if (response.ok) {
        // Success! Refresh the list and reset form
        setShowAddForm(false);
        setFormData({
          name: "",
          pricingTier: "basic",
          pricePerMachine: 40,
          hourlyRate: 180,
        });
        setSites([]); // Reset sites
        fetchCustomers(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Something went wrong");
    }
  };

  const addSite = () => {
    setSites([...sites, { name: "", address: "", city: "", state: "", zipCode: "" }]);
  };

  const removeSite = (index: number) => {
    setSites(sites.filter((_, i) => i !== index));
  };

  const updateSite = (index: number, field: keyof SiteFormData, value: string) => {
    const updatedSites = [...sites];
    updatedSites[index] = { ...updatedSites[index], [field]: value };
    setSites(updatedSites);
  };

  const handleTierChange = (tier: string) => {
    const tierDefaults = {
      basic: { pricePerMachine: 40, hourlyRate: 180 },
      standard: { pricePerMachine: 60, hourlyRate: 150 },
      mega: { pricePerMachine: 85, hourlyRate: 120 },
    };
    
    const defaults = tierDefaults[tier as keyof typeof tierDefaults] || tierDefaults.basic;
    setFormData({
      ...formData,
      pricingTier: tier,
      pricePerMachine: defaults.pricePerMachine,
      hourlyRate: defaults.hourlyRate,
    });
  };

  const handleSyncFromHubspot = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/hubspot/sync-companies", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Sync complete!\n\nSynced: ${data.synced} new companies\nUpdated: ${data.updated} existing companies\nErrors: ${data.errors}`);
        fetchCustomers(); // Refresh the list
      } else {
        alert(data.error || "Failed to sync from HubSpot");
      }
    } catch (error) {
      console.error("Error syncing from HubSpot:", error);
      alert("Something went wrong while syncing");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer companies and pricing tiers
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncFromHubspot}
            disabled={syncing}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Syncing..." : "Sync from HubSpot"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? "Cancel" : "+ Add Customer"}
          </button>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Customer</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Company Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label htmlFor="pricingTier" className="block text-sm font-medium text-slate-700 mb-2">
                Pricing Tier
              </label>
              <select
                id="pricingTier"
                value={formData.pricingTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className="input"
              >
                <option value="basic">Basic - $40/machine, $180/hour</option>
                <option value="standard">Standard - $60/machine, $150/hour</option>
                <option value="mega">Mega - $85/machine, $120/hour</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pricePerMachine" className="block text-sm font-medium text-slate-700 mb-2">
                  Price per Machine ($/month)
                </label>
                <input
                  id="pricePerMachine"
                  type="number"
                  value={formData.pricePerMachine}
                  onChange={(e) => setFormData({ ...formData, pricePerMachine: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-slate-700 mb-2">
                  Hourly Rate ($/hour)
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
            </div>

            {/* Sites Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-900">Sites (Optional)</h4>
                <button
                  type="button"
                  onClick={addSite}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  + Add Site
                </button>
              </div>

              {sites.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No sites added. You can add sites later from the customer detail page.</p>
              ) : (
                <div className="space-y-4">
                  {sites.map((site, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-sm font-medium text-gray-700">Site {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeSite(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Site Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={site.name}
                            onChange={(e) => updateSite(index, "name", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Main Office"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Address
                          </label>
                          <input
                            type="text"
                            value={site.address}
                            onChange={(e) => updateSite(index, "address", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="123 Main St"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={site.city}
                            onChange={(e) => updateSite(index, "city", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Los Angeles"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={site.state}
                            onChange={(e) => updateSite(index, "state", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="CA"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={site.zipCode}
                            onChange={(e) => updateSite(index, "zipCode", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="90001"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSites([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Create Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Table */}
      <div className="table-container">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-4">No customers yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Your First Customer
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Pricing Tier</th>
                <th>Monthly Rate</th>
                <th>Hourly Rate</th>
                <th>Sites</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="font-medium text-slate-900">{customer.name}</div>
                  </td>
                  <td>
                    <span className={`badge ${
                      customer.pricingTier === 'mega' ? 'badge-warning' :
                      customer.pricingTier === 'standard' ? 'badge-info' :
                      'badge-neutral'
                    } capitalize`}>
                      {customer.pricingTier}
                    </span>
                  </td>
                  <td className="text-slate-600">
                    ${customer.pricePerMachine}/machine
                  </td>
                  <td className="text-slate-600">
                    ${customer.hourlyRate}/hour
                  </td>
                  <td className="text-slate-600">
                    {customer._count.sites} site{customer._count.sites !== 1 ? "s" : ""}
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
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

