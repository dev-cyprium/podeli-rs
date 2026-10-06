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

## Activity logs and Trello

- Keep technical analysis, implementation notes, decisions, command results, and discussion history in `logs/YYYY-MM-DD.md`. Append to an existing daily log rather than overwriting it.
- Trello cards must be understandable to non-programmers: a concrete task title, a short description, and a few observable completion criteria.
- Keep ticket status concise and current. Do not append chat transcripts, old descriptions, code-level details, or test output to cards; preserve that history in the daily log.

## Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
