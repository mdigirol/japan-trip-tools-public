// IndexedDB: purchases, photos, the sync queue, cached API results, and the To buy list.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Purchase } from '../data/schema';
import type { Want } from './wants';
import { DB_NAME } from './storageNames';

export interface QueueEntry { id?: number; purchaseId: string; at: string }
export interface CacheEntry<T = unknown> { key: string; at: number; value: T }

interface CompanionDB extends DBSchema {
  purchases: { key: string; value: Purchase };
  photos: { key: string; value: { id: string; purchaseId: string; blob: Blob; at: string } };
  queue: { key: number; value: QueueEntry };
  cache: { key: string; value: CacheEntry };
  wants: { key: string; value: Want };     // v2: the To buy list, this phone only
}

let dbp: Promise<IDBPDatabase<CompanionDB>> | null = null;

export function db() {
  if (!dbp) {
    dbp = openDB<CompanionDB>(DB_NAME, 2, {
      upgrade(d, oldVersion) {
        if (oldVersion < 1) {
          d.createObjectStore('purchases', { keyPath: 'id' });
          d.createObjectStore('photos', { keyPath: 'id' });
          d.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
          d.createObjectStore('cache', { keyPath: 'key' });
        }
        if (oldVersion < 2) d.createObjectStore('wants', { keyPath: 'id' });
      }
    });
  }
  return dbp;
}

// Cache helpers fall back to memory when IndexedDB is unavailable (private mode, tests).
const mem = new Map<string, CacheEntry>();

export async function cacheGet<T>(key: string): Promise<CacheEntry<T> | undefined> {
  try { return (await (await db()).get('cache', key)) as CacheEntry<T> | undefined; }
  catch { return mem.get(key) as CacheEntry<T> | undefined; }
}

export async function cachePut<T>(key: string, value: T): Promise<void> {
  const e = { key, at: Date.now(), value };
  mem.set(key, e);
  try { await (await db()).put('cache', e); } catch { /* memory only */ }
}

export async function persistStorage() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* not supported */ }
}
