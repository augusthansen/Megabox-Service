# Megabox Service Portal

Remote service management platform for mail inserter machines.

## Tech Stack

- **Next.js 14** (App Router) - Frontend + Backend
- **React** + **TypeScript** - UI library with type safety
- **Tailwind CSS** - Styling
- **Prisma** + **PostgreSQL** (Supabase) - Database
- **NextAuth.js** - Authentication
- **bcryptjs** - Password hashing

## Getting Started

### Prerequisites

- Node.js v18.20.7 or higher
- PostgreSQL database (Supabase recommended)
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` with your actual values:

   - `DATABASE_URL` - Your Supabase PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `HUBSPOT_API_KEY` - Your HubSpot private app token
   - `DAILY_API_KEY` - Your Daily.co API key

3. **Set up the database:**

   ```bash
   # Push schema to database
   npm run db:push

   # Or create a migration
   npm run db:migrate

   # Seed initial admin user
   npm run db:seed
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Initial Admin User

After seeding, you can log in with:

- **Email:** admin@megaboxsupply.com
- **Password:** admin123

⚠️ **IMPORTANT:** Change this password immediately after first login!

## Project Structure

```
megabox-service/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login, etc.)
│   ├── admin/             # Admin panel pages
│   ├── customer/          # Customer portal (Phase 3)
│   ├── tech/              # Tech dashboard (Phase 4)
│   └── api/               # API routes
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── components/            # Reusable components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   └── auth.ts           # Auth helpers
└── public/               # Static files
```

## Development Phases

- **Phase 1:** Foundation & Setup (Current) ✅
- **Phase 2:** Admin Panel
- **Phase 3:** Customer Portal
- **Phase 4:** Tech Dashboard
- **Phase 5:** Billing
- **Phase 6:** HubSpot Sync
- **Phase 7:** Notifications
- **Phase 8:** Reporting

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
