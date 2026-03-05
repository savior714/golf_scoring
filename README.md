# Antigravity Golf Tracker

A mobile-first golf scoring application built on Expo Router.
From initial setup to data model expansion, UI/UX refinement, and miss-shot analysis — this is a continuously evolving project-managed codebase.

## Features

1. **Hole Recording (`app/(tabs)/record.tsx`)**
   - Course selection, PAR and DISTANCE display with web compatibility (`window.confirm`)
   - Individual tracking of Stroke, Putt, OB, and Penalty/Hazard
   - 6 miss-shot patterns (Slice, Hook, Fat Shot, Shank, Bunker, Three-putt) with grid analysis

2. **Real-time Leaderboard & Professional Scorecard (`app/(tabs)/index.tsx`)**
   - **Professional Scorecard Table**: 9-hole split table with per-score symbols (◎, ○, □, ◇) and auto-totals
   - Score 3x5 grid view (progress, Eagle to Double, average putts, separate OB/Hazard stats)
   - Integrated with proprietary statistics service (`golfService.ts`)

3. **Club Master Data & 27-Hole / Dynamic Course Support**
   - **4-Layer Structure**: Club > Course (9-hole unit) > Hole > Distance
   - **Dynamic Course Combination**: 3-step selection (Club → Out → In) for 27-hole courses, building 18-hole rounds
   - **Admin-only Registration**: Exclusive club data entry/edit screen for `savior714@gmail.com` (`app/(tabs)/admin.tsx`)
   - **AI Auto-import**: Automatically ex-tracts hole-by-hole Par and Distance from a course intro page URL using Gemini 2.5 Flash (Free). Automatically falls back to text-paste mode for JS-rendered sites (100% coverage). Powered by Supabase Edge Function (`course-import`). (Design doc: `docs/COURSE_AUTO_IMPORT_PLAN.md`)

4. **Multi-user Support & Cloud Sync**
   - **Google OAuth**: Easy login via Google account (Magic Link & OAuth Popup)
   - **Data Migration**: Anonymous records are automatically transferred to the account upon login
   - **Supabase Cloud**: Per-user data isolation (RLS) and real-time cloud backup

5. **Persistent Storage**
   - Independent `AsyncStorage` key management per user (`@golf_rounds_data_{userId}`)

## Architecture (DDD & 3-Layer)

- **Modules (`src/modules/golf`)**: Isolated business logic for the golf domain
  - **Definition**: Data types and interfaces (`golf.types.ts`)
  - **Repository**: Data access layer (Local + Remote) (`golf.repository.ts`)
  - **Service**: Stats calculation and domain logic (`golf.service.ts`)
  - **Data**: Domain-specific static data (`golf.data.ts`)
- **Shared (`src/shared`)**: Reusable infrastructure and UI across the project
  - **Components**: Common UI components (`src/shared/components`)
  - **Lib**: External library configs (Supabase, etc.) (`src/shared/lib`)
  - **Constants**: Themes and constants (`src/shared/constants`)
- **Router (`app/`)**: File-system routing based on Expo Router (UI-Only View Layer)
  - **Premium UI**: Dark-theme glassmorphism design with animations

## Recent Updates

- **Course AI Auto-import (2026-03-05)**: Added Gemini 2.5 Flash parsing from course URL → auto-fills admin form. Deployed Supabase Edge Function `course-import`. JS SPA sites automatically switch to text-paste mode.
- **API Key Security (2026-03-05)**: Replaced API key in docs with a placeholder. Actual key stored only in Supabase Secrets.
- **Auth Flash Fix (2026-03-05)**: Maintains splash screen until session check is complete, eliminating the "dashboard flash before login redirect" issue.
- **Data Consistency (2026-03-05)**: Improved `useMemo` logic to prioritize the current active round (`current_round_id`) in dashboard leaderboard calculation.
- **Singleton Promise Pattern (2026-03-05)**: Introduced Singleton Promise for `getStorageKey` to prevent Race Conditions during concurrent async calls immediately after login.
- **SSR Build Compatibility (Vercel)**: Applied Isomorphic Safety Wrapper to prevent build errors from missing `window` object during static rendering.
- **Club Master DB Integration**: Designed 4-layer schema (Club, Course, Hole, Distance) with 27-hole club support.
- **Performance Optimization**: Computation optimized with `useMemo` and async parallelization with `Promise.all`.
- **Architecture Refactoring**: Strict DDD separation of business logic (`src/modules`) and shared infrastructure (`src/shared`).
- **SSOT Docs English Translation (2026-03-06)**: All documentation in `docs/` folder fully translated to English for token efficiency.

## Development & Running

```bash
# Install dependencies
npm install

# Start Expo Go (mobile) or Web server
npx expo start

# Deploy Edge Function (when admin features are updated)
npx supabase functions deploy course-import
```

## Environment Variables

Create a `.env` file at the project root (see `.env.example`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Supabase Edge Function secrets (Supabase Dashboard → Edge Functions → Manage secrets):

```bash
GOOGLE_AI_API_KEY=<YOUR_GOOGLE_AI_API_KEY>   # Free from Google AI Studio
```
