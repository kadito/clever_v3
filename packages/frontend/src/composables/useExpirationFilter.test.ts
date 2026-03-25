import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getExpirationDate, useExpirationFilter } from './useExpirationFilter';
import type { BaseContent } from '@clever/shared';

/**
 * Helper to build a minimal BaseContent item for testing.
 */
function makeItem(
  contentType: string,
  data: Record<string, unknown>,
): BaseContent {
  return {
    uuid: crypto.randomUUID(),
    contentType,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'test',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'test',
    version: 1,
    isDeleted: false,
    data,
  };
}

// ---------------------------------------------------------------------------
// MI-01 through MI-07 — getExpirationDate pure function
// ---------------------------------------------------------------------------
describe('getExpirationDate', () => {
  /**
   * MI-01 — License with dataVencimento returns that date
   * Validates: REQ-03
   */
  it('MI-01: license with dataVencimento returns that date', () => {
    const item = makeItem('licenses', { dataVencimento: '2026-06-15' });
    expect(getExpirationDate(item)).toBe('2026-06-15');
  });

  /**
   * MI-02 — License without dataVencimento returns undefined
   * Validates: REQ-06
   */
  it('MI-02: license without dataVencimento returns undefined', () => {
    const item = makeItem('licenses', {});
    expect(getExpirationDate(item)).toBeUndefined();
  });

  /**
   * MI-03 — Contract with only fimContratoCPA returns that date
   * Validates: REQ-03
   */
  it('MI-03: contract with only fimContratoCPA returns that date', () => {
    const item = makeItem('contracts', { fimContratoCPA: '2026-08-01' });
    expect(getExpirationDate(item)).toBe('2026-08-01');
  });

  /**
   * MI-04 — Contract with only fimContratoSH returns that date
   * Validates: REQ-03
   */
  it('MI-04: contract with only fimContratoSH returns that date', () => {
    const item = makeItem('contracts', { fimContratoSH: '2026-09-01' });
    expect(getExpirationDate(item)).toBe('2026-09-01');
  });

  /**
   * MI-05 — Contract with both dates returns the soonest
   * Validates: REQ-03
   */
  it('MI-05: contract with both dates returns the soonest', () => {
    const item = makeItem('contracts', {
      fimContratoCPA: '2026-06-01',
      fimContratoSH: '2026-08-01',
    });
    expect(getExpirationDate(item)).toBe('2026-06-01');
  });

  /**
   * MI-06 — Contract with neither date returns undefined
   * Validates: REQ-06
   */
  it('MI-06: contract with neither date returns undefined', () => {
    const item = makeItem('contracts', {});
    expect(getExpirationDate(item)).toBeUndefined();
  });

  /**
   * MI-07 — Malformed date returns undefined
   * Validates: REQ-06
   *
   * The composable guards with `typeof date === 'string' && date.length >= 7`.
   * A string shorter than 7 chars (cannot hold "YYYY-MM") is treated as malformed.
   */
  it('MI-07: malformed date (too short) returns undefined', () => {
    const item = makeItem('licenses', { dataVencimento: 'bad' });
    expect(getExpirationDate(item)).toBeUndefined();
  });

  /**
   * MI-07b — Non-string date value returns undefined
   * Validates: REQ-06
   */
  it('MI-07b: non-string date value returns undefined', () => {
    const item = makeItem('licenses', { dataVencimento: 12345 });
    expect(getExpirationDate(item)).toBeUndefined();
  });
});


// ---------------------------------------------------------------------------
// MI-08 through MI-11 — filterOptions (composable, needs Date mocking)
// ---------------------------------------------------------------------------
describe('useExpirationFilter — filterOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * MI-08 — Generates exactly 12 options
   * Validates: REQ-02
   */
  it('MI-08: generates exactly 12 options', () => {
    const { filterOptions } = useExpirationFilter('licenses');
    expect(filterOptions.value).toHaveLength(12);
  });

  /**
   * MI-09 — First option is current month
   * Validates: REQ-02
   */
  it('MI-09: first option is current month (Março 2026)', () => {
    const { filterOptions } = useExpirationFilter('licenses');
    const first = filterOptions.value[0];
    expect(first.value).toBe('2026-03');
    expect(first.label).toBe('Março 2026');
  });

  /**
   * MI-10 — Last option is 11 months ahead
   * Validates: REQ-02
   */
  it('MI-10: last option is 11 months ahead (Fevereiro 2027)', () => {
    const { filterOptions } = useExpirationFilter('licenses');
    const last = filterOptions.value[11];
    expect(last.value).toBe('2027-02');
    expect(last.label).toBe('Fevereiro 2027');
  });

  /**
   * MI-11 — Month names are capitalized Portuguese
   * Validates: REQ-02
   */
  it('MI-11: month names are capitalized Portuguese', () => {
    vi.setSystemTime(new Date(2026, 0, 1)); // January 1, 2026
    const { filterOptions } = useExpirationFilter('licenses');
    const first = filterOptions.value[0];
    expect(first.label).toBe('Janeiro 2026');
    // First character is uppercase
    expect(first.label[0]).toBe(first.label[0].toUpperCase());
  });
});

