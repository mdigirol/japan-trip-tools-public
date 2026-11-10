# Japan Trip Companion (public demo)

> **Retired.** This demo is no longer online, and development continues in a private repo. The code is kept here as is. Pages served a retirement page and a kill-switch service worker (`retired/`) to clear installed copies; to bring the app back, revert the deploy step in `.github/workflows/deploy.yml`.

A phone-first, offline web app for a trip to Japan: what to say, do, or pay, right now.

This is a public copy for testing. The itinerary in `data/sample/trip.json` is a 20-day prototype trip for friends (Tokyo → Hakone → Kyoto → Osaka → Kiso Valley → Tokyo, Oct 22–Nov 10, 2026), with its seven real hotels. Day plans are suggestions.

## Try it

```bash
npm install
npm run dev          # http://localhost:5173/japan-trip-tools-public/
```

The app follows the trip's dates, so add `?now=` to any URL to pick a moment:

- `?now=2026-10-23T18:00%2B09:00` (first night in Tokyo)
- `?now=2026-10-29T10:00%2B09:00` (travel day to Hakone, before check-in)
- `?now=2026-11-02T08:00%2B09:00` (Kyoto)
- `?now=2026-11-10T08:00%2B09:00` (flying home)

To install on an iPhone: open the site in Safari while online, Share → **Add to Home Screen**, then open it once from the home screen. Settings shows **Ready for offline ✓** when the cache is full.

## What's in it

| Tool | What it does |
| --- | --- |
| Today | Date and city, weather, today's neighborhoods with tips, tonight's hotel taxi card, suggestions |
| Phrases | Situation tabs, search, tap to hear, hold for full screen, fill-in slots, stars |
| Show cards | Hotel taxi cards from `trip.json`, dining, bath and other cards; screen stays awake |
| Etiquette | Do/don't cards by place type and area, must-first |
| Currency | Live rate (cached), manual override, quick table, calculator with 税込/税抜, units |
| Emergency | Tap-to-call numbers, ambulance card with tonight's hotel, earthquakes, pharmacy |
| Purchases & tax refund | One purchase store: by person (for us or gifts), tax refund log by bag, departure-day customs checklist |
| Konbini | Offline list near each day's areas and hotel; live "near me" |
| Signs & menus, Transit, Numbers, Shopping guide | Reference |

All Japanese is a draft that hasn't had a native-speaker review yet. Dev builds show an amber dot on unreviewed strings.

## Use your own trip

Put your own stays and days in `data/local/trip.json`. The app uses it instead of the sample when it exists, and `data/local/` is gitignored so your plans stay out of commits. `tests/unit/trip.test.ts` checks it against the schema in `src/data/schema.ts` and rejects anything that looks like a booking number, price or token. Then run `npm run build-konbini` to write an offline konbini list for your stops next to it.

To deploy your own copy with your data, commit `data/local/` to your fork (`git add -f data/local`) along with an empty `data/local/.tracked-ok`, which tells the leak guard that this is deliberate.

Set `VITE_ITINERARY_URL` (for example in a `.env` file) to add an "Open this day in the itinerary" link on Today.

## Optional: sync purchases between two phones

Sync is off unless you build with `VITE_DATA_REPO=owner/repo`. It stores purchases as GitHub Issues in that (private) repo:

1. Create a private repo and add the labels `souvenir`, `taxfree` and `deleted`.
2. Create a fine-grained token limited to that repo with **Issues: Read and write**.
3. Paste the token into Settings on each phone. It stays in that phone's storage only.

Photos never sync.

## Feedback

The bottom of **More** has a feedback form: pick Bug, Idea or Wrong info, type a note, tap **Send**. A small Cloudflare Worker files it as an issue on this repo, so testers never need GitHub. Notes written offline wait on the phone and send once it's back online with More open. Setup is in [`worker/feedback/README.md`](worker/feedback/README.md). Until the relay is set up, the form opens a prefilled GitHub issue instead.

The form is specific to this public demo and isn't part of the private app.

## Develop

```bash
npm test             # Vitest
npm run test:e2e     # Playwright (builds and serves the production bundle)
npm run build        # typecheck and build to dist/
npm run build-konbini
npm run review-sheet # Japanese strings → review/japanese-strings.csv
```

Conventions are in `CLAUDE.md`.
