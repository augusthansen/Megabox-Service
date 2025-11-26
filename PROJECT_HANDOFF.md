# Megabox Supply Remote Service Platform - Project Handoff

## Project Overview

A remote service management platform for mail inserter machines. This is a Next.js application that integrates with HubSpot CRM and Service Hub for customer and ticket management.

**Current Phase:** Phase 1 - Foundation & Setup (In Progress)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Authentication:** Custom session-based (using sessionStorage)
- **Integrations:** HubSpot CRM & Service Hub

## Project Status

### ✅ Completed Features

1. **Project Setup**

   - Next.js 14 with TypeScript and Tailwind CSS
   - Prisma ORM configured with PostgreSQL
   - Database schema with 11 core tables
   - Initial admin user seeding

2. **Authentication**

   - Custom login system (bypassed NextAuth.js due to issues)
   - Session management using sessionStorage
   - Protected admin routes

3. **Admin Dashboard**

   - Dashboard with statistics (customers, sites, machines, open tickets)
   - Navigation sidebar with dark theme
   - Top bar with user info and sign-out

4. **Customer Management**

   - List all customers
   - Add new customers with pricing tiers
   - View/edit customer details
   - Add sites to customers
   - HubSpot sync functionality

5. **Site Management**

   - List all sites
   - View/edit site details
   - Add machines to sites

6. **Machine Management**

   - List all machines
   - View/edit machine details
   - View recent tickets for machines

7. **Ticket Management**

   - List all tickets with filters (status, priority)
   - Create new tickets
   - View ticket details with full information
   - Edit ticket details (status, priority, assignment, etc.)
   - Link to view tickets in HubSpot
   - HubSpot sync functionality

8. **User Management** ⭐ **RECENTLY ADDED**
   - List all users
   - Create new users with roles
   - Edit user details
   - Toggle user active/inactive status
   - Filter users by company

9. **HubSpot Integration** ⭐ **RECENTLY ADDED**
   
   **Companies:**
   - Sync companies from HubSpot CRM
   - Filter sync by "Service Plan" custom property
   - Automatic creation of new companies
   - Update existing companies on re-sync
   
   **Tickets:**
   - Sync tickets from HubSpot Service Hub with company associations
   - Two-way sync: Create/update tickets in app → automatically syncs to HubSpot
   - Status and priority mapping between systems
   - Direct links to view/edit tickets in HubSpot
   - Company association preservation
   
   See [HUBSPOT_TICKETS.md](./HUBSPOT_TICKETS.md) for detailed ticket integration documentation

## Database Schema

### Core Models

1. **User** - System users (super_admin, service_tech, customer_admin, customer_user)
2. **Company** - Customer companies (with HubSpot ID support)
3. **Site** - Physical locations for companies
4. **Machine** - Mail inserter machines at sites
5. **MachineAlarm** - Machine alarm history
6. **Ticket** - Service tickets (with HubSpot ID support)
7. **Session** - Remote access sessions
8. **Attachment** - File attachments for tickets
9. **Comment** - Comments on tickets
10. **Invoice** - Billing invoices
11. **FloorMap** - Visual floor maps for sites

### Key Relationships

- Company → Sites (one-to-many)
- Site → Machines (one-to-many)
- Company → Tickets (one-to-many)
- Site → Tickets (one-to-many)
- Machine → Tickets (one-to-many)
- Ticket → Comments (one-to-many)
- Ticket → Attachments (one-to-many)

## Environment Variables

Required in `.env.local`:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"

# NextAuth (legacy, may not be fully used)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# HubSpot Integration
HUBSPOT_API_KEY="your-hubspot-private-app-token"

