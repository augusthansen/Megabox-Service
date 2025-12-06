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

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pricingTier: "basic",
    pricePerMachine: 40,
    hourlyRate: 180,
  });
  const [sites, setSites] = useState<SiteFormData[]>([]);
  const [contacts, setContacts] = useState<ContactFormData[]>([]);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch existing users when form is shown
  useEffect(() => {
    if (showAddForm) {
      fetchExistingUsers();
    }
  }, [showAddForm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch customers:", errorData);
        alert(`Failed to load customers: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      alert("Error loading customers. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Filter to show users without a company or allow all users
        setExistingUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
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
          contacts: contacts, // Include contacts in the request
          existingUserIds: selectedUserIds, // Include selected existing users
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Success! Refresh the list and reset form
        setShowAddForm(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          pricingTier: "basic",
          pricePerMachine: 40,
          hourlyRate: 180,
        });
        setSites([]); // Reset sites
        setContacts([]); // Reset contacts
        setSelectedUserIds([]); // Reset selected users
        
        // Show success message with HubSpot sync info
        if (data.hubspotId) {
          alert(`Customer "${data.name}" created successfully!\n\n✅ Synced to HubSpot (ID: ${data.hubspotId})`);
        } else {
          alert(`Customer "${data.name}" created successfully!\n\n⚠️ Note: Could not sync to HubSpot. Customer was created locally.`);
        }
        
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

  const addContact = () => {
    setContacts([...contacts, { firstName: "", lastName: "", email: "", phone: "", jobTitle: "" }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ContactFormData, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
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
        let message = `Sync complete!\n\nSynced: ${data.synced} new companies\nUpdated: ${data.updated} existing companies\nErrors: ${data.errors}`;
        
        // Show detailed error information if there are errors
        if (data.errors > 0 && data.details?.errors) {
          message += "\n\nError details:\n";
          data.details.errors.slice(0, 5).forEach((err: any, idx: number) => {
            message += `\n${idx + 1}. ${err.company || 'Unknown'}: ${err.error || 'Unknown error'}`;
          });
          if (data.details.errors.length > 5) {
            message += `\n... and ${data.details.errors.length - 5} more errors`;
          }
        }
        
        alert(message);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Customer</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="company@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pricingTier" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                <label htmlFor="pricePerMachine" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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

            {/* Contacts Section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white">Contacts (Optional)</h4>
                <button
                  type="button"
                  onClick={addContact}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  + Add Contact
                </button>
              </div>

              {contacts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400 italic">No contacts added. You can add contacts later from the customer detail page.</p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={index} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-slate-300">Contact {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">First Name</label>
                          <input
                            type="text"
                            value={contact.firstName}
                            onChange={(e) => updateContact(index, "firstName", e.target.value)}
                            className="input text-sm"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={contact.lastName}
                            onChange={(e) => updateContact(index, "lastName", e.target.value)}
                            className="input text-sm"
                            placeholder="Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Email</label>
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(index, "email", e.target.value)}
                            className="input text-sm"
                            placeholder="john.doe@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(index, "phone", e.target.value)}
                            className="input text-sm"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Job Title</label>
                          <input
                            type="text"
                            value={contact.jobTitle}
                            onChange={(e) => updateContact(index, "jobTitle", e.target.value)}
                            className="input text-sm"
                            placeholder="Operations Manager"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Users Section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Add Existing Users (Optional)</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                  Select users from your system to associate with this company
                </p>
                {loadingUsers ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Loading users...</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg p-3 bg-gray-50 dark:bg-slate-700">
                    {existingUsers.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400 italic">No users available</p>
                    ) : (
                      existingUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-3 p-2 hover:bg-white dark:hover:bg-slate-600 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Warn if user is already associated with another company
                                if (user.company && user.company.id) {
                                  const confirmReassign = window.confirm(
                                    `${user.name} is currently associated with ${user.company.name}. Do you want to reassign them to this new company?`
                                  );
                                  if (!confirmReassign) {
                                    return;
                                  }
                                }
                                setSelectedUserIds([...selectedUserIds, user.id]);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-500 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              {user.email}
                              {user.company && (
                                <span className="ml-2 text-orange-600 dark:text-orange-400">
                                  (Currently: {user.company.name})
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 rounded">
                            {user.role.replace("_", " ")}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {selectedUserIds.length > 0 && (
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </div>

            {/* Sites Section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white">Sites (Optional)</h4>
                <button
                  type="button"
                  onClick={addSite}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  + Add Site
                </button>
              </div>

              {sites.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400 italic">No sites added. You can add sites later from the customer detail page.</p>
              ) : (
                <div className="space-y-4">
                  {sites.map((site, index) => (
                    <div key={index} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-slate-300">Site {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeSite(index)}
                          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                            Site Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={site.name}
                            onChange={(e) => updateSite(index, "name", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Main Office"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                            Address
                          </label>
                          <input
                            type="text"
                            value={site.address}
                            onChange={(e) => updateSite(index, "address", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="123 Main St"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={site.city}
                            onChange={(e) => updateSite(index, "city", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Los Angeles"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={site.state}
                            onChange={(e) => updateSite(index, "state", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="CA"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={site.zipCode}
                            onChange={(e) => updateSite(index, "zipCode", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="90001"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
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
            <p className="text-slate-500 dark:text-slate-400 mb-4">No customers yet</p>
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
                    <div className="font-medium text-slate-900 dark:text-white">{customer.name}</div>
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
                  <td className="text-slate-600 dark:text-slate-300">
                    ${customer.pricePerMachine}/machine
                  </td>
                  <td className="text-slate-600 dark:text-slate-300">
                    ${customer.hourlyRate}/hour
                  </td>
                  <td className="text-slate-600 dark:text-slate-300">
                    {customer._count.sites} site{customer._count.sites !== 1 ? "s" : ""}
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
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

