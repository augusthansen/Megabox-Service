"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Machine {
  id: string;
  name: string;
  model?: string | null;
  serialNumber?: string | null;
  status?: string | null;
  isCurrentlyDown?: boolean;
}

interface MachineShape {
  id: string;
  name: string;
  color?: string;
  points: { x: number; y: number }[];
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface MachineDetailModalProps {
  machine: Machine;
  currentShapeId?: string | null;
  currentRotation?: number;
  shapes?: MachineShape[];
  onClose: () => void;
  onRemove?: () => void;
  onChangeShape?: (shapeId: string | null) => void;
  onChangeRotation?: (rotation: number) => void;
  isEditMode?: boolean;
}

export default function MachineDetailModal({
  machine,
  currentShapeId,
  currentRotation = 0,
  shapes = [],
  onClose,
  onRemove,
  onChangeShape,
  onChangeRotation,
  isEditMode = false,
}: MachineDetailModalProps) {
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(currentShapeId || null);
  const [rotation, setRotation] = useState<number>(currentRotation);

  useEffect(() => {
    fetchRecentTickets();
  }, [machine.id]);

  const fetchRecentTickets = async () => {
    try {
      const response = await fetch(
        `/api/tickets?machineId=${machine.id}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setRecentTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      maintenance:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return statusColors[status || ""] || statusColors.inactive;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return priorityColors[priority] || priorityColors.medium;
  };

  const handleShapeChange = (shapeId: string | null) => {
    setSelectedShapeId(shapeId);
    if (onChangeShape) {
      onChangeShape(shapeId);
    }
  };

  const handleRotationChange = (newRotation: number) => {
    // Normalize rotation to 0-360
    const normalized = ((newRotation % 360) + 360) % 360;
    setRotation(normalized);
    if (onChangeRotation) {
      onChangeRotation(normalized);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {machine.model || machine.name}
            </h2>
            {machine.serialNumber && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Serial: {machine.serialNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Status */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                machine.status
              )}`}
            >
              {machine.status || "Unknown"}
            </span>
            {machine.isCurrentlyDown && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Currently Down
              </span>
            )}
          </div>

          {/* Shape Selector (edit mode only) */}
          {isEditMode && shapes.length > 0 && onChangeShape && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon Shape
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Default shape option */}
                <button
                  onClick={() => handleShapeChange(null)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedShapeId === null
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500"
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="2" y="4" width="16" height="12" rx="1" />
                  </svg>
                  Default
                </button>
                {shapes.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => handleShapeChange(shape.id)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedShapeId === shape.id
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500"
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="w-5 h-5">
                      <polygon
                        points={shape.points.map(p => `${p.x * 16 + 2},${p.y * 16 + 2}`).join(" ")}
                        fill={selectedShapeId === shape.id ? "currentColor" : (shape.color || "#06b6d4")}
                      />
                    </svg>
                    {shape.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rotation Controls (edit mode only) */}
          {isEditMode && onChangeRotation && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rotation: {rotation}°
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRotationChange(rotation - 90)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
                  title="Rotate 90° counter-clockwise"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={rotation}
                  onChange={(e) => handleRotationChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <button
                  onClick={() => handleRotationChange(rotation + 90)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
                  title="Rotate 90° clockwise"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRotationChange(0)}
                  className="px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
                  title="Reset rotation"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mb-6">
            <Link
              href={`/admin/machines/${machine.id}`}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
            >
              View Details
            </Link>
            <Link
              href={`/admin/tickets?machineId=${machine.id}`}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-center text-sm font-medium"
            >
              All Tickets
            </Link>
          </div>

          {/* Recent Tickets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Recent Tickets
            </h3>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Loading...
              </p>
            ) : recentTickets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No recent tickets
              </p>
            ) : (
              <div className="space-y-2">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          #{ticket.ticketNumber}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer (edit mode only) */}
        {isEditMode && onRemove && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={onRemove}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Remove from Floor Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