# Optional (for future phases)
DAILY_API_KEY="your-daily-api-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
QUICKBOOKS_CLIENT_ID="your-quickbooks-client-id"
QUICKBOOKS_CLIENT_SECRET="your-quickbooks-client-secret"
```

## Initial Admin User

- **Email:** admin@megaboxsupply.com
- **Password:** admin123
- ⚠️ **IMPORTANT:** Change this password immediately after first login!

## Project Structure

```
megabox-service/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page
│   ├── admin/
│   │   ├── layout.tsx           # Admin layout with sidebar
│   │   ├── page.tsx             # Dashboard
│   │   ├── customers/
│   │   │   ├── page.tsx         # Customer list
│   │   │   └── [id]/page.tsx    # Customer detail
│   │   ├── sites/
│   │   │   ├── page.tsx         # Site list
│   │   │   └── [id]/page.tsx    # Site detail
│   │   ├── machines/
│   │   │   ├── page.tsx         # Machine list
│   │   │   └── [id]/page.tsx    # Machine detail
│   │   ├── tickets/
│   │   │   ├── page.tsx         # Ticket list
│   │   │   └── [id]/page.tsx    # Ticket detail
│   │   ├── users/
│   │   │   └── page.tsx         # User list (placeholder)
│   │   ├── invoices/
│   │   │   └── page.tsx         # Invoice list (placeholder)
│   │   └── settings/
│   │       └── page.tsx         # Settings (placeholder)
│   └── api/
│       ├── login/
│       │   └── route.ts         # Custom login endpoint
│       ├── customers/
│       │   ├── route.ts         # List/create customers
│       │   └── [id]/route.ts    # Get/update customer
│       ├── sites/
│       │   ├── route.ts         # List/create sites
│       │   └── [id]/route.ts    # Get/update site
│       ├── machines/
│       │   ├── route.ts         # List/create machines
│       │   └── [id]/route.ts    # Get/update machine
│       ├── tickets/
│       │   ├── route.ts         # List/create tickets
│       │   └── [id]/route.ts    # Get/update ticket
│       ├── stats/
│       │   └── route.ts         # Dashboard statistics
│       └── hubspot/
│           ├── sync-companies/
│           │   └── route.ts     # Sync companies from HubSpot
│           └── sync-tickets/
│               └── route.ts     # Sync tickets from HubSpot
├── components/
│   ├── admin/
│   │   ├── sidebar.tsx          # Admin navigation sidebar
│   │   └── top-bar.tsx          # Admin top bar
│   ├── providers.tsx            # NextAuth providers (legacy)
│   └── sign-out-button.tsx      # Sign out button
├── lib/
│   ├── prisma.ts                # Prisma client
│   ├── auth.ts                  # Auth utilities (password hashing)
│   ├── hubspot.ts               # HubSpot integration utilities
│   └── utils.ts                 # General utilities
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Database seeding
├── types/
│   └── next-auth.d.ts           # NextAuth type definitions
└── [config files]
```

## Key Files to Review

### HubSpot Integration (Recent Addition)

1. **`lib/hubspot.ts`** - Core HubSpot utilities

   - `getHubspotClient()` - Initialize HubSpot client
   - `syncCompaniesFromHubspot()` - Fetch companies from HubSpot
   - `syncTicketsFromHubspot()` - Fetch tickets from HubSpot
   - `createTicketInHubspot()` - Create ticket in HubSpot
   - `updateTicketInHubspot()` - Update ticket in HubSpot
   - Status/priority mapping functions

2. **`app/api/hubspot/sync-companies/route.ts`** - Sync companies API

   - Fetches companies from HubSpot
   - Creates new companies or updates existing ones
   - Maps HubSpot properties to our schema

3. **`app/api/hubspot/sync-tickets/route.ts`** - Sync tickets API

   - Fetches tickets from HubSpot Service Hub
   - Links tickets to companies via HubSpot associations
   - Creates new tickets or updates existing ones

4. **`app/admin/customers/page.tsx`** - Customers page with sync button
5. **`app/admin/tickets/page.tsx`** - Tickets page with sync button

### Authentication

- **`app/api/login/route.ts`** - Custom login endpoint (bypasses NextAuth)
- **`app/(auth)/login/page.tsx`** - Login form
- **`app/admin/layout.tsx`** - Protected route wrapper using sessionStorage

### Database

- **`prisma/schema.prisma`** - Complete database schema
- **`lib/prisma.ts`** - Prisma client singleton

## Recent Changes (HubSpot Integration)

### What Was Added

1. **HubSpot SDK** - `@hubspot/api-client` package installed
2. **HubSpot Client Utility** - `lib/hubspot.ts` with all integration functions
3. **Sync API Routes** - Two endpoints for syncing companies and tickets
4. **Two-Way Sync** - Tickets created/updated in app sync to HubSpot
5. **UI Sync Buttons** - Added to Customers and Tickets pages
6. **Status/Priority Mapping** - Converts between HubSpot and app formats

### How It Works

1. **Sync from HubSpot:**

   - Click "🔄 Sync from HubSpot" button
   - Fetches data from HubSpot API
   - Creates new records or updates existing ones
   - Shows summary of what was synced

2. **Sync to HubSpot:**

   - When creating a ticket → automatically creates in HubSpot (if company has HubSpot ID)
   - When updating a ticket → automatically updates in HubSpot (if ticket has HubSpot ID)

3. **Data Mapping:**
   - HubSpot companies → Our Company model (via `hubspotId`)
   - HubSpot tickets → Our Ticket model (via `hubspotId`)
   - Status and priority values are mapped between formats

## Setup Instructions

### 1. Install Dependencies

```bash
cd megabox-service
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local` and fill in:

- `DATABASE_URL` - Your Supabase connection string
- `HUBSPOT_API_KEY` - Your HubSpot private app token
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# Seed initial admin user
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Access the Application

- Open http://localhost:3000 (or 3001 if 3000 is in use)
- Login with: admin@megaboxsupply.com / admin123

## HubSpot Setup

See `HUBSPOT_SETUP.md` for detailed instructions on:

- Creating a HubSpot Private App
- Getting your API key
- Setting up permissions
- Using the sync features

## Known Issues / Technical Debt

1. **Authentication:** Currently using sessionStorage instead of proper session management. Consider implementing proper JWT or server-side sessions.

2. **NextAuth.js:** Partially configured but not fully used due to client-side issues. May need to revisit or remove.

3. **Error Handling:** Some API routes could use more robust error handling.

4. **Type Safety:** Some `any` types in use, especially in admin pages. Should be properly typed.

5. **Responsive Design:** Sidebar is not yet mobile-responsive.

6. **HubSpot Sync:**
   - Currently syncs first 100 records (pagination not implemented)
   - No webhook support yet (manual sync only)
   - No conflict resolution for simultaneous edits

## Next Steps / TODO

### Immediate

- [ ] Test HubSpot integration with real data
- [ ] Add pagination to HubSpot sync (currently limited to 100 records)
- [ ] Improve error messages for HubSpot sync failures
- [ ] Add loading states and better UX for sync operations

### Short Term

- [ ] Make sidebar responsive for mobile
- [ ] Implement proper session management (replace sessionStorage)
- [ ] Add user management functionality
- [ ] Add invoice management functionality
- [ ] Add settings page functionality

### Medium Term

- [ ] Implement HubSpot webhooks for real-time sync
- [ ] Add customer portal (Phase 3)
- [ ] Add tech dashboard (Phase 4)
- [ ] Add remote access functionality (Phase 6)

### Long Term

- [ ] Add QuickBooks integration (Phase 5)
- [ ] Add Daily.co video calling (Phase 7)
- [ ] Add Google Workspace email integration (Phase 7)

## Development Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:push          # Push schema changes
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Build
npm run build            # Build for production
npm run start            # Start production server
```

