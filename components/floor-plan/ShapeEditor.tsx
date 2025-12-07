"use client";

import { useState, useRef, useEffect } from "react";

interface Point {
  x: number;
  y: number;
}

type ArrowDirection = "up" | "down" | "left" | "right";

interface MachineShape {
  id: string;
  name: string;
  points: Point[];
  inputArrow?: { x: number; y: number; direction: ArrowDirection };
  outputArrow?: { x: number; y: number; direction: ArrowDirection };
  color?: string;
  createdAt: string;
}

interface ShapeEditorProps {
  onSave: (shape: MachineShape) => void;
  onCancel: () => void;
  existingShape?: MachineShape;
}

const COLOR_OPTIONS = [
  { name: "Cyan", value: "#06b6d4" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
];

// Grid size for snapping
const GRID_SIZE = 20;

// Snap a value to the grid
function snapToGridValue(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// Helper to denormalize points from 0-1 range to canvas coordinates
// Uses UNIFORM scaling to preserve aspect ratio and snaps to grid
function denormalizePoints(normalizedPoints: Point[], width: number, height: number): Point[] {
  // Add padding so the shape isn't right at the edges
  const padding = 40;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  // Use the smaller dimension to ensure shape fits, preserving aspect ratio
  const scale = Math.min(drawWidth, drawHeight);

  // Center the shape
  const offsetX = padding + (drawWidth - scale) / 2;
  const offsetY = padding + (drawHeight - scale) / 2;

  return normalizedPoints.map(p => ({
    x: snapToGridValue(p.x * scale + offsetX),
    y: snapToGridValue(p.y * scale + offsetY),
  }));
}

// Helper to denormalize arrow position
function denormalizeArrow(
  arrow: { x: number; y: number; direction: ArrowDirection },
  _points: Point[],
  width: number,
  height: number
): { x: number; y: number; direction: ArrowDirection } {
  const padding = 40;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  // Use the smaller dimension to ensure shape fits, preserving aspect ratio
  const scale = Math.min(drawWidth, drawHeight);

  // Center the shape
  const offsetX = padding + (drawWidth - scale) / 2;
  const offsetY = padding + (drawHeight - scale) / 2;

  return {
    x: snapToGridValue(arrow.x * scale + offsetX),
    y: snapToGridValue(arrow.y * scale + offsetY),
    direction: arrow.direction,
  };
}

export default function ShapeEditor({ onSave, onCancel, existingShape }: ShapeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasWidth = 400;
  const canvasHeight = 300;
  const gridSize = GRID_SIZE;

  // Denormalize existing shape points to canvas coordinates
  const initialPoints = existingShape?.points && existingShape.points.length > 0
    ? denormalizePoints(existingShape.points, canvasWidth, canvasHeight)
    : [];

  const initialInputArrow = existingShape?.inputArrow
    ? denormalizeArrow(existingShape.inputArrow, initialPoints, canvasWidth, canvasHeight)
    : undefined;

  const initialOutputArrow = existingShape?.outputArrow
    ? denormalizeArrow(existingShape.outputArrow, initialPoints, canvasWidth, canvasHeight)
    : undefined;

  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [shapeName, setShapeName] = useState(existingShape?.name || "");
  const [shapeColor, setShapeColor] = useState(existingShape?.color || "#06b6d4");
  const [isDrawing, setIsDrawing] = useState(!existingShape || existingShape.points.length === 0);
  const [inputArrow, setInputArrow] = useState<MachineShape["inputArrow"]>(initialInputArrow);
  const [outputArrow, setOutputArrow] = useState<MachineShape["outputArrow"]>(initialOutputArrow);
  const [placingArrow, setPlacingArrow] = useState<"input" | "output" | null>(null);
  const [arrowDirection, setArrowDirection] = useState<ArrowDirection>("up");

  // Dragging state
  const [dragging, setDragging] = useState<{ type: "point" | "inputArrow" | "outputArrow"; index?: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Draw shape
    if (points.length > 0) {
      // Convert hex to rgba for transparency
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      ctx.fillStyle = hexToRgba(shapeColor, 0.7);
      ctx.strokeStyle = shapeColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (!isDrawing && points.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Draw points (draggable handles)
      points.forEach((point, index) => {
        const isFirst = index === 0;
        const isSelected = selectedPoint === index;

        ctx.fillStyle = isFirst ? "#22c55e" : isSelected ? "#f97316" : "#3b82f6";
        ctx.beginPath();
        ctx.arc(point.x, point.y, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw outline for selected point
        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    // Draw input arrow (black, no label)
    if (inputArrow) {
      drawArrow(ctx, inputArrow.x, inputArrow.y, inputArrow.direction, "#000000");
    }

    // Draw output arrow (black, no label)
    if (outputArrow) {
      drawArrow(ctx, outputArrow.x, outputArrow.y, outputArrow.direction, "#000000");
    }

  }, [points, isDrawing, inputArrow, outputArrow, shapeColor, selectedPoint]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: ArrowDirection,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const arrowSize = 12;
    const shaftLength = 15;

    ctx.beginPath();

    // Draw arrow shaft and head based on direction
    switch (direction) {
      case "up":
        // Shaft
        ctx.moveTo(x, y + shaftLength);
        ctx.lineTo(x, y);
        ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.moveTo(x, y - arrowSize);
        ctx.lineTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.closePath();
        ctx.fill();
        break;
      case "down":
        ctx.moveTo(x, y - shaftLength);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + arrowSize);
        ctx.lineTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.closePath();
        ctx.fill();
        break;
      case "left":
        ctx.moveTo(x + shaftLength, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - arrowSize, y);
        ctx.lineTo(x, y - 6);
        ctx.lineTo(x, y + 6);
        ctx.closePath();
        ctx.fill();
        break;
      case "right":
        ctx.moveTo(x - shaftLength, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + arrowSize, y);
        ctx.lineTo(x, y - 6);
        ctx.lineTo(x, y + 6);
        ctx.closePath();
        ctx.fill();
        break;
    }

    // Draw a small circle at arrow base for easier dragging
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const snapToGrid = (value: number): number => {
    return snapToGridValue(value);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findClickedElement = (pos: Point): { type: "point" | "inputArrow" | "outputArrow"; index?: number } | null => {
    const threshold = 15;

    // Check points first
    for (let i = 0; i < points.length; i++) {
      const dist = Math.sqrt((pos.x - points[i].x) ** 2 + (pos.y - points[i].y) ** 2);
      if (dist < threshold) {
        return { type: "point", index: i };
      }
    }

    // Check input arrow
    if (inputArrow) {
      const dist = Math.sqrt((pos.x - inputArrow.x) ** 2 + (pos.y - inputArrow.y) ** 2);
      if (dist < threshold) {
        return { type: "inputArrow" };
      }
    }

    // Check output arrow
    if (outputArrow) {
      const dist = Math.sqrt((pos.x - outputArrow.x) ** 2 + (pos.y - outputArrow.y) ** 2);
      if (dist < threshold) {
        return { type: "outputArrow" };
      }
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (placingArrow) {
      // Place arrow mode
      const snappedX = snapToGrid(pos.x);
      const snappedY = snapToGrid(pos.y);

      if (placingArrow === "input") {
        setInputArrow({ x: snappedX, y: snappedY, direction: arrowDirection });
      } else {
        setOutputArrow({ x: snappedX, y: snappedY, direction: arrowDirection });
      }
      setPlacingArrow(null);
      return;
    }

    if (isDrawing) {
      // Drawing mode - add points
      const snappedX = snapToGrid(pos.x);
      const snappedY = snapToGrid(pos.y);

      // Check if clicking near first point to close shape
      if (points.length > 2) {
        const firstPoint = points[0];
        const distance = Math.sqrt((snappedX - firstPoint.x) ** 2 + (snappedY - firstPoint.y) ** 2);
        if (distance < 20) {
          setIsDrawing(false);
          return;
        }
      }
      setPoints([...points, { x: snappedX, y: snappedY }]);
    } else {
      // Edit mode - check if clicking on existing element
      const clicked = findClickedElement(pos);
      if (clicked) {
        setDragging(clicked);
        if (clicked.type === "point" && clicked.index !== undefined) {
          setSelectedPoint(clicked.index);
        }
      } else {
        setSelectedPoint(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;

    const pos = getMousePos(e);
    const snappedX = snapToGrid(pos.x);
    const snappedY = snapToGrid(pos.y);

    if (dragging.type === "point" && dragging.index !== undefined) {
      const newPoints = [...points];
      newPoints[dragging.index] = { x: snappedX, y: snappedY };
      setPoints(newPoints);
    } else if (dragging.type === "inputArrow" && inputArrow) {
      setInputArrow({ ...inputArrow, x: snappedX, y: snappedY });
    } else if (dragging.type === "outputArrow" && outputArrow) {
      setOutputArrow({ ...outputArrow, x: snappedX, y: snappedY });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleSave = () => {
    if (!shapeName.trim()) {
      alert("Please enter a shape name");
      return;
    }
    if (points.length < 3) {
      alert("Please draw at least 3 points to create a shape");
      return;
    }

    const shape: MachineShape = {
      id: existingShape?.id || `shape_${Date.now()}`,
      name: shapeName.trim(),
      points: normalizePoints(points),
      inputArrow: inputArrow ? normalizeArrow(inputArrow) : undefined,
      outputArrow: outputArrow ? normalizeArrow(outputArrow) : undefined,
      color: shapeColor,
      createdAt: existingShape?.createdAt || new Date().toISOString(),
    };

    onSave(shape);
  };

  // Normalize points to 0-1 range using UNIFORM scaling to preserve aspect ratio
  const normalizePoints = (pts: Point[]): Point[] => {
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;

    // Use uniform scale based on the larger dimension to preserve aspect ratio
    const maxDimension = Math.max(width, height);

    return pts.map(p => ({
      x: (p.x - minX) / maxDimension,
      y: (p.y - minY) / maxDimension,
    }));
  };

  const normalizeArrow = (arrow: NonNullable<MachineShape["inputArrow"]>) => {
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;

    // Use uniform scale based on the larger dimension to preserve aspect ratio
    const maxDimension = Math.max(width, height);

    return {
      x: (arrow.x - minX) / maxDimension,
      y: (arrow.y - minY) / maxDimension,
      direction: arrow.direction,
    };
  };

  const handleClear = () => {
    setPoints([]);
    setIsDrawing(true);
    setInputArrow(undefined);
    setOutputArrow(undefined);
    setSelectedPoint(null);
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
      if (!isDrawing) setIsDrawing(true);
      setSelectedPoint(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPoint !== null && points.length > 3) {
      const newPoints = points.filter((_, i) => i !== selectedPoint);
      setPoints(newPoints);
      setSelectedPoint(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {existingShape ? "Edit" : "Create"} Machine Shape
        </h2>

        {/* Shape Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Shape Name
          </label>
          <input
            type="text"
            value={shapeName}
            onChange={(e) => setShapeName(e.target.value)}
            placeholder="e.g., Bluecrest Elevate"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Color Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Shape Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => setShapeColor(color.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  shapeColor === color.value
                    ? "border-gray-900 dark:border-white scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {isDrawing
              ? "Click to add points. Click near the first point (green) to close the shape."
              : placingArrow
                ? `Click to place ${placingArrow} arrow (${arrowDirection})`
                : "Shape complete! Drag points or arrows to reposition them."}
          </div>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`border border-gray-300 dark:border-gray-600 rounded ${
              dragging ? "cursor-grabbing" : placingArrow || isDrawing ? "cursor-crosshair" : "cursor-grab"
            }`}
          />
        </div>

        {/* Arrow Controls */}
        {!isDrawing && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Flow Arrows
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Direction:</label>
              <select
                value={arrowDirection}
                onChange={(e) => setArrowDirection(e.target.value as ArrowDirection)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              >
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPlacingArrow("input")}
                className={`px-3 py-1 text-sm rounded ${
                  placingArrow === "input"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                }`}
              >
                {inputArrow ? "Move Input" : "Add Input"} Arrow
              </button>
              <button
                onClick={() => setPlacingArrow("output")}
                className={`px-3 py-1 text-sm rounded ${
                  placingArrow === "output"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}
              >
                {outputArrow ? "Move Output" : "Add Output"} Arrow
              </button>
              {inputArrow && (
                <button
                  onClick={() => setInputArrow(undefined)}
                  className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                >
                  Remove Input
                </button>
              )}
              {outputArrow && (
                <button
                  onClick={() => setOutputArrow(undefined)}
                  className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                >
                  Remove Output
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drawing Controls */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={handleUndo}
            disabled={points.length === 0}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Clear All
          </button>
          {!isDrawing && (
            <button
              onClick={() => setIsDrawing(true)}
              className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              Add More Points
            </button>
          )}
          {selectedPoint !== null && points.length > 3 && (
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
            >
              Delete Selected Point
            </button>
          )}
        </div>

        {/* Help text */}
        {!isDrawing && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Tip: Click and drag any point (blue circles) or arrow to move it. Click a point to select it (orange), then use &quot;Delete Selected Point&quot; to remove it.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={points.length < 3 || !shapeName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Shape
          </button>
        </div>
      </div>
    </div>
  );
}
