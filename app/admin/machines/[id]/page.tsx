"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface MachineAlarm {
  id: string;
  alarmCode: string;
  alarmDescription: string | null;
  occurrenceDate: string;
  resolvedDate: string | null;
  resolution: string | null;
}

interface Machine {
  id: string;
  name: string;
  model: string | null;
  series: string | null;
  serialNumber: string | null;
  status: string | null;
  isCurrentlyDown: boolean;
  hasRemoteAccess: boolean;
  remoteAccessType: string | null;
  remoteAccessId: string | null;
  windowsVersion: string | null;
  directConnectVersion: string | null;
  firmwareVersion: string | null;
  site: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    company: { id: string; name: string };
  };
  tickets: {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    machineDown: boolean;
    createdAt: string;
    resolvedAt: string | null;
  }[];
  alarms: MachineAlarm[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminMachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", model: "", series: "", serialNumber: "", status: "",
    isCurrentlyDown: false, hasRemoteAccess: false, remoteAccessType: "",
    remoteAccessId: "", windowsVersion: "", directConnectVersion: "", firmwareVersion: "",
  });

  useEffect(() => { if (machineId) fetchMachine(); }, [machineId]);

  const fetchMachine = async () => {
    try {
      const response = await fetch("/api/machines/" + machineId);
      if (response.ok) {
        const data = await response.json();
        setMachine(data);
        setEditForm({
          name: data.name || "", model: data.model || "", series: data.series || "",
          serialNumber: data.serialNumber || "", status: data.status || "",
          isCurrentlyDown: data.isCurrentlyDown || false, hasRemoteAccess: data.hasRemoteAccess || false,
          remoteAccessType: data.remoteAccessType || "", remoteAccessId: data.remoteAccessId || "",
          windowsVersion: data.windowsVersion || "", directConnectVersion: data.directConnectVersion || "",
          firmwareVersion: data.firmwareVersion || "",
        });
      } else { setError("Machine not found"); }
    } catch (err) { setError("Failed to load"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/machines/" + machineId, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        const updated = await response.json();
        setMachine({ ...machine!, ...updated });
        setIsEditing(false);
      } else { alert("Failed to update"); }
    } catch (err) { alert("Failed to update"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this machine?")) return;
    try {
      const response = await fetch("/api/machines/" + machineId, { method: "DELETE" });
      if (response.ok) router.push("/admin/machines");
      else alert("Failed to delete");
    } catch (err) { alert("Failed to delete"); }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    const s = status.toLowerCase();
    if (s === "active") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (s === "down") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (s === "maintenance") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  const getTicketStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      assigned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      closed: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    };
    return colors[status] || colors.open;
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );

  if (error || !machine) return (
    <div className="p-6 text-center py-12">
      <p className="text-slate-500 dark:text-slate-400 mb-4">{error || "Not found"}</p>
      <Link href="/admin/machines" className="btn-primary">Back to Machines</Link>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/machines" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Machines</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white font-medium">{machine.name}</span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={"w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 " + (machine.isCurrentlyDown ? "bg-red-100 dark:bg-red-900/30" : "bg-purple-100 dark:bg-purple-900/30")}>
              <svg className={"w-8 h-8 " + (machine.isCurrentlyDown ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{machine.name}</h1>
                <span className={"px-3 py-1 text-sm font-semibold rounded-full " + getStatusColor(machine.status)}>{machine.status || "Unknown"}</span>
                {machine.isCurrentlyDown && <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Down</span>}
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>{machine.site.name}</span>
                <span>•</span>
                <Link href={"/admin/customers/" + machine.site.company.id} className="hover:text-primary-600 dark:hover:text-primary-400">{machine.site.company.name}</Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="btn-secondary">Edit</button>
                <Link href={"/admin/tickets?machineId=" + machine.id} className="btn-primary">View Tickets</Link>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary" disabled={saving}>Cancel</button>
                <button onClick={handleSave} className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Specifications</h2>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model</label><input type="text" value={editForm.model} onChange={(e) => setEditForm({...editForm, model: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Series</label><input type="text" value={editForm.series} onChange={(e) => setEditForm({...editForm, series: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number</label><input type="text" value={editForm.serialNumber} onChange={(e) => setEditForm({...editForm, serialNumber: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="input">
                    <option value="">Select</option><option value="Active">Active</option><option value="Down">Down</option><option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex items-center pt-6"><label className="flex items-center gap-2"><input type="checkbox" checked={editForm.isCurrentlyDown} onChange={(e) => setEditForm({...editForm, isCurrentlyDown: e.target.checked})} className="w-4 h-4" /><span className="text-sm text-slate-700 dark:text-slate-300">Currently Down</span></label></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Model</p><p className="text-slate-900 dark:text-white">{machine.model || "N/A"}</p></div>
                <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Series</p><p className="text-slate-900 dark:text-white">{machine.series || "N/A"}</p></div>
                <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Serial Number</p><p className="text-slate-900 dark:text-white font-mono">{machine.serialNumber || "N/A"}</p></div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Software & Remote</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Windows</p><p className="text-slate-900 dark:text-white font-mono text-sm">{machine.windowsVersion || "N/A"}</p></div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">DirectConnect</p><p className="text-slate-900 dark:text-white font-mono text-sm">{machine.directConnectVersion || "N/A"}</p></div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Firmware</p><p className="text-slate-900 dark:text-white font-mono text-sm">{machine.firmwareVersion || "N/A"}</p></div>
            </div>
            {machine.hasRemoteAccess && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-900 dark:text-blue-300">Remote Access: {machine.remoteAccessType} - {machine.remoteAccessId}</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Tickets</h2>
              <Link href={"/admin/tickets?machineId=" + machine.id} className="text-sm text-primary-600 dark:text-primary-400 font-medium">View All</Link>
            </div>
            {machine.tickets && machine.tickets.length > 0 ? (
              <div className="space-y-3">
                {machine.tickets.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} href={"/admin/tickets/" + ticket.id} className="block bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <div className="flex items-center gap-2 mb-1"><span className="font-mono text-sm text-slate-600 dark:text-slate-400">{ticket.ticketNumber}</span><span className={"px-2 py-0.5 text-xs font-medium rounded-full " + getTicketStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</span></div>
                    <p className="font-medium text-slate-900 dark:text-white">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-center text-slate-500 dark:text-slate-400 py-8">No tickets</p>}
          </div>

          {/* Activity History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Activity History
            </h2>
            {(() => {
              // Build unified timeline
              type ActivityItem = {
                id: string;
                type: "ticket_created" | "ticket_resolved" | "alarm" | "alarm_resolved";
                date: string;
                title: string;
                description: string;
                status?: string;
                linkHref?: string;
              };
              const activities: ActivityItem[] = [];

              machine.tickets?.forEach((ticket) => {
                activities.push({
                  id: "ticket-" + ticket.id,
                  type: "ticket_created",
                  date: ticket.createdAt,
                  title: "Ticket #" + ticket.ticketNumber + " Created",
                  description: ticket.subject,
                  status: ticket.status,
                  linkHref: "/admin/tickets/" + ticket.id,
                });
                if (ticket.resolvedAt) {
                  activities.push({
                    id: "ticket-resolved-" + ticket.id,
                    type: "ticket_resolved",
                    date: ticket.resolvedAt,
                    title: "Ticket #" + ticket.ticketNumber + " Resolved",
                    description: ticket.subject,
                    linkHref: "/admin/tickets/" + ticket.id,
                  });
                }
              });

              machine.alarms?.forEach((alarm) => {
                activities.push({
                  id: "alarm-" + alarm.id,
                  type: "alarm",
                  date: alarm.occurrenceDate,
                  title: "Alarm: " + alarm.alarmCode,
                  description: alarm.alarmDescription || "Machine alarm triggered",
                });
                if (alarm.resolvedDate) {
                  activities.push({
                    id: "alarm-resolved-" + alarm.id,
                    type: "alarm_resolved",
                    date: alarm.resolvedDate,
                    title: "Alarm Resolved: " + alarm.alarmCode,
                    description: alarm.resolution || "Alarm was resolved",
                  });
                }
              });

              activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              if (activities.length === 0) {
                return <p className="text-center text-slate-500 dark:text-slate-400 py-8">No activity recorded</p>;
              }

              const getIcon = (type: ActivityItem["type"]) => {
                if (type === "ticket_created") return <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>;
                if (type === "ticket_resolved") return <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>;
                if (type === "alarm") return <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>;
                return <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
              };

              return (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                  <div className="space-y-4">
                    {activities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="relative flex items-start gap-4 pl-1">
                        <div className="relative z-10">{getIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {activity.linkHref ? (
                              <Link href={activity.linkHref} className="font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">{activity.title}</Link>
                            ) : (
                              <span className="font-medium text-slate-900 dark:text-white">{activity.title}</span>
                            )}
                            {activity.status && <span className={"px-2 py-0.5 text-xs font-medium rounded-full " + getTicketStatusColor(activity.status)}>{activity.status.replace("_", " ")}</span>}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">{activity.description}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(activity.date).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {activities.length > 10 && <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Showing 10 of {activities.length} activities</p></div>}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Location</h2>
            <div className="space-y-3">
              <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Site</p><p className="text-slate-900 dark:text-white font-medium">{machine.site.name}</p></div>
              {machine.site.city && <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Address</p><p className="text-slate-700 dark:text-slate-300 text-sm">{machine.site.address}<br/>{machine.site.city}, {machine.site.state} {machine.site.zipCode}</p></div>}
              <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Company</p><Link href={"/admin/customers/" + machine.site.company.id} className="text-primary-600 dark:text-primary-400">{machine.site.company.name}</Link></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-slate-900 dark:text-white">{machine.tickets?.length || 0}</p><p className="text-xs text-slate-500 dark:text-slate-400">Total Tickets</p></div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-slate-900 dark:text-white">{machine.tickets?.filter(t => ["open", "assigned", "in_progress"].includes(t.status)).length || 0}</p><p className="text-xs text-slate-500 dark:text-slate-400">Open</p></div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">Delete this machine permanently.</p>
            <button onClick={handleDelete} className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Delete Machine</button>
          </div>
        </div>
      </div>
    </div>
  );
}