## Important Notes

1. **Database:** Using Supabase PostgreSQL. Connection string format:

   ```
   postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
   ```

   Or use Supavisor pooling:

   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```

2. **Port:** Dev server may run on 3000 or 3001. Check terminal output.

3. **Cache Issues:** If you see "Could not find module" errors, clear `.next` cache:

   ```bash
   rm -rf .next
   npm run dev
   ```

4. **HubSpot API:** Requires Private App with Companies and Tickets read/write permissions.

## Master Plan

### Project Overview

**Megabox Supply Remote Service Platform** - A comprehensive platform for managing remote service for mail inserter machines. The platform provides remote access, ticket management, customer portals, and billing integration.

### Pricing Tiers

1. **Basic Tier**

   - $40/month per machine
   - $180/hour for remote service
   - Standard support

2. **Standard Tier**

   - $60/month per machine
   - $150/hour for remote service
   - Priority support

3. **Mega Tier**
   - $85/month per machine
   - $120/hour for remote service
   - Premium support with dedicated tech

### User Roles

1. **Super Admin** - Full system access, user management, billing
2. **Service Tech** - Access to tickets, remote sessions, machine management
3. **Customer Admin** - Manage their company's sites, machines, view tickets
4. **Customer User** - View-only access to their company's data

### Development Phases

#### Phase 1: Foundation & Setup ✅ (In Progress)

- [x] Next.js project setup
- [x] Database schema (Prisma + PostgreSQL)
- [x] Authentication system
- [x] Admin dashboard
- [x] Customer management
- [x] Site management
- [x] Machine management
- [x] Ticket management
- [x] HubSpot CRM integration

#### Phase 2: Admin Panel (In Progress)

- [x] Dashboard with statistics
- [x] Customer management
- [x] Site management
- [x] Machine management
- [x] Ticket management
- [ ] User management
- [ ] Invoice management
- [ ] Settings page
- [ ] Reporting

#### Phase 3: Customer Portal (Planned)

- [ ] Customer login
- [ ] View their sites and machines
- [ ] View tickets
- [ ] Create tickets
- [ ] View invoices
- [ ] Machine status dashboard

#### Phase 4: Tech Dashboard (Planned)

- [ ] Tech login
- [ ] Assigned tickets view
- [ ] Remote access controls
- [ ] Session management
- [ ] Time tracking
- [ ] Machine diagnostics

#### Phase 5: Billing Integration (Planned)

- [ ] QuickBooks integration
- [ ] Automatic invoice generation
- [ ] Usage tracking
- [ ] Payment processing
- [ ] Billing reports

#### Phase 6: Remote Access (Planned)

- [ ] Remote desktop connection
- [ ] Machine control interface
- [ ] Screen sharing
- [ ] File transfer
- [ ] Session recording

#### Phase 7: Notifications & Communication (Planned)

- [ ] Email notifications (Google Workspace)
- [ ] Video calling (Daily.co)
- [ ] SMS notifications
- [ ] In-app notifications
- [ ] Ticket status updates

#### Phase 8: Reporting & Analytics (Planned)

- [ ] Usage reports
- [ ] Ticket analytics
- [ ] Machine uptime reports
- [ ] Customer reports
- [ ] Revenue reports

### Integrations

1. **HubSpot CRM** ✅ (Implemented)

   - Customer/company sync
   - Ticket sync
   - Two-way synchronization

2. **HubSpot Service Hub** ✅ (Implemented)

   - Ticket management
   - Status synchronization

3. **QuickBooks** (Planned - Phase 5)

   - Invoice generation
   - Payment tracking
   - Financial reporting

4. **Daily.co** (Planned - Phase 7)

   - Video calling
   - Screen sharing
   - Remote assistance

5. **Google Workspace** (Planned - Phase 7)
   - Email notifications
   - Calendar integration
   - Document sharing

### Core Features

1. **Customer Management**

   - Company profiles
   - Pricing tier assignment
   - Usage tracking
   - Billing information

2. **Site Management**

   - Multiple sites per company
   - Site details (address, contacts, timezone)
   - Floor maps
   - Site-specific settings

3. **Machine Management**

   - Machine profiles (model, serial, firmware)
   - Configuration tracking
   - Alarm history
   - Remote access settings
   - Status monitoring

4. **Ticket Management**

   - Create/edit tickets
   - Assign to techs
   - Priority levels
   - Status tracking
   - Time tracking
   - Cost calculation
   - Comments and attachments

5. **Remote Sessions**

   - Session creation
   - Remote access
   - Session recording
   - Time tracking
   - Cost calculation

6. **Billing**
   - Automatic invoice generation
   - Usage-based billing
   - Tier-based pricing
   - Payment tracking

### Database Schema Overview

The database includes 11 core tables:

- **User** - System users with roles and 2FA support
- **Company** - Customer companies with pricing tiers
- **Site** - Physical locations
- **Machine** - Mail inserter machines
- **MachineAlarm** - Alarm history
- **Ticket** - Service tickets
- **Session** - Remote access sessions
- **Attachment** - File attachments
- **Comment** - Ticket comments
- **Invoice** - Billing invoices
- **FloorMap** - Visual site layouts

All relationships are properly defined with foreign keys and cascading deletes where appropriate.

## Support Files

- `HUBSPOT_SETUP.md` - HubSpot integration guide
- `README.md` - General project overview
- `SETUP_COMPLETE.md` - Initial setup documentation
- `NEXT_STEPS.md` - Development roadmap

## Contact / Context

This project is for managing remote service for mail inserter machines. The user is a novice developer, so code should be well-documented and changes should be explained clearly.

HubSpot CRM is the source of truth for customers, and HubSpot Service Hub is the source of truth for tickets. The app syncs bidirectionally with HubSpot.

---

**Last Updated:** After HubSpot integration implementation
**Status:** Phase 1 - Foundation & Setup (In Progress)
