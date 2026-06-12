import { describe, it, expect } from 'vitest';
import { WORK_SHEET_CONSTANTS } from '../types';
import type { WorkSheetPricingSnapshot } from '../types';
import {
  calculateWorkSheetPricing,
  createWorkSheetPricingSnapshot,
  recalculateWorkSheetPricingSnapshot,
} from '../validation';
import type { WorkSheetPricingInput, WorkSheetRateOverrides } from '../validation';

/**
 * MI-01: calculateWorkSheetPricing() with rateOverrides
 * Validates: Requirements PRICE-BR-002, PRICE-BR-007, PRICE-AC-010
 */
describe('MI-01: calculateWorkSheetPricing() with rateOverrides', () => {
  const baseInput: WorkSheetPricingInput = {
    weekendHoliday: false,
    hasDisplacement: true,
    totalKms: 100,
    arrivalTime: '09:00',
    departureTime: '11:00',
  };

  const customRates: WorkSheetRateOverrides = {
    hourlyRateWeekday: 40,
    hourlyRateWeekendHoliday: 50,
    mileageRatePerKm: 0.30,
    travelFeeShort: 30,
    travelFeeLong: 50,
    travelFeeThresholdKm: 200,
    minimumHours: 2,
  };

  it('when rateOverrides provided, uses those rates for hourlyRate', () => {
    const result = calculateWorkSheetPricing({
      ...baseInput,
      rateOverrides: customRates,
    });

    expect(result.hourlyRate).toBe(40); // weekday custom rate
  });

  it('when rateOverrides provided with weekendHoliday, uses weekend rate', () => {
    const result = calculateWorkSheetPricing({
      ...baseInput,
      weekendHoliday: true,
      rateOverrides: customRates,
    });

    expect(result.hourlyRate).toBe(50); // weekend custom rate
  });

  it('when rateOverrides provided, calculates laborPrice with custom hourly rate', () => {
    const result = calculateWorkSheetPricing({
      ...baseInput,
      rateOverrides: customRates,
    });

    // 2 hours × €40 = €80
    expect(result.laborHours).toBe(2);
    expect(result.laborPrice).toBe(80);
  });

  it('when rateOverrides provided, calculates travelFee with custom threshold', () => {
    // 100km with threshold 200km → short fee (€30)
    const result = calculateWorkSheetPricing({
      ...baseInput,
      totalKms: 100,
      rateOverrides: customRates,
    });

    expect(result.travelFee).toBe(30);

    // 201km with threshold 200km → long fee (€50)
    const resultLong = calculateWorkSheetPricing({
      ...baseInput,
      totalKms: 201,
      rateOverrides: customRates,
    });

    expect(resultLong.travelFee).toBe(50);
  });

  it('when rateOverrides provided, calculates mileagePrice with custom rate', () => {
    const result = calculateWorkSheetPricing({
      ...baseInput,
      totalKms: 100,
      rateOverrides: customRates,
    });

    // 100km × €0.30 = €30
    expect(result.mileagePrice).toBe(30);
  });

  it('when rateOverrides provided, applies custom minimumHours', () => {
    // Duration 30min but custom minimum is 2 hours
    const result = calculateWorkSheetPricing({
      ...baseInput,
      arrivalTime: '10:00',
      departureTime: '10:30',
      hasDisplacement: false,
      rateOverrides: customRates,
    });

    expect(result.laborHours).toBe(2); // custom minimum
    expect(result.laborPrice).toBe(80); // 2h × €40
  });

  it('when rateOverrides omitted, falls back to WORK_SHEET_CONSTANTS (backward compat)', () => {
    const result = calculateWorkSheetPricing(baseInput);

    expect(result.hourlyRate).toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY);
    expect(result.mileagePrice).toBe(
      Math.round(100 * WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM * 100) / 100
    );
    expect(result.travelFee).toBe(WORK_SHEET_CONSTANTS.TRAVEL_FEE_SHORT); // 100km < 180km threshold
  });

  it('totalPrice is sum of laborPrice + travelFee + mileagePrice with custom rates', () => {
    const result = calculateWorkSheetPricing({
      ...baseInput,
      totalKms: 100,
      rateOverrides: customRates,
    });

    // laborPrice=80 + travelFee=30 + mileagePrice=30 = 140
    expect(result.totalPrice).toBe(result.laborPrice + result.travelFee + result.mileagePrice);
    expect(result.totalPrice).toBe(140);
  });
});

