"use client";

import { useState } from "react";

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

interface MachinePaletteProps {
  machines: Machine[];
  shapes: MachineShape[];
  onAddMachine: (machineId: string, shapeId?: string) => void;
}

export default function MachinePalette({
  machines,
  shapes,
  onAddMachine,
}: MachinePaletteProps) {
  const [selectedShapeId, setSelectedShapeId] = useState<string | undefined>(
    shapes.length > 0 ? shapes[0].id : undefined
  );

  if (machines.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          All machines are placed on the floor plan
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Unplaced Machines ({machines.length})
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Select a shape, then click a machine to add
        </p>
      </div>

      {/* Shape Selector */}
      {shapes.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Shape to use:
          </label>
          <div className="flex flex-wrap gap-2">
            {/* Default (no shape) option */}
            <button
              onClick={() => setSelectedShapeId(undefined)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                selectedShapeId === undefined
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <rect x="2" y="4" width="16" height="12" rx="1" />
              </svg>
              Default
            </button>
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => setSelectedShapeId(shape.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  selectedShapeId === shape.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <svg viewBox="0 0 20 20" className="w-4 h-4">
                  <polygon
                    points={shape.points.map(p => `${p.x * 16 + 2},${p.y * 16 + 2}`).join(" ")}
                    fill={shape.color || "#06b6d4"}
                  />
                </svg>
                {shape.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto">
        {machines.map((machine) => (
          <button
            key={machine.id}
            onClick={() => onAddMachine(machine.id, selectedShapeId)}
            className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  machine.isCurrentlyDown
                    ? "bg-red-500"
                    : machine.status === "active"
                    ? "bg-green-500"
                    : machine.status === "maintenance"
                    ? "bg-amber-500"
                    : "bg-gray-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {machine.model || machine.name}
                </p>
                {machine.serialNumber && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    S/N: {machine.serialNumber}
                  </p>
                )}
              </div>
              <span className="text-blue-600 dark:text-blue-400 text-xs">
                + Add
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
