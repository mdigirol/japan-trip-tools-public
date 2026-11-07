import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../src/lib/db';
import { cleanRequest, PLACES_MAX, shorten, tidyAdvice, tripAreas, userPrompt, type WantAdvice } from '../../src/lib/wantAdvice';
import { allWants, applyResult, AREAS, lookupWant, MAX_TRIES, newWant, runWants, saveWant, todayWants, type Want } from '../../src/lib/wants';
import { trip } from '../../src/lib/trip';
import { handle, type Ask, type Env } from '../../worker/shopping/src/index';

const advice: WantAdvice = {
  summary: 'Buy it from a tea specialist.',
  places: [{ name: 'Ippodo Tea', area: 'kyoto-downtown', why: 'Main store, wide range of grades.' }]
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const URL_ = 'https://shopping.test/';

describe('trip areas', () => {
  it('lists cities first, then each neighborhood once', () => {
    const a = tripAreas(trip);
    expect(a[0]).toEqual({ slug: 'tokyo', name: 'Tokyo' });
    expect(a.map((x) => x.slug)).toContain('kappabashi');
    expect(new Set(a.map((x) => x.slug)).size).toBe(a.length);
    expect(AREAS).toEqual(a);
  });
});

describe('request and answer cleanup', () => {
  it('trims the item and note, and drops bad areas', () => {
    const r = cleanRequest({ item: '  Matcha \n tin ', note: '', areas: [{ slug: 'gion', name: 'Gion' }, { slug: 'Bad Slug', name: 'x' }, 'junk'] });
    expect(r).toEqual({ item: 'Matcha tin', note: undefined, areas: [{ slug: 'gion', name: 'Gion' }] });
    expect(userPrompt(r!)).toContain('gion: Gion');
  });
  it('rejects an empty item or a non-object', () => {
    expect(cleanRequest({ item: '   ' })).toBeNull();
    expect(cleanRequest('matcha')).toBeNull();
  });
  it('keeps at most three places and maps unknown areas to anywhere', () => {
    const many = { summary: ' s ', places: Array.from({ length: 5 }, (_, i) => ({ name: `Shop ${i}`, area: i ? 'nowhere' : 'gion', why: 'w' })) };
    const t = tidyAdvice(many, [{ slug: 'gion', name: 'Gion' }]);
    expect(t.places).toHaveLength(PLACES_MAX);
    expect(t.places.map((p) => p.area)).toEqual(['gion', 'anywhere', 'anywhere']);
    expect(t.summary).toBe('s');
  });
  it('shortens long text at a sentence or a word, never mid-word', () => {
    expect(shorten('Short.', 50)).toBe('Short.');
    const two = 'Dozens of knife shops line the street here. Bring your passport for tax-free.';
    expect(shorten(two, 60)).toBe('Dozens of knife shops line the street here.');
    const one = 'Dozens of knife shops, with many gyuto in the mid range and engraving';
    const s = shorten(one, 40);
    expect(s.endsWith('…')).toBe(true);
    expect(s.length).toBeLessThanOrEqual(40);
    expect(one.startsWith(s.slice(0, -1))).toBe(true);
    expect(one[s.length - 1]).toBe(' ');   // the cut falls between words
  });
});

describe('one lookup', () => {
  it('sends text/plain JSON and reads the advice', async () => {
    const fetcher = vi.fn(async () => json(200, { ok: true, advice }));
    const r = await lookupWant({ item: 'Matcha' }, AREAS, { url: URL_, fetcher });
    expect(r).toEqual({ ok: true, advice });
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'Content-Type': 'text/plain;charset=UTF-8' });
    expect(JSON.parse(init.body as string).item).toBe('Matcha');
  });
  it('retries network trouble and odd answers, but not a rejected item', async () => {
    expect(await lookupWant({ item: 'x' }, [], { url: URL_, fetcher: async () => { throw new TypeError('offline'); } })).toMatchObject({ ok: false, retry: true });
    expect(await lookupWant({ item: 'x' }, [], { url: URL_, fetcher: async () => json(200, { advice: { nope: 1 } }) })).toMatchObject({ ok: false, retry: true });
    expect(await lookupWant({ item: 'x' }, [], { url: URL_, fetcher: async () => json(400, {}) })).toMatchObject({ ok: false, retry: false });
    expect(await lookupWant({ item: 'x' }, [], { url: URL_, fetcher: async () => json(422, {}) })).toMatchObject({ ok: false, retry: false });
  });
  it('gives up after MAX_TRIES failures', () => {
    let w: Want = newWant('Tea');
    for (let i = 0; i < MAX_TRIES - 1; i++) w = applyResult(w, { ok: false, error: 'e', retry: true });
    expect(w.lookup).toBe('pending');
    w = applyResult(w, { ok: false, error: 'e', retry: true });
    expect(w.lookup).toBe('failed');
    w = applyResult(w, { ok: true, advice });
    expect(w).toMatchObject({ lookup: 'ok', tries: 0, error: undefined, advice });
  });
});