/**
 * MI-03: createWorkSheetPricingSnapshot() shape validation
 * Validates: Requirements PRICE-BR-001, PRICE-BR-005
 */
describe('MI-03: createWorkSheetPricingSnapshot() shape validation', () => {
  const input = {
    weekendHoliday: false,
    hasDisplacement: true,
    totalKms: 120,
    arrivalTime: '08:00',
    departureTime: '12:00',
  };

  it('returns object with rates and calculated sub-objects', () => {
    const snapshot = createWorkSheetPricingSnapshot(input);

    expect(snapshot).toHaveProperty('rates');
    expect(snapshot).toHaveProperty('calculated');
    expect(typeof snapshot.rates).toBe('object');
    expect(typeof snapshot.calculated).toBe('object');
  });

  it('rates contains all 7 required fields', () => {
    const snapshot = createWorkSheetPricingSnapshot(input);

    const rateKeys = Object.keys(snapshot.rates);
    expect(rateKeys).toContain('hourlyRateWeekday');
    expect(rateKeys).toContain('hourlyRateWeekendHoliday');
    expect(rateKeys).toContain('mileageRatePerKm');
    expect(rateKeys).toContain('travelFeeShort');
    expect(rateKeys).toContain('travelFeeLong');
    expect(rateKeys).toContain('travelFeeThresholdKm');
    expect(rateKeys).toContain('minimumHours');
    expect(rateKeys).toHaveLength(7);
  });

  it('calculated contains all 6 required fields', () => {
    const snapshot = createWorkSheetPricingSnapshot(input);

    const calcKeys = Object.keys(snapshot.calculated);
    expect(calcKeys).toContain('hourlyRate');
    expect(calcKeys).toContain('laborHours');
    expect(calcKeys).toContain('laborPrice');
    expect(calcKeys).toContain('travelFee');
    expect(calcKeys).toContain('mileagePrice');
    expect(calcKeys).toContain('totalPrice');
    expect(calcKeys).toHaveLength(6);
  });

  it('rates match current WORK_SHEET_CONSTANTS values', () => {
    const snapshot = createWorkSheetPricingSnapshot(input);

    expect(snapshot.rates.hourlyRateWeekday).toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY);
    expect(snapshot.rates.hourlyRateWeekendHoliday).toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY);
    expect(snapshot.rates.mileageRatePerKm).toBe(WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM);
    expect(snapshot.rates.travelFeeShort).toBe(WORK_SHEET_CONSTANTS.TRAVEL_FEE_SHORT);
    expect(snapshot.rates.travelFeeLong).toBe(WORK_SHEET_CONSTANTS.TRAVEL_FEE_LONG);
    expect(snapshot.rates.travelFeeThresholdKm).toBe(WORK_SHEET_CONSTANTS.TRAVEL_FEE_THRESHOLD_KM);
    expect(snapshot.rates.minimumHours).toBe(WORK_SHEET_CONSTANTS.MINIMUM_HOURS);
  });

  it('calculated totals are consistent with calculateWorkSheetPricing output', () => {
    const snapshot = createWorkSheetPricingSnapshot(input);

    const directResult = calculateWorkSheetPricing({
      ...input,
      rateOverrides: snapshot.rates,
    });

    expect(snapshot.calculated.hourlyRate).toBe(directResult.hourlyRate);
    expect(snapshot.calculated.laborHours).toBe(directResult.laborHours);
    expect(snapshot.calculated.laborPrice).toBe(directResult.laborPrice);
    expect(snapshot.calculated.travelFee).toBe(directResult.travelFee);
    expect(snapshot.calculated.mileagePrice).toBe(directResult.mileagePrice);
    expect(snapshot.calculated.totalPrice).toBe(directResult.totalPrice);
  });

  it('snapshot satisfies WorkSheetPricingSnapshot interface', () => {
    const snapshot: WorkSheetPricingSnapshot = createWorkSheetPricingSnapshot(input);

    // All numeric fields are actual numbers (not NaN/undefined)
    expect(Number.isFinite(snapshot.rates.hourlyRateWeekday)).toBe(true);
    expect(Number.isFinite(snapshot.rates.hourlyRateWeekendHoliday)).toBe(true);
    expect(Number.isFinite(snapshot.rates.mileageRatePerKm)).toBe(true);
    expect(Number.isFinite(snapshot.rates.travelFeeShort)).toBe(true);
    expect(Number.isFinite(snapshot.rates.travelFeeLong)).toBe(true);
    expect(Number.isFinite(snapshot.rates.travelFeeThresholdKm)).toBe(true);
    expect(Number.isFinite(snapshot.rates.minimumHours)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.hourlyRate)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.laborHours)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.laborPrice)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.travelFee)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.mileagePrice)).toBe(true);
    expect(Number.isFinite(snapshot.calculated.totalPrice)).toBe(true);
  });
});

