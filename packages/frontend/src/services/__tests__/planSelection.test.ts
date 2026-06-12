import { describe, it, expect } from 'vitest';
import {
  getAvailablePlans,
  requiresDistance,
  getPlanDetails,
  getPlanOptions,
} from '../planSelection';

describe('MI-01: getAvailablePlans()', () => {
  it('returns 3 CPA plans for contract type "CPA"', () => {
    const plans = getAvailablePlans('CPA');
    expect(plans).toHaveLength(3);
  });

  it('returns correct CPA plan IDs', () => {
    const plans = getAvailablePlans('CPA');
    const ids = plans.map(p => p.id);
    expect(ids).toEqual(['cpa_essential', 'cpa_professional', 'cpa_premium']);
  });

  it('returns 6 S&H plans for contract type "S&H"', () => {
    const plans = getAvailablePlans('S&H');
    expect(plans).toHaveLength(6);
  });

  it('returns correct S&H plan IDs', () => {
    const plans = getAvailablePlans('S&H');
    const ids = plans.map(p => p.id);
    expect(ids).toEqual([
      'sh_simple',
      'sh_brass',
      'sh_silver',
      'sh_gold',
      'sh_diamond',
      'sh_platinum',
    ]);
  });

  it('returns empty array for empty string', () => {
    const plans = getAvailablePlans('');
    expect(plans).toEqual([]);
  });

  it('returns empty array for invalid contract type', () => {
    const plans = getAvailablePlans('INVALID' as any);
    expect(plans).toEqual([]);
  });
});

describe('MI-02: requiresDistance()', () => {
  it('returns false for CPA', () => {
    expect(requiresDistance('CPA')).toBe(false);
  });

  it('returns true for S&H', () => {
    expect(requiresDistance('S&H')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(requiresDistance('')).toBe(false);
  });

  it('returns false for invalid type', () => {
    expect(requiresDistance('INVALID')).toBe(false);
  });
});

describe('MI-03: getPlanDetails()', () => {
  it('returns the ESSENTIAL CARE plan for CPA cpa_essential', () => {
    const plan = getPlanDetails('CPA', 'cpa_essential');
    expect(plan).not.toBeNull();
    expect(plan!.id).toBe('cpa_essential');
    expect(plan!.name).toBe('ESSENTIAL CARE');
  });

  it('returns the GOLD plan for S&H sh_gold', () => {
    const plan = getPlanDetails('S&H', 'sh_gold');
    expect(plan).not.toBeNull();
    expect(plan!.id).toBe('sh_gold');
    expect(plan!.name).toBe('GOLD');
  });

  it('returns null for unknown plan ID', () => {
    const plan = getPlanDetails('CPA', 'unknown');
    expect(plan).toBeNull();
  });

  it('returns null for empty contract type', () => {
    const plan = getPlanDetails('', 'cpa_essential');
    expect(plan).toBeNull();
  });

  it('returned plan has correct structure', () => {
    const plan = getPlanDetails('CPA', 'cpa_essential');
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('description');
    expect(plan).toHaveProperty('parameters');
    expect(plan).toHaveProperty('schedule');
    expect(plan).toHaveProperty('prices');
  });
});

describe('MI-04: getPlanOptions()', () => {
  it('returns 3 options for CPA', () => {
    const options = getPlanOptions('CPA');
    expect(options).toHaveLength(3);
  });

  it('returns 6 options for S&H', () => {
    const options = getPlanOptions('S&H');
    expect(options).toHaveLength(6);
  });

  it('returns empty array for empty string', () => {
    const options = getPlanOptions('');
    expect(options).toEqual([]);
  });

  it('options have correct { value, label } shape', () => {
    const options = getPlanOptions('CPA');
    for (const option of options) {
      expect(option).toHaveProperty('value');
      expect(option).toHaveProperty('label');
      expect(typeof option.value).toBe('string');
      expect(typeof option.label).toBe('string');
    }
  });

  it('CPA options have correct values (plan IDs) and labels (plan names)', () => {
    const options = getPlanOptions('CPA');
    expect(options).toEqual([
      { value: 'cpa_essential', label: 'ESSENTIAL CARE' },
      { value: 'cpa_professional', label: 'PROFESSIONAL CARE' },
      { value: 'cpa_premium', label: 'PREMIUM CARE' },
    ]);
  });

  it('S&H options have correct values and labels', () => {
    const options = getPlanOptions('S&H');
    expect(options).toEqual([
      { value: 'sh_simple', label: 'SIMPLE' },
      { value: 'sh_brass', label: 'BRASS' },
      { value: 'sh_silver', label: 'SILVER' },
      { value: 'sh_gold', label: 'GOLD' },
      { value: 'sh_diamond', label: 'DIAMOND' },
      { value: 'sh_platinum', label: 'PLATINUM' },
    ]);
  });
});
