import { describe, expect, it } from 'vitest';
import { UNIT_GROUPS, convertInput, roundUnit } from '../../src/lib/units';

const pair = (id: string) => UNIT_GROUPS.flatMap((g) => g.pairs).find((p) => p.id === id)!;

describe('units', () => {
  it('has the pairs the Units screen promises', () => {
    expect(UNIT_GROUPS.map((g) => g.title)).toEqual(['Temperature', 'Weight', 'Volume', 'Length']);
    for (const id of ['temp', 'g-oz', 'kg-lb', 'ml-floz', 'l-gal', 'cm-in', 'm-ft', 'km-mi']) expect(pair(id)).toBeTruthy();
  });

  it('converts both ways', () => {
    expect(convertInput('20', pair('temp').ab)).toBe('68');
    expect(convertInput('68', pair('temp').ba)).toBe('20');
    expect(convertInput('1', pair('kg-lb').ab)).toBe('2.2');
    expect(convertInput('23', pair('kg-lb').ab)).toBe('50.7');
    expect(convertInput('50', pair('kg-lb').ba)).toBe('22.7');
    expect(convertInput('350', pair('ml-floz').ab)).toBe('11.8');
    expect(convertInput('12', pair('ml-floz').ba)).toBe('354.9');
    expect(convertInput('2', pair('l-gal').ab)).toBe('0.53');
    expect(convertInput('100', pair('g-oz').ab)).toBe('3.53');
    expect(convertInput('170', pair('cm-in').ab)).toBe('66.9');
    expect(convertInput('3776', pair('m-ft').ab)).toBe('12388.5');
    expect(convertInput('10', pair('km-mi').ab)).toBe('6.21');
  });

  it('round-trips without drift', () => {
    for (const p of UNIT_GROUPS.flatMap((g) => g.pairs)) expect(p.ba(p.ab(42))).toBeCloseTo(42, 9);
  });

  it('clears on empty or junk input, never shows -0 or NaN', () => {
    expect(convertInput('', pair('kg-lb').ab)).toBe('');
    expect(convertInput('  ', pair('kg-lb').ab)).toBe('');
    expect(convertInput('abc', pair('kg-lb').ab)).toBe('');
    expect(roundUnit(-0.001)).toBe('0');
    expect(roundUnit(NaN)).toBe('');
  });
});
