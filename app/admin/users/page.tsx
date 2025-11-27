"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Users Management Page
 * Enterprise-grade user management interface
 */

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string | null;
  company: {
    id: string;
    name: string;
  } | null;
  hubspotId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "service_tech",
    companyId: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "service_tech",
          companyId: "",
        });
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Something went wrong");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleSyncFromHubspot = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/hubspot/sync-contacts", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Sync complete!\n\n` +
          `✓ Synced: ${data.synced} new contacts\n` +
          `✓ Updated: ${data.updated} existing contacts\n` +
          `⚠ Skipped: ${data.skipped} contacts\n` +
          `✗ Errors: ${data.errors}`
        );
        fetchUsers(); // Refresh the list
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

  const getRoleBadge = (role: string) => {
    const badges = {
      super_admin: "badge badge-danger",
      service_tech: "badge badge-info",
      customer_admin: "badge badge-warning",
      customer_tech: "badge badge-neutral",
    };
    return badges[role as keyof typeof badges] || "badge badge-neutral";
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      super_admin: "Super Admin",
      service_tech: "Service Tech",
      customer_admin: "Customer Admin",
      customer_tech: "Customer Tech",
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage system users and access control
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
            {showAddForm ? "Cancel" : "+ Add User"}
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Add New User
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Role *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input"
                >
                  <option value="service_tech">Service Tech</option>
                  <option value="customer_admin">Customer Admin</option>
                  <option value="customer_tech">Customer Tech</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            {(formData.role === "customer_admin" ||
              formData.role === "customer_tech") && (
              <div>
                <label
                  htmlFor="companyId"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Company * (Required for customer roles)
                </label>
                <select
                  id="companyId"
                  value={formData.companyId}
                  onChange={(e) =>
                    setFormData({ ...formData, companyId: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-8">
                  No users found. Create your first user!
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {user.name}
                        </span>
                        {user.hubspotId && (
                          <a
                            href={`https://app.hubspot.com/contacts/contact/${user.hubspotId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 transition-colors"
                            title="View in HubSpot"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.5 0c-1.7 0-3.1 1.4-3.1 3.1 0 .4.1.8.2 1.1l-4.2 2.4c-.6-.4-1.3-.6-2-.6-2.1 0-3.8 1.7-3.8 3.8 0 .5.1.9.2 1.4l-3.1 2c-.4-.2-.9-.3-1.4-.3C.6 12.9 0 13.5 0 14.2s.6 1.3 1.3 1.3 1.3-.6 1.3-1.3c0-.3-.1-.5-.2-.7l3.1-2c.6.5 1.4.9 2.3.9 2.1 0 3.8-1.7 3.8-3.8 0-.5-.1-.9-.2-1.4l4.2-2.4c.6.4 1.3.6 2 .6 2 0 3.6-1.6 3.6-3.6S20.5 0 18.5 0zm0 2.2c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zM9.4 11.2c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2 2.2 1 2.2 2.2-1 2.2-2.2 2.2zM1.3 15c-.2 0-.3-.1-.3-.3s.1-.3.3-.3.3.1.3.3-.1.3-.3.3zm17.2 3.6c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1-1.4-3.1-3.1-3.1zm0 4.8c-.9 0-1.7-.8-1.7-1.7s.8-1.7 1.7-1.7 1.7.8 1.7 1.7-.8 1.7-1.7 1.7z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-600">{user.email}</td>
                  <td>
                    <span className={getRoleBadge(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="text-slate-600">
                    {user.company ? (
                      <Link
                        href={`/admin/customers/${user.companyId}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {user.company.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td>
                    {user.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-neutral">Inactive</span>
                    )}
                  </td>
                  <td className="text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        className="text-sm text-slate-600 hover:text-slate-900"
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
