"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import KonvaCanvas (client-side only)
const KonvaCanvas = dynamic(
  () => import("@/components/floor-plan/KonvaCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

/**
 * Customer Facility Detail Page
 * Shows facility information and read-only floor plan view
 */

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

interface Site {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

// Zoom constants
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function CustomerFacilityDetail() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachinePosition | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Fetch site data and floor plan
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Check if user has access to this site
        const userData = sessionStorage.getItem("user");
        if (!userData) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userData);

        // Fetch floor plan data (includes site info and machines)
        const response = await fetch(`/api/floor-plans/${siteId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Facility not found");
          } else {
            setError("Failed to load facility");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Verify user has access to this site
        if (data.site && data.site.company) {
          // In a real app, you'd verify the site belongs to the user's company
        }

        setSite(data.site);
        setFloorPlan(data.floorPlan);

        // Combine placed and unplaced machines for the machine list
        const placedMachines = data.floorPlan.machinePositions.map((p: MachinePosition) => p.machine);
        const allMachines = [...placedMachines, ...data.unplacedMachines];
        setMachines(allMachines);
      } catch (err) {
        console.error("Error fetching facility:", err);
        setError("Failed to load facility");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId, router]);

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

  // Handle machine click on floor plan
  const handleMachineClick = (position: MachinePosition) => {
    setSelectedMachineId(position.machineId);
    setSelectedMachine(position);
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

  // Get status color
  const getStatusColor = (status: string | null | undefined, isDown?: boolean) => {
    if (isDown) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    if (!status) return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "maintenance":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "down":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading facility...</p>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-500 dark:text-red-400 mb-4">{error || "Facility not found"}</p>
        <Link
          href="/customer/facilities"
          className="text-primary-600 dark:text-primary-400 hover:underline"
        >
          Back to Facilities
        </Link>
      </div>
    );
  }

  const baseScale = floorPlan ? stageSize.width / floorPlan.width : 1;
  const scale = baseScale * zoom;

  // Count machines by status
  const downMachines = machines.filter(m => m.isCurrentlyDown);
  const activeMachines = machines.filter(m => m.status === "active" && !m.isCurrentlyDown);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/customer/facilities"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          Facilities
        </Link>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 dark:text-white font-medium">{site.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {site.name}
          </h1>
          {(site.city || site.state) && (
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {[site.address, site.city, site.state, site.zipCode].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {activeMachines.length} Active
            </span>
          </div>
          {downMachines.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                {downMachines.length} Down
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Machine Down Alert */}
      {downMachines.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                {downMachines.length} machine{downMachines.length > 1 ? "s" : ""} currently down
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {downMachines.map(m => m.name).join(", ")}
              </p>
              <Link
                href={`/customer/tickets/new?machineId=${downMachines[0].id}`}
                className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                Report an issue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Plan */}
        <div className="lg:col-span-2">
          <div className="card dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
            {/* Floor Plan Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {floorPlan?.name || "Floor Plan"}
              </h2>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
                  title="Zoom out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded min-w-[48px]"
                  title="Reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
                  title="Zoom in"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Floor Plan Canvas */}
            {floorPlan && mounted ? (
              <div
                ref={containerRef}
                onWheel={handleWheel}
                className="bg-slate-50 dark:bg-slate-900 overflow-auto"
                style={{ maxHeight: "60vh" }}
              >
                <div
                  style={{
                    width: floorPlan.width * scale,
                    height: floorPlan.height * scale,
                    minWidth: "100%",
                    minHeight: "300px",
                  }}
                >
                  <KonvaCanvas
                    floorPlan={floorPlan}
                    stageSize={{ width: floorPlan.width * scale, height: floorPlan.height * scale }}
                    scale={scale}
                    selectedMachineId={selectedMachineId}
                    selectedLabelId={null}
                    isEditMode={false}
                    isDarkMode={isDarkMode}
                    onMachineClick={handleMachineClick}
                    onMachineDragEnd={() => {}}
                    onLabelClick={() => {}}
                    onLabelDragEnd={() => {}}
                    onStageClick={() => setSelectedMachineId(null)}
                  />
                </div>

                {/* Empty state */}
                {floorPlan.machinePositions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">
                        No machines have been placed on this floor plan yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-900">
                <p className="text-slate-500 dark:text-slate-400">
                  No floor plan configured for this facility.
                </p>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 p-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
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
            </div>
          </div>
        </div>

        {/* Sidebar - Machine List & Details */}
        <div className="space-y-4">
          {/* Selected Machine Details */}
          {selectedMachine && (
            <div className="card p-4 dark:bg-slate-800 dark:border-slate-700 border-2 border-primary-500 dark:border-primary-400">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {selectedMachine.machine.name}
                  </h3>
                  {selectedMachine.machine.model && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedMachine.machine.model}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedMachine.machine.status, selectedMachine.machine.isCurrentlyDown)}`}>
                  {selectedMachine.machine.isCurrentlyDown ? "Down" : selectedMachine.machine.status || "Unknown"}
                </span>
              </div>

              {selectedMachine.machine.serialNumber && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  S/N: {selectedMachine.machine.serialNumber}
                </p>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/customer/machines/${selectedMachine.machine.id}`}
                  className="flex-1 px-3 py-2 text-sm font-medium text-center bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View Details
                </Link>
                <Link
                  href={`/customer/tickets/new?machineId=${selectedMachine.machine.id}`}
                  className="flex-1 px-3 py-2 text-sm font-medium text-center border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Report Issue
                </Link>
              </div>
            </div>
          )}

          {/* Machine List */}
          <div className="card dark:bg-slate-800 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Machines ({machines.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {machines.length === 0 ? (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  No machines at this facility
                </div>
              ) : (
                machines.map((machine) => (
                  <button
                    key={machine.id}
                    onClick={() => {
                      const position = floorPlan?.machinePositions.find(
                        (p) => p.machineId === machine.id
                      );
                      if (position) {
                        setSelectedMachineId(machine.id);
                        setSelectedMachine(position);
                      }
                    }}
                    className={`w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      selectedMachineId === machine.id
                        ? "bg-primary-50 dark:bg-primary-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {machine.name}
                        </p>
                        {machine.model && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {machine.model}
                          </p>
                        )}
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          machine.isCurrentlyDown
                            ? "bg-red-500"
                            : machine.status === "active"
                            ? "bg-green-500"
                            : machine.status === "maintenance"
                            ? "bg-yellow-500"
                            : "bg-slate-400"
                        }`}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Contact Info */}
          {(site.contactName || site.contactPhone || site.contactEmail) && (
            <div className="card p-4 dark:bg-slate-800 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Facility Contact
              </h3>
              <div className="space-y-2 text-sm">
                {site.contactName && (
                  <p className="text-slate-600 dark:text-slate-400">
                    {site.contactName}
                  </p>
                )}
                {site.contactPhone && (
                  <a
                    href={`tel:${site.contactPhone}`}
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {site.contactPhone}
                  </a>
                )}
                {site.contactEmail && (
                  <a
                    href={`mailto:${site.contactEmail}`}
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {site.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
