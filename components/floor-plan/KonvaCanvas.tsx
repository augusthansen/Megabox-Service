"use client";

import { Stage, Layer, Rect, Line, Group, Text, Shape, Arrow } from "react-konva";

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
  color?: string | null;
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

interface KonvaCanvasProps {
  floorPlan: FloorPlan;
  stageSize: { width: number; height: number };
  scale: number;
  selectedMachineId: string | null;
  selectedLabelId: string | null;
  isEditMode: boolean;
  isDarkMode: boolean;
  onMachineClick: (position: MachinePosition) => void;
  onMachineDragEnd: (machineId: string, x: number, y: number) => void;
  onLabelClick: (label: TextLabel) => void;
  onLabelDragEnd: (labelId: string, x: number, y: number) => void;
  onStageClick: () => void;
}

// Helper to get arrow points based on direction
// Uses uniform scaling to preserve aspect ratio
function getArrowPoints(
  arrow: { x: number; y: number; direction: ArrowDirection },
  width: number,
  height: number
): number[] {
  // Use uniform scale to match shape rendering
  const scale = Math.min(width, height);
  const ax = arrow.x * scale;
  const ay = arrow.y * scale;
  const arrowLength = 25;

  switch (arrow.direction) {
    case "up":
      return [ax, ay + arrowLength, ax, ay + 5];
    case "down":
      return [ax, ay - 5, ax, ay + arrowLength - 5];
    case "left":
      return [ax + arrowLength, ay, ax + 5, ay];
    case "right":
      return [ax - 5, ay, ax + arrowLength - 5, ay];
    default:
      return [ax, ay + arrowLength, ax, ay + 5];
  }
}

// Custom shape renderer using the shape's polygon points
function CustomMachineShape({
  position,
  isSelected,
  isDraggable,
  gridSize,
  onClick,
  onDragEnd,
}: {
  position: MachinePosition;
  isSelected: boolean;
  isDraggable: boolean;
  gridSize: number;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const machine = position.machine;
  const shape = position.shape!;

  const w = position.width;
  const h = position.height;

  // Determine color based on status (overrides shape color when machine has issues)
  const getStatusColor = () => {
    if (machine.isCurrentlyDown) return "#ef4444"; // Red
    if (machine.status === "active") return shape.color || "#22c55e"; // Use shape color or green
    if (machine.status === "maintenance") return "#f59e0b"; // Amber
    if (machine.status === "inactive") return "#6b7280"; // Gray
    return shape.color || "#06b6d4"; // Shape color or cyan default
  };

  const fillColor = getStatusColor();
  const strokeColor = isSelected ? "#1d4ed8" : "#0e7490";
  const strokeWidth = isSelected ? 3 : 2;

  // Convert normalized points (0-1) to actual positions using UNIFORM scaling
  // This preserves the original aspect ratio of the shape
  const scale = Math.min(w, h);
  const scaledPoints = shape.points.flatMap(p => [p.x * scale, p.y * scale]);

  return (
    <Group
      x={position.x}
      y={position.y}
      rotation={position.rotation}
      draggable={isDraggable}
      dragBoundFunc={(pos) => ({
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize,
      })}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(e) => {
        onDragEnd(e.target.x(), e.target.y());
      }}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isDraggable ? "grab" : "pointer";
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = "default";
        }
      }}
    >
      {/* Custom polygon shape */}
      <Line
        points={scaledPoints}
        closed={true}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={isSelected ? 12 : 6}
        shadowOffset={{ x: 3, y: 3 }}
        shadowOpacity={0.5}
      />

      {/* Input arrow */}
      {shape.inputArrow && (
        <Arrow
          points={getArrowPoints(shape.inputArrow, w, h)}
          pointerLength={10}
          pointerWidth={10}
          fill="#000000"
          stroke="#000000"
          strokeWidth={2}
        />
      )}

      {/* Output arrow */}
      {shape.outputArrow && (
        <Arrow
          points={getArrowPoints(shape.outputArrow, w, h)}
          pointerLength={10}
          pointerWidth={10}
          fill="#000000"
          stroke="#000000"
          strokeWidth={2}
        />
      )}

      {/* Down indicator */}
      {machine.isCurrentlyDown && (
        <>
          <Rect
            x={w * 0.2}
            y={4}
            width={w * 0.6}
            height={20}
            fill="#ffffff"
            cornerRadius={3}
          />
          <Text
            x={w * 0.2}
            y={7}
            width={w * 0.6}
            text="DOWN"
            fontSize={9}
            fontStyle="bold"
            fill="#ef4444"
            align="center"
          />
        </>
      )}
    </Group>
  );
}

