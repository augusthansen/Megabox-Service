# CLAUDE.md - AI Assistant Guide for Megabox Service Platform

> **Last Updated:** 2025-11-25
> **Project Status:** Phase 1 - Foundation & Setup (In Progress)

This document provides comprehensive guidance for AI assistants working on the Megabox Service Platform codebase. It covers architecture, conventions, workflows, and best practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Architecture](#codebase-architecture)
3. [Tech Stack Details](#tech-stack-details)
4. [Database Schema](#database-schema)
5. [Directory Structure](#directory-structure)
6. [Development Workflows](#development-workflows)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Conventions](#api-conventions)
9. [HubSpot Integration](#hubspot-integration)
10. [Code Style & Conventions](#code-style--conventions)
11. [Common Tasks & Patterns](#common-tasks--patterns)
12. [Troubleshooting](#troubleshooting)
13. [Known Issues & Technical Debt](#known-issues--technical-debt)
14. [Development Phases & Roadmap](#development-phases--roadmap)

---

## Project Overview

### What is Megabox Service?

A remote service management platform for mail inserter machines. This Next.js application integrates with HubSpot CRM and Service Hub to manage customers, sites, machines, and service tickets.

### Business Model

**Pricing Tiers:**
- **Basic:** $40/month per machine, $180/hour remote service
- **Standard:** $60/month per machine, $150/hour remote service
- **Mega:** $85/month per machine, $120/hour remote service

### User Roles

1. **super_admin** - Full system access, user management, billing
2. **service_tech** - Access to tickets, remote sessions, machine management
3. **customer_admin** - Manage their company's sites, machines, view tickets
4. **customer_tech** - View-only access to their company's data

### Initial Admin Credentials

```
Email: admin@megaboxsupply.com
Password: admin123
```

⚠️ **IMPORTANT:** These credentials should be changed immediately after first login in production environments.

---

## Codebase Architecture

### Framework: Next.js 14 App Router

This project uses the **Next.js 14 App Router** (not Pages Router). Key implications:

- **Server Components by default** - Components are server-side unless marked with `'use client'`
- **File-based routing** - Routes are defined by folder structure in `/app`
- **Route Groups** - `(auth)` groups routes without affecting URL structure
- **API Routes** - Located in `/app/api/*` directories as `route.ts` files
- **Layouts** - `layout.tsx` files provide shared UI for route segments

### Architecture Pattern

**Full-stack Monolith:**
- Frontend: React components with TypeScript
- Backend: Next.js API routes
- Database: PostgreSQL (Supabase) via Prisma ORM
- Authentication: Custom session-based (sessionStorage)
- Integrations: HubSpot CRM & Service Hub

### Data Flow

```
User Interface (React Components)
    ↓
API Routes (/app/api/*/route.ts)
    ↓
Business Logic (in API routes)
    ↓
Prisma ORM (lib/prisma.ts)
    ↓
PostgreSQL Database (Supabase)
```

**For HubSpot:**
```
API Routes → HubSpot Utilities (lib/hubspot.ts) → HubSpot API
```

---

## Tech Stack Details

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.18 | Framework |
| `react` | 18.3.1 | UI library |
| `typescript` | 5.5.4 | Type safety |
| `@prisma/client` | 5.20.0 | Database ORM |
| `tailwindcss` | 3.4.7 | Styling |
| `next-auth` | 4.24.7 | Auth (partially used) |
| `bcryptjs` | 2.4.3 | Password hashing |
| `@hubspot/api-client` | 13.4.0 | HubSpot integration |
| `zod` | 3.23.8 | Schema validation |

### Development Tools

- **ESLint** - Linting with Next.js config
- **Prettier** - Code formatting
- **Prisma** - Database migrations and schema management
- **tsx** - TypeScript execution for scripts

### Path Aliases

```json
{
  "@/*": ["./*"]
}
```

Usage: `import { prisma } from "@/lib/prisma"`

---

## Database Schema

### Core Models (11 Tables)

#### 1. User
Stores system users with authentication and role information.

**Key Fields:**
- `id` (CUID), `email` (unique), `passwordHash`, `name`, `role`
- `companyId` (nullable) - Links customer users to companies
- `twoFactorSecret`, `twoFactorEnabled` - For future 2FA implementation

**Relations:**
- Belongs to: Company (optional)
- Has many: Tickets (created/assigned), Sessions, Attachments, Comments

#### 2. Company
Customer companies with pricing and HubSpot integration.

**Key Fields:**
- `hubspotId` (unique, nullable) - Links to HubSpot CRM companies
- `pricingTier` (basic|standard|mega)
- `pricePerMachine`, `hourlyRate` - Tier-specific pricing
- `currentMonthUsageHours`, `currentMonthUsageCost` - Billing tracking

**Relations:**
- Has many: Users, Sites, Tickets, Invoices

#### 3. Site
Physical locations where machines are installed.

**Key Fields:**
- `companyId`, `name`, `address`, `city`, `state`, `zipCode`
- `timezone` (default: "America/New_York")
- `contactName`, `contactPhone`, `contactEmail`
- `isActive` - Soft delete flag

**Relations:**
- Belongs to: Company
- Has many: Machines, Tickets, FloorMaps

#### 4. Machine
Mail inserter machines at customer sites.

**Key Fields:**
- `siteId`, `name`, `model`, `series`, `serialNumber`
- `windowsVersion`, `directConnectVersion`, `firmwareVersion`
- `configuration` (JSON) - Scanning, feeders, stations, etc.
- `isCurrentlyDown`, `hasRemoteAccess`, `remoteAccessType`
- `floorMapId`, `positionX`, `positionY` - Visual positioning

**Relations:**
- Belongs to: Site
- Has many: MachineAlarms, Tickets

#### 5. Ticket
Service tickets with HubSpot synchronization.

**Key Fields:**
- `ticketNumber` (unique), `hubspotId` (unique, nullable)
- `companyId`, `siteId`, `machineId`, `createdById`, `assignedToId`
- `subject`, `description`, `priority`, `status`
- `machineDown` - Critical flag
- `totalMinutes`, `totalCost` - Billing tracking
- Timestamp fields: `createdAt`, `assignedAt`, `startedAt`, `resolvedAt`, `closedAt`

**Relations:**
- Belongs to: Company, Site, Machine, User (creator/assignee)
- Has many: Sessions, Attachments, Comments

#### 6. Session
Remote access/support sessions for billing.

**Key Fields:**
- `ticketId`, `techId`, `sessionType` (remote_support|video_call|research|documentation)
- `startTime`, `endTime`, `durationMinutes`
- `rateType` (business|after_hours|weekend), `rateAmount`, `rateMultiplier`, `cost`
- `videoRecordingUrl`, `notes`

#### 7-11. Supporting Models
- **MachineAlarm** - Machine alarm history
- **Attachment** - File attachments for tickets
- **Comment** - Comments on tickets with internal flag
- **Invoice** - Monthly billing invoices
- **FloorMap** - Visual floor layouts for sites

### Enums

```typescript
enum UserRole { super_admin, customer_admin, customer_tech, service_tech }
enum PricingTier { basic, standard, mega }
enum TicketStatus { open, assigned, in_progress, on_hold, resolved, closed }
enum TicketPriority { low, medium, high, urgent }
enum SessionType { remote_support, video_call, research, documentation }
enum InvoiceStatus { draft, sent, paid, overdue, cancelled }
```

### Key Indexes

Performance-critical indexes on:
- `User.email`, `User.companyId`
- `Company.hubspotId`
- `Ticket.ticketNumber`, `Ticket.hubspotId`, `Ticket.status`
- `Machine.serialNumber`, `Machine.siteId`

---

## Directory Structure

```
megabox-service/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no /auth in URL)
│   │   └── login/
│   │       ├── page.tsx          # Login form
│   │       └── actions.ts        # Server actions
│   ├── admin/                    # Admin dashboard routes
│   │   ├── layout.tsx           # Admin layout with sidebar
│   │   ├── page.tsx             # Dashboard (stats)
│   │   ├── customers/           # Customer CRUD
│   │   ├── sites/               # Site CRUD
│   │   ├── machines/            # Machine CRUD
│   │   ├── tickets/             # Ticket CRUD
│   │   ├── users/               # User management (placeholder)
│   │   ├── invoices/            # Invoice management (placeholder)
│   │   └── settings/            # Settings (placeholder)
│   ├── api/                     # API routes
│   │   ├── login/route.ts       # Custom login endpoint
│   │   ├── stats/route.ts       # Dashboard statistics
│   │   ├── customers/           # Customer API
│   │   │   ├── route.ts         # GET (list), POST (create)
│   │   │   └── [id]/route.ts    # GET, PUT, DELETE by ID
│   │   ├── sites/               # Site API (same pattern)
│   │   ├── machines/            # Machine API (same pattern)
│   │   ├── tickets/             # Ticket API (same pattern)
│   │   └── hubspot/             # HubSpot integration
│   │       ├── sync-companies/route.ts
│   │       └── sync-tickets/route.ts
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (redirects to login/admin)
├── components/                   # Reusable React components
│   ├── admin/
│   │   ├── sidebar.tsx          # Admin navigation sidebar
│   │   └── top-bar.tsx          # Admin top bar with user info
│   └── sign-out-button.tsx      # Sign out functionality
├── lib/                         # Utility libraries
│   ├── prisma.ts                # Prisma client singleton
│   ├── auth.ts                  # Password hashing, user utilities
│   ├── hubspot.ts               # HubSpot API integration
│   └── utils.ts                 # General utilities (clsx, cn)
├── prisma/
│   ├── schema.prisma            # Database schema definition
│   └── seed.ts                  # Database seeding script
├── types/
│   └── next-auth.d.ts           # NextAuth type extensions
├── public/                      # Static assets (future use)
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── .gitignore                  # Git ignore rules
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── env.example                 # Environment variables template
```

### Important Files

| File | Purpose |
|------|---------|
| `lib/prisma.ts` | Database client - use this for all DB operations |
| `lib/auth.ts` | Password utilities, user lookup |
| `lib/hubspot.ts` | HubSpot sync utilities |
| `prisma/schema.prisma` | Single source of truth for database schema |
| `app/admin/layout.tsx` | Protected route wrapper with auth check |

---

## Development Workflows

### Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env.local
   ```

   Required variables:
   - `DATABASE_URL` - Supabase PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `HUBSPOT_API_KEY` - HubSpot Private App token

3. **Database setup:**
   ```bash
   npm run db:push    # Push schema to database
   npm run db:seed    # Create initial admin user
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (port 3000 or 3001) |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database (no migration) |
| `npm run db:migrate` | Create and run migration |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio GUI |

### Database Workflows

#### Making Schema Changes

1. **Edit `prisma/schema.prisma`**
2. **Push changes:**
   ```bash
   npm run db:push    # Quick dev updates (no migration history)
   # OR
   npm run db:migrate # Production-ready (creates migration files)
   ```
3. **Regenerate Prisma Client:**
   - Automatically done by push/migrate
   - Manual: `npx prisma generate`

#### Viewing/Editing Data

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

### Git Workflow

**Branch Naming:** Must start with `claude/` and include session ID for AI-assisted work.

Example: `claude/claude-md-midvlch8k2v4maan-01L4vywsR3HDamdYxjE6SGpZ`

**Commit Guidelines:**
- Use descriptive commit messages
- Focus on "why" rather than "what"
- Follow existing commit style from git log

**Push/Pull Best Practices:**
- Always use: `git push -u origin <branch-name>`
- Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network errors
- Fetch specific branches: `git fetch origin <branch-name>`

---

## Authentication & Authorization

### Current Implementation

**⚠️ Important:** This project uses **custom session-based authentication**, not fully implemented NextAuth.js.

### How It Works

1. **Login Flow:**
   - User submits credentials to `/app/api/login/route.ts`
   - API validates email/password using `lib/auth.ts` utilities
   - On success, returns user object (stored in `sessionStorage` on client)

2. **Session Storage:**
   ```typescript
   // Stored in browser sessionStorage
   sessionStorage.setItem('user', JSON.stringify(userData))
   ```

3. **Protected Routes:**
   - Admin layout (`app/admin/layout.tsx`) checks for user in sessionStorage
   - Redirects to login if not authenticated

### Password Security

- **Hashing:** bcryptjs with salt rounds = 10
- **Storage:** Never store plain text passwords
- **Verification:** Use `verifyPassword()` from `lib/auth.ts`

```typescript
import { hashPassword, verifyPassword } from '@/lib/auth'

// Creating user
const hashedPassword = await hashPassword(plainPassword)

// Verifying login
const isValid = await verifyPassword(plainPassword, user.passwordHash)
```

### Role-Based Access (Future)

Roles are defined in schema but not yet enforced in UI:
- `super_admin` - Full access
- `service_tech` - Tickets, sessions, machines
- `customer_admin` - Own company data
- `customer_tech` - Read-only company data

**TODO:** Implement role-based UI restrictions and API authorization.

---

## API Conventions

### Route Structure

All API routes follow this pattern:

```
/app/api/[resource]/
├── route.ts              # Collection endpoints (GET list, POST create)
└── [id]/route.ts        # Individual endpoints (GET, PUT, DELETE by ID)
```

### HTTP Methods

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/customers` | List all customers |
| `POST` | `/api/customers` | Create new customer |
| `GET` | `/api/customers/[id]` | Get customer by ID |
| `PUT` | `/api/customers/[id]` | Update customer |
| `DELETE` | `/api/customers/[id]` | Delete customer |

### Request/Response Format

**Responses use JSON:**

```typescript
// Success
return NextResponse.json({ data: result })

// Error
return NextResponse.json({ error: 'Error message' }, { status: 400 })
```

### Database Access Pattern

```typescript
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.company.findMany({
      include: {
        sites: true,
        users: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
```

### Common Includes

```typescript
// Customers with related data
prisma.company.findMany({
  include: {
    sites: { include: { machines: true } },
    tickets: true,
  }
})

// Tickets with full context
prisma.ticket.findMany({
  include: {
    company: true,
    site: true,
    machine: true,
    createdBy: true,
    assignedTo: true,
    comments: true,
    attachments: true,
  }
})
```

---

## HubSpot Integration

### Overview

**Two-way synchronization** between Megabox Service and HubSpot:
- **HubSpot CRM** → Companies (customers)
- **HubSpot Service Hub** → Tickets

### Setup Requirements

1. **Create HubSpot Private App:**
   - Go to HubSpot → Settings → Integrations → Private Apps
   - Create app with permissions:
     - `crm.objects.companies.read`, `crm.objects.companies.write`
     - `tickets` (read/write)
   - Copy API token to `HUBSPOT_API_KEY` env variable

2. **See HUBSPOT_SETUP.md for detailed instructions**

### HubSpot Utilities (`lib/hubspot.ts`)

#### Core Functions

```typescript
// Initialize client
const client = getHubspotClient()

// Sync from HubSpot
await syncCompaniesFromHubspot()  // Returns company array
await syncTicketsFromHubspot()     // Returns ticket array

// Create/update in HubSpot
await createTicketInHubspot({ subject, description, priority, companyId })
await updateTicketInHubspot(hubspotId, { status, priority, subject, description })
```

#### Data Mapping

**Priority Mapping:**
```typescript
// Our app → HubSpot
low → LOW
medium → MEDIUM
high → HIGH
urgent → URGENT
```

**Status Mapping:**
```typescript
// Our app → HubSpot
open → NEW
assigned → OPEN
in_progress → IN_PROGRESS
on_hold → WAITING
resolved → RESOLVED
closed → CLOSED
```

### Sync Endpoints

#### 1. Sync Companies
**Endpoint:** `POST /api/hubspot/sync-companies`

Fetches companies from HubSpot CRM and creates/updates in database:
- Matches by `hubspotId`
- Creates new companies if not found
- Updates existing companies

#### 2. Sync Tickets
**Endpoint:** `POST /api/hubspot/sync-tickets`

Fetches tickets from HubSpot Service Hub:
- Matches by `hubspotId`
- Links to companies via HubSpot associations
- Creates new tickets if not found
- Updates existing tickets

### UI Integration

**Sync Buttons:**
- Customer page: "🔄 Sync from HubSpot"
- Tickets page: "🔄 Sync from HubSpot"

**Auto-sync to HubSpot:**
- Creating ticket → Creates in HubSpot (if company has hubspotId)
- Updating ticket → Updates in HubSpot (if ticket has hubspotId)

### Limitations

- **Pagination:** Currently fetches first 100 records only
- **Manual Sync:** No webhooks yet (requires manual sync button)
- **Conflict Resolution:** No handling for simultaneous edits
- **Associations:** Only company-ticket associations implemented

---

## Code Style & Conventions

### TypeScript Best Practices

1. **Strict Mode Enabled:**
   - Always type function parameters and return values
   - Avoid `any` type (use `unknown` if truly unknown)
   - Use Prisma-generated types where possible

2. **Type Imports:**
   ```typescript
   import type { Company, PricingTier } from '@prisma/client'
   import { prisma } from '@/lib/prisma'
   ```

3. **Async/Await:**
   - Always use try/catch for async operations
   - Log errors before returning error responses

### React/Next.js Conventions

1. **Server vs Client Components:**
   ```typescript
   // Server component (default, no directive)
   export default async function Page() {
     const data = await prisma.company.findMany()
     return <div>{/* ... */}</div>
   }

   // Client component (needs interactivity)
   'use client'
   import { useState } from 'react'
   export default function InteractiveForm() {
     const [value, setValue] = useState('')
     // ...
   }
   ```

2. **File Naming:**
   - Components: `kebab-case.tsx` (e.g., `sign-out-button.tsx`)
   - Pages: `page.tsx`
   - Layouts: `layout.tsx`
   - API Routes: `route.ts`

3. **Component Structure:**
   ```typescript
   // Imports
   import { Component } from 'library'
   import type { Props } from '@/types'

   // Component
   export default function ComponentName({ prop }: Props) {
     // Hooks
     const [state, setState] = useState()

     // Handlers
     const handleClick = () => {}

     // Render
     return <div>...</div>
   }
   ```

### Styling with Tailwind

1. **Use utility classes:**
   ```tsx
   <div className="flex items-center justify-between p-4 bg-gray-100">
   ```

2. **Conditional classes:**
   ```tsx
   import { cn } from '@/lib/utils'

   <div className={cn(
     "base-classes",
     isActive && "active-classes",
     "more-classes"
   )}>
   ```

3. **Dark theme colors:** Project uses dark sidebar theme
   - Background: `bg-gray-900`, `bg-gray-800`
   - Text: `text-white`, `text-gray-300`
   - Accents: `text-blue-400`, `hover:bg-gray-700`

### Database Conventions

1. **Always use Prisma client from `lib/prisma.ts`:**
   ```typescript
   import { prisma } from '@/lib/prisma'
   ```

2. **Prefer explicit includes over select:**
   ```typescript
   // Good - clear what's included
   prisma.company.findMany({ include: { sites: true } })

   // Avoid unless necessary - harder to maintain
   prisma.company.findMany({ select: { id: true, name: true } })
   ```

3. **Use transactions for related operations:**
   ```typescript
   await prisma.$transaction([
     prisma.ticket.create({ ... }),
     prisma.comment.create({ ... }),
   ])
   ```

### Error Handling

```typescript
try {
  const result = await someDatabaseOperation()
  return NextResponse.json(result)
} catch (error) {
  console.error('Descriptive error message:', error)
  return NextResponse.json(
    { error: 'User-friendly error message' },
    { status: 500 }
  )
}
```

---

## Common Tasks & Patterns

### 1. Adding a New API Endpoint

**Example: Add GET /api/users**

1. Create `/app/api/users/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
```

2. Create `/app/api/users/[id]/route.ts` for individual operations

### 2. Adding a New Page

**Example: Add /admin/reports**

1. Create `/app/admin/reports/page.tsx`:
```typescript
export default async function ReportsPage() {
  // Server-side data fetching
  const stats = await fetch('http://localhost:3000/api/stats')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      {/* Report components */}
    </div>
  )
}
```

2. Add link to sidebar in `/components/admin/sidebar.tsx`

### 3. Adding a Database Model

1. **Edit `prisma/schema.prisma`:**
```prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name])
}
```

2. **Push changes:**
```bash
npm run db:migrate -- --name add_new_model
```

3. **Update seed if needed:** Edit `prisma/seed.ts`

### 4. Adding HubSpot Sync for New Entity

1. **Add to `lib/hubspot.ts`:**
```typescript
export async function syncNewEntityFromHubspot() {
  const client = getHubspotClient()
  const response = await client.crm.newEntity.basicApi.getPage(100)

  return response.results.map((item: any) => ({
    hubspotId: item.id,
    // Map properties
  }))
}
```

2. **Create sync API route:** `/app/api/hubspot/sync-new-entity/route.ts`

3. **Add sync button to UI**

### 5. Updating Ticket Status (Common Pattern)

```typescript
// In API route
const ticket = await prisma.ticket.update({
  where: { id: ticketId },
  data: {
    status: 'in_progress',
    startedAt: new Date(),
  },
})

// Sync to HubSpot if ticket has hubspotId
if (ticket.hubspotId) {
  await updateTicketInHubspot(ticket.hubspotId, {
    status: ticket.status,
  })
}
```

### 6. Calculating Billing Costs

```typescript
// Session cost calculation
const hourlyRate = company.hourlyRate // From pricing tier
const durationMinutes = session.endTime - session.startTime
const cost = (durationMinutes / 60) * hourlyRate * rateMultiplier

await prisma.session.update({
  where: { id: sessionId },
  data: {
    durationMinutes,
    cost,
  },
})

// Update ticket total
await prisma.ticket.update({
  where: { id: ticketId },
  data: {
    totalMinutes: { increment: durationMinutes },
    totalCost: { increment: cost },
  },
})
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or let Next.js use alternative port (3001, 3002, etc.)
npm run dev
```

#### 2. Database Connection Issues

**Error:** `Can't reach database server`

**Solutions:**
1. **Check DATABASE_URL format:**
   ```
   # Standard (Direct connection)
   postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

   # Pooling (Supavisor)
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```

2. **Verify Supabase IP restrictions:**
   - Go to Supabase → Settings → Database → Connection Pooling
   - Ensure your IP is allowed or disable IP restrictions for development

3. **Check Supabase project status** (not paused)

See `DATABASE_SETUP.md` and `CONNECTION_TROUBLESHOOTING.md` for detailed steps.

#### 3. Module Not Found Errors

**Error:** `Module not found: Can't resolve '@/lib/...'`

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

#### 4. Prisma Client Out of Sync

**Error:** `Prisma schema changed, run npx prisma generate`

**Solution:**
```bash
npx prisma generate
# Or push/migrate will auto-generate
npm run db:push
```

#### 5. HubSpot API Errors

**Error:** `401 Unauthorized` or `403 Forbidden`

**Solutions:**
1. Verify `HUBSPOT_API_KEY` in `.env.local`
2. Check Private App permissions in HubSpot
3. Ensure API key hasn't expired

**Error:** `Property 'hs_ticket_priority' does not exist`

**Solution:** HubSpot property names vary. Check HubSpot API docs or use Prisma Studio to inspect actual property names.

#### 6. Authentication Not Working

**Symptoms:** Redirected to login after logging in

**Solutions:**
1. **Check sessionStorage:** Open DevTools → Application → Session Storage
2. **Verify API response:** Check Network tab for `/api/login` response
3. **Clear session storage:**
   ```javascript
   sessionStorage.clear()
   ```

### Debug Commands

```bash
# Check database connection
npx prisma db pull

# Inspect database
npm run db:studio

# View Prisma client
npx prisma generate --help

# Check Next.js build errors
npm run build

# Verbose logging
DEBUG=* npm run dev
```

---

## Known Issues & Technical Debt

### Authentication Issues

1. **sessionStorage is not secure for production**
   - Current: Client-side session in sessionStorage
   - TODO: Implement JWT or server-side sessions
   - Risk: Session data can be manipulated

2. **NextAuth.js partially configured but not used**
   - Legacy setup exists in codebase
   - TODO: Either fully implement NextAuth or remove it
   - Files: `app/api/auth/[nextauth]/route.ts`, `lib/auth-config.ts`

3. **No role-based access control in UI**
   - Roles exist in database but not enforced
   - TODO: Add middleware to check permissions

### HubSpot Integration

1. **Pagination not implemented**
   - Currently fetches first 100 records only
   - TODO: Implement cursor-based pagination
   - Impact: Won't sync all data for large accounts

2. **No webhook support**
   - Changes in HubSpot require manual sync
   - TODO: Implement HubSpot webhooks for real-time sync
   - Endpoints needed: Company updates, Ticket updates

3. **No conflict resolution**
   - Simultaneous edits in both systems could conflict
   - TODO: Add last-modified timestamps and conflict detection

### Type Safety

1. **Some 'any' types in admin pages**
   - Files: Various `/app/admin/*` pages
   - TODO: Replace with proper TypeScript types

2. **HubSpot response types not fully typed**
   - Using `any` for HubSpot API responses
   - TODO: Create proper type definitions

### UI/UX

1. **Sidebar not mobile-responsive**
   - Works on desktop only
   - TODO: Add hamburger menu for mobile

2. **No loading states for sync operations**
   - Sync buttons don't show progress
   - TODO: Add spinners and progress indicators

3. **Limited error messages**
   - Generic error messages in UI
   - TODO: Surface specific error details to users

### Future Features (Not Yet Implemented)

- User management UI
- Invoice management UI
- Settings page
- Remote access functionality
- Video calling integration
- QuickBooks integration
- Email notifications
- Reporting & analytics

---

## Development Phases & Roadmap

### Phase 1: Foundation & Setup ✅ (Current)

**Status:** In Progress (90% complete)

**Completed:**
- [x] Next.js project setup
- [x] Database schema (11 models)
- [x] Authentication system (basic)
- [x] Admin dashboard with stats
- [x] Customer/Site/Machine/Ticket CRUD
- [x] HubSpot CRM & Service Hub integration
- [x] Two-way ticket sync

**Remaining:**
- [ ] User management UI
- [ ] Invoice management UI
- [ ] Settings page
- [ ] Proper session management

### Phase 2: Admin Panel (Partial)

**Completed:**
- [x] Dashboard statistics
- [x] Customer management
- [x] Site management
- [x] Machine management
- [x] Ticket management

**TODO:**
- [ ] Complete user management
- [ ] Complete invoice management
- [ ] Settings page with preferences
- [ ] Reporting & analytics

### Phase 3: Customer Portal (Planned)

**Features:**
- Customer login separate from admin
- View own sites and machines
- View and create tickets
- View invoices
- Machine status dashboard

**Not Started**

### Phase 4: Tech Dashboard (Planned)

**Features:**
- Service tech login
- View assigned tickets
- Remote access controls
- Session management
- Time tracking
- Machine diagnostics

**Not Started**

### Phase 5: Billing Integration (Planned)

**Features:**
- QuickBooks integration
- Automatic invoice generation
- Usage tracking
- Payment processing
- Billing reports

**Not Started**

### Phase 6: Remote Access (Planned)

**Features:**
- Remote desktop connection
- Machine control interface
- Screen sharing
- File transfer
- Session recording

**Not Started**

### Phase 7: Notifications & Communication (Planned)

**Integrations:**
- Email notifications (Google Workspace)
- Video calling (Daily.co)
- SMS notifications
- In-app notifications
- Ticket status updates

**Not Started**

### Phase 8: Reporting & Analytics (Planned)

**Features:**
- Usage reports
- Ticket analytics
- Machine uptime reports
- Customer reports
- Revenue reports

**Not Started**

---

## Key Principles for AI Assistants

### When Making Changes

1. **Always Read Before Editing**
   - Never propose changes to code you haven't read
   - Use Read tool before Edit/Write tools
   - Understand existing patterns before adding new code

2. **Avoid Over-Engineering**
   - Only make changes directly requested or clearly necessary
   - Don't add "improvements" beyond scope
   - Don't refactor unrelated code
   - Keep solutions simple and focused

3. **Maintain Consistency**
   - Follow existing file structure and naming
   - Match code style in surrounding files
   - Use established patterns (API routes, DB queries, etc.)

4. **Security First**
   - Never commit secrets or API keys
   - Validate user input at API boundaries
   - Use parameterized queries (Prisma handles this)
   - Hash passwords with bcryptjs

5. **Document Complex Logic**
   - Add comments for non-obvious code
   - Update this CLAUDE.md when adding new patterns
   - Keep PROJECT_HANDOFF.md in sync

### When Helping Users

1. **User is a novice developer**
   - Explain changes clearly
   - Reference file paths with line numbers: `file.ts:123`
   - Show what changed and why

2. **Provide Context**
   - Link to related documentation
   - Explain how new code fits into architecture
   - Point out dependencies and side effects

3. **Test Guidance**
   - Suggest testing steps after changes
   - Remind to check both UI and API
   - Mention database inspection with Prisma Studio

---

## Additional Resources

### Documentation Files

- **README.md** - Quick start and general overview
- **PROJECT_HANDOFF.md** - Comprehensive project context and status
- **HUBSPOT_SETUP.md** - HubSpot integration guide
- **DATABASE_SETUP.md** - Database configuration help
- **TESTING_GUIDE.md** - Testing procedures
- **SETUP_COMPLETE.md** - Initial setup documentation

### External Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [HubSpot API](https://developers.hubspot.com/docs/api/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Key Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Lint code

# Database
npm run db:push          # Quick schema sync (dev)
npm run db:migrate       # Create migration (production)
npm run db:seed          # Seed initial data
npm run db:studio        # GUI for database

# Utilities
npx prisma generate      # Regenerate Prisma client
npx prisma format        # Format schema file
rm -rf .next             # Clear Next.js cache
```

---

## Summary for AI Assistants

**This is a Next.js 14 (App Router) full-stack application** for managing remote service of mail inserter machines. It uses:

- **PostgreSQL (Supabase)** via Prisma ORM
- **Custom authentication** (sessionStorage-based, needs improvement)
- **HubSpot integration** for CRM and ticketing
- **Tailwind CSS** for styling
- **TypeScript** for type safety

**Current Status:** Phase 1 foundation complete, working on Phase 2 admin features.

**Key Things to Know:**
1. Always import Prisma client from `@/lib/prisma`
2. API routes follow REST conventions in `/app/api/*`
3. HubSpot sync utilities are in `@/lib/hubspot`
4. User is a novice developer - explain changes clearly
5. Avoid over-engineering - keep it simple

**When in Doubt:**
- Check `prisma/schema.prisma` for data model
- Review `PROJECT_HANDOFF.md` for comprehensive context
- Look at existing API routes for patterns
- Ask user for clarification rather than guessing

---

**Last Updated:** 2025-11-25
**Maintained By:** AI assistants working on this project
**Status:** Living document - update as project evolves
