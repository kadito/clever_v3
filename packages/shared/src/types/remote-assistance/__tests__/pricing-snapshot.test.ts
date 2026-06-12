import { describe, it, expect } from 'vitest';
import { REMOTE_ASSISTANCE_CONSTANTS } from '../types';
import type { RemoteAssistancePricingSnapshot } from '../types';
import {
  calculateRemoteAssistancePricing,
  createRemoteAssistancePricingSnapshot,
  recalculateRemoteAssistancePricingSnapshot,
} from '../validation';
import type { RemoteAssistancePricingInput, RemoteAssistanceRateOverrides } from '../validation';

/**
 * MI-02: calculateRemoteAssistancePricing() with rateOverrides
 * Validates: Requirements PRICE-BR-002, PRICE-BR-007, PRICE-AC-010
 */
describe('MI-02: calculateRemoteAssistancePricing() with rateOverrides', () => {
  const baseInput: RemoteAssistancePricingInput = {
    startTime: '09:00',
    endTime: '11:00',
    isWeekendOrHoliday: false,
  };

  const customRates: RemoteAssistanceRateOverrides = {
    priceBusinessHours: 50,
    priceAfterHours: 70,
    billingIncrementMinutes: 30,
    businessHoursMorningStart: 8 * 60,     // 08:00
    businessHoursMorningEnd: 12 * 60,      // 12:00
    businessHoursAfternoonStart: 13 * 60,  // 13:00
    businessHoursAfternoonEnd: 17 * 60,    // 17:00
  };

  it('when rateOverrides provided, uses those rates instead of constants', () => {
    const result = calculateRemoteAssistancePricing({
      ...baseInput,
      rateOverrides: customRates,
    });

    // Session 09:00-11:00 fully within custom business hours (08:00-12:00)
    // All time at business hours rate €50/h
    expect(result.isZeroCost).toBe(false);
    // Breakdown should use custom rate
    const bizSegments = result.breakdown.filter(s => s.isBusinessHours);
    for (const seg of bizSegments) {
      expect(seg.rate).toBe(50);
    }
  });

  it('verify totalValue, businessHoursValue, offHoursValue with custom rates', () => {
    const result = calculateRemoteAssistancePricing({
      ...baseInput,
      rateOverrides: customRates,
    });

    // 09:00-11:00 = 120 min, rounded to 30-min increment = 120 min
    // All within custom business hours (08:00-12:00)
    // Value = (120 / 60) × €50 = €100
    expect(result.totalMinutes).toBe(120);
    expect(result.billingMinutes).toBe(120); // 120 is already multiple of 30
    expect(result.businessMinutes).toBe(120);
    expect(result.offHoursMinutes).toBe(0);
    expect(result.businessHoursValue).toBe(100);
    expect(result.offHoursValue).toBe(0);
    expect(result.totalValue).toBe(100);
  });

  it('when rateOverrides omitted, falls back to REMOTE_ASSISTANCE_CONSTANTS (backward compat)', () => {
    const result = calculateRemoteAssistancePricing(baseInput);

    // 09:00-11:00 fully within default business hours (09:00-12:30)
    // 120 min rounded to 15-min = 120 min
    // Value = (120 / 60) × €45 = €90
    expect(result.businessHoursValue).toBe(90);
    expect(result.totalValue).toBe(90);
    // Verify the rate used matches constants
    const bizSegments = result.breakdown.filter(s => s.isBusinessHours);
    for (const seg of bizSegments) {
      expect(seg.rate).toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS);
    }
  });

  it('custom billingIncrementMinutes affects rounding correctly', () => {
    // 25 min session with 30-min increments → rounds to 30 min
    const result = calculateRemoteAssistancePricing({
      startTime: '09:00',
      endTime: '09:25',
      isWeekendOrHoliday: false,
      rateOverrides: customRates,
    });

    expect(result.totalMinutes).toBe(25);
    expect(result.billingMinutes).toBe(30); // ceil(25/30)*30 = 30
    // Value = (30 / 60) × €50 = €25
    expect(result.totalValue).toBe(25);
  });

  it('custom business hours boundaries affect segment classification', () => {
    // Custom business hours: 08:00-12:00, 13:00-17:00
    // Session 12:00-13:30 → 12:00-13:00 off-hours, 13:00-13:30 business
    const result = calculateRemoteAssistancePricing({
      startTime: '12:00',
      endTime: '13:30',
      isWeekendOrHoliday: false,
      rateOverrides: customRates,
    });

    // 90 min total, rounded to 30-min = 90 min
    expect(result.totalMinutes).toBe(90);
    expect(result.billingMinutes).toBe(90);
    // Raw: 60 min off-hours (12:00-13:00) + 30 min business (13:00-13:30)
    // Proportional: business = round((30/90)*90) = 30, off = 90-30 = 60
    expect(result.businessMinutes).toBe(30);
    expect(result.offHoursMinutes).toBe(60);
    // Business value = (30/60) × €50 = €25
    expect(result.businessHoursValue).toBe(25);
    // Off-hours value = (60/60) × €70 = €70
    expect(result.offHoursValue).toBe(70);
    expect(result.totalValue).toBe(95);
  });

  it('weekend/holiday with custom rates uses off-hours rate for entire duration', () => {
    const result = calculateRemoteAssistancePricing({
      ...baseInput,
      isWeekendOrHoliday: true,
      rateOverrides: customRates,
    });

    // 120 min rounded to 30-min = 120 min
    // All at off-hours rate €70
    // Value = (120/60) × €70 = €140
    expect(result.businessMinutes).toBe(0);
    expect(result.offHoursMinutes).toBe(120);
    expect(result.offHoursValue).toBe(140);
    expect(result.totalValue).toBe(140);
  });

  it('Contrato payment → zero-cost regardless of custom rates', () => {
    const result = calculateRemoteAssistancePricing({
      ...baseInput,
      paymentMethod: 'Contrato',
      rateOverrides: customRates,
    });

    expect(result.isZeroCost).toBe(true);
    expect(result.totalValue).toBe(0);
    expect(result.businessHoursValue).toBe(0);
    expect(result.offHoursValue).toBe(0);
  });

  it('Garantia payment → zero-cost regardless of custom rates', () => {
    const result = calculateRemoteAssistancePricing({
      ...baseInput,
      paymentMethod: 'Garantia',
      rateOverrides: customRates,
    });

    expect(result.isZeroCost).toBe(true);
    expect(result.totalValue).toBe(0);
  });
});

