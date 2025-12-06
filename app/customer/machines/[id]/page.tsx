"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/**
 * Customer Machine Detail Page
 * View detailed machine information and recent tickets
 */

interface MachineAlarm {
  id: string;
  alarmCode: string;
  alarmDescription: string | null;
  occurrenceDate: string;
  resolvedDate: string | null;
  resolution: string | null;
}

interface MachineTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
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
  windowsVersion: string | null;
  directConnectVersion: string | null;
  firmwareVersion: string | null;
  configuration: any;
  site: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    company: {
      id: string;
      name: string;
    };
  };
  tickets: MachineTicket[];
  alarms: MachineAlarm[];
  createdAt: string;
  updatedAt: string;
}

// Activity item for the unified timeline
interface ActivityItem {
  id: string;
  type: "ticket_created" | "ticket_resolved" | "alarm" | "alarm_resolved";
  date: string;
  title: string;
  description: string;
  status?: string;
  linkHref?: string;
}

export default function CustomerMachineDetailPage() {
  const params = useParams();
  const machineId = params.id as string;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (machineId) {
      fetchMachine();
    }
  }, [machineId]);

  const fetchMachine = async () => {
    try {
      const response = await fetch(`/api/machines/${machineId}`);
      if (response.ok) {
        const data = await response.json();
        setMachine(data);
      } else {
        setError("Machine not found");
      }
    } catch (err) {
      console.error("Error fetching machine:", err);
      setError("Failed to load machine details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "down":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "maintenance":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getTicketStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      assigned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      on_hold: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      closed: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    };
    return colors[status] || colors.open;
  };

  // Build unified activity timeline from tickets and alarms
  const buildActivityTimeline = (machine: Machine): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Add ticket creation events
    machine.tickets.forEach((ticket) => {
      activities.push({
        id: `ticket-created-${ticket.id}`,
        type: "ticket_created",
        date: ticket.createdAt,
        title: `Ticket #${ticket.ticketNumber} Created`,
        description: ticket.subject,
        status: ticket.status,
        linkHref: `/customer/tickets/${ticket.id}`,
      });

      // Add ticket resolved events
      if (ticket.resolvedAt) {
        activities.push({
          id: `ticket-resolved-${ticket.id}`,
          type: "ticket_resolved",
          date: ticket.resolvedAt,
          title: `Ticket #${ticket.ticketNumber} Resolved`,
          description: ticket.subject,
          linkHref: `/customer/tickets/${ticket.id}`,
        });
      }
    });

    // Add alarm events
    machine.alarms?.forEach((alarm) => {
      activities.push({
        id: `alarm-${alarm.id}`,
        type: "alarm",
        date: alarm.occurrenceDate,
        title: `Alarm: ${alarm.alarmCode}`,
        description: alarm.alarmDescription || "Machine alarm triggered",
      });

      // Add alarm resolved events
      if (alarm.resolvedDate) {
        activities.push({
          id: `alarm-resolved-${alarm.id}`,
          type: "alarm_resolved",
          date: alarm.resolvedDate,
          title: `Alarm Resolved: ${alarm.alarmCode}`,
          description: alarm.resolution || "Alarm was resolved",
        });
      }
    });

    // Sort by date descending (most recent first)
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "ticket_created":
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case "ticket_resolved":
        return (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "alarm":
        return (
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "alarm_resolved":
        return (
          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading machine details...</p>
        </div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-4">{error || "Machine not found"}</p>
        <Link href="/customer/machines" className="btn-primary">
          Back to Machines
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/customer/machines"
        className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Machines
      </Link>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{machine.name}</h1>
              <p className="text-slate-600 dark:text-slate-400">{machine.site.name}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(machine.status)}`}>
                  {machine.status || "Unknown"}
                </span>
                {machine.isCurrentlyDown && (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Currently Down
                  </span>
                )}
                {machine.hasRemoteAccess && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Remote Access
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`/customer/tickets/new?machineId=${machine.id}`}
            className="btn-primary flex items-center justify-center whitespace-nowrap"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Ticket
          </Link>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Specifications */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Specifications
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Model</p>
                <p className="text-slate-900 dark:text-white">{machine.model || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Series</p>
                <p className="text-slate-900 dark:text-white">{machine.series || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Serial Number</p>
              <p className="text-slate-900 dark:text-white font-mono">{machine.serialNumber || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Site</p>
              <p className="text-slate-900 dark:text-white font-medium">{machine.site.name}</p>
            </div>
            {(machine.site.address || machine.site.city) && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Address</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {machine.site.address && <span>{machine.site.address}<br /></span>}
                  {machine.site.city && (
                    <span>
                      {machine.site.city}
                      {machine.site.state && `, ${machine.site.state}`}
                      {machine.site.zipCode && ` ${machine.site.zipCode}`}
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Company</p>
              <p className="text-slate-700 dark:text-slate-300">{machine.site.company.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Software Versions */}
      {(machine.windowsVersion || machine.directConnectVersion || machine.firmwareVersion) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Software Versions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {machine.windowsVersion && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Windows</p>
                <p className="text-slate-900 dark:text-white font-mono text-sm">{machine.windowsVersion}</p>
              </div>
            )}
            {machine.directConnectVersion && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">DirectConnect</p>
                <p className="text-slate-900 dark:text-white font-mono text-sm">{machine.directConnectVersion}</p>
              </div>
            )}
            {machine.firmwareVersion && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Firmware</p>
                <p className="text-slate-900 dark:text-white font-mono text-sm">{machine.firmwareVersion}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Tickets */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Recent Tickets
          </h2>
          <Link
            href={`/customer/tickets?machineId=${machine.id}`}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            View All
          </Link>
        </div>

        {machine.tickets && machine.tickets.length > 0 ? (
          <div className="space-y-3">
            {machine.tickets.slice(0, 5).map((ticket) => (
              <Link
                key={ticket.id}
                href={`/customer/tickets/${ticket.id}`}
                className="block bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-400">{ticket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTicketStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white truncate">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-3">No tickets for this machine</p>
            <Link
              href={`/customer/tickets/new?machineId=${machine.id}`}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
            >
              Create First Ticket
            </Link>
          </div>
        )}
      </div>

      {/* Machine Activity History */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-soft border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity History
        </h2>

        {(() => {
          const activities = buildActivityTimeline(machine);
          if (activities.length === 0) {
            return (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-slate-400">No activity recorded yet</p>
              </div>
            );
          }

          return (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="relative flex items-start gap-4 pl-1">
                    {/* Icon */}
                    <div className="relative z-10">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activity.linkHref ? (
                          <Link
                            href={activity.linkHref}
                            className="font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {activity.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-900 dark:text-white">
                            {activity.title}
                          </span>
                        )}
                        {activity.status && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTicketStatusColor(activity.status)}`}>
                            {activity.status.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {activities.length > 10 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing 10 of {activities.length} activities
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Quick Help */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start gap-4">
          <svg className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Need help with this machine?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Create a support ticket to get assistance from our service team. We'll help troubleshoot any issues you're experiencing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/customer/tickets/new?machineId=${machine.id}`}
                className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Ticket
              </Link>
              <a
                href="mailto:support@megaboxsupply.com"
                className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