// ---------------------------------------------------------------------------
// MI-12 through MI-17 — filterItems (composable)
// ---------------------------------------------------------------------------
describe('useExpirationFilter — filterItems', () => {
  /**
   * MI-12 — No filter active returns all items
   * Validates: REQ-04
   */
  it('MI-12: no filter active returns all items', () => {
    const { filterItems, selectedMonth } = useExpirationFilter('licenses');
    const items = [
      makeItem('licenses', { dataVencimento: '2026-06-15' }),
      makeItem('licenses', { dataVencimento: '2026-07-10' }),
      makeItem('licenses', { dataVencimento: '2026-08-20' }),
      makeItem('licenses', {}),
      makeItem('licenses', { dataVencimento: '2026-09-01' }),
    ];

    expect(selectedMonth.value).toBeNull();
    expect(filterItems(items)).toHaveLength(5);
  });

  /**
   * MI-13 — Filter matches items in selected month
   * Validates: REQ-03
   */
  it('MI-13: filter matches items in selected month', () => {
    const { filterItems, selectedMonth } = useExpirationFilter('licenses');
    const items = [
      makeItem('licenses', { dataVencimento: '2026-06-01' }),
      makeItem('licenses', { dataVencimento: '2026-06-30' }),
      makeItem('licenses', { dataVencimento: '2026-07-15' }),
    ];

    selectedMonth.value = '2026-06';
    const result = filterItems(items);
    expect(result).toHaveLength(2);
    result.forEach((item) => {
      expect(getExpirationDate(item)!.startsWith('2026-06')).toBe(true);
    });
  });

  /**
   * MI-14 — Items without expiration excluded when filter active
   * Validates: REQ-06
   */
  it('MI-14: items without expiration excluded when filter active', () => {
    const { filterItems, selectedMonth } = useExpirationFilter('licenses');
    const items = [
      makeItem('licenses', { dataVencimento: '2026-06-15' }),
      makeItem('licenses', {}),
      makeItem('licenses', { dataVencimento: '2026-06-20' }),
    ];

    selectedMonth.value = '2026-06';
    const result = filterItems(items);
    expect(result).toHaveLength(2);
    // None of the results should have undefined expiration
    result.forEach((item) => {
      expect(getExpirationDate(item)).toBeDefined();
    });
  });

  /**
   * MI-15 — Items without expiration included when no filter
   * Validates: REQ-06
   */
  it('MI-15: items without expiration included when no filter', () => {
    const { filterItems, selectedMonth } = useExpirationFilter('licenses');
    const noDateItem = makeItem('licenses', {});
    const items = [
      makeItem('licenses', { dataVencimento: '2026-06-15' }),
      noDateItem,
    ];

    expect(selectedMonth.value).toBeNull();
    const result = filterItems(items);
    expect(result).toHaveLength(2);
    expect(result).toContain(noDateItem);
  });

  /**
   * MI-16 — Empty result when no items match
   * Validates: REQ-05
   */
  it('MI-16: empty result when no items match', () => {
    const { filterItems, selectedMonth } = useExpirationFilter('licenses');
    const items = [
      makeItem('licenses', { dataVencimento: '2026-06-15' }),
      makeItem('licenses', { dataVencimento: '2026-07-10' }),
    ];

    selectedMonth.value = '2026-12';
    expect(filterItems(items)).toHaveLength(0);
  });

  /**
   * MI-17 — Works on pre-searched array (coexistence with search)
   * Validates: REQ-07
   */
  it('MI-17: works on pre-searched array (coexistence)', () => {
    const { filterItems, selectedMonth } = useExpirationFilter('contracts');

    // Simulate a pre-filtered (searched) array — only 2 items survived search
    const searchFiltered = [
      makeItem('contracts', { fimContratoCPA: '2026-06-10' }),
      makeItem('contracts', { fimContratoCPA: '2026-08-05' }),
    ];

    selectedMonth.value = '2026-06';
    const result = filterItems(searchFiltered);
    expect(result).toHaveLength(1);
    expect(getExpirationDate(result[0])).toBe('2026-06-10');
  });
});
