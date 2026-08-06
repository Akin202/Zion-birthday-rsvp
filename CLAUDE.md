# RSVP Website — Zion's 7th Birthday

## What this is

An RSVP website for a children's birthday party, built by FlagIQ for Saidat Awolowo,
an event producer in Lagos. ~150 invited households, ~200 headcount, event
October 18th 2026.

The visual layer was generated in **Google AI Studio** and is largely finished.
Work in this repo is the engineering: database, data flow, auth, email,
performance, deployment.

## The actual product

Two audiences, two jobs:

1. **Guests (parents)** open a WhatsApp link on a mid-range Android phone and fill
   an RSVP form. This must be fast, frictionless, and beautiful.
2. **The client** uses the admin area — and critically, on event day her staff stand
   at the venue door with a phone, search a guest's name, and see instantly how many
   children and nannies that guest declared. Extras get turned away. **The door
   check-in tool is the highest-stakes screen in the app.**

## Stack — read this before assuming

This is a **Vite + React 19 SPA**. It is *not* Next.js. Earlier planning documents
in this project's history assumed Next.js App Router; that was never what got built.
Do not reach for server actions, `app/layout.tsx`, middleware, `next/font`,
`next/image`, or the Metadata API — none of them exist here.

- Vite 6, React 19, TypeScript, Tailwind CSS v4 (via `@tailwindcss/vite`)
- `react-router-dom` v7, declarative `BrowserRouter` mode
- Framer Motion (`motion/react`) — always via `LazyMotion` + `m`
- Supabase: Postgres, Auth, RLS, Realtime, Edge Functions
- Resend for email
- Deployed on Vercel as a static SPA (`vercel.json` rewrites all paths to `index.html`)

Entry point is `index.html` → `src/main.tsx` → `src/App.tsx`. Everything else lives
in top-level `app/`, `components/`, `lib/`, `config/`, `types/`, `hooks/` — `src/`
holds only those three entry files.

### Where server-side logic goes

There is no Node server. Anything that must not be client-trusted goes in a
**Supabase Edge Function** (`supabase/functions/`):

- Server-side re-validation, phone normalisation, headcount computation
- RSVP deadline enforcement
- Rate limiting
- Resend email dispatch

`SUPABASE_SERVICE_ROLE_KEY` lives only in Edge Function secrets. It must **never**
appear behind a `VITE_` prefix — that prefix bundles the value into public JS.

## Contracts — do not break these

- `types/rsvp.ts` — the data model. The Supabase schema must match it exactly.
  **The types are the contract; the schema conforms to them, not the reverse.**
  Change the types only with a deliberate reason, and update the schema in the
  same commit.
- `config/event.config.ts` — every event-specific string, colour, and asset path.
  **Never hardcode an event detail into a component.** This file is what makes the
  build resellable to the next client.
- `lib/data-access.ts` — the only seam between UI and database. Components call
  these functions. Replace the bodies with real Supabase queries; do not change
  the signatures.

## Conventions

- `// TODO(claude-code):` marks every spot where real logic belongs. Grep for them.
- Presentational components stay pure — props in, JSX out. Data fetching lives in
  `lib/data-access.ts`, never in a UI component.
- The admin area is deliberately **not** comic-themed. It's a clean business tool —
  the client explicitly said spreadsheets felt unprofessional. Don't "improve" it
  toward the party aesthetic.
- Admin routes are lazy-loaded in `src/App.tsx`. Keep them that way: recharts alone
  is ~404 KB and must never land in the guest bundle.

## Hard constraints

- **Mobile first.** Guests are on mid-range Androids over patchy Nigerian mobile
  data. Target LCP under 2.5s on throttled Slow 4G.
- **Privacy is contractual.** The end client refused to share her guest list because
  she was worried about contact data being misused. Guest data must never be
  publicly readable. RLS: `anon` can INSERT, and SELECT only a single row by
  `edit_token`. No public table reads, ever. Admin reads go through Supabase Auth
  as `authenticated`.
- **Accessibility:** WCAG AA. 4.5:1 body text, 3:1 large text and UI borders.
  Never communicate state by colour alone.
- **Motion:** animate only `transform` and `opacity`. Every animation wrapped in
  the `useReducedMotion` check (`hooks/useReducedMotion.ts`).
- **IP:** no Marvel, DC, Spider-Man, or Batman names, logos, characters, or
  costumes anywhere in code, comments, copy, or generated assets. Comic-book style
  via generic conventions only — halftone dots, speech bubbles, bold ink outlines,
  speed lines, generic bursts (POW / ZAP / BOOM). One "Gotham" reference was already
  caught and removed; re-grep before shipping copy.

## Commands

```bash
npm run dev            # local dev on :3000
npm run lint           # tsc --noEmit
npm run build          # must pass before any commit
npm test               # vitest unit tests
npm run test:coverage  # coverage report
npm run test:e2e       # playwright
npx supabase db push   # apply migrations
```

## Git

The remote must be an aliased SSH host, not bare `github.com`. This project belongs
to the `Akin202` (FlagIQ) GitHub identity → `github-akin202`. Confirm before pushing.

## Current state

**Phase 0 complete.** Build and typecheck are green, the duplicate `src/` stub tree
and all Google AI Studio residue are gone, routing is real (`react-router-dom` with
lazy admin chunks), and Vitest + Playwright are wired with 51 unit tests and 9 E2E
smoke tests passing.

Still rendering from `lib/mock-data.ts` through the `lib/data-access.ts` seam —
**no backend exists yet.** Next: Supabase schema, RLS, and live RSVP submission.

A visual redesign is planned but deferred; the client has not yet supplied the new
direction. Build against the current comic-book UI — components are pure
presentational, so reskinning later won't disturb the data layer.
