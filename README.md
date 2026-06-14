# CalledIt

Settle the bet. See who actually calls it.

A shared prediction board for a group of friends or coworkers. Someone posts a claim ("Our launch slips past Friday", "Lakers win tonight", "It rains at the picnic"). Everyone logs how likely they think it is. When it resolves, CalledIt scores everyone and updates a **leaderboard that ranks who's the sharpest forecaster** — not who got lucky, but who's actually *calibrated* (Brier score). Optional friendly stakes settle up automatically. No accounts — a board lives at a share link.

## Why this exists (the wedge)

Bet/wager apps (WagerLab, FinalCall, Poll) track *money won and lost*. None answer the question every friend group actually argues about: **"who's right most often?"** CalledIt makes that objective and fun — a running scoreboard of who calls it. The social loop (post a claim → friends forecast → resolve → leaderboard + bragging rights) gives people a real reason to come back, which a solo prediction journal never had.

## Architecture

- **Backend** — FastAPI, layered: `api/` routers, `services/` (board/prediction/forecast store, scoring engine), `core/` config + db, `schemas/` Pydantic v2. Storage aiosqlite. Stdlib + aiosqlite only, no external paid APIs.
- **Frontend** — BUILDLESS (deploy sandbox has no node/npm; NEVER run a build step). `frontend/index.html` + `frontend/app.js` + `frontend/styles.css`. Tailwind via CDN play script + inline `tailwind.config` for the tokens below; Google Fonts; **Chart.js via CDN** for the per-member calibration sparkline; vanilla JS `fetch()` to the API. FastAPI mounts frontend dir as `StaticFiles(html=True)` at `/`.
  - CRITICAL (learned the hard way, do NOT repeat): asset tags reference ROOT paths (`/app.js`, `/styles.css`), NOT `/frontend/app.js` (StaticFiles serves the dir AT `/` → `/frontend/...` 404s → dead page). Apply bg/font on `<body>` via Tailwind CLASSES, not a `<style>` block of class-name values. Script must init after DOM ready (defer / DOMContentLoaded). Every tag well-formed.

## Identity model (no accounts — keep it dead simple)

- A **board** is created with a title → server returns a `code` (short, shareable, e.g. 6 chars) and the board URL `/{code}`. Anyone with the link can view + participate.
- **Members** are just names added to a board (no login). A visitor picks "who am I" from the member list (stored in localStorage) or adds themselves. Trust-based, like a shared poll/scoreboard pad. (Document this as an explicit MVP simplification.)

## Scoring (reuse HunchLog's math — it's proven)

- A member's forecast on a resolved prediction: stated probability `p` (0..1), outcome `o` (1 happened / 0 not). **Brier contribution** = `(p − o)²`.
- A member's **Brier score** = mean of their `(p−o)²` over resolved predictions they forecasted. Lower = better. Friendly label: ≤0.1 "oracle", ≤0.2 "sharp", ≤0.35 "decent", >0.35 "wishful".
- **Leaderboard**: rank members by Brier ascending (best caller first); show n (predictions scored), accuracy (% where their side — p>0.5 — matched outcome), and net stake (+/−) if stakes used. A member needs ≥3 resolved forecasts to get a rank (else "needs more calls").
- **Per-member calibration** (deciles, same as HunchLog) available for a sparkline. Compute server-side in `services/scoring.py`. Port the Brier/decile logic from the hunchlog repo (github.com/AgentSpore/hunchlog, src/hunchlog/services/scoring.py) — same formulas.

## Data model (sqlite)

- `boards(id, code UNIQUE, title, created_at)`
- `members(id, board_id, name, created_at)`
- `predictions(id, board_id, claim, resolve_by DATE, stake REAL DEFAULT 0, status['open'|'resolved'], outcome INTEGER NULL, created_at, resolved_at NULL)`
- `forecasts(id, prediction_id, member_id, probability REAL (0..1), created_at)`  — one forecast per member per prediction (upsert)

## API (under /api/v1, no auth, CORS open, NO trailing-slash collection routes — exact paths like `/boards`, `/boards/{code}/predictions`)