// Mail Inserter Machine Shape - L-shaped like real inserters (default shape)
// Input feeds from left, output exits from bottom-right
function DefaultMachineShape({
  position,
  isSelected,
  isDraggable,
  gridSize,
  onClick,
  onDragEnd,
}: {
  position: MachinePosition;
  isSelected: boolean;
  isDraggable: boolean;
  gridSize: number;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const machine = position.machine;

  // Determine color based on status
  const getStatusColor = () => {
    if (machine.isCurrentlyDown) return "#ef4444"; // Red
    if (machine.status === "active") return "#22c55e"; // Green
    if (machine.status === "maintenance") return "#f59e0b"; // Amber
    if (machine.status === "inactive") return "#6b7280"; // Gray
    return "#06b6d4"; // Cyan default (like your image)
  };

  const fillColor = getStatusColor();
  const strokeColor = isSelected ? "#1d4ed8" : "#0e7490";
  const strokeWidth = isSelected ? 3 : 2;

  // Display text
  const displayName = machine.model || machine.name || "Machine";
  const displaySerial = machine.serialNumber ? `S/N: ${machine.serialNumber}` : "";

  // Mail inserter shape (matching your image):
  // - Vertical section on LEFT (input tower) - aligned with top of middle section
  // - Middle horizontal section
  // - Small output stub at BOTTOM RIGHT - exits downward
  const w = position.width;   // Total width
  const h = position.height;  // Total height

  // Left tower takes up about 40% of width
  const towerWidth = w * 0.4;
  // Middle horizontal section height (this is the main body)
  const middleHeight = h * 0.4;
  // Left tower extends down from the middle section (longer now)
  const towerHeight = h * 1.1;
  // Output stub on bottom right
  const outputStubWidth = w * 0.3;
  const outputStubHeight = h * 0.25;

  return (
    <Group
      x={position.x}
      y={position.y}
      rotation={position.rotation}
      draggable={isDraggable}
      dragBoundFunc={(pos) => ({
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize,
      })}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(e) => {
        onDragEnd(e.target.x(), e.target.y());
      }}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isDraggable ? "grab" : "pointer";
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = "default";
        }
      }}
    >
      {/* Left tower - starts at same level as middle section, extends down */}
      <Rect
        x={0}
        y={0}
        width={towerWidth}
        height={towerHeight}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={isSelected ? 12 : 6}
        shadowOffset={{ x: 3, y: 3 }}
        shadowOpacity={0.5}
      />

      {/* Middle horizontal section - aligned with top of left tower */}
      <Rect
        x={towerWidth - 2}
        y={0}
        width={w - towerWidth + 2}
        height={middleHeight}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Output stub extending down from bottom-right of middle section */}
      <Rect
        x={w - outputStubWidth}
        y={middleHeight}
        width={outputStubWidth}
        height={outputStubHeight}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Input arrow (pointing UP into the left tower from bottom) */}
      <Arrow
        points={[towerWidth / 2, towerHeight + 25, towerWidth / 2, towerHeight + 5]}
        pointerLength={10}
        pointerWidth={10}
        fill="#374151"
        stroke="#374151"
        strokeWidth={2}
      />

      {/* Output arrow (pointing DOWN from the stub) */}
      <Arrow
        points={[w - outputStubWidth / 2, middleHeight + outputStubHeight + 5,
                 w - outputStubWidth / 2, middleHeight + outputStubHeight + 25]}
        pointerLength={10}
        pointerWidth={10}
        fill="#374151"
        stroke="#374151"
        strokeWidth={2}
      />

      {/* Machine model label - in the middle section */}
      <Text
        x={towerWidth + 4}
        y={8}
        width={w - towerWidth - outputStubWidth - 8}
        text={displayName}
        fontSize={11}
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        wrap="char"
      />

      {/* Serial number - below model name in middle section */}
      {displaySerial && (
        <Text
          x={towerWidth + 4}
          y={22}
          width={w - towerWidth - outputStubWidth - 8}
          text={displaySerial}
          fontSize={9}
          fill="rgba(255,255,255,0.85)"
          align="center"
          wrap="none"
          ellipsis={true}
        />
      )}

      {/* Down indicator - in the left tower */}
      {machine.isCurrentlyDown && (
        <>
          <Rect
            x={4}
            y={4}
            width={towerWidth - 8}
            height={20}
            fill="#ffffff"
            cornerRadius={3}
          />
          <Text
            x={4}
            y={7}
            width={towerWidth - 8}
            text="DOWN"
            fontSize={9}
            fontStyle="bold"
            fill="#ef4444"
            align="center"
          />
        </>
      )}
    </Group>
  );
}

