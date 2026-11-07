# Japan Trip Companion — conventions

Phone-first offline web app for a Japan trip. Public demo and friends' prototype: `data/sample/trip.json` is a 20-day itinerary (Oct 22–Nov 10, 2026) with real hotel names and addresses. Content notes: `context/`.

## Public repo rules

- **This repo and site are public.** Commit nothing confidential: no booking or confirmation numbers, reservation names, prices paid, tokens or keys, and no personal names. The one real itinerary allowed is the prototype in `data/sample/trip.json`: hotel names, addresses and front-desk numbers only.
- The sync token lives only on the phones (localStorage). Never in source, the build, the workflow or a test fixture.
- Souvenir recipients and purchases live only on the phones (and, if sync is on, in the private repo named by `VITE_DATA_REPO`).
- `data/sample/trip.json` is sample data. `tests/unit/trip.test.ts` fails the build on anything outside the schema or anything that looks like a booking number, price, token or clock time. Don't loosen it; fix the data.
- Real itineraries go in `data/local/` (see Data below). It is gitignored here, and `tests/unit/data-local.test.ts` fails if any of it is tracked.

## Public-only features (never port to `japan-trip-tools`)

Changes here are often copied into the private `japan-trip-tools`. These belong to this repo only; leave them out of any port:

- **Feedback form and relay** (bottom of More): `src/lib/feedback.ts`, `src/lib/feedbackIssue.ts`, `src/components/Feedback.tsx`, `worker/feedback/`, `tests/unit/feedback.test.ts`, the feedback test in `tests/e2e/app.spec.ts`, the `<Feedback />` line in `src/routes/More.tsx`, the `VITE_FEEDBACK_URL`/`VITE_TURNSTILE_SITE_KEY` lines in `.github/workflows/deploy.yml` and `playwright.config.ts`, and `"worker"` in `tsconfig.json`. Notes become public issues on `mdigirol/japan-trip-tools-public`, so in the private app they would publish real trip details. Guards: the form renders only when the base path is `/japan-trip-tools-public/`, and `tests/unit/feedback.test.ts` fails in a repo with any other package name.
- **Storage names** (`src/lib/storageNames.ts`, `tests/unit/storage-names.test.ts`, and the imports of it in `src/lib/settings.ts`, `src/lib/db.ts`, `src/lib/feedback.ts` and `vite.config.ts`). Both apps share the origin `https://mdigirol.github.io`, and localStorage, IndexedDB and Cache Storage are scoped by origin, so this repo prefixes every name with `jtc-public-`. The private app keeps its own names (`jtc-settings-v1`, the `companion` database, the `rates`/`weather`/`overpass` caches); renaming them there would lose its phones' saved data.
- **BETA label**: the `main h1::after` rule in `src/styles.css` (a BETA pill after each screen title), and "BETA" in the `<title>` and `apple-mobile-web-app-title` in `index.html` and in the manifest `name`/`short_name` in `vite.config.ts`, and the amber BETA ribbon across the top-left corner of the icons (`scripts/make-icons.mjs`, `public/icons/`). It tells this demo apart from the private app on a phone.
- **Prototype itinerary**: `data/sample/trip.json` (the friends' Oct 22–Nov 10 trip and its seven hotels), the area tips it added in `src/data/places.ts`/`context/places.md`, and the sample-date expectations in `tests/unit/trip.test.ts`, `today.test.ts`, `jma.test.ts` and `tests/e2e/app.spec.ts`. Never copy it into `japan-trip-tools`, which keeps its own sample and its real trip in `data/local/`. (The old "SAMPLE ITINERARY" banner was removed, so there is nothing of it to port.)
- The relay is a Cloudflare Worker (`worker/feedback/README.md`). Its GitHub token is a Cloudflare secret only. `FEEDBACK_URL` and `TURNSTILE_SITE_KEY` are public repo variables, not secrets. Pushing to `main` doesn't deploy the Worker; run `npx wrangler@4 deploy` in `worker/feedback/`.

## Content

- American English in UI copy, comments and docs.
- Every content item carries `source` tags (`N`, `K`, `T`, `I`, `V`, `JNTO`; see `context/README.md`).
- Safety-relevant `[V]` facts (emergency numbers, tax-free rules, transit rules) need an official `sourceUrl` before the freeze (Nov 8). Phone numbers are verified before the trip; set `verified: true` only with an official URL.
- All Japanese ships as a draft, `reviewed: false` (D9). `npm run review-sheet` exports it; `npm run review-import` applies the native speaker's corrections. Dev builds show an amber dot on unreviewed strings.
- Copyright: never paste text from the purchased guides. Paraphrase only. The guides stay in Dropbox.
- No flashcards (D4). No shared favorites (D6).
- UI copy: short, plain, specific. One idea per line on cards.

## Data

- The app reads `data/local/trip.json` and `data/local/konbini-near-stops.json` when `data/local/trip.json` exists, otherwise `data/sample/`. Files are never mixed. Code imports them as `@data/<file>` (`scripts/build-env.ts`).
- `data/local/` is untracked in this repo. A repo that deliberately tracks its own itinerary there (a personal companion that merges this one) opts in by committing an empty `data/local/.tracked-ok`.
- Scenario tests (Today, content, konbini) and the e2e build always use `data/sample/`, so they pass in any repo. `tests/unit/trip.test.ts` checks both the sample and the active data.
- Optional build-time settings, set in a `.env` file or the environment: `VITE_DATA_REPO` (turns purchase sync on), `VITE_ITINERARY_URL` (shows "Open this day in the itinerary" on Today) and `VITE_SHOPPING_URL` (where-to-buy suggestions on To buy, from `worker/shopping/`). Public repo only: `VITE_FEEDBACK_URL` and `VITE_TURNSTILE_SITE_KEY` (the feedback relay).
- The base path is the repo name on Pages (`GITHUB_REPOSITORY`), else the folder name. Override with `BASE_PATH`.

## Code

- Vite + TypeScript + Preact, plain CSS with custom properties (`src/styles.css`). No CSS framework, no web fonts.
- Hash routes (`#/phrases?tab=bar`), one file per module in `src/routes/`. Register new tools in `src/lib/modules.ts` (`ready: true` shows the tile).
- All date logic goes through `src/lib/now.ts` (Asia/Tokyo). `?now=2026-11-21T08:00%2B09:00` overrides the clock.
- Today's logic lives in `src/lib/trip.ts` (`todayState`). Today shows no stop names or times from the itinerary.
- Storage: IndexedDB via `src/lib/db.ts` (purchases, photos, sync queue, API cache); `localStorage` via `src/lib/settings.ts` (try/catch).
- Sync (`src/lib/sync.ts`): pull, merge (last write wins by `updatedAt`), then push the queue. Photos never sync.
- To buy (`src/lib/wants.ts`): per phone only, never synced. Each item is looked up once through the `worker/shopping` relay (Claude) and the answer is saved on it. Pending items retry on add, app start, coming online, returning to the foreground, and every 5 minutes while open. The Worker's Anthropic key is a Cloudflare secret only.
- Service worker: `vite-plugin-pwa` (generateSW) in `vite.config.ts`. Live APIs (rates, weather, Overpass) are network-first with cache fallback; GitHub is never cached.
- Every phone-facing screen must work at 375 px wide, in both themes, with the network off. Tap targets ≥ 44 px.

## Commands

- `npm run dev` — dev server at http://localhost:5173/japan-trip-tools-public/
- `npm test` — Vitest on the sample itinerary (logic, content schemas), plus trip.json confidentiality on the sample and the active data
- `npm run test:e2e` — Playwright against a production build of the sample itinerary in `dist-e2e/` (offline, `?now=` scenarios, cards, claim log)
- `npm run build` — typecheck and build to `dist/`
- `npm run build-konbini` — refresh the offline konbini list from Overpass (writes next to the active `trip.json`)
- `npm run review-sheet` / `npm run review-import` — the Japanese review round trip

## Deploys

- Push to `main` → GitHub Actions runs the tests, builds, and publishes to Pages. No secrets in the workflow.
