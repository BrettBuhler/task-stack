# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm start` — Run production server

No test framework is configured.

## Architecture

Task Stack is a task management app built with **Next.js 16** (App Router), **React 19**, **TypeScript**, **Supabase** (auth + Postgres), and **Tailwind CSS v4**.

### Key Layers

- **Pages** (`src/app/`): App Router with `layout.tsx` root, routes for `/login`, `/signup`, `/settings`, `/markdown`, and `/api/send-digest`. Home page renders the `TaskStack` component.
- **Components** (`src/components/`): Client components (`'use client'`). `TaskStack` is the main orchestrator — manages task list with drag-and-drop (@dnd-kit). `TaskCard` handles individual tasks with status cycling (todo → in_progress → done). `FollowUpChecker` polls every 30s for due reminders.
- **Hooks** (`src/hooks/`): `useTasks` for task CRUD + optimistic reordering, `useFollowUps` for reminder management + polling.
- **Lib** (`src/lib/`): `supabase.ts` creates browser/server/middleware clients. `auth.ts` wraps Supabase Auth. `types.ts` has all interfaces. `notifications.ts` wraps Browser Notifications API. `markdown.ts` converts tasks to GitHub-flavored markdown.
- **Middleware** (`src/middleware.ts`): Protects all routes except `/login` and `/signup`; redirects authenticated users away from auth pages.

### Data Flow

Components → custom hooks → Supabase client → Postgres (with RLS). No external state library — just React useState + custom hooks.

### Database

Schema defined in `supabase-schema.sql` and `supabase-cron.sql`:
- **tasks**: id, user_id, title, description, status, priority, sort_order, timestamps
- **follow_ups**: id, task_id, user_id, title, due_date, notified
- **email_preferences**: user_id, enabled, frequency, custom_cron, last_sent_at

### Email Digest

`/api/send-digest` is a serverless endpoint called hourly by Supabase pg_cron. Uses Resend API. Protected by `DIGEST_API_KEY`.

### Environment Variables

Required in `.env.local` (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Admin operations
- `RESEND_API_KEY` — Email sending
- `DIGEST_API_KEY` — Digest endpoint auth

## Conventions

- Components are PascalCase, hooks use `use` prefix, utilities are camelCase
- All types centralized in `src/lib/types.ts`
- Inline SVG icons throughout (no icon library)
- Dark cyberpunk theme: background #06060e, cyan (#00f0ff) and purple (#a855f7) accents
- Tailwind v4 theme configured inline in `src/app/globals.css` (not tailwind.config)
- Path alias: `@/*` maps to `src/*`
