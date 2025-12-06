# Megabox Service Portal

Remote service management platform for mail inserter machines.

## Tech Stack

- **Next.js 14** (App Router) - Frontend + Backend
- **React 18** + **TypeScript** - UI library with type safety
- **Tailwind CSS** - Styling
- **Prisma** + **PostgreSQL** (Supabase) - Database
- **bcryptjs** - Password hashing
- **HubSpot** - CRM & Service Hub integration
- **Twilio** - Voice calling
- **Daily.co** - Video calling

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL database (Supabase recommended)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Copy `env.example` to `.env.local` and configure:

   ```bash
   cp env.example .env.local
   ```

   Required variables:
   - `DATABASE_URL` - Supabase PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `HUBSPOT_API_KEY` - HubSpot private app token
   - `TWILIO_*` - Twilio credentials (for voice calling)
   - `DAILY_API_KEY` - Daily.co API key (for video calling)

3. **Set up the database:**

   ```bash
   npm run db:push    # Push schema to database
   npm run db:seed    # Seed initial admin user
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Admin User

After seeding, log in with:

- **Email:** admin@megaboxsupply.com
- **Password:** admin123

**Change this password immediately after first login!**

## Project Structure

```
megabox-service/
├── app/
│   ├── (auth)/            # Login page
│   ├── admin/             # Admin panel
│   ├── customer/          # Customer portal
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities (auth, prisma, hubspot, twilio)
├── prisma/                # Database schema & seed
└── docs/                  # Integration documentation
```

## Features

### Implemented
- Admin dashboard with statistics
- Customer/company management
- Site management
- Machine management
- Ticket management (CRUD + HubSpot sync)
- User management
- HubSpot CRM integration (companies, contacts, tickets)
- Twilio voice calling
- Daily.co video calling
- Customer portal

### Planned
- Invoice management & QuickBooks integration
- Advanced reporting
- Push notifications

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## Documentation

Integration guides are in `docs/integrations/`:
- HubSpot setup and configuration
- Twilio voice calling setup
- Daily.co video calling setup
- Ngrok tunneling for webhooks
