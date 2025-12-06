# Session Handoff - Megabox Service Platform

## Quick Start for New Chat

**Project Location:** `/Users/augusthansen/Documents/Programs/Megabox Service App/megabox-service`

**Dev Server:** `npm run dev` (runs on port 3000 or 3001)

**Database:** Supabase PostgreSQL with Prisma ORM

**Recent Commit:** `0556842` - Knowledge base enhancements

---

## Project Overview

A comprehensive remote service management platform for mail inserter machines (Bluecrest equipment). Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, and PostgreSQL (Supabase).

### Key Integrations
- **HubSpot CRM** - Customer/company sync, ticket sync (bidirectional)
- **Twilio** - Phone calling with recording and transcription
- **OpenAI** - Embeddings for knowledge base semantic search
- **Anthropic Claude** - AI chat responses in knowledge base
- **Supabase Storage** - File/document storage
- **Daily.co** - Video calling (configured)

---

## Recent Session Work (December 2024)

### Knowledge Base AI System - Major Feature

The knowledge base allows uploading PDF manuals and using AI to search and answer questions about them.

#### Key Components:

1. **`/components/knowledge-base/KnowledgeChat.tsx`** - AI chat interface
   - Guided filtering with document category buttons (Operator, Service, Parts, TSB/Wiring)
   - Machine/module category dropdowns
   - Real-time streaming responses
   - Citation display with page numbers

2. **`/components/knowledge-base/DocumentBrowser.tsx`** - Document management
   - Upload PDFs with drag-and-drop
   - Edit document metadata after upload
   - Filter by type/status
   - Reprocess failed documents

3. **`/lib/knowledge-base.ts`** - Core RAG implementation
   - PDF parsing with pdf-parse
   - Text chunking with overlap
   - OpenAI embeddings (text-embedding-3-small)
   - Hybrid search: semantic + keyword matching for part numbers
   - Claude AI for response generation

4. **`/app/api/knowledge-base/`** - API routes
   - `/upload` - Upload PDFs
   - `/documents` - List/manage documents
   - `/documents/[id]` - Get/update/delete single document
   - `/chat` - AI chat endpoint
   - `/search` - Search documents
   - `/stats` - Knowledge base statistics

#### Machine/Module Categories (synchronized across components):

**Inserter Systems:**
- Epic, MPS, FPS, FPS-SD, Flowmaster, Rival, APS, MSE, DI2000

**Software:**
- DC & RTP (formerly "Direct Connect")
- Scanning Software

**Modules:**
- Feeder Module
- Input Module
- Stacker Module
- Envelope Module
- Metering Module
- Buckle Chute Module

#### Document Types (Prisma enum):
```
service_manual, parts_manual, procedures, tsb, quick_reference,
troubleshooting, installation, maintenance, wiring_diagram, other
```

---

## Project Structure

```
megabox-service/
├── app/
│   ├── (auth)/login/           # Login page
│   ├── admin/                  # Admin dashboard
│   │   ├── page.tsx            # Dashboard with stats
│   │   ├── customers/          # Customer management
│   │   ├── sites/              # Site management
│   │   ├── machines/           # Machine management
│   │   ├── tickets/            # Ticket management
│   │   ├── users/              # User management
│   │   ├── invoices/           # Invoice management
│   │   ├── knowledge-base/     # Knowledge base admin
│   │   ├── queue/              # Phone queue management
│   │   └── settings/           # Settings page
│   ├── customer/               # Customer portal
│   │   ├── page.tsx            # Customer dashboard
│   │   ├── tickets/            # View/create tickets
│   │   ├── machines/           # View machines
│   │   └── settings/           # Customer settings
│   └── api/                    # API routes
│       ├── login/              # Authentication
│       ├── customers/          # Customer CRUD
│       ├── sites/              # Site CRUD
│       ├── machines/           # Machine CRUD
│       ├── tickets/            # Ticket CRUD
│       ├── users/              # User CRUD
│       ├── invoices/           # Invoice CRUD
│       ├── hubspot/            # HubSpot sync
│       ├── twilio/             # Twilio webhooks
│       ├── knowledge-base/     # Knowledge base API
│       ├── notifications/      # Notification system
│       ├── queue/              # Call queue
│       ├── chat/               # Ticket chat
│       └── sessions/           # Session management
├── components/
│   ├── admin/
│   │   ├── sidebar.tsx         # Admin navigation
│   │   └── top-bar.tsx         # Top bar with notifications
│   ├── knowledge-base/
│   │   ├── KnowledgeChat.tsx   # AI chat interface
│   │   └── DocumentBrowser.tsx # Document management
│   ├── notifications/
│   │   └── NotificationBell.tsx
│   ├── queue/
│   │   └── PhoneQueueStatus.tsx
│   ├── chat/
│   │   └── ChatWindow.tsx      # Ticket chat
│   ├── twilio-calling.tsx      # Phone calling
│   ├── video-call.tsx          # Video calling
│   └── communication-*.tsx     # Communication requests
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── auth.ts                 # Password hashing
│   ├── hubspot.ts              # HubSpot integration
│   ├── twilio.ts               # Twilio integration
│   ├── knowledge-base.ts       # RAG system
│   ├── notifications.ts        # Notification helpers
│   ├── activity-log.ts         # Activity logging
│   ├── supabase.ts             # Supabase client
│   ├── daily.ts                # Daily.co video
│   └── theme-context.tsx       # Dark mode context
├── prisma/
│   └── schema.prisma           # Database schema
└── docs/                       # Documentation
```

