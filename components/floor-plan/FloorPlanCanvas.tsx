"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import MachineDetailModal from "./MachineDetailModal";
import MachinePalette from "./MachinePalette";
import ShapeEditor from "./ShapeEditor";

// Dynamically import the entire KonvaCanvas component (client-side only)
const KonvaCanvas = dynamic(() => import("./KonvaCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
});

interface Machine {
  id: string;
  name: string;
  model?: string | null;
  serialNumber?: string | null;
  status?: string | null;
  isCurrentlyDown?: boolean;
}

type ArrowDirection = "up" | "down" | "left" | "right";

interface MachineShape {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  inputArrow?: { x: number; y: number; direction: ArrowDirection } | null;
  outputArrow?: { x: number; y: number; direction: ArrowDirection } | null;
  color?: string;
  isDefault: boolean;
}

interface MachinePosition {
  id: string;
  machineId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string | null;
  shapeId?: string | null;
  shape?: MachineShape | null;
  machine: Machine;
}

interface TextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  rotation: number;
}

interface FloorPlan {
  id: string;
  siteId: string;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  backgroundColor: string;
  showGrid: boolean;
  machinePositions: MachinePosition[];
  textLabels: TextLabel[];
}

interface FloorPlanCanvasProps {
  siteId: string;
  isEditMode: boolean;
  isSuperAdmin: boolean;
}