/**
 * MI-05: recalculateWorkSheetPricingSnapshot()
 * Validates: Requirements PRICE-BR-007, PRICE-AC-009
 */
describe('MI-05: recalculateWorkSheetPricingSnapshot()', () => {
  // Simulate "original" anchored rates that differ from current constants
  const anchoredRates: WorkSheetPricingSnapshot['rates'] = {
    hourlyRateWeekday: 45,
    hourlyRateWeekendHoliday: 60,
    mileageRatePerKm: 0.40,
    travelFeeShort: 35,
    travelFeeLong: 55,
    travelFeeThresholdKm: 150,
    minimumHours: 1,
  };

  const baseInput = {
    weekendHoliday: false,
    hasDisplacement: true,
    totalKms: 100,
    arrivalTime: '09:00',
    departureTime: '11:00',
  };

  it('preserves existing rates (does not use current constants)', () => {
    const snapshot = recalculateWorkSheetPricingSnapshot(anchoredRates, baseInput);

    // Rates should be the exact same object values as provided
    expect(snapshot.rates.hourlyRateWeekday).toBe(45);
    expect(snapshot.rates.hourlyRateWeekendHoliday).toBe(60);
    expect(snapshot.rates.mileageRatePerKm).toBe(0.40);
    expect(snapshot.rates.travelFeeShort).toBe(35);
    expect(snapshot.rates.travelFeeLong).toBe(55);
    expect(snapshot.rates.travelFeeThresholdKm).toBe(150);
    expect(snapshot.rates.minimumHours).toBe(1);

    // They should NOT equal current constants (which are different)
    expect(snapshot.rates.hourlyRateWeekday).not.toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY);
    expect(snapshot.rates.hourlyRateWeekendHoliday).not.toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY);
  });

  it('recalculates calculated using the existing rates', () => {
    const snapshot = recalculateWorkSheetPricingSnapshot(anchoredRates, baseInput);

    // 2 hours × €45 weekday = €90
    expect(snapshot.calculated.hourlyRate).toBe(45);
    expect(snapshot.calculated.laborHours).toBe(2);
    expect(snapshot.calculated.laborPrice).toBe(90);

    // 100km × €0.40 = €40
    expect(snapshot.calculated.mileagePrice).toBe(40);

    // 100km < 150km threshold → short fee (€35)
    expect(snapshot.calculated.travelFee).toBe(35);

    // Total: 90 + 35 + 40 = 165
    expect(snapshot.calculated.totalPrice).toBe(165);
  });

  it('different input values produce different calculated results but same rates', () => {
    const inputA = {
      weekendHoliday: false,
      hasDisplacement: true,
      totalKms: 100,
      arrivalTime: '09:00',
      departureTime: '11:00',
    };

    const inputB = {
      weekendHoliday: true,
      hasDisplacement: true,
      totalKms: 200,
      arrivalTime: '08:00',
      departureTime: '14:00',
    };

    const snapshotA = recalculateWorkSheetPricingSnapshot(anchoredRates, inputA);
    const snapshotB = recalculateWorkSheetPricingSnapshot(anchoredRates, inputB);

    // Rates are identical
    expect(snapshotA.rates).toEqual(snapshotB.rates);

    // Calculated values differ
    expect(snapshotA.calculated.hourlyRate).not.toBe(snapshotB.calculated.hourlyRate);
    expect(snapshotA.calculated.laborHours).not.toBe(snapshotB.calculated.laborHours);
    expect(snapshotA.calculated.totalPrice).not.toBe(snapshotB.calculated.totalPrice);
  });

  it('rates object is referentially the same as input rates', () => {
    const snapshot = recalculateWorkSheetPricingSnapshot(anchoredRates, baseInput);

    // The rates should be the same object reference (preserved, not cloned)
    expect(snapshot.rates).toBe(anchoredRates);
  });
});
