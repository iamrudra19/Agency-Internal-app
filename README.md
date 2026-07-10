# Proxim Ops — Internal Agency Operations App

Command center for Proxim Systems: contacts, cold-outreach sequences, pipeline,
clients, and the Revenue Bridge™ that tracks progress toward the ₹1.5L/month target.

**Stack:** React 19 + TypeScript · Vite · TailwindCSS v4 · TanStack Router/Query/Table ·
Supabase (auth + Postgres + realtime) · Recharts · dnd-kit · framer-motion · sonner

## Getting started

```bash
npm install
cp .env.example .env   # already points at the live proxim-ops Supabase project
npm run dev
```

Sign in with your operator account (email/password auth via Supabase). New team
members can create an account from the login screen.

## Supabase

Project: `proxim-ops` (`msnmyeihtuneqtnfzqed`, ap-south-1 / Mumbai).
Schema lives in Supabase migrations (`initial_schema`, `seed_contacts`) — tables:
`contacts`, `deals`, `campaigns`, `outreach_sequences`, `daily_activity`, `tasks`,
`revenue_targets`, `app_settings`. All tables have RLS with full access for
authenticated users, and are added to the realtime publication so open tabs sync live.

## Pages

- **Dashboard `/`** — Revenue Bridge (funnel vs. required counts from conversion math),
  metric cards, Today's Action Queue (auto-generated from sequence day-gaps + due tasks),
  7-day sparklines.
- **Contacts `/contacts`** — searchable/filterable list, slide-over detail with outreach
  timeline, deals, tasks, notes; quick add / full add; CSV bulk import.
- **Pipeline `/pipeline`** — drag-and-drop kanban; won/lost prompts; weighted pipeline
  summary; list view on mobile.
- **Outreach `/outreach`** — one-row daily activity logger, sequence table with
  Day 0/3/7/14 visual timelines (PAS → BAB → AIDA → QVC), campaign manager with
  per-campaign stats, weekly/monthly report with deltas.
- **Clients `/clients`** — won deals as projects: status, payment progress, deliverables,
  project tasks.
- **Analytics `/analytics`** — Gap Calculator, 6-month revenue vs target, revenue by
  source/geography, funnel + time-in-stage, outreach volume/reply-rate charts,
  campaign comparison.
- **Settings `/settings`** — profile, target + conversion assumptions (drive the
  Revenue Bridge), sequence day gaps, CSV export, danger zone.

## Keyboard shortcuts

`N` new contact · `D` new deal · `T` new task · `/` focus search ·
`G then D/P/O/C/A/S` navigate to Dashboard/Pipeline/Outreach/Contacts/Analytics/Settings.

## Deploy

Static SPA — build with `npm run build`, deploy `dist/` to Vercel (`vercel.json`
included) or Netlify (`public/_redirects` included).
