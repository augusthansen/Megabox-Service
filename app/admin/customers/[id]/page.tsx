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

interface Machine {
  id: string;
  name: string;
  model: string;
  serialNumber: string | null;
  status: string;
}

interface Site {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  primaryContactId: string | null;
  primaryContact: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    machines: number;
  };
  machines?: Machine[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
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
  const customerId = params?.id as string;
  
  // Debug: Log the customer ID
  useEffect(() => {
    console.log("Customer Detail Page - customerId:", customerId);
    console.log("Customer Detail Page - params:", params);
  }, [customerId, params]);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSiteForm, setShowAddSiteForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingMachineToSite, setAddingMachineToSite] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    primaryContactId: "",
  });
  const [customerFormData, setCustomerFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pricingTier: "basic",
    pricePerMachine: 0,
    hourlyRate: 0,
  });
  const [machineFormData, setMachineFormData] = useState({
    name: "",
    model: "",
    serialNumber: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUsersForm, setShowAddUsersForm] = useState(false);
  const [contacts, setContacts] = useState<ContactFormData[]>([]);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      console.log("Fetching customer with ID:", customerId);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/customers/${customerId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      console.log("API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Customer data received:", data);
        setCustomerFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          pricingTier: data.pricingTier,
          pricePerMachine: Number(data.pricePerMachine) || 0,
          hourlyRate: Number(data.hourlyRate) || 0,
        });
        
        // Fetch machines for each site
        if (data.sites && data.sites.length > 0) {
          try {
            const sitesWithMachines = await Promise.all(
              data.sites.map(async (site: Site) => {
                try {
                  const machinesRes = await fetch(`/api/machines?siteId=${site.id}`);
                  if (machinesRes.ok) {
                    const machines = await machinesRes.json();
                    return { ...site, machines };
                  }
                  return site;
                } catch (err) {
                  console.error(`Error fetching machines for site ${site.id}:`, err);
                  return site;
                }
              })
            );
            setCustomer({ ...data, sites: sitesWithMachines });
            setLoading(false); // Stop loading after setting customer with machines
            fetchUsers(); // Fetch users after customer is loaded
          } catch (err) {
            console.error("Error fetching machines:", err);
            setCustomer(data); // Still set customer data even if machines fail
            setLoading(false); // Stop loading even if machines fail
          }
        } else {
          setCustomer(data);
          setLoading(false); // Stop loading after setting customer
          fetchUsers(); // Fetch users after customer is loaded
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        console.error("Failed to fetch customer:", response.status, errorData);
        setLoading(false);
        // Don't redirect immediately - show error state instead
        setCustomer(null);
        const errorMessage = errorData.details 
          ? `${errorData.error}\n\nDetails: ${errorData.details}`
          : errorData.error || response.statusText || 'Unknown error';
        alert(`Failed to load customer: ${errorMessage}\n\nCheck the browser console and server terminal for details.`);
      }
    } catch (error: any) {
      console.error("Error fetching customer:", error);
      setLoading(false);
      // Don't redirect immediately - show error state instead
      setCustomer(null);
      
      if (error.name === 'AbortError') {
        alert("Request timed out after 10 seconds. The server may be slow or unresponsive.\n\nPlease check:\n1. Is your dev server running?\n2. Check the terminal for errors\n3. Try refreshing the page");
      } else {
        alert(`Error loading customer: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck the browser console and server terminal for details.`);
      }
    } finally {
      // Ensure loading state is cleared even if there's an unexpected error
      setLoading(false);
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    setSubmitting(true);

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
          primaryContactId: "",
        });
        fetchCustomer(); // Refresh to show new site
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create site");
      }
    } catch (error) {
      console.error("Error creating site:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerFormData),
      });

      if (response.ok) {
        setEditingCustomer(false);
        fetchCustomer(); // Refresh to show updated data
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    if (!customerId) {
      console.log("fetchUsers: No customerId provided");
      return;
    }
    setLoadingUsers(true);
    try {
      console.log("fetchUsers: Fetching users for companyId:", customerId);
      const response = await fetch(`/api/users?companyId=${customerId}`);
      console.log("fetchUsers: Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("fetchUsers: Received users:", data);
        console.log("fetchUsers: Number of users:", data.length);
        setUsers(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("fetchUsers: Failed to fetch users:", response.status, errorData);
        alert(`Failed to load users: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Error loading users. Check console for details.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchExistingUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setExistingUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAddUsersForm) {
      fetchExistingUsers();
    }
  }, [showAddUsersForm]);

  // Fetch users when site form is shown
  useEffect(() => {
    if (showAddSiteForm && customerId) {
      fetchUsers();
    }
  }, [showAddSiteForm, customerId]);

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

  const handleAddUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts: contacts,
          existingUserIds: selectedUserIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("handleAddUsers: Response data:", data);
        setShowAddUsersForm(false);
        setContacts([]);
        setSelectedUserIds([]);
        
        let message = `Users added successfully!\n\n`;
        if (data.syncedContacts > 0) {
          message += `✓ Created/Associated: ${data.syncedContacts} new contacts\n`;
        }
        if (data.associatedUsers > 0) {
          message += `✓ Associated: ${data.associatedUsers} existing users\n`;
        }
        if (data.failedContacts > 0) {
          message += `⚠ Failed: ${data.failedContacts} contacts\n`;
        }
        alert(message);
        
        // Wait a moment for database to update, then refresh
        setTimeout(() => {
          console.log("handleAddUsers: Refreshing users list...");
          fetchUsers(); // Refresh users list
          fetchCustomer(); // Refresh customer to update user count
        }, 500);
      } else {
        const data = await response.json();
        console.error("handleAddUsers: Failed to add users:", data);
        alert(data.error || "Failed to add users");
      }
    } catch (error) {
      console.error("Error adding users:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMachine = async (e: React.FormEvent, siteId: string) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const response = await fetch("/api/machines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...machineFormData,
          siteId,
        }),
      });

      if (response.ok) {
        setAddingMachineToSite(null);
        setMachineFormData({
          name: "",
          model: "",
          serialNumber: "",
        });
        fetchCustomer(); // Refresh to show new machine
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create machine");
      }
    } catch (error) {
      console.error("Error creating machine:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Customer not found</p>
          <Link href="/admin/customers" className="btn-primary">
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>
      </div>

      {/* Customer Header */}
      <div className="card p-6">
        {editingCustomer ? (
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Edit Customer</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(false);
                  setCustomerFormData({
                    name: customer.name,
                    email: customer.email || "",
                    phone: customer.phone || "",
                    pricingTier: customer.pricingTier,
                    pricePerMachine: customer.pricePerMachine,
                    hourlyRate: customer.hourlyRate,
                  });
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  className="input"
                  placeholder="company@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  className="input"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pricing Tier *</label>
                <select
                  value={customerFormData.pricingTier}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, pricingTier: e.target.value })}
                  className="input"
                  required
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="mega">Mega</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price Per Machine ($)</label>
                <input
                  type="number"
                  value={customerFormData.pricePerMachine}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, pricePerMachine: parseFloat(e.target.value) })}
                  className="input"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={customerFormData.hourlyRate}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, hourlyRate: parseFloat(e.target.value) })}
                  className="input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(false);
                  setCustomerFormData({
                    name: customer.name,
                    email: customer.email || "",
                    phone: customer.phone || "",
                    pricingTier: customer.pricingTier,
                    pricePerMachine: customer.pricePerMachine,
                    hourlyRate: customer.hourlyRate,
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{customer.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Email:</span>
                    <a href={`mailto:${customer.email}`} className="font-semibold text-primary-600 hover:underline">
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Phone:</span>
                    <a href={`tel:${customer.phone}`} className="font-semibold text-primary-600 hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Pricing Tier:</span>
                  <span className="badge badge-info capitalize">
                    {customer.pricingTier}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Monthly Rate:</span>
                  <span className="font-semibold text-slate-900">${customer.pricePerMachine}/machine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Hourly Rate:</span>
                  <span className="font-semibold text-slate-900">${customer.hourlyRate}/hour</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditingCustomer(true)}
              className="btn-secondary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Customer
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Sites</p>
            <p className="text-3xl font-bold text-slate-900">{customer._count.sites}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Machines</p>
            <p className="text-3xl font-bold text-slate-900">{customer._count.machines}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Users</p>
            <p className="text-3xl font-bold text-slate-900">{customer._count.users}</p>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Users</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage users associated with this customer
            </p>
          </div>
          <button
            onClick={() => setShowAddUsersForm(!showAddUsersForm)}
            className="btn-primary"
          >
            {showAddUsersForm ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Users
              </>
            )}
          </button>
        </div>

        {showAddUsersForm && (
          <form onSubmit={handleAddUsers} className="mb-6 space-y-6 border-b border-slate-200 pb-6">
            {/* New Contacts Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-gray-900">Add New Contacts</h4>
                <button
                  type="button"
                  onClick={addContact}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  + Add Contact
                </button>
              </div>

              {contacts.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No contacts added. Click &quot;Add Contact&quot; to add one.</p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-sm font-medium text-gray-700">Contact {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                          <input
                            type="text"
                            required
                            value={contact.firstName}
                            onChange={(e) => updateContact(index, "firstName", e.target.value)}
                            className="input text-sm"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={contact.lastName}
                            onChange={(e) => updateContact(index, "lastName", e.target.value)}
                            className="input text-sm"
                            placeholder="Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                          <input
                            type="email"
                            required
                            value={contact.email}
                            onChange={(e) => updateContact(index, "email", e.target.value)}
                            className="input text-sm"
                            placeholder="john.doe@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(index, "phone", e.target.value)}
                            className="input text-sm"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
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
            <div className="border-t border-gray-200 pt-4">
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Add Existing Users</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Select users from your system to associate with this company
                </p>
                {loadingUsers ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {existingUsers.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No users available</p>
                    ) : (
                      existingUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Warn if user is already associated with another company
                                if (user.company && user.company.id && user.company.id !== customerId) {
                                  const confirmReassign = window.confirm(
                                    `${user.name} is currently associated with ${user.company.name}. Do you want to reassign them to this company?`
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
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                              {user.company && user.company.id !== customerId && (
                                <span className="ml-2 text-orange-600">
                                  (Currently: {user.company.name})
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                            {user.role.replace("_", " ")}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {selectedUserIds.length > 0 && (
                  <p className="mt-2 text-sm text-blue-600">
                    {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddUsersForm(false);
                  setContacts([]);
                  setSelectedUserIds([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || (contacts.length === 0 && selectedUserIds.length === 0)}
              >
                {submitting ? "Adding..." : "Add Users"}
              </button>
            </div>
          </form>
        )}

        {/* Users List */}
        {loadingUsers ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">No users yet</p>
            <button
              onClick={() => setShowAddUsersForm(true)}
              className="btn-primary"
            >
              Add Users
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sites Section */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sites</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage locations for this customer
            </p>
          </div>
          <button
            onClick={() => setShowAddSiteForm(!showAddSiteForm)}
            className="btn-primary"
          >
            {showAddSiteForm ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Site
              </>
            )}
          </button>
        </div>

        {/* Add Site Form */}
        {showAddSiteForm && (
          <div className="mb-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Site</h3>
            <form onSubmit={handleAddSite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Site Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Main Office"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">
                    Street Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="123 Main St"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    placeholder="Los Angeles"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-slate-700 mb-2">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-semibold text-slate-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="input"
                    placeholder="90001"
                  />
                </div>
              </div>

              {/* Primary Contact Selection */}
              <div>
                <label htmlFor="primaryContactId" className="block text-sm font-semibold text-slate-700 mb-2">
                  Main Point of Contact
                </label>
                <select
                  id="primaryContactId"
                  value={formData.primaryContactId}
                  onChange={(e) => setFormData({ ...formData, primaryContactId: e.target.value })}
                  className="input"
                >
                  <option value="">-- Select a contact (optional) --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Select the main point of contact for this facility
                </p>
                {users.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No users found for this company. Add users first to assign a contact.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSiteForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create Site
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sites List */}
        {customer.sites.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-slate-500 mb-4">No sites yet</p>
            <button
              onClick={() => setShowAddSiteForm(true)}
              className="btn-primary"
            >
              Add Your First Site
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {customer.sites.map((site) => (
              <div
                key={site.id}
                className="card p-4 border-l-4 border-l-primary-500"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{site.name}</h4>
                      <span className="badge badge-neutral">
                        {site._count.machines} machine{site._count.machines !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {site.address && (
                      <p className="text-sm text-slate-600 flex items-center mb-1">
                        <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {site.address}
                        {site.city && `, ${site.city}`}
                        {site.state && `, ${site.state}`}
                        {site.zipCode && ` ${site.zipCode}`}
                      </p>
                    )}
                    {site.primaryContact && (
                      <p className="text-sm text-slate-600 flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Main Contact:</span> {site.primaryContact.name} ({site.primaryContact.email})
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddingMachineToSite(addingMachineToSite === site.id ? null : site.id)}
                      className="btn-secondary text-sm"
                    >
                      {addingMachineToSite === site.id ? "Cancel" : "+ Add Machine"}
                    </button>
                    <Link
                      href={`/admin/sites/${site.id}`}
                      className="btn-secondary text-sm"
                    >
                      View Site
                    </Link>
                  </div>
                </div>

                {/* Add Machine Form */}
                {addingMachineToSite === site.id && (
                  <form onSubmit={(e) => handleAddMachine(e, site.id)} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h5 className="font-semibold text-slate-900 mb-3">Add Machine to {site.name}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Machine Name *</label>
                        <input
                          type="text"
                          value={machineFormData.name}
                          onChange={(e) => setMachineFormData({ ...machineFormData, name: e.target.value })}
                          className="input"
                          placeholder="Machine 1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Model *</label>
                        <input
                          type="text"
                          value={machineFormData.model}
                          onChange={(e) => setMachineFormData({ ...machineFormData, model: e.target.value })}
                          className="input"
                          placeholder="Model XYZ"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Serial Number</label>
                        <input
                          type="text"
                          value={machineFormData.serialNumber}
                          onChange={(e) => setMachineFormData({ ...machineFormData, serialNumber: e.target.value })}
                          className="input"
                          placeholder="SN123456"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingMachineToSite(null);
                          setMachineFormData({ name: "", model: "", serialNumber: "" });
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? "Adding..." : "Add Machine"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Machines List */}
                {site.machines && site.machines.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <h5 className="text-sm font-semibold text-slate-700 mb-2">Machines at this site:</h5>
                    <div className="space-y-2">
                      {site.machines.map((machine) => (
                        <Link
                          key={machine.id}
                          href={`/admin/machines/${machine.id}`}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                        >
                          <div>
                            <span className="font-medium text-slate-900">{machine.name}</span>
                            <span className="text-sm text-slate-600 ml-2">{machine.model}</span>
                            {machine.serialNumber && (
                              <span className="text-xs text-slate-500 ml-2">(SN: {machine.serialNumber})</span>
                            )}
                          </div>
                          <span className={`badge ${
                            machine.status === "active" ? "badge-success" :
                            machine.status === "inactive" ? "badge-neutral" :
                            "badge-warning"
                          }`}>
                            {machine.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