- `POST /api/v1/boards` `{title}` → `{code, title, ...}`
- `GET /api/v1/boards/{code}` → board + members + predictions (each with forecasts, derived `due` flag, and for resolved ones each member's brier contribution)
- `POST /api/v1/boards/{code}/members` `{name}` → member
- `POST /api/v1/boards/{code}/predictions` `{claim, resolve_by, stake?}` → prediction
- `PUT /api/v1/predictions/{id}/forecast` `{member_id, probability}` (accept 0..1 or 0..100, normalize; upsert) → forecast
- `PATCH /api/v1/predictions/{id}/resolve` `{outcome: bool}` → resolved; triggers re-score
- `DELETE /api/v1/predictions/{id}`
- `GET /api/v1/boards/{code}/leaderboard` → `[{member, brier, label, n, accuracy, net_stake, rank}]` (ranked; unranked members listed with rank null + "needs more calls")
- `GET /api/v1/boards/{code}/members/{member_id}/calibration` → decile points for the sparkline
- `GET /api/v1/health`

## UX / UI spec (THIS is the bar — fun, social, satisfying; not a dull form)

**Design language:** lively but clean — "friendly competition." Confident, a little playful (this is about friends + bragging), but still crisp and trustworthy. One strong accent + a celebratory "called it!" moment on resolve.

**Design tokens** (inline `tailwind.config`):
- `bg` `#0E1525` (deep indigo-night) with `surface` `#16213A`, `surface-2` `#1E2B47`, `ink` `#F1F5FB`, `muted` `#93A1C0`, `border` `#2A3A5C`. (A confident DARK board — feels like a scoreboard/arena. If a dark theme proves hard to make legible, fall back to a clean light theme, but prefer dark.)
- Accent `brand` `#F59E0B` (amber — the "spotlight") with `brand-2` `#FBBF24`. Outcome: `hit` `#34D399` (it happened), `miss` `#FB7185` (it didn't), `pending` `#FBBF24`. Leaderboard medals: gold `#FBBF24`, silver `#CBD5E1`, bronze `#D9A066`.
- Typography (Google Fonts): display/headings **"Clash Grotesk" or "Sora"** (700, punchy), body **"Inter"**, numbers/scores **"JetBrains Mono"**. Hero 40/48, h2 24/30, body 15/24, score 28/32 mono.
- Radius 16px cards, 10px controls. Glow shadow on the leaderboard top spot. 8-pt spacing.

**Screens / states**
1. **Landing** (no board yet) — punchy hero "Who actually calls it?" + one-line pitch, a single "Create a board" input (title) → on submit, go to the board and show a **copyable share link** ("Send this to your friends"). A tiny "join with a code" field.
2. **Board** (the home of the product) — header: board title + share link + the member chips (with "you are: ___" picker). Three zones:
   - **Leaderboard** (hero of the board): ranked members with medal for top 3, big mono Brier + label ("oracle"/"sharp"/…), n calls, accuracy %, net stake. Top spot glows. Empty/early state: "Make 3 calls each to rank."
   - **Open predictions**: each claim card shows resolve-by, who's forecasted (avatars/initials + their %), and — if *you* haven't forecasted — an inline **probability slider** to drop your call (the satisfying input, live mono readout + verbal hint). DUE ones are highlighted amber with a "Resolve" action (any member can resolve: "It happened" / "It didn't").
   - **+ New claim**: modal — claim textarea (placeholder "We ship before Friday"), resolve-by date, optional stake amount, submit.
3. **Resolve moment** — when a prediction resolves, a brief celebratory micro-interaction: the people who called it right flash `hit`-green, the leaderboard re-ranks with a smooth reorder animation, and a toast "Sarah called it 🎯". This is the dopamine that brings people back.
4. **Member detail** — a small panel/sparkline (Chart.js) of that member's calibration + their record.
5. **Loading** skeletons; **errors** inline + human.

**Interaction quality**
- The probability slider (drop your call) + the animated leaderboard re-rank are the signature delights. Smooth 150–250ms transitions, amber focus rings, the top-spot glow. Fully responsive 360→1280 (leaderboard becomes a stacked list on mobile, slider thumb thumb-friendly, share link easy to copy). `prefers-reduced-motion` respected. Status always icon+text+color (a11y). Lighthouse a11y ≥ 95.

## Seed (so a fresh visitor sees a living board)

On startup, if no boards exist, seed ONE demo board (code `DEMO01`, title "Friday Crew") with 4 members (Sam, Maya, Leo, Pri) and ~10 predictions: ~7 resolved with everyone's forecasts (make them differ — Maya consistently sharp/calibrated, Leo over-confident, so the leaderboard has a clear, fun ranking) + 3 open, one already **due** (so the resolve loop is demoable on first visit). Idempotent. The landing page can link to "see a demo board" → `/DEMO01`.

## Success Criteria

- Create a board → get a share code; add members; post a claim; each member drops a probability; resolve a due one → leaderboard re-ranks and the per-member Brier updates correctly.
- `GET /boards/DEMO01/leaderboard` returns a ranked list where the deliberately-sharp member is #1 and the over-confident one is lower — math correct (port HunchLog's Brier/decile).
- The frontend is a genuinely polished, fun board implementing the UX spec — leaderboard with medals, inline probability slider to drop a call, the celebratory resolve re-rank, share link, responsive + accessible — NOT a raw form or JSON page. Assets load from `/` (no `/frontend/...` 404), JS runs, `GET /api/v1/health` → 200.
- No account, no external paid API, no build step; single `uvicorn` process serves API + static frontend.
