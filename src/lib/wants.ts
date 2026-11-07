// The To buy list: things we still want to find, with where to buy each one.
// Per phone only (IndexedDB, never synced). Where-to-buy comes from the relay in worker/shopping, which asks Claude.
//
// When the lookup runs: every new item starts "pending". The queue works through pending items one at a time
// on add, on app start, when the phone comes back online, when the app returns to the foreground, and every
// few minutes while it's open. Answers are saved on the item, so they show offline.
import { useEffect, useState } from 'preact/hooks';
import type { TripDay } from '../data/schema';
import { db } from './db';
import { uuid } from './purchases';
import { trip } from './trip';
import { tripAreas, WantAdvice, type Area, type WantPlace } from './wantAdvice';

// Set VITE_SHOPPING_URL at build time to turn lookups on. Without it the list still works, with no suggestions.
export const SHOPPING_URL: string = import.meta.env.VITE_SHOPPING_URL ?? '';

export type LookupState = 'pending' | 'ok' | 'failed';
export interface Want {
  id: string;
  item: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  got: boolean;
  gotAt?: string;
  lookup: LookupState;
  advice?: WantAdvice;
  adviceAt?: string;
  error?: string;    // last lookup problem, shown under the item
  tries?: number;    // failed tries since the last success
}

export const MAX_TRIES = 5;
export const AREAS: Area[] = tripAreas(trip);
const areaName = new Map(AREAS.map((a) => [a.slug, a.name]));
export const areaLabel = (slug: string) => (slug === 'anywhere' ? 'Anywhere' : areaName.get(slug) ?? slug);

// ---- store ----
const subs = new Set<() => void>();
export const notifyWants = () => subs.forEach((f) => f());

export async function allWants(): Promise<Want[]> {
  try {
    const l = await (await db()).getAll('wants');
    return l.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch { return []; }
}

export function useWants(): Want[] | null {
  const [l, set] = useState<Want[] | null>(null);
  useEffect(() => {
    const f = () => { allWants().then(set); };
    f(); subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return l;
}

export async function saveWant(w: Want): Promise<Want> {
  await (await db()).put('wants', w);
  notifyWants();
  return w;
}

export async function deleteWant(id: string) {
  await (await db()).delete('wants', id);
  notifyWants();
}

export function newWant(item: string, note?: string): Want {
  const t = new Date().toISOString();
  return { id: uuid(), item: item.trim(), note: note?.trim() || undefined, createdAt: t, updatedAt: t, got: false, lookup: 'pending' };
}

export async function addWant(item: string, note?: string): Promise<Want> {
  const w = await saveWant(newWant(item, note));
  void runWants();
  return w;
}

export const setGot = (w: Want, got: boolean) =>
  saveWant({ ...w, got, gotAt: got ? new Date().toISOString() : undefined, updatedAt: new Date().toISOString() });

// "Look again": back to pending, then run.
export async function relook(w: Want) {
  await saveWant({ ...w, lookup: 'pending', error: undefined, tries: 0, updatedAt: new Date().toISOString() });
  void runWants();
}

// ---- one lookup ----
export type LookupResult = { ok: true; advice: WantAdvice } | { ok: false; error: string; retry: boolean };

// text/plain keeps it a "simple" request: no CORS preflight on a slow phone connection.
export async function lookupWant(w: Pick<Want, 'item' | 'note'>, areas: Area[], { url = SHOPPING_URL, fetcher = fetch }: { url?: string; fetcher?: typeof fetch } = {}): Promise<LookupResult> {
  let r: Response;
  try {
    r = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ item: w.item, note: w.note, areas }) });
  } catch {
    return { ok: false, error: 'Couldn’t reach the server. It will try again.', retry: true };
  }
  if (r.ok) {
    const body = await r.json().catch(() => null) as { advice?: unknown } | null;
    const p = WantAdvice.safeParse(body?.advice);
    return p.success ? { ok: true, advice: p.data } : { ok: false, error: 'Got an answer it couldn’t read. It will try again.', retry: true };
  }
  if (r.status === 400) return { ok: false, error: 'The server couldn’t use this item. Edit it and try again.', retry: false };
  if (r.status === 422) return { ok: false, error: 'No suggestion for this one.', retry: false };
  if (r.status === 429) return { ok: false, error: 'Too many lookups at once. It will try again shortly.', retry: true };
  return { ok: false, error: 'The lookup didn’t work. It will try again.', retry: true };
}

// Applies a lookup result to an item.
export function applyResult(w: Want, res: LookupResult, at = new Date().toISOString()): Want {
  if (res.ok) return { ...w, lookup: 'ok', advice: res.advice, adviceAt: at, error: undefined, tries: 0, updatedAt: at };
  const tries = (w.tries ?? 0) + 1;
  const giveUp = !res.retry || tries >= MAX_TRIES;
  return { ...w, lookup: giveUp ? 'failed' : 'pending', error: giveUp && res.retry ? 'The lookup kept failing. Tap “Look again” to retry.' : res.error, tries, updatedAt: at };
}

// ---- the queue ----
let running: Promise<number> | null = null;

// Works through pending items, oldest first. Stops early when offline or the server is unreachable.
// Returns how many items it looked up.
export function runWants(opts: { url?: string; fetcher?: typeof fetch; online?: () => boolean } = {}): Promise<number> {
  if (running) return running;
  const url = opts.url ?? SHOPPING_URL;
  const online = opts.online ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);
  running = (async () => {
    let n = 0;
    if (!url) return n;
    const pending = (await allWants()).filter((w) => w.lookup === 'pending').reverse();
    for (const w of pending) {
      if (!online()) break;
      const res = await lookupWant(w, AREAS, { url, fetcher: opts.fetcher });
      // Re-read in case the item was edited, checked off or deleted while the lookup ran.
      const cur = await (await db()).get('wants', w.id).catch(() => undefined);
      if (!cur || cur.item !== w.item || cur.note !== w.note) continue;
      await saveWant(applyResult(cur, res));
      n++;
      if (!res.ok && res.retry) break;   // server trouble: wait for the next trigger
    }
    return n;
  })().finally(() => { running = null; });
  return running;
}

export const LOOKUP_EVERY_MS = 5 * 60_000;

// Called once from main.tsx.
export function startWants() {
  if (!SHOPPING_URL || typeof window === 'undefined') return;
  const go = () => { void runWants(); };
  window.addEventListener('online', go);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') go(); });
  setInterval(() => { if (document.visibilityState === 'visible') go(); }, LOOKUP_EVERY_MS);
  go();
}

// ---- Today ----
export interface TodayWant { want: Want; place: WantPlace }

// Items still to buy with a place in today's neighborhoods (first) or today's cities. At most `max`, one place each.
export function todayWants(list: Want[], day: Pick<TripDay, 'places' | 'hoods'> | undefined, max = 3): TodayWant[] {
  if (!day) return [];
  const hoods = new Set(day.hoods.map((h) => h.slug));
  const cities = new Set<string>(day.places.filter((p) => p !== 'anywhere'));
  const hits: (TodayWant & { score: number })[] = [];
  for (const w of list) {
    if (w.got || !w.advice) continue;
    let best: (TodayWant & { score: number }) | undefined;
    for (const p of w.advice.places) {
      const score = hoods.has(p.area) ? 2 : cities.has(p.area) ? 1 : 0;
      if (score && (!best || score > best.score)) best = { want: w, place: p, score };
    }
    if (best) hits.push(best);
  }
  return hits.sort((a, b) => b.score - a.score || a.want.createdAt.localeCompare(b.want.createdAt)).slice(0, max).map(({ want, place }) => ({ want, place }));
}
