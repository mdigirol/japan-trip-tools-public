// Metric ⇄ US conversions for the Units screen. Exact factors (international yard and pound, US customary volume).
import { cToF, fToC } from './weather';

export interface UnitPair { id: string; a: string; b: string; ab: (x: number) => number; ba: (x: number) => number }
export interface UnitGroup { id: string; title: string; pairs: UnitPair[] }

const scale = (id: string, a: string, b: string, aPerB: number): UnitPair =>
  ({ id, a, b, ab: (x) => x / aPerB, ba: (x) => x * aPerB });

export const UNIT_GROUPS: UnitGroup[] = [
  { id: 'temp', title: 'Temperature', pairs: [{ id: 'temp', a: '°C', b: '°F', ab: cToF, ba: fToC }] },
  { id: 'weight', title: 'Weight', pairs: [scale('g-oz', 'g', 'oz', 28.349523125), scale('kg-lb', 'kg', 'lb', 0.45359237)] },
  { id: 'volume', title: 'Volume', pairs: [scale('ml-floz', 'mL', 'fl oz', 29.5735295625), scale('l-gal', 'L', 'gal', 3.785411784)] },
  { id: 'length', title: 'Length', pairs: [scale('cm-in', 'cm', 'in', 2.54), scale('m-ft', 'm', 'ft', 0.3048), scale('km-mi', 'km', 'mi', 1.609344)] }
];

/** Two decimals below 10 (0.26 gal, 1.06 qt-sized answers), one decimal above. No trailing zeros. */
export function roundUnit(x: number): string {
  if (!Number.isFinite(x)) return '';
  const d = Math.abs(x) < 10 ? 100 : 10;
  const r = Math.round(x * d) / d;
  return String(Object.is(r, -0) ? 0 : r);
}

/** Convert a typed value; '' (or something that isn't a number) clears the other box. */
export function convertInput(v: string, f: (x: number) => number): string {
  if (v.trim() === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? roundUnit(f(n)) : '';
}
