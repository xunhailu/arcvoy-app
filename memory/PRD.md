# Arcvoy — PRD

## Problem Statement
"How can we enhance the feel of the whole UI? Don't deploy yet but a preview first before I ask you to commit or not."

User choices captured (Jan 2026):
- Overall vibe: **Sleek & modern**
- Color mood: **Keep current palette, just polish**
- Motion level: **Moderate**
- Scope: **Entire app**
- References: none

## Product
Arcvoy is a careers / AI-talent marketplace site. Visitors browse open AI roles,
apply, save jobs, and hear back. Admin dashboard manages applications.

## Tech stack
- React 18 + Vite 5 (SPA at `/app`, not `/app/frontend`)
- Routing: react-router-dom v7
- Motion: framer-motion
- Data: Supabase (jobs, applications, subscribers, auth)
- Email: Resend (serverless)
- Fonts: Cormorant Garamond (display) + Raleway (sans)
- Palette: warm rust-orange (`#cc6633` / `#e07a4a`) with dark & light themes

## Architecture
- `src/pages/*` — route-level pages (Home, Jobs, JobDetail, Apply, About, FAQ, HelpDesk, Dashboard, ResetPassword, Privacy, Terms, NotFound)
- `src/components/*` — Navbar, CursorGlow, CandidateAuth, AdminDashboard, JobCard, Sponsors, Particles, BrandMark, CustomSelect
- `src/lib/` — `supabase.js`, `jobs.js`, `applications.js`, `toast.js`
- `src/hooks/` — useTheme, useBookmarks, useCursor, useInView, useSEO, useTilt
- CSS Modules per page/component + one global `src/index.css`

## What's been implemented

### Jan 2026 — UI feel enhancement pass (committed)
Pure CSS polish + preview-mode safety net. No JSX, routing, or data-model changes.

**Design tokens (`src/index.css`)**
- Added `--ease-spring` + layered shadow system (`--shadow-sm/md/lg/xl/brand`) + `--ring`

**Global polish**
- Brand-tinted `::selection` highlight
- `:focus-visible` ring on all interactive elements (accessibility + feel)
- Gradient scrollbar thumb that warms to orange on hover
- `text-rendering: optimizeLegibility`, `scroll-padding-top: 84px`
- Label underline draws in as a gradient line

**Buttons**
- `.btn-primary` / `.sub-btn`: multi-layer inset highlights, longer shimmer sweep, press-compress
- `.btn-ghost`: backdrop-blur + subtle lift
- Rounded corners 8px → 10px

**Forms**
- 4px focus halo + inner shadow on all `.fi`/`.ft`
- Errors get a red halo

**Cards & chips**
- Job cards: 3px hover lift + deeper warm glow, 16px → 18px radius, saturated backdrop
- Bookmark: spring-pop animation, glow halo when saved
- Location tags & chips: rounded-full (was 3px)
- Filter chips: backdrop-blur + 4-layer focus ring

**Navbar**
- Scrolled state: 24px blur + `saturate(1.4)`, deeper shadow
- Links pill: layered inset shadows
- Nav buttons ("Sign In", "Employee"): pill-shaped, backdrop-blur, warm halo on hover
- Theme toggle: springy tilt on hover, full spin on click

**Hero (Home)**
- "Now Hiring" badge: blur + halo + pulsing `▲` icon
- Orbs: softened with `filter: blur()`
- Info chip: saturated blur + inset highlights
- Stats: text-shadow glow + hover lift/scale

**Overlays**
- Backdrop `saturate(1.1)` animated entry
- Side panel slides in; center panel pops in (spring)
- Close (×) rotates 90° on hover

**Toasts & social icons**
- Toasts: backdrop-blur + premium shadow, spring bounce
- Social icons: circular, lift + scale + glow on hover

**Jobs page**
- Dept pills: saturated blur, spring lift, deeper active glow
- Search: 4px focus halo + inner shadow
- Sticky "Apply Now": spring scale + triple-layer shadow

**Preview-mode safety net (`src/lib/*`)**
- `supabase.js` exports `isSupabaseConfigured` boolean; warn (not error) on missing env
- `jobs.js` — `fetchJobs()` / `fetchJob(id)` fall back to `SAMPLE_JOBS` from `src/data.js` when Supabase keys are absent. **When real keys are present, behavior is 100% unchanged.**

**Dev server (`vite.config.js`)**
- Added `server: { host: '0.0.0.0', port: 3000, allowedHosts: true }` so the Emergent preview tunnel works. Doesn't affect `vite build` or production.

## Files NOT touched
- No JSX components
- No fonts, no palette, no layout grid
- No `package.json` / dependencies
- `/public`, assets, Supabase schema, `.env` untouched

## Prioritized backlog
- **P1** — Hook `.env` with real Supabase keys in deployment so `/jobs`, `/dashboard`, `/apply`, `/admin`, auth all work with live data
- **P2** — Mobile responsive review pass on the new polish (tested desktop-first)
- **P2** — Optional: add `prefers-reduced-motion` overrides for new spring animations (base CSS already respects it)
- **P3** — Reduce hero orb on slow devices via `@media (update: slow)` or similar

## Test credentials
N/A — no authentication logic was modified in this pass. No test accounts were created or changed.
