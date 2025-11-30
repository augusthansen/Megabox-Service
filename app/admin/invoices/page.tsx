"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Invoices Page
 *
 * Shows a list of all invoices with filters and allows creating new ones.
 */

interface Invoice {
  id: string;
  invoiceNumber: string;
  billingPeriod: string;
  machineCount: number;
  subscriptionFee: number;
  usageHours: number;
  usageFee: number;
  escalationFees: number;
  travelExpenses: number;
  totalAmount: number;
  status: string;
  paidDate: string | null;
  quickbooksInvoiceId: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    email: string | null;
    pricingTier: string;
  };
}

interface Company {
  id: string;
  name: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterBillingPeriod, setFilterBillingPeriod] = useState<string>("");
  const [formData, setFormData] = useState({
    companyId: "",
    billingPeriod: "",
    status: "draft",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
  }, [filterCompany, filterStatus, filterBillingPeriod]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCompany) params.append("companyId", filterCompany);
      if (filterStatus) params.append("status", filterStatus);
      if (filterBillingPeriod)
        params.append("billingPeriod", filterBillingPeriod);

      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        console.error("Failed to fetch invoices");
        alert("Failed to load invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("Error loading invoices");
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
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: formData.companyId,
          billingPeriod: formData.billingPeriod,
          status: formData.status,
        }),
      });

      if (response.ok) {
        alert("Invoice created successfully!");
        setShowAddForm(false);
        setFormData({
          companyId: "",
          billingPeriod: "",
          status: "draft",
        });
        fetchInvoices();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}\n\nDetails: ${errorData.details}`
          : errorData.error || "Failed to create invoice";
        console.error("Invoice creation error:", errorData);
        setError(errorMessage);
        alert(errorMessage); // Show alert for visibility
      }
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      const errorMessage = error.message || "Something went wrong";
      setError(errorMessage);
      alert(errorMessage); // Show alert for visibility
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "badge-neutral",
      sent: "badge-info",
      paid: "badge-success",
      overdue: "badge-danger",
      cancelled: "badge-neutral",
    };
    return colors[status] || "badge-neutral";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatBillingPeriod = (period: string) => {
    // Format "2024-01" to "January 2024"
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Generate billing period options (last 12 months)
  const getBillingPeriodOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = formatBillingPeriod(value);
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer invoices and billing
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? "Cancel" : "+ Create Invoice"}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Company
            </label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="input"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Billing Period
            </label>
            <select
              value={filterBillingPeriod}
              onChange={(e) => setFilterBillingPeriod(e.target.value)}
              className="input"
            >
              <option value="">All Periods</option>
              {getBillingPeriodOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create Invoice Form */}
      {showAddForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Create New Invoice
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Automatic Calculation:</strong> The invoice will be
              automatically calculated based on:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Machine count per site (from active sites)</li>
                <li>
                  Subscription fees (machines × price per machine per site)
                </li>
                <li>Usage hours and fees from tickets in the billing period</li>
                <li>Escalation fees and travel expenses from tickets</li>
              </ul>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company *
                </label>
                <select
                  required
                  value={formData.companyId}
                  onChange={(e) =>
                    setFormData({ ...formData, companyId: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Billing Period *
                </label>
                <select
                  required
                  value={formData.billingPeriod}
                  onChange={(e) =>
                    setFormData({ ...formData, billingPeriod: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select period...</option>
                  {getBillingPeriodOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No invoices found. Create your first invoice to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Company</th>
                  <th>Billing Period</th>
                  <th>Machines</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                  >
                    <td className="font-medium text-slate-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td>{invoice.company.name}</td>
                    <td>{formatBillingPeriod(invoice.billingPeriod)}</td>
                    <td>{invoice.machineCount}</td>
                    <td className="font-semibold text-slate-900">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td>
                      <span
                        className={`badge ${getStatusColor(invoice.status)}`}
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
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
