"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Invoice Detail Page
 * 
 * View and edit an individual invoice
 */

interface InvoiceLineItem {
  id: string;
  siteId: string;
  machineCount: number;
  subscriptionFee: number;
  usageHours: number;
  usageFee: number;
  escalationFees: number;
  travelExpenses: number;
  subtotal: number;
  site: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  };
}

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
  updatedAt: string;
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    pricingTier: string;
    pricePerMachine: number;
    hourlyRate: number;
  };
  lineItems?: InvoiceLineItem[];
  tickets?: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    site: {
      id: string;
      name: string;
    };
    totalMinutes: number;
    totalCost: number;
    escalationFees: number;
    travelExpenses: number;
    createdAt: string;
  }>;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    billingPeriod: "",
    machineCount: 0,
    subscriptionFee: "",
    usageHours: "",
    usageFee: "",
    escalationFees: "0",
    travelExpenses: "0",
    status: "draft",
    paidDate: "",
    quickbooksInvoiceId: "",
  });

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        setFormData({
          billingPeriod: data.billingPeriod,
          machineCount: data.machineCount,
          subscriptionFee: data.subscriptionFee.toString(),
          usageHours: data.usageHours.toString(),
          usageFee: data.usageFee.toString(),
          escalationFees: data.escalationFees.toString(),
          travelExpenses: data.travelExpenses.toString(),
          status: data.status,
          paidDate: data.paidDate ? new Date(data.paidDate).toISOString().split("T")[0] : "",
          quickbooksInvoiceId: data.quickbooksInvoiceId || "",
        });
      } else {
        console.error("Invoice not found");
        alert("Invoice not found");
        router.push("/admin/invoices");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      alert("Error loading invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingPeriod: formData.billingPeriod,
          machineCount: formData.machineCount,
          subscriptionFee: formData.subscriptionFee ? parseFloat(formData.subscriptionFee) : undefined,
          usageHours: formData.usageHours ? parseFloat(formData.usageHours) : undefined,
          usageFee: formData.usageFee ? parseFloat(formData.usageFee) : undefined,
          escalationFees: parseFloat(formData.escalationFees) || 0,
          travelExpenses: parseFloat(formData.travelExpenses) || 0,
          status: formData.status,
          paidDate: formData.paidDate || null,
          quickbooksInvoiceId: formData.quickbooksInvoiceId || null,
        }),
      });

      if (response.ok) {
        alert("Invoice updated successfully!");
        setEditing(false);
        fetchInvoice();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to update invoice");
      }
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatBillingPeriod = (period: string) => {
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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

  // Calculate total from form data
  const calculateTotal = () => {
    const subFee = parseFloat(formData.subscriptionFee) || 0;
    const useFee = parseFloat(formData.usageFee) || 0;
    const escFees = parseFloat(formData.escalationFees) || 0;
    const travel = parseFloat(formData.travelExpenses) || 0;
    return subFee + useFee + escFees + travel;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/invoices"
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Invoice {invoice.invoiceNumber}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatBillingPeriod(invoice.billingPeriod)} • {invoice.company.name}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Invoice
            </button>
          ) : (
            <>
              <button onClick={() => { setEditing(false); fetchInvoice(); }} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Invoice Details</h3>
              <span className={`badge ${getStatusColor(invoice.status)}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Company</p>
                <p className="text-base font-medium text-slate-900">
                  <Link href={`/admin/customers/${invoice.company.id}`} className="text-primary-600 hover:text-primary-700">
                    {invoice.company.name}
                  </Link>
                </p>
                {invoice.company.email && (
                  <p className="text-sm text-slate-500">{invoice.company.email}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Billing Period</p>
                  {editing ? (
                    <input
                      type="month"
                      value={formData.billingPeriod}
                      onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                      className="input mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium text-slate-900">
                      {formatBillingPeriod(invoice.billingPeriod)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Machine Count</p>
                  {editing ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.machineCount}
                      onChange={(e) => setFormData({ ...formData, machineCount: parseInt(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium text-slate-900">{invoice.machineCount}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Per-Site Breakdown */}
          {invoice.lineItems && invoice.lineItems.length > 0 ? (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Per-Site Breakdown</h3>
              <div className="space-y-6">
                {invoice.lineItems.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{item.site.name}</h4>
                        {item.site.address && (
                          <p className="text-sm text-slate-500">
                            {item.site.address}
                            {item.site.city && `, ${item.site.city}`}
                            {item.site.state && `, ${item.site.state}`}
                            {item.site.zipCode && ` ${item.site.zipCode}`}
                          </p>
                        )}
                      </div>
                      <span className="badge badge-info">
                        {item.machineCount} {item.machineCount === 1 ? "Machine" : "Machines"}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Subscription Fee:</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(item.subscriptionFee)}
                        </span>
                      </div>
                      {item.usageHours > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Usage ({item.usageHours.toFixed(2)} hrs):
                          </span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(item.usageFee)}
                          </span>
                        </div>
                      )}
                      {item.escalationFees > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Escalation Fees:</span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(item.escalationFees)}
                          </span>
                        </div>
                      )}
                      {item.travelExpenses > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Travel Expenses:</span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(item.travelExpenses)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-900">Site Subtotal:</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Subscription Fee</p>
                    <p className="text-sm text-slate-500">
                      {invoice.machineCount} machines × {formatCurrency(invoice.company.pricePerMachine)}/machine
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(invoice.subscriptionFee)}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Usage Fee</p>
                    <p className="text-sm text-slate-500">
                      {invoice.usageHours.toFixed(2)} hours × {formatCurrency(invoice.company.hourlyRate)}/hour
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(invoice.usageFee)}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <p className="font-medium text-slate-900">Escalation Fees</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(invoice.escalationFees)}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <p className="font-medium text-slate-900">Travel Expenses</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(invoice.travelExpenses)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="card p-6">
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-slate-900">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </div>
          </div>

          {/* Tickets Included */}
          {invoice.tickets && invoice.tickets.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Tickets Included ({invoice.tickets.length})
              </h3>
              <div className="space-y-2">
                {invoice.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {ticket.ticketNumber}
                      </Link>
                      <p className="text-sm text-slate-600">{ticket.subject}</p>
                      <p className="text-xs text-slate-500">
                        {ticket.site.name} • {Math.round(ticket.totalMinutes / 60 * 10) / 10} hours
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-slate-900">
                        {formatCurrency(ticket.totalCost)}
                      </p>
                      {(ticket.escalationFees > 0 || ticket.travelExpenses > 0) && (
                        <p className="text-xs text-slate-500">
                          {ticket.escalationFees > 0 && `Esc: ${formatCurrency(ticket.escalationFees)}`}
                          {ticket.escalationFees > 0 && ticket.travelExpenses > 0 && " • "}
                          {ticket.travelExpenses > 0 && `Travel: ${formatCurrency(ticket.travelExpenses)}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Status & Actions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                {editing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`badge ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                )}
              </div>

              {formData.status === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paid Date
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={formData.paidDate}
                      onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <p className="text-sm text-slate-900">
                      {invoice.paidDate
                        ? new Date(invoice.paidDate).toLocaleDateString()
                        : "Not set"}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  QuickBooks Invoice ID
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.quickbooksInvoiceId}
                    onChange={(e) => setFormData({ ...formData, quickbooksInvoiceId: e.target.value })}
                    className="input"
                    placeholder="QB-12345"
                  />
                ) : (
                  <p className="text-sm text-slate-900">
                    {invoice.quickbooksInvoiceId || "Not linked"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Metadata</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Created</p>
                <p className="text-slate-900">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Last Updated</p>
                <p className="text-slate-900">
                  {new Date(invoice.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