---

## Database Schema (Key Models)

### Core Business:
- **User** - super_admin, customer_admin, customer_tech, service_tech
- **Company** - Customer companies with pricing tiers
- **Site** - Physical locations
- **Machine** - Mail inserter machines
- **Ticket** - Service tickets with categories, priorities, status
- **Session** - Remote support sessions with recordings
- **Invoice** - Billing with line items

### Communication:
- **CommunicationRequest** - Video/phone/chat requests
- **ChatMessage** - Real-time ticket chat
- **CallQueue** - Phone queue management
- **Notification** - In-app notifications

### Knowledge Base:
- **KnowledgeDocument** - Uploaded PDFs with metadata
- **DocumentChunk** - Text chunks with embeddings
- **KnowledgeChatSession** - Chat sessions
- **KnowledgeChatMessage** - Chat messages with citations
- **KnowledgeBaseArticle** - Manual articles (for future use)

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."

# HubSpot
HUBSPOT_API_KEY="..."

# Twilio
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# AI
OPENAI_API_KEY="..."        # For embeddings
ANTHROPIC_API_KEY="..."     # For Claude chat

# Daily.co (video)
DAILY_API_KEY="..."

# NextAuth (legacy)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
```

---

## Current Status & Known Issues

### Working Features:
- Admin dashboard with stats
- Customer/Site/Machine/Ticket CRUD
- HubSpot bidirectional sync
- Twilio phone calling with recording
- Knowledge base with AI chat
- Document upload and processing
- Notifications system
- Dark mode

### Known Issues:
1. **Authentication** - Uses sessionStorage (not production-ready)
2. **HubSpot Sync** - Limited to 100 records (no pagination)
3. **Some `any` types** - Could use better TypeScript types

---

## Recent Changes (This Session)

1. **Knowledge Base Guided Filtering**
   - Added document category buttons (Operator, Service, Parts, TSB/Wiring)
   - Added machine/module category dropdowns
   - Categories map to specific document types for filtering

2. **Hybrid Search Implementation**
   - Combines semantic search (embeddings) with keyword matching
   - Detects part numbers and error codes automatically
   - Prioritizes exact matches for specific identifiers

3. **Document Edit Modal**
   - Can now edit PDF metadata after upload
   - Title, type, manufacturer, machine model, description, tags

4. **Module/Machine Updates**
   - Renamed "Direct Connect" to "DC & RTP"
   - Added Metering Module, Buckle Chute Module, Envelope Module
   - Added "procedures" document type to Prisma enum

5. **Bug Fixes**
   - Fixed Prisma upload error (missing procedures enum)
   - Synchronized module lists across all components

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate client
npx prisma studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Build
npm run build            # Build for production
```

---

## Login Credentials

**Admin:** admin@megaboxsupply.com / admin123

---

## Files to Reference First

When starting a new task, these files give the best context:

1. **`prisma/schema.prisma`** - Complete database schema
2. **`PROJECT_HANDOFF.md`** - Full project overview
3. **`lib/knowledge-base.ts`** - Knowledge base implementation
4. **`components/knowledge-base/KnowledgeChat.tsx`** - AI chat UI
5. **`components/knowledge-base/DocumentBrowser.tsx`** - Document management
6. **`app/admin/layout.tsx`** - Admin layout and auth check

---

## Next Potential Tasks

1. Add more machine models to the lists
2. Improve knowledge base search accuracy
3. Add customer portal knowledge base access
4. Implement proper authentication (JWT/sessions)
5. Add HubSpot pagination for large syncs
6. Customer satisfaction surveys after ticket resolution
