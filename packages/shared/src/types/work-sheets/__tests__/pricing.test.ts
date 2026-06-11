import { describe, it, expect } from 'vitest';
import { WORK_SHEET_CONSTANTS } from '../types';
import { calculateWorkSheetPricing } from '../validation';
import type { WorkSheetPricingInput } from '../validation';

describe('WORK_SHEET_CONSTANTS', () => {
  /**
   * MI-01: Constants match spec values
   * Validates: Requirements PRICE-BR-001, PRICE-BR-002, PRICE-BR-003, PRICE-BR-004, PRICE-BR-005, PRICE-BR-009, PRICE-BR-011
   */
  it('MI-01: should have correct constant values matching spec', () => {
    expect(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY).toBe(55.0);
    expect(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY).toBe(70.0);
    expect(WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM).toBe(0.45);
    expect(WORK_SHEET_CONSTANTS.TRAVEL_FEE_SHORT).toBe(45.0);
    expect(WORK_SHEET_CONSTANTS.TRAVEL_FEE_LONG).toBe(60.0);
    expect(WORK_SHEET_CONSTANTS.TRAVEL_FEE_THRESHOLD_KM).toBe(180);
    expect(WORK_SHEET_CONSTANTS.MINIMUM_HOURS).toBe(1);
    expect(WORK_SHEET_CONSTANTS.IVA_RATE).toBe(0.23);
  });
});

describe('calculateWorkSheetPricing', () => {
  const baseInput: WorkSheetPricingInput = {
    weekendHoliday: false,
    hasDisplacement: false,
    totalKms: 0,
    arrivalTime: '09:00',
    departureTime: '11:00',
  };

  /**
   * MI-02: Weekday rate calculation
   * Validates: Requirements PRICE-AC-001, PRICE-BR-001
   */
  it('MI-02: weekday rate — hourlyRate=55, correct laborPrice', () => {
    const input: WorkSheetPricingInput = {
      ...baseInput,
      weekendHoliday: false,
      arrivalTime: '09:00',
      departureTime: '11:00',
    };

    const result = calculateWorkSheetPricing(input);

    expect(result.hourlyRate).toBe(55);
    expect(result.laborHours).toBe(2);
    expect(result.laborPrice).toBe(110);
  });

  /**
   * MI-03: Weekend/holiday rate calculation
   * Validates: Requirements PRICE-AC-002, PRICE-BR-002
   */
  it('MI-03: weekend rate — hourlyRate=70, correct laborPrice', () => {
    const input: WorkSheetPricingInput = {
      ...baseInput,
      weekendHoliday: true,
      arrivalTime: '09:00',
      departureTime: '11:00',
    };

    const result = calculateWorkSheetPricing(input);

    expect(result.hourlyRate).toBe(70);
    expect(result.laborHours).toBe(2);
    expect(result.laborPrice).toBe(140);
  });

  /**
   * MI-04: Minimum 1 hour rule
   * Validates: Requirements PRICE-BR-011
   */
  it('MI-04: minimum 1 hour — duration 30min charges 1 hour', () => {
    const input: WorkSheetPricingInput = {
      ...baseInput,
      weekendHoliday: false,
      arrivalTime: '10:00',
      departureTime: '10:30',
    };

    const result = calculateWorkSheetPricing(input);

    expect(result.laborHours).toBe(1);
    expect(result.laborPrice).toBe(55);
  });

  /**
   * MI-05: 180km threshold — exactly 180km gets short fee (€45), 181km gets long fee (€60)
   * Validates: Requirements PRICE-AC-003, PRICE-AC-004, PRICE-BR-004, PRICE-BR-005
   */
  describe('MI-05: 180km threshold', () => {
    it('exactly 180km gets short fee (€45)', () => {
      const input: WorkSheetPricingInput = {
        ...baseInput,
        hasDisplacement: true,
        totalKms: 180,
        arrivalTime: '09:00',
        departureTime: '11:00',
      };

      const result = calculateWorkSheetPricing(input);

      expect(result.travelFee).toBe(45);
      expect(result.mileagePrice).toBe(81); // 180 × 0.45
    });

    it('181km gets long fee (€60)', () => {
      const input: WorkSheetPricingInput = {
        ...baseInput,
        hasDisplacement: true,
        totalKms: 181,
        arrivalTime: '09:00',
        departureTime: '11:00',
      };

      const result = calculateWorkSheetPricing(input);

      expect(result.travelFee).toBe(60);
    });
  });

  /**
   * MI-06: Mileage calculation — totalKms × €0.45 per km
   * Validates: Requirements PRICE-AC-005, PRICE-BR-003
   */
  it('MI-06: mileage calculation — totalKms × €0.45', () => {
    const input: WorkSheetPricingInput = {
      ...baseInput,
      hasDisplacement: true,
      totalKms: 200,
      arrivalTime: '09:00',
      departureTime: '11:00',
    };

    const result = calculateWorkSheetPricing(input);

    expect(result.mileagePrice).toBe(90); // 200 × 0.45
    expect(result.travelFee).toBe(60); // >180km
  });

  /**
   * MI-07: Missing times → zeroed result
   * Validates: Requirements PRICE-AC-012
   */
  it('MI-07: missing times — returns zeroed result', () => {
    const input: WorkSheetPricingInput = {
      ...baseInput,
      arrivalTime: '',
      departureTime: '',
    };

    const result = calculateWorkSheetPricing(input);

    expect(result.hourlyRate).toBe(55); // hourlyRate still set based on weekendHoliday
    expect(result.laborHours).toBe(0);
    expect(result.laborPrice).toBe(0);
    expect(result.travelFee).toBe(0);
    expect(result.mileagePrice).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  /**
   * MI-08: Overnight wrap-around — departure before arrival = next day
   * Validates: Requirements PRICE-AC-001
   */
  it('MI-08: overnight wrap-around — departure 02:00 arrival 22:00 = 4h', () => {
    const input: WorkSheetPricingInput = {
      ...baseInput,
      weekendHoliday: false,
      arrivalTime: '22:00',
      departureTime: '02:00',
    };

    const result = calculateWorkSheetPricing(input);

    expect(result.laborHours).toBe(4);
    expect(result.laborPrice).toBe(220); // 4h × €55
  });

  /**
   * MI-09: Displacement disabled — travelFee=0, mileagePrice=0, totalPrice = laborPrice only
   * Validates: Requirements PRICE-AC-012
   */
  it('MI-09: displacement disabled — no travel/mileage costs', () => {
    const input: WorkSheetPricingInput = {
      ...baseInput,
      hasDisplacement: false,
      totalKms: 100,
      arrivalTime: '09:00',
      departureTime: '11:00',
    };

    const result = calculateWorkSheetPricing(input);

    expect(result.travelFee).toBe(0);
    expect(result.mileagePrice).toBe(0);
    expect(result.totalPrice).toBe(110); // laborPrice only (2h × €55)
    expect(result.hasDisplacement).toBe(false);
  });
});