/**
 * MI-04: createRemoteAssistancePricingSnapshot() shape validation
 * Validates: Requirements PRICE-BR-001, PRICE-BR-006
 */
describe('MI-04: createRemoteAssistancePricingSnapshot() shape validation', () => {
  const input = {
    startTime: '09:00',
    endTime: '11:00',
    isWeekendOrHoliday: false,
    paymentMethod: 'Faturação' as const,
  };

  it('returns object with rates and calculated sub-objects', () => {
    const snapshot = createRemoteAssistancePricingSnapshot(input);

    expect(snapshot).toHaveProperty('rates');
    expect(snapshot).toHaveProperty('calculated');
    expect(typeof snapshot.rates).toBe('object');
    expect(typeof snapshot.calculated).toBe('object');
  });

  it('rates contains all 7 required fields', () => {
    const snapshot = createRemoteAssistancePricingSnapshot(input);

    const rateKeys = Object.keys(snapshot.rates);
    expect(rateKeys).toContain('priceBusinessHours');
    expect(rateKeys).toContain('priceAfterHours');
    expect(rateKeys).toContain('billingIncrementMinutes');
    expect(rateKeys).toContain('businessHoursMorningStart');
    expect(rateKeys).toContain('businessHoursMorningEnd');
    expect(rateKeys).toContain('businessHoursAfternoonStart');
    expect(rateKeys).toContain('businessHoursAfternoonEnd');
    expect(rateKeys).toHaveLength(7);
  });

  it('calculated contains all 8 required fields', () => {
    const snapshot = createRemoteAssistancePricingSnapshot(input);

    const calcKeys = Object.keys(snapshot.calculated);
    expect(calcKeys).toContain('totalValue');
    expect(calcKeys).toContain('businessHoursValue');
    expect(calcKeys).toContain('offHoursValue');
    expect(calcKeys).toContain('totalMinutes');
    expect(calcKeys).toContain('billingMinutes');
    expect(calcKeys).toContain('businessMinutes');
    expect(calcKeys).toContain('offHoursMinutes');
    expect(calcKeys).toContain('isZeroCost');
    expect(calcKeys).toHaveLength(8);
  });

  it('rates match current REMOTE_ASSISTANCE_CONSTANTS values', () => {
    const snapshot = createRemoteAssistancePricingSnapshot(input);

    expect(snapshot.rates.priceBusinessHours).toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS);
    expect(snapshot.rates.priceAfterHours).toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS);
    expect(snapshot.rates.billingIncrementMinutes).toBe(REMOTE_ASSISTANCE_CONSTANTS.BILLING_INCREMENT_MINUTES);
    expect(snapshot.rates.businessHoursMorningStart).toBe(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_MORNING_START);
    expect(snapshot.rates.businessHoursMorningEnd).toBe(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_MORNING_END);
    expect(snapshot.rates.businessHoursAfternoonStart).toBe(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_AFTERNOON_START);
    expect(snapshot.rates.businessHoursAfternoonEnd).toBe(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_AFTERNOON_END);
  });

  it('calculated totals are consistent with calculateRemoteAssistancePricing output', () => {
    const snapshot = createRemoteAssistancePricingSnapshot(input);

    const directResult = calculateRemoteAssistancePricing({
      ...input,
      rateOverrides: snapshot.rates,
    });

    expect(snapshot.calculated.totalValue).toBe(directResult.totalValue);
    expect(snapshot.calculated.businessHoursValue).toBe(directResult.businessHoursValue);
    expect(snapshot.calculated.offHoursValue).toBe(directResult.offHoursValue);
    expect(snapshot.calculated.totalMinutes).toBe(directResult.totalMinutes);
    expect(snapshot.calculated.billingMinutes).toBe(directResult.billingMinutes);
    expect(snapshot.calculated.businessMinutes).toBe(directResult.businessMinutes);
    expect(snapshot.calculated.offHoursMinutes).toBe(directResult.offHoursMinutes);
    expect(snapshot.calculated.isZeroCost).toBe(directResult.isZeroCost);
  });

  it('zero-cost behavior for Contrato payment method', () => {
    const snapshot = createRemoteAssistancePricingSnapshot({
      ...input,
      paymentMethod: 'Contrato',
    });

    expect(snapshot.calculated.isZeroCost).toBe(true);
    expect(snapshot.calculated.totalValue).toBe(0);
    expect(snapshot.calculated.businessHoursValue).toBe(0);
    expect(snapshot.calculated.offHoursValue).toBe(0);
  });

  it('zero-cost behavior for Garantia payment method', () => {
    const snapshot = createRemoteAssistancePricingSnapshot({
      ...input,
      paymentMethod: 'Garantia',
    });

    expect(snapshot.calculated.isZeroCost).toBe(true);
    expect(snapshot.calculated.totalValue).toBe(0);
  });

  it('snapshot satisfies RemoteAssistancePricingSnapshot interface', () => {
    const snapshot: RemoteAssistancePricingSnapshot = createRemoteAssistancePricingSnapshot(input);

    // All numeric fields are actual numbers (not NaN/undefined)
    expect(Number.isFinite(snapshot.rates.priceBusinessHours)).toBe(true);
    expect(Number.isFinite(snapshot.rates.priceAfterHours)).toBe(true);
    expect(Number.isFinite(snapshot.rates.billingIncrementMinutes)).toBe(true);
    expect(Number.isFinite(snapshot.rates.businessHoursMorningStart)).toBe(true);
    expect(Number.isFinite(snapshot.rates.businessHoursMorningEnd)).toBe(true);
    expect(Number.isFinite(snapshot.rates.businessHoursAfternoonStart)).toBe(true);
    expect(Number.isFinite(snapshot.rates.businessHoursAfternoonEnd)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.totalValue)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.businessHoursValue)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.offHoursValue)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.totalMinutes)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.billingMinutes)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.businessMinutes)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.offHoursMinutes)).toBe(true);
    expect(typeof snapshot.calculated.isZeroCost).toBe('boolean');
  });
});