// Wrapper component that chooses between custom and default shape
function MachineShapeInline({
  position,
  isSelected,
  isDraggable,
  gridSize,
  onClick,
  onDragEnd,
}: {
  position: MachinePosition;
  isSelected: boolean;
  isDraggable: boolean;
  gridSize: number;
  onClick: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  // Use custom shape if assigned, otherwise use default
  if (position.shape && position.shape.points.length >= 3) {
    return (
      <CustomMachineShape
        position={position}
        isSelected={isSelected}
        isDraggable={isDraggable}
        gridSize={gridSize}
        onClick={onClick}
        onDragEnd={onDragEnd}
      />
    );
  }

  return (
    <DefaultMachineShape
      position={position}
      isSelected={isSelected}
      isDraggable={isDraggable}
      gridSize={gridSize}
      onClick={onClick}
      onDragEnd={onDragEnd}
    />
  );
}

export default function KonvaCanvas({
  floorPlan,
  stageSize,
  scale,
  selectedMachineId,
  selectedLabelId,
  isEditMode,
  isDarkMode,
  onMachineClick,
  onMachineDragEnd,
  onLabelClick,
  onLabelDragEnd,
  onStageClick,
}: KonvaCanvasProps) {
  // Dark mode colors
  const backgroundColor = isDarkMode ? "#1f2937" : floorPlan.backgroundColor;
  // Grid lines are barely visible
  const gridColor = isDarkMode ? "rgba(55, 65, 81, 0.3)" : "rgba(229, 231, 235, 0.5)";
  // Grid size for snapping
  const gridSize = floorPlan.gridSize;

  // Draw grid lines
  const renderGrid = () => {
    if (!floorPlan.showGrid) return null;

    const lines = [];

    for (let x = 0; x <= floorPlan.width; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, floorPlan.height]}
          stroke={gridColor}
          strokeWidth={1}
        />
      );
    }

    for (let y = 0; y <= floorPlan.height; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, floorPlan.width, y]}
          stroke={gridColor}
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  return (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      scaleX={scale}
      scaleY={scale}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onStageClick();
        }
      }}
    >
      <Layer>
        {/* Background */}
        <Rect
          width={floorPlan.width}
          height={floorPlan.height}
          fill={backgroundColor}
        />

        {/* Grid */}
        {renderGrid()}

        {/* Text Labels */}
        {floorPlan.textLabels?.map((label) => (
          <Group
            key={label.id}
            x={label.x}
            y={label.y}
            rotation={label.rotation}
            draggable={isEditMode}
            dragBoundFunc={(pos) => ({
              x: Math.round(pos.x / gridSize) * gridSize,
              y: Math.round(pos.y / gridSize) * gridSize,
            })}
            onClick={() => onLabelClick(label)}
            onTap={() => onLabelClick(label)}
            onDragEnd={(e) => {
              onLabelDragEnd(label.id, e.target.x(), e.target.y());
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = isEditMode ? "grab" : "pointer";
              }
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = "default";
              }
            }}
          >
            {/* Selection indicator */}
            {selectedLabelId === label.id && (
              <Rect
                x={-4}
                y={-4}
                width={label.text.length * label.fontSize * 0.6 + 8}
                height={label.fontSize + 8}
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[4, 4]}
                fill="transparent"
              />
            )}
            <Text
              text={label.text}
              fontSize={label.fontSize}
              fontStyle={label.fontWeight === "bold" ? "bold" : "normal"}
              fill={label.color}
            />
          </Group>
        ))}

        {/* Machines */}
        {floorPlan.machinePositions.map((position) => (
          <MachineShapeInline
            key={position.id}
            position={position}
            isSelected={selectedMachineId === position.machineId}
            isDraggable={isEditMode}
            gridSize={gridSize}
            onClick={() => onMachineClick(position)}
            onDragEnd={(x, y) => onMachineDragEnd(position.machineId, x, y)}
          />
        ))}
      </Layer>
    </Stage>
  );
}