describe('the queue', () => {
  beforeEach(async () => { await (await db()).clear('wants'); });

  it('looks up pending items oldest first and saves the answers', async () => {
    const a = { ...newWant('First'), createdAt: '2026-11-01T00:00:00Z' };
    const b = { ...newWant('Second'), createdAt: '2026-11-02T00:00:00Z' };
    await saveWant(a); await saveWant(b);
    const asked: string[] = [];
    const fetcher = vi.fn(async (_u: unknown, init?: RequestInit) => { asked.push(JSON.parse(init!.body as string).item); return json(200, { ok: true, advice }); });
    expect(await runWants({ url: URL_, fetcher })).toBe(2);
    expect(asked).toEqual(['First', 'Second']);
    expect((await allWants()).every((w) => w.lookup === 'ok' && w.advice?.summary === advice.summary)).toBe(true);
    expect(await runWants({ url: URL_, fetcher })).toBe(0);     // nothing left to do
  });

  it('stops at the first server failure and keeps items pending', async () => {
    await saveWant(newWant('One')); await saveWant(newWant('Two'));
    const fetcher = vi.fn(async () => json(503, {}));
    expect(await runWants({ url: URL_, fetcher })).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await allWants()).every((w) => w.lookup === 'pending')).toBe(true);
  });

  it('does nothing offline or without a relay URL', async () => {
    await saveWant(newWant('One'));
    const fetcher = vi.fn();
    expect(await runWants({ url: URL_, fetcher, online: () => false })).toBe(0);
    expect(await runWants({ url: '', fetcher })).toBe(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('Today hint', () => {
  const day = { places: ['kyoto' as const], hoods: [{ name: 'Gion', blurb: '', slug: 'gion' }] };
  const w = (item: string, area: string, o: Partial<Want> = {}): Want =>
    ({ ...newWant(item), lookup: 'ok', advice: { summary: '', places: [{ name: `${item} shop`, area, why: '' }] }, ...o });

  it('puts neighborhood matches before city matches, and skips the rest', () => {
    const list = [w('Fan', 'kyoto'), w('Comb', 'gion'), w('Socks', 'anywhere'), w('Knife', 'kappabashi'), w('Tea', 'gion', { got: true })];
    expect(todayWants(list, day).map((h) => h.want.item)).toEqual(['Comb', 'Fan']);
  });
  it('shows at most three', () => {
    expect(todayWants(['a', 'b', 'c', 'd'].map((i) => w(i, 'gion')), day)).toHaveLength(3);
    expect(todayWants([w('a', 'gion')], undefined)).toEqual([]);
  });
});

describe('where-to-buy relay', () => {
  const env: Env = { ANTHROPIC_API_KEY: 'test', ALLOWED_ORIGINS: 'https://mdigirol.github.io' };
  const post = (body: unknown, origin = 'https://mdigirol.github.io') =>
    new Request('https://relay.test/', { method: 'POST', headers: { Origin: origin }, body: JSON.stringify(body) });
  const ok: Ask = async () => ({ advice, refused: false });

  it('refuses other origins and runs only with a key', async () => {
    expect((await handle(post({ item: 'Tea' }, 'https://evil.test'), env, ok)).status).toBe(403);
    expect((await handle(post({ item: 'Tea' }), { ...env, ANTHROPIC_API_KEY: undefined }, ok)).status).toBe(503);
  });
  it('rejects an empty item before asking', async () => {
    const ask = vi.fn(ok);
    expect((await handle(post({ item: ' ' }), env, ask)).status).toBe(400);
    expect(ask).not.toHaveBeenCalled();
  });
  it('rate limits per IP', async () => {
    const limited = { ...env, LOOKUP_LIMITER: { limit: async () => ({ success: false }) } };
    expect((await handle(post({ item: 'Tea' }), limited, ok)).status).toBe(429);
  });
  it('returns tidied advice, with CORS for the app', async () => {
    const r = await handle(post({ item: 'Tea', areas: [{ slug: 'gion', name: 'Gion' }] }), env, ok);
    expect(r.status).toBe(200);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('https://mdigirol.github.io');
    const body = await r.json() as { advice: WantAdvice };
    expect(body.advice.places[0].area).toBe('anywhere');   // kyoto-downtown wasn't in this request's areas
  });
  it('says so when the model declines or fails', async () => {
    expect((await handle(post({ item: 'Tea' }), env, async () => ({ advice: null, refused: true }))).status).toBe(422);
    expect((await handle(post({ item: 'Tea' }), env, async () => { throw new Error('boom'); })).status).toBe(502);
  });
});
