# Session Handoff Document

## Project Overview
**Megabox Service Platform** - A Next.js 14 application for managing mail inserter machines, service tickets, and customer relationships. Built with TypeScript, Prisma ORM, PostgreSQL (Supabase), and Tailwind CSS.

## Recent Session Summary (Floor Plan Feature)

### What Was Built

#### 1. Interactive Floor Plan System
A complete floor plan feature for visualizing and managing machine layouts at customer facilities.

**Key Files:**
- `components/floor-plan/FloorPlanCanvas.tsx` - Main floor plan component with edit mode
- `components/floor-plan/KonvaCanvas.tsx` - React-Konva canvas renderer for machines/labels
- `components/floor-plan/ShapeEditor.tsx` - Custom polygon shape drawing tool
- `components/floor-plan/MachineDetailModal.tsx` - Machine info popup with shape/rotation controls
- `components/floor-plan/MachinePalette.tsx` - Sidebar for adding unplaced machines

**Features Implemented:**
- Drag-and-drop machine placement with grid snapping (25px default)
- Custom machine shape editor with polygon drawing
- Uniform scaling to preserve shape aspect ratios when saving/loading
- Rotation controls (0-360 degrees with 90° quick buttons)
- Text labels with customizable font size, weight, and color
- Zoom controls (25%-300%) with Ctrl+scroll support
- Dark mode support with barely visible grid lines
- Real-time saving to database

#### 2. Customer Facilities Portal
Customer-facing pages to view their facilities and floor plans.

**Key Files:**
- `app/customer/facilities/page.tsx` - List of customer's facilities
- `app/customer/facilities/[id]/page.tsx` - Facility detail with read-only floor plan
- `app/api/customer/sites/route.ts` - API for customer's sites with machine stats

#### 3. API Endpoints
- `GET/POST /api/floor-plans/[siteId]` - Floor plan CRUD
- `POST/PUT/DELETE /api/floor-plans/[siteId]/positions` - Machine positions
- `POST/PUT/DELETE /api/floor-plans/[siteId]/labels` - Text labels
- `GET/POST /api/machine-shapes` - Custom shape management
- `GET/PUT/DELETE /api/machine-shapes/[id]` - Individual shape operations

#### 4. Database Schema Updates
Added to `prisma/schema.prisma`:
- `FloorPlan` - Canvas dimensions, grid settings, background color
- `MachinePosition` - x, y, width, height, rotation, shapeId
- `MachineShape` - Custom polygon shapes with points, arrows, colors
- `FloorPlanLabel` - Text annotations with styling

### Technical Details

**Shape Normalization:**
Shapes are stored with normalized 0-1 coordinates using uniform scaling (based on the larger dimension) to preserve aspect ratios. When rendering, shapes are scaled uniformly using `Math.min(width, height)`.

**Grid Snapping:**
- Floor plan canvas: 25px grid (configurable)
- Shape editor: 20px grid
- Snapping happens in real-time during drag via `dragBoundFunc`

**Dependencies Added:**
- `react-konva` - Canvas rendering
- `konva` - Canvas library

### UI Updates
- Changed Customers icon in admin sidebar to people group icon
- Added "Facilities" link to customer navigation (desktop and mobile)
- Facilities admin page for super admins

## Codebase Structure

```
megabox-service/
├── app/
│   ├── admin/           # Super admin pages
│   │   ├── facilities/  # Facility management (NEW)
│   │   ├── customers/
│   │   ├── machines/
│   │   ├── sites/       # Simplified, uses FloorPlanCanvas
│   │   └── tickets/
│   ├── customer/        # Customer portal
│   │   ├── facilities/  # Customer facilities view (NEW)
│   │   └── dashboard/
│   └── api/
│       ├── floor-plans/ # Floor plan APIs (NEW)
│       ├── machine-shapes/ # Shape APIs (NEW)
│       ├── customer/    # Customer-specific APIs (NEW)
│       └── ...
├── components/
│   ├── floor-plan/      # Floor plan components (NEW)
│   ├── admin/
│   ├── chat/
│   └── ...
├── lib/
│   ├── prisma.ts
│   ├── auth-config.ts
│   └── ...
└── prisma/
    └── schema.prisma    # Updated with floor plan models
```

## Known State

### What Works
- Floor plan creation and editing
- Custom shape drawing with polygon editor
- Machine placement with drag-and-drop
- Rotation controls for machines
- Text label creation and editing
- Grid snapping for all elements
- Zoom and pan functionality
- Customer facilities view (read-only)
- Dark mode support throughout

### Potential Improvements
- Add undo/redo for floor plan edits
- Add copy/paste for machines
- Add ruler/measurement tools
- Export floor plan as image
- Import floor plan from image

## Environment Setup
```bash
cd megabox-service
npm install
npx prisma generate
npx prisma db push  # If schema changed
npm run dev
```

## Git Status
All changes committed and pushed to `main` branch.
