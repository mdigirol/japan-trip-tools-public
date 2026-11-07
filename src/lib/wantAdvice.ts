// Shared by the app (src/lib/wants.ts) and the where-to-buy Worker (worker/shopping): the request limits,
// the prompt, and the shape of the answer. Keep it free of browser and Worker APIs.
import { z } from 'zod';
import type { TripFile } from '../data/schema';

export const ITEM_MAX = 120;
export const NOTE_MAX = 300;
export const AREAS_MAX = 80;
export const PLACES_MAX = 3;

// An area the answer can point at: a trip neighborhood slug (as in trip.json hoods) or a city id.
export interface Area { slug: string; name: string }

export const WantPlace = z.object({
  name: z.string(),   // store, chain or street, e.g. "Ippodo Tea, Kyoto main store"
  area: z.string(),   // one of the request's area slugs, or "anywhere"
  why: z.string()     // one short line
});
export const WantAdvice = z.object({
  summary: z.string(),
  places: z.array(WantPlace)
});
export type WantPlace = z.infer<typeof WantPlace>;
export type WantAdvice = z.infer<typeof WantAdvice>;

export interface LookupRequest { item: string; note?: string; areas: Area[] }

// Every city and neighborhood on the trip, cities first. The city ids match Place in schema.ts.
const CITY_NAMES: Record<string, string> = { tokyo: 'Tokyo', hakone: 'Hakone', kyoto: 'Kyoto', osaka: 'Osaka', nara: 'Nara', kiso: 'Kiso Valley', maihama: 'Maihama (Tokyo Disney)' };
export function tripAreas(trip: TripFile): Area[] {
  const out = new Map<string, string>();
  for (const d of trip.days) for (const p of d.places) if (CITY_NAMES[p]) out.set(p, CITY_NAMES[p]);
  for (const d of trip.days) for (const h of d.hoods) if (h.slug && !out.has(h.slug)) out.set(h.slug, h.name);
  return [...out].map(([slug, name]) => ({ slug, name })).slice(0, AREAS_MAX);
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');
const SLUG = /^[a-z0-9-]{1,40}$/;

// Checks and trims a request body. Returns null when it can't be used.
export function cleanRequest(b: unknown): LookupRequest | null {
  if (!b || typeof b !== 'object') return null;
  const r = b as Record<string, unknown>;
  const item = clip(r.item, ITEM_MAX);
  if (!item) return null;
  const note = clip(r.note, NOTE_MAX) || undefined;
  const areas = (Array.isArray(r.areas) ? r.areas : [])
    .map((a) => ({ slug: clip((a as Area)?.slug, 40), name: clip((a as Area)?.name, 60) }))
    .filter((a) => SLUG.test(a.slug) && a.name)
    .slice(0, AREAS_MAX);
  return { item, note, areas };
}

export const SYSTEM_PROMPT = `You help two American visitors on a trip in Japan find where to buy things on their shopping list.
For each item, name the best kinds of places to buy it in Japan: specific stores or chains, shopping streets, or markets.
Prefer places in the areas they are visiting, listed below. Name a well-known chain when it is the easy answer.
Say when an item is easy to find anywhere (konbini, drugstores, Don Quijote) or hard to find.
Mention tax-free when it matters, and any rule that affects bringing the item home to the US (liquids, knives, food).
Don't invent store names or addresses. If you aren't sure a specific store exists, name the type of store instead.
Write plain, short American English. The summary is one or two sentences. Give at most ${PLACES_MAX} places.
For each place, "area" must be one of the given area slugs, or "anywhere" when it isn't tied to one.`;

export function userPrompt(r: LookupRequest): string {
  const areas = r.areas.length ? r.areas.map((a) => `${a.slug}: ${a.name}`).join('\n') : '(none given)';
  return `Areas on the trip (slug: name):\n${areas}\n\nItem: ${r.item}${r.note ? `\nNote: ${r.note}` : ''}`;
}

// Trims an answer to what the app shows, and maps unknown areas to "anywhere".
export function tidyAdvice(a: WantAdvice, areas: Area[]): WantAdvice {
  const known = new Set(areas.map((x) => x.slug));
  return {
    summary: a.summary.trim().slice(0, 400),
    places: a.places.slice(0, PLACES_MAX).map((p) => ({
      name: p.name.trim().slice(0, 80),
      area: known.has(p.area) ? p.area : 'anywhere',
      why: p.why.trim().slice(0, 200)
    })).filter((p) => p.name)
  };
}