/**
 * MI-06: recalculateRemoteAssistancePricingSnapshot()
 * Validates: Requirements PRICE-BR-007, PRICE-AC-009
 */
describe('MI-06: recalculateRemoteAssistancePricingSnapshot()', () => {
  // Simulate "original" anchored rates that differ from current constants
  const anchoredRates: RemoteAssistancePricingSnapshot['rates'] = {
    priceBusinessHours: 50,
    priceAfterHours: 75,
    billingIncrementMinutes: 30,
    businessHoursMorningStart: 8 * 60,     // 08:00
    businessHoursMorningEnd: 12 * 60,      // 12:00
    businessHoursAfternoonStart: 13 * 60,  // 13:00
    businessHoursAfternoonEnd: 17 * 60,    // 17:00
  };

  const baseInput = {
    startTime: '09:00',
    endTime: '11:00',
    isWeekendOrHoliday: false,
    paymentMethod: 'Faturação' as const,
  };

  it('preserves existing rates (does not use current constants)', () => {
    const snapshot = recalculateRemoteAssistancePricingSnapshot(anchoredRates, baseInput);

    // Rates should be the exact same values as provided
    expect(snapshot.rates.priceBusinessHours).toBe(50);
    expect(snapshot.rates.priceAfterHours).toBe(75);
    expect(snapshot.rates.billingIncrementMinutes).toBe(30);
    expect(snapshot.rates.businessHoursMorningStart).toBe(8 * 60);
    expect(snapshot.rates.businessHoursMorningEnd).toBe(12 * 60);
    expect(snapshot.rates.businessHoursAfternoonStart).toBe(13 * 60);
    expect(snapshot.rates.businessHoursAfternoonEnd).toBe(17 * 60);

    // They should NOT equal current constants (which are different)
    expect(snapshot.rates.priceBusinessHours).not.toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS);
    expect(snapshot.rates.priceAfterHours).not.toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS);
    expect(snapshot.rates.billingIncrementMinutes).not.toBe(REMOTE_ASSISTANCE_CONSTANTS.BILLING_INCREMENT_MINUTES);
  });

  it('recalculates calculated using the existing rates', () => {
    const snapshot = recalculateRemoteAssistancePricingSnapshot(anchoredRates, baseInput);

    // 09:00-11:00 = 120 min, fully within custom business hours (08:00-12:00)
    // Rounded to 30-min increment: 120 min (already multiple of 30)
    // Value = (120/60) × €50 = €100
    expect(snapshot.calculated.totalMinutes).toBe(120);
    expect(snapshot.calculated.billingMinutes).toBe(120);
    expect(snapshot.calculated.businessMinutes).toBe(120);
    expect(snapshot.calculated.offHoursMinutes).toBe(0);
    expect(snapshot.calculated.businessHoursValue).toBe(100);
    expect(snapshot.calculated.offHoursValue).toBe(0);
    expect(snapshot.calculated.totalValue).toBe(100);
    expect(snapshot.calculated.isZeroCost).toBe(false);
  });

  it('different input values produce different calculated results but same rates', () => {
    const inputA = {
      startTime: '09:00',
      endTime: '11:00',
      isWeekendOrHoliday: false,
      paymentMethod: 'Faturação' as const,
    };

    const inputB = {
      startTime: '16:00',
      endTime: '18:00',
      isWeekendOrHoliday: false,
      paymentMethod: 'Faturação' as const,
    };

    const snapshotA = recalculateRemoteAssistancePricingSnapshot(anchoredRates, inputA);
    const snapshotB = recalculateRemoteAssistancePricingSnapshot(anchoredRates, inputB);

    // Rates are identical
    expect(snapshotA.rates).toEqual(snapshotB.rates);

    // Calculated values differ because inputB spans 16:00-17:00 business + 17:00-18:00 off-hours
    expect(snapshotA.calculated.totalValue).not.toBe(snapshotB.calculated.totalValue);
    expect(snapshotA.calculated.offHoursMinutes).not.toBe(snapshotB.calculated.offHoursMinutes);
  });

  it('rates object is referentially the same as input rates', () => {
    const snapshot = recalculateRemoteAssistancePricingSnapshot(anchoredRates, baseInput);

    // The rates should be the same object reference (preserved, not cloned)
    expect(snapshot.rates).toBe(anchoredRates);
  });
});
