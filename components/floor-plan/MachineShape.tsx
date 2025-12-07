"use client";

import { Rect, Text, Group } from "react-konva";

interface MachineShapeProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  name: string;
  model?: string;
  serialNumber?: string;
  status?: string;
  isCurrentlyDown?: boolean;
  isSelected?: boolean;
  isDraggable?: boolean;
  onClick?: () => void;
  onDragEnd?: (x: number, y: number) => void;
}

export default function MachineShape({
  id,
  x,
  y,
  width,
  height,
  rotation = 0,
  name,
  model,
  serialNumber,
  status,
  isCurrentlyDown,
  isSelected = false,
  isDraggable = false,
  onClick,
  onDragEnd,
}: MachineShapeProps) {
  // Determine color based on status
  const getStatusColor = () => {
    if (isCurrentlyDown) return "#ef4444"; // Red
    if (status === "active") return "#22c55e"; // Green
    if (status === "maintenance") return "#f59e0b"; // Amber
    if (status === "inactive") return "#6b7280"; // Gray
    return "#3b82f6"; // Blue default
  };

  const fillColor = getStatusColor();
  const strokeColor = isSelected ? "#1d4ed8" : "#374151";
  const strokeWidth = isSelected ? 3 : 1;

  // Display text - prioritize model, fallback to name
  const displayName = model || name || "Machine";
  const displaySerial = serialNumber ? `S/N: ${serialNumber}` : "";

  // Calculate font size based on box width
  const fontSize = Math.min(12, width / 8);

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable={isDraggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={(e) => {
        if (onDragEnd) {
          onDragEnd(e.target.x(), e.target.y());
        }
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
      {/* Machine rectangle */}
      <Rect
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={isSelected ? 10 : 4}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.5}
      />

      {/* Model/Name text */}
      <Text
        x={4}
        y={4}
        width={width - 8}
        text={displayName}
        fontSize={fontSize}
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        wrap="none"
        ellipsis={true}
      />

      {/* Serial number text */}
      {displaySerial && (
        <Text
          x={4}
          y={height - fontSize - 6}
          width={width - 8}
          text={displaySerial}
          fontSize={fontSize - 2}
          fill="rgba(255,255,255,0.8)"
          align="center"
          wrap="none"
          ellipsis={true}
        />
      )}

      {/* Status indicator dot */}
      {isCurrentlyDown && (
        <Rect
          x={width - 12}
          y={4}
          width={8}
          height={8}
          fill="#ffffff"
          cornerRadius={4}
        />
      )}
    </Group>
  );
}