// Zoom constants
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function FloorPlanCanvas({
  siteId,
  isEditMode: initialEditMode,
  isSuperAdmin,
}: FloorPlanCanvasProps) {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [unplacedMachines, setUnplacedMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [showMachineDetail, setShowMachineDetail] = useState<MachinePosition | null>(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Shape management
  const [shapes, setShapes] = useState<MachineShape[]>([]);
  const [showShapeEditor, setShowShapeEditor] = useState(false);
  const [editingShape, setEditingShape] = useState<MachineShape | null>(null);
  const [showShapeManager, setShowShapeManager] = useState(false);

  // Label management
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<TextLabel | null>(null);
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelFontSize, setNewLabelFontSize] = useState(16);
  const [newLabelFontWeight, setNewLabelFontWeight] = useState("normal");
  const [newLabelColor, setNewLabelColor] = useState("#374151");

  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch available shapes
  const fetchShapes = useCallback(async () => {
    try {
      const response = await fetch("/api/machine-shapes");
      if (response.ok) {
        const data = await response.json();
        setShapes(data);
      }
    } catch (err) {
      console.error("Failed to fetch shapes:", err);
    }
  }, []);

  useEffect(() => {
    fetchShapes();
  }, [fetchShapes]);

  // Save a new shape
  const handleSaveShape = async (shape: {
    id?: string;
    name: string;
    points: { x: number; y: number }[];
    inputArrow?: { x: number; y: number; direction: string };
    outputArrow?: { x: number; y: number; direction: string };
  }) => {
    try {
      setSaving(true);
      const isNew = !editingShape;
      const url = isNew ? "/api/machine-shapes" : `/api/machine-shapes/${editingShape.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shape),
      });

      if (response.ok) {
        await fetchShapes();
        setShowShapeEditor(false);
        setEditingShape(null);
      }
    } catch (err) {
      console.error("Failed to save shape:", err);
    } finally {
      setSaving(false);
    }
  };

  // Delete a shape
  const handleDeleteShape = async (shapeId: string) => {
    if (!confirm("Are you sure you want to delete this shape?")) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/machine-shapes/${shapeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchShapes();
      }
    } catch (err) {
      console.error("Failed to delete shape:", err);
    } finally {
      setSaving(false);
    }
  };

  // Fetch floor plan data
  const fetchFloorPlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/floor-plans/${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setFloorPlan(data.floorPlan);
        setUnplacedMachines(data.unplacedMachines);
      } else {
        setError("Failed to load floor plan");
      }
    } catch (err) {
      setError("Failed to load floor plan");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchFloorPlan();
  }, [fetchFloorPlan]);

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && floorPlan) {
        const containerWidth = containerRef.current.offsetWidth;
        const scale = Math.min(1, containerWidth / floorPlan.width);
        setStageSize({
          width: floorPlan.width * scale,
          height: floorPlan.height * scale,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [floorPlan]);

  // Handle machine position drag
  const handleDragEnd = async (machineId: string, x: number, y: number) => {
    if (!floorPlan) return;

    // Always snap to grid
    const snapX = Math.round(x / floorPlan.gridSize) * floorPlan.gridSize;
    const snapY = Math.round(y / floorPlan.gridSize) * floorPlan.gridSize;

    // Update local state immediately for responsiveness
    setFloorPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        machinePositions: prev.machinePositions.map((pos) =>
          pos.machineId === machineId ? { ...pos, x: snapX, y: snapY } : pos
        ),
      };
    });

    // Save to server
    try {
      setSaving(true);
      await fetch(`/api/floor-plans/${siteId}/positions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: [{ machineId, x: snapX, y: snapY }],
        }),
      });
    } catch (err) {
      console.error("Failed to save position:", err);
    } finally {
      setSaving(false);
    }
  };

  // Add machine to floor plan
  const handleAddMachine = async (machineId: string, shapeId?: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/floor-plans/${siteId}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId,
          x: 100,
          y: 100,
          shapeId: shapeId || null,
        }),
      });

      if (response.ok) {
        await fetchFloorPlan();
      }
    } catch (err) {
      console.error("Failed to add machine:", err);
    } finally {
      setSaving(false);
    }
  };

  // Change shape for a placed machine
  const handleChangeShape = async (machineId: string, shapeId: string | null) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/floor-plans/${siteId}/positions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: [{ machineId, shapeId }],
        }),
      });

      if (response.ok) {
        // Update local state
        setFloorPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            machinePositions: prev.machinePositions.map((pos) =>
              pos.machineId === machineId
                ? { ...pos, shapeId, shape: shapeId ? shapes.find(s => s.id === shapeId) || null : null }
                : pos
            ),
          };
        });
      }
    } catch (err) {
      console.error("Failed to change shape:", err);
    } finally {
      setSaving(false);
    }
  };

  // Change rotation for a placed machine
  const handleChangeRotation = async (machineId: string, rotation: number) => {
    // Update local state immediately for responsiveness
    setFloorPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        machinePositions: prev.machinePositions.map((pos) =>
          pos.machineId === machineId ? { ...pos, rotation } : pos
        ),
      };
    });

    // Also update the showMachineDetail if it's the same machine
    if (showMachineDetail?.machineId === machineId) {
      setShowMachineDetail((prev) => prev ? { ...prev, rotation } : null);
    }

    // Save to server
    try {
      setSaving(true);
      await fetch(`/api/floor-plans/${siteId}/positions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: [{ machineId, rotation }],
        }),
      });
    } catch (err) {
      console.error("Failed to change rotation:", err);
    } finally {
      setSaving(false);
    }
  };

  // Remove machine from floor plan
  const handleRemoveMachine = async (machineId: string) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/floor-plans/${siteId}/positions?machineId=${machineId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setShowMachineDetail(null);
        setSelectedMachineId(null);
        await fetchFloorPlan();
      }
    } catch (err) {
      console.error("Failed to remove machine:", err);
    } finally {
      setSaving(false);
    }
  };

  // Update floor plan settings
  const handleUpdateSettings = async (settings: Partial<FloorPlan>) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/floor-plans/${siteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setFloorPlan(data);
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle machine click
  const handleMachineClick = (position: MachinePosition) => {
    if (isEditMode) {
      setSelectedMachineId(
        selectedMachineId === position.machineId ? null : position.machineId
      );
      setSelectedLabelId(null);
    }
    setShowMachineDetail(position);
  };

  // Add a new text label
  const handleAddLabel = async () => {
    if (!newLabelText.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/floor-plans/${siteId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newLabelText,
          x: 100,
          y: 100,
          fontSize: newLabelFontSize,
          fontWeight: newLabelFontWeight,
          color: newLabelColor,
        }),
      });

      if (response.ok) {
        const label = await response.json();
        setFloorPlan((prev) => {
          if (!prev) return prev;
          return { ...prev, textLabels: [...prev.textLabels, label] };
        });
        setShowAddLabelModal(false);
        setNewLabelText("");
        setNewLabelFontSize(16);
        setNewLabelFontWeight("normal");
        setNewLabelColor("#374151");
      }
    } catch (err) {
      console.error("Failed to add label:", err);
    } finally {
      setSaving(false);
    }
  };

  // Update a label
  const handleUpdateLabel = async (label: TextLabel) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/floor-plans/${siteId}/labels`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: [label] }),
      });

      if (response.ok) {
        setFloorPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            textLabels: prev.textLabels.map((l) =>
              l.id === label.id ? label : l
            ),
          };
        });
        setEditingLabel(null);
      }
    } catch (err) {
      console.error("Failed to update label:", err);
    } finally {
      setSaving(false);
    }
  };

  // Delete a label
  const handleDeleteLabel = async (labelId: string) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/floor-plans/${siteId}/labels?labelId=${labelId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setFloorPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            textLabels: prev.textLabels.filter((l) => l.id !== labelId),
          };
        });
        setSelectedLabelId(null);
        setEditingLabel(null);
      }
    } catch (err) {
      console.error("Failed to delete label:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle label drag end
  const handleLabelDragEnd = async (labelId: string, x: number, y: number) => {
    if (!floorPlan) return;

    // Always snap to grid
    const snapX = Math.round(x / floorPlan.gridSize) * floorPlan.gridSize;
    const snapY = Math.round(y / floorPlan.gridSize) * floorPlan.gridSize;

    // Update local state
    setFloorPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        textLabels: prev.textLabels.map((l) =>
          l.id === labelId ? { ...l, x: snapX, y: snapY } : l
        ),
      };
    });

    // Save to server
    try {
      setSaving(true);
      await fetch(`/api/floor-plans/${siteId}/labels`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labels: [{ id: labelId, x: snapX, y: snapY }],
        }),
      });
    } catch (err) {
      console.error("Failed to save label position:", err);
    } finally {
      setSaving(false);
    }
  };

  // Handle label click
  const handleLabelClick = (label: TextLabel) => {
    if (isEditMode) {
      setSelectedLabelId(selectedLabelId === label.id ? null : label.id);
      setSelectedMachineId(null);
      setEditingLabel(label);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchFloorPlan}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!floorPlan || !mounted) {
    return null;
  }

  const baseScale = stageSize.width / floorPlan.width;
  const scale = baseScale * zoom;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {floorPlan.name}
          </h3>
          {saving && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded min-w-[48px]"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {isEditMode ? "Done Editing" : "Edit Layout"}
            </button>
          )}
          {isEditMode && (
            <>
              <button
                onClick={() => setShowAddLabelModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
              >
                Add Label
              </button>
              <button
                onClick={() => setShowShapeManager(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
              >
                Manage Shapes
              </button>
              <button
                onClick={() =>
                  handleUpdateSettings({ showGrid: !floorPlan.showGrid })
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  floorPlan.showGrid
                    ? "bg-gray-200 dark:bg-gray-600"
                    : "bg-gray-100 dark:bg-gray-700"
                } text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600`}
              >
                Grid: {floorPlan.showGrid ? "On" : "Off"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className={`flex-1 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-auto relative ${
            isEditMode ? "cursor-default" : ""
          }`}
          style={{ maxHeight: "70vh" }}
        >
          <div
            style={{
              width: floorPlan.width * scale,
              height: floorPlan.height * scale,
              minWidth: "100%",
              minHeight: "100%",
            }}
          >
          <KonvaCanvas
            floorPlan={floorPlan}
            stageSize={{ width: floorPlan.width * scale, height: floorPlan.height * scale }}
            scale={scale}
            selectedMachineId={selectedMachineId}
            selectedLabelId={selectedLabelId}
            isEditMode={isEditMode}
            isDarkMode={isDarkMode}
            onMachineClick={handleMachineClick}
            onMachineDragEnd={handleDragEnd}
            onLabelClick={handleLabelClick}
            onLabelDragEnd={handleLabelDragEnd}
            onStageClick={() => {
              setSelectedMachineId(null);
              setSelectedLabelId(null);
            }}
          />
          </div>

          {/* Empty state */}
          {floorPlan.machinePositions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No machines placed yet
                </p>
                {isEditMode && unplacedMachines.length > 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Use the panel on the right to add machines
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (edit mode only) */}
        {isEditMode && (
          <div className="w-64 flex-shrink-0">
            <MachinePalette
              machines={unplacedMachines}
              shapes={shapes}
              onAddMachine={handleAddMachine}
            />

            {/* Canvas Settings */}
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                Canvas Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Width
                  </label>
                  <input
                    type="number"
                    value={floorPlan.width}
                    onChange={(e) =>
                      handleUpdateSettings({ width: parseInt(e.target.value) || 1200 })
                    }
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Height
                  </label>
                  <input
                    type="number"
                    value={floorPlan.height}
                    onChange={(e) =>
                      handleUpdateSettings({ height: parseInt(e.target.value) || 800 })
                    }
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Grid Size
                  </label>
                  <input
                    type="number"
                    value={floorPlan.gridSize}
                    onChange={(e) =>
                      handleUpdateSettings({ gridSize: parseInt(e.target.value) || 25 })
                    }
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Down</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span>Inactive</span>
        </div>
      </div>

      {/* Machine Detail Modal */}
      {showMachineDetail && (
        <MachineDetailModal
          machine={showMachineDetail.machine}
          currentShapeId={showMachineDetail.shapeId}
          currentRotation={showMachineDetail.rotation}
          shapes={shapes}
          onClose={() => setShowMachineDetail(null)}
          onRemove={
            isEditMode
              ? () => handleRemoveMachine(showMachineDetail.machineId)
              : undefined
          }
          onChangeShape={
            isEditMode
              ? (shapeId) => handleChangeShape(showMachineDetail.machineId, shapeId)
              : undefined
          }
          onChangeRotation={
            isEditMode
              ? (rotation) => handleChangeRotation(showMachineDetail.machineId, rotation)
              : undefined
          }
          isEditMode={isEditMode}
        />
      )}

      {/* Shape Editor Modal */}
      {showShapeEditor && (
        <ShapeEditor
          onSave={handleSaveShape}
          onCancel={() => {
            setShowShapeEditor(false);
            setEditingShape(null);
          }}
          existingShape={editingShape ? {
            id: editingShape.id,
            name: editingShape.name,
            points: editingShape.points,
            inputArrow: editingShape.inputArrow ? {
              x: editingShape.inputArrow.x,
              y: editingShape.inputArrow.y,
              direction: editingShape.inputArrow.direction as ArrowDirection,
            } : undefined,
            outputArrow: editingShape.outputArrow ? {
              x: editingShape.outputArrow.x,
              y: editingShape.outputArrow.y,
              direction: editingShape.outputArrow.direction as ArrowDirection,
            } : undefined,
            color: editingShape.color,
            createdAt: "",
          } : undefined}
        />
      )}

      {/* Shape Manager Modal */}
      {showShapeManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Machine Shapes
              </h2>
              <button
                onClick={() => setShowShapeManager(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create custom shapes for different inserter models. Draw the outline and add input/output flow arrows.
            </p>

            <button
              onClick={() => {
                setEditingShape(null);
                setShowShapeEditor(true);
              }}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Shape
            </button>

            {shapes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No custom shapes created yet. Click the button above to create one.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {shapes.map((shape) => (
                  <div
                    key={shape.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {shape.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {shape.points.length} points
                          {shape.inputArrow && " • Input arrow"}
                          {shape.outputArrow && " • Output arrow"}
                        </p>
                      </div>
                      {!shape.isDefault && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingShape(shape);
                              setShowShapeEditor(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteShape(shape.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Shape Preview */}
                    <div className="mt-3 h-20 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-16 h-16">
                        <polygon
                          points={shape.points.map(p => `${p.x * 80 + 10},${p.y * 80 + 10}`).join(" ")}
                          fill={shape.color ? `${shape.color}b3` : "rgba(6, 182, 212, 0.7)"}
                          stroke={shape.color || "#0e7490"}
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {shape.isDefault && (
                      <span className="inline-block mt-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Label Modal */}
      {showAddLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Text Label
              </h2>
              <button
                onClick={() => setShowAddLabelModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text
                </label>
                <input
                  type="text"
                  value={newLabelText}
                  onChange={(e) => setNewLabelText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter label text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={newLabelFontSize}
                    onChange={(e) => setNewLabelFontSize(parseInt(e.target.value) || 16)}
                    min={8}
                    max={72}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Weight
                  </label>
                  <select
                    value={newLabelFontWeight}
                    onChange={(e) => setNewLabelFontWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex gap-2">
                  {["#374151", "#1f2937", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newLabelColor === color ? "border-blue-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddLabelModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLabel}
                disabled={!newLabelText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Label Modal */}
      {editingLabel && isEditMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Label
              </h2>
              <button
                onClick={() => setEditingLabel(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text
                </label>
                <input
                  type="text"
                  value={editingLabel.text}
                  onChange={(e) => setEditingLabel({ ...editingLabel, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={editingLabel.fontSize}
                    onChange={(e) => setEditingLabel({ ...editingLabel, fontSize: parseInt(e.target.value) || 16 })}
                    min={8}
                    max={72}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Weight
                  </label>
                  <select
                    value={editingLabel.fontWeight}
                    onChange={(e) => setEditingLabel({ ...editingLabel, fontWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex gap-2">
                  {["#374151", "#1f2937", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingLabel({ ...editingLabel, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        editingLabel.color === color ? "border-blue-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => handleDeleteLabel(editingLabel.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingLabel(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateLabel(editingLabel)}
                  disabled={!editingLabel.text.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
