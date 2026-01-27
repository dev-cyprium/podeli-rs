# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start Next.js dev server (binds to 0.0.0.0)
- `npx convex dev` - Start Convex dev server (must run alongside Next.js dev)
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check (`tsc --noEmit`)
- `npm run check` - Lint + typecheck combined

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Shadcn/UI (New York style)
- **Backend:** Convex (serverless functions, database, file storage)
- **Auth:** Clerk (JWT-based, integrated via `ConvexProviderWithClerk`)
- **Language:** Serbian - all UI text, route names, and user-facing strings are in Serbian

## Architecture

### Frontend (Next.js App Router)

Pages use server components with `preloadQuery()` for Convex data, passing preloaded data to client components via `usePreloadedQuery()`. Client components use `useQuery()` for reactive subscriptions and `useAction()`/`useMutation()` for writes.

The provider chain is in `components/ConvexClientProvider.tsx`: Clerk wraps Convex, providing JWT auth to all Convex functions.

Route structure uses Serbian names:
- `/p/[shortId]/[slug]` - Item detail (public)
- `/pretraga` - Search results
- `/kontrolna-tabla` - Dashboard (protected)
- `/kontrolna-tabla/predmeti` - My items
- `/kontrolna-tabla/predmeti/novi` - New item wizard
- `/kontrolna-tabla/zakupi` - My bookings
- `/kako-funkcionise` - How it works

Components are organized by feature in subdirectories under `components/` (e.g., `components/p/`, `components/search/`, `components/kontrolna-tabla/`, `components/booking/`). Shadcn/UI primitives live in `components/ui/`.

### Backend (Convex)

All backend logic is in the `convex/` directory. Key files:
- `schema.ts` - Database schema (items, bookings, reviews, notifications)
- `items.ts` - Item CRUD, search, image URL generation
- `bookings.ts` - Booking lifecycle with date overlap detection
- `reviews.ts` - Review system with rating aggregation
- `clerk.ts` - Clerk user profile fetching via action

### Convex Conventions (from `.cursor/rules/convex_rules.mdc`)

- Always use the new function syntax with `args`, `returns`, and `handler`
- Always include return validators (use `v.null()` for void functions)
- Use `internalQuery`/`internalMutation`/`internalAction` for private functions
- Never use `.filter()` in queries - use `.withIndex()` instead
- Use `ctx.db.patch()` for partial updates, `ctx.db.replace()` for full replacement
- Actions cannot access `ctx.db` - call queries/mutations via `ctx.runQuery`/`ctx.runMutation`
- File storage uses `v.id("_storage")` for storage IDs and `ctx.storage.getUrl()` for signed URLs
- Index names should reflect all fields (e.g., `by_field1_and_field2`)

### Database Schema

Four tables: `items`, `bookings`, `reviews`, `notifications`. User IDs are Clerk subject strings (stored as `v.string()`, not `v.id()`). Items use `shortId` + `slug` for URL routing. Full-text search is on the `searchText` field of items with category filtering.

Booking statuses flow: `pending` -> `confirmed` -> `active` -> `completed` (or `cancelled`).

### Auth Pattern

Convex functions enforce auth by calling a `requireIdentity()` helper which uses `ctx.auth.getUserIdentity()`. The user ID is `identity.subject` (Clerk user ID string).

## Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).
