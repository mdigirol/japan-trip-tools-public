import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STORAGE_PREFIX } from '../../src/lib/storageNames';

// The kill switch (retired/sw.js) runs on the shared origin https://mdigirol.github.io, so it must
// delete only this app's caches and leave the private app's alone.
const SCOPE = 'https://mdigirol.github.io/japan-trip-tools-public/';
const source = readFileSync(new URL('../../retired/sw.js', import.meta.url), 'utf8');

async function runKillSwitch(cacheNames: string[]) {
  const listeners: Record<string, (e: any) => void> = {};
  const deleted: string[] = [];
  const navigated: string[] = [];
  let skipped = false;
  let unregistered = false;
  const self = {
    addEventListener: (type: string, fn: (e: any) => void) => { listeners[type] = fn; },
    skipWaiting: () => { skipped = true; },
    registration: { scope: SCOPE, unregister: async () => { unregistered = true; return true; } },
    caches: {
      keys: async () => cacheNames,
      delete: async (n: string) => { deleted.push(n); return true; }
    },
    clients: {
      matchAll: async () => [{ url: `${SCOPE}#/phrases`, navigate: async (u: string) => { navigated.push(u); } }]
    }
  };
  new Function('self', source)(self);
  listeners.install({});
  let done: Promise<unknown> = Promise.resolve();
  listeners.activate({ waitUntil: (p: Promise<unknown>) => { done = p; } });
  await done;
  return { deleted, navigated, skipped, unregistered };
}

describe('retired kill switch', () => {
  it('uses the same prefix as the app', () => {
    expect(source).toContain(`'${STORAGE_PREFIX}'`);
  });

  it('deletes only this app’s caches, unregisters and reloads open windows', async () => {
    const r = await runKillSwitch([
      `workbox-precache-v2-${SCOPE}`,
      `${STORAGE_PREFIX}rates`,
      `${STORAGE_PREFIX}weather`,
      'workbox-precache-v2-https://mdigirol.github.io/japan-trip-tools/',
      'rates',
      'weather',
      'overpass'
    ]);
    expect(r.deleted.sort()).toEqual([`${STORAGE_PREFIX}rates`, `${STORAGE_PREFIX}weather`, `workbox-precache-v2-${SCOPE}`].sort());
    expect(r.skipped).toBe(true);
    expect(r.unregistered).toBe(true);
    expect(r.navigated).toEqual([`${SCOPE}#/phrases`]);
  });
});
