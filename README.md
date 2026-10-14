# CricPlus — Enterprise Cricket Tournament Management Platform

**CricPlus** is a premier cricket tournament management platform engineered for **TEOCO**, built to manage corporate competitions including **DDPL** (Dynamic Daredevils Premier League), **Game of RUN** (Official TEOCO Cricket Championship), and future company tournaments.

---

## 🏆 Key Features & Architectural Pillars

### 1. Flexible Team & Player Management
- Configurable squad sizes per tournament ($7 \le \text{players} \le 15+$).
- Pre-registration player pool with admin approval and account-linking.
- Franchise owners, Captains (C), and Vice-Captains (VC).
- Detailed player profiles (Batting style, bowling style, playing role, employee ID).

### 2. Concurrency-Safe Auction Engine
- Room Auctioneer console designed for in-person auctions where owners sit together.
- Atomic PostgreSQL stored procedures (`place_auction_bid`, `conclude_auction_lot`).
- Server-side team purse validation and squad capacity enforcement.
- Real-time bid updates, custom step increments (+₹100, +₹200, +₹500), and auditable undo history.
- Sold vs. Unsold pool management with automatic squad assignment.

### 3. Professional Cricket Scoring Engine
- Mobile-optimized scoring dial with one-thumb reach ($0, 1, 2, 3, 4, 6$).
- Bowler spell tracking (overs, maidens, runs conceded, wickets, economy rate).
- Legal and illegal deliveries (Wides, No-Balls with free hits, Byes, Leg-Byes).
- Dismissal modal capturing wicket mode (Caught, Bowled, LBW, Run-out, Stumped) and fielder attribution.
- Dynamic strike rotation on odd runs and end-of-over transitions.
- Full scorecard generation with Fall of Wickets (FOW) and over summaries.

### 4. Tournament Standings & Net Run Rate (NRR)
- Win (2 pts), Tie/No-Result (1 pt), Loss (0 pts).
- Official ICC-compliant Net Run Rate calculation with full-quota overs adjustment for all-out innings.
- Qualification indicators and rank sorting.

### 5. Historical Tournament Archive & All-Time Records
- Independent multi-year editions (DDPL 2025, 2026, 2027; Game of RUN 2025, 2026, 2027).
- Permanent preservation of past champions, runner-ups, and final scorecards.
- Aggregated all-time career statistics (Runs, Wickets, Average, Strike Rate, MVP points) without mixing tournament records.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14/15 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons, Canvas Confetti
- **Database & Auth:** Supabase (PostgreSQL 15+), Supabase Auth, Row Level Security (RLS)
- **Deployment:** Vercel + Supabase

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- npm or pnpm
- Supabase project account (free or pro)

### 2. Environment Setup
Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Migration & Seed
In your Supabase SQL Editor:
1. Run `supabase/migrations/20261013000000_initial_cricpluse_schema.sql`
2. Run `supabase/seed.sql` to load demo tournaments (DDPL & Game of RUN)

### 4. Install & Run Locally
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
cricket-app/
├── legacy/                   # Safely preserved original prototype files
├── supabase/
│   ├── migrations/           # Production PostgreSQL schema with RLS & RPC
│   └── seed.sql              # Realistic seed data (DDPL & Game of RUN)
├── src/
│   ├── app/
│   │   ├── archive/          # Historical Archive & Hall of Fame
│   │   ├── auction/          # Live Player Auction Console
│   │   ├── auth/login/       # Authentication (Sign In & Register)
│   │   ├── leaderboard/      # Orange Cap, Purple Cap & MVP Leaderboards
│   │   ├── matches/          # Match Fixtures & Live Scoring Console
│   │   ├── profile/          # Player Profile & Style Settings
│   │   ├── standings/        # Points Table & Net Run Rate (NRR)
│   │   ├── teams/            # Franchises, Squads & Purse Details
│   │   ├── tournaments/      # Tournament Hub (DDPL & Game of RUN)
│   │   ├── layout.tsx        # Root Layout with Sports Branding
│   │   └── page.tsx          # Central Executive Dashboard
│   ├── components/
│   │   └── layout/           # Reusable Navbar, Footer & Drawers
│   ├── lib/
│   │   ├── supabase/         # Typed Supabase client initializers
│   │   └── utils.ts          # Cricket math helpers (Overs, NRR, Economy)
│   └── types/
│       └── database.types.ts # TypeScript interfaces for all domain entities
└── package.json
```
