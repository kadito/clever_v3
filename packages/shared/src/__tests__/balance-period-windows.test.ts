import { describe, it, expect } from 'vitest';
import { computePeriodWindows } from '../balance-extraction';

describe('computePeriodWindows()', () => {
  it('opens the previous period and the current one for an open-ended contract started in 2025', () => {
    const windows = computePeriodWindows('2025-11-01', '', '2026-01-01', '2026-11-18');
    expect(windows).toEqual([
      { periodStart: '2025-11-01', periodEnd: '2026-11-01', isActive: false },
      { periodStart: '2026-11-01', periodEnd: '2027-11-01', isActive: true },
    ]);
  });

  it('skips periods that end on or before the start date (2025-01-01..2026-01-01)', () => {
    const windows = computePeriodWindows('2023-01-01', '', '2026-01-01', '2026-11-18');
    expect(windows.map((w) => w.periodStart)).toEqual(['2026-01-01']);
  });

  it('caps a bounded contract: earlier slices closed, current slice ends at fim', () => {
    const windows = computePeriodWindows('2025-03-01', '2026-12-31', '2026-01-01', '2026-11-18');
    expect(windows).toEqual([
      { periodStart: '2025-03-01', periodEnd: '2026-03-01', isActive: false },
      { periodStart: '2026-03-01', periodEnd: '2026-12-31', isActive: true },
    ]);
  });

  it('keeps the last period closed when the contract has expired', () => {
    const windows = computePeriodWindows('2025-03-01', '2026-03-01', '2026-01-01', '2026-11-18');
    expect(windows).toEqual([{ periodStart: '2025-03-01', periodEnd: '2026-03-01', isActive: false }]);
  });

  it('returns a single current window when the contract started in 2026, and none without a start date', () => {
    expect(computePeriodWindows('2026-02-01', '', '2026-01-01', '2026-11-18')).toHaveLength(1);
    expect(computePeriodWindows('', '', '2026-01-01', '2026-11-18')).toEqual([]);
  });
});
