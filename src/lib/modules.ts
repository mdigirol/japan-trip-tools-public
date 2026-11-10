// Every tool, for the home tiles, the More page and the bottom bar. `ready: false` hides a Phase 2 module until it ships.
// `short` is the bottom-bar label when `label` is too long for it.
export interface ModuleInfo { path: string; label: string; short?: string; ic: string; blurb: string; ready: boolean }

export const MODULES: ModuleInfo[] = [
  { path: 'phrases', label: 'Phrases', ic: '💬', blurb: 'Say it, show it, hear it', ready: true },
  { path: 'cards', label: 'Show cards', short: 'Cards', ic: '🪪', blurb: 'Taxi, dining, bath', ready: true },
  { path: 'etiquette', label: 'Etiquette', ic: '🙇', blurb: 'Do and don’t', ready: true },
  { path: 'currency', label: 'Currency', ic: '¥', blurb: 'Rate, table, calculator', ready: true },
  { path: 'emergency', label: 'Emergency', ic: '🚑', blurb: 'Numbers, pharmacy, earthquakes', ready: true },
  { path: 'purchases', label: 'Purchases & tax refund', short: 'Purchases', ic: '🛍️', blurb: 'For us or gifts · tax refund log', ready: true },
  { path: 'konbini', label: 'Konbini', ic: '🏪', blurb: 'Nearest stores', ready: true },
  { path: 'decoder', label: 'Signs & menus', short: 'Signs', ic: '🔤', blurb: 'Decode words', ready: true },
  { path: 'transit', label: 'Transit', ic: '🚄', blurb: 'Tickets, IC cards, taxis', ready: true },
  { path: 'numbers', label: 'Numbers', ic: '🔢', blurb: 'Prices aloud, counters', ready: true },
  { path: 'units', label: 'Units', ic: '📏', blurb: '°C/°F, kg/lb, mL/fl oz', ready: true },
  { path: 'shopping', label: 'Shopping guide', short: 'Shopping', ic: '🧾', blurb: 'Tax-free rules, sizes', ready: true },
  { path: 'settings', label: 'Settings', ic: '⚙️', blurb: 'Name, units, sync', ready: true }
];

// Settings stays last and never goes in the bar.
const PINNED = 'settings';
// The bar is Today, these many tools, then More.
export const NAV_TOOLS = 3;

// Ready tools in the phone's saved order. Unknown paths are dropped; tools missing from the saved
// order (new ones) keep their default place after the saved ones.
export function orderedModules(order: string[]): ModuleInfo[] {
  const ready = MODULES.filter((m) => m.ready && m.path !== PINNED);
  const byPath = new Map(ready.map((m) => [m.path, m]));
  const saved = [...new Set(order)].filter((p) => byPath.has(p)).map((p) => byPath.get(p)!);
  const rest = ready.filter((m) => !saved.includes(m));
  return [...saved, ...rest, ...MODULES.filter((m) => m.ready && m.path === PINNED)];
}

export const navModules = (order: string[]) => orderedModules(order).filter((m) => m.path !== PINNED).slice(0, NAV_TOOLS);

// Move one tool up (-1) or down (+1). Returns the full new order of movable tools.
export function moveModule(order: string[], path: string, by: -1 | 1): string[] {
  const list = orderedModules(order).filter((m) => m.path !== PINNED).map((m) => m.path);
  const i = list.indexOf(path), j = i + by;
  if (i < 0 || j < 0 || j >= list.length) return list;
  [list[i], list[j]] = [list[j], list[i]];
  return list;
}
