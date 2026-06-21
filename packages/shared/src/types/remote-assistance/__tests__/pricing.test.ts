import { describe, it, expect } from 'vitest';
import { REMOTE_ASSISTANCE_CONSTANTS } from '../types';
import { calculateRemoteAssistancePricing } from '../validation';
import type { RemoteAssistancePricingInput } from '../validation';

describe('REMOTE_ASSISTANCE_CONSTANTS', () => {
  /**
   * MI-10: Constants match spec values
   * Validates: Requirements PRICE-BR-006, PRICE-BR-007, PRICE-BR-008, PRICE-BR-009, PRICE-BR-010
   */
  it('MI-10: should have correct constant values matching spec', () => {
    expect(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS).toBe(45.0);
    expect(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS).toBe(60.0);
    expect(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_MORNING_START).toBe(540);   // 09:00
    expect(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_MORNING_END).toBe(780);     // 13:00
    expect(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_AFTERNOON_START).toBe(870); // 14:30
    expect(REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_AFTERNOON_END).toBe(1080);  // 18:00
    expect(REMOTE_ASSISTANCE_CONSTANTS.BILLING_INCREMENT_MINUTES).toBe(15);
    expect(REMOTE_ASSISTANCE_CONSTANTS.IVA_RATE).toBe(0.23);
  });
});

describe('calculateRemoteAssistancePricing', () => {
  const baseInput: RemoteAssistancePricingInput = {
    startTime: '09:00',
    endTime: '10:00',
    isWeekendOrHoliday: false,
  };

  /**
   * MI-11: Business hours only — session 10:00-11:00 entirely within morning window
   * Validates: Requirements PRICE-AC-006, PRICE-BR-006
   */
  it('MI-11: business hours only — entire session at €45/h', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '10:00',
      endTime: '11:00',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalMinutes).toBe(60);
    expect(result.billingMinutes).toBe(60);
    expect(result.businessMinutes).toBe(60);
    expect(result.offHoursMinutes).toBe(0);
    expect(result.businessHoursValue).toBe(45); // 60min / 60 × €45
    expect(result.offHoursValue).toBe(0);
    expect(result.totalValue).toBe(45);
    expect(result.isZeroCost).toBe(false);
  });

  /**
   * MI-12: Off-hours only — session 20:00-21:00 entirely outside business windows
   * Validates: Requirements PRICE-AC-007, PRICE-BR-007
   */
  it('MI-12: off-hours only — entire session at €60/h', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '20:00',
      endTime: '21:00',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalMinutes).toBe(60);
    expect(result.billingMinutes).toBe(60);
    expect(result.businessMinutes).toBe(0);
    expect(result.offHoursMinutes).toBe(60);
    expect(result.businessHoursValue).toBe(0);
    expect(result.offHoursValue).toBe(60); // 60min / 60 × €60
    expect(result.totalValue).toBe(60);
    expect(result.isZeroCost).toBe(false);
  });

  /**
   * MI-13: Lunch gap crossing — session 12:30-13:30 splits at 13:00
   * Business [12:30-13:00] = 30min, Off-hours [13:00-13:30] = 30min
   * Raw 60min → billing 60min. businessValue = (30/60)*45 = 22.50, offHoursValue = (30/60)*60 = 30.00
   * Validates: Requirements PRICE-AC-008, PRICE-BR-008
   */
  it('MI-13: lunch gap crossing — split at 13:00', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '12:30',
      endTime: '13:30',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalMinutes).toBe(60);
    expect(result.billingMinutes).toBe(60);
    expect(result.businessMinutes).toBe(30);
    expect(result.offHoursMinutes).toBe(30);
    expect(result.businessHoursValue).toBe(22.5);  // 30min / 60 × €45
    expect(result.offHoursValue).toBe(30);          // 30min / 60 × €60
    expect(result.totalValue).toBe(52.5);
    expect(result.isZeroCost).toBe(false);

    // Verify breakdown segments
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0].isBusinessHours).toBe(true);
    expect(result.breakdown[1].isBusinessHours).toBe(false);
  });

  /**
   * MI-14: Afternoon boundary split — session 14:00-15:00 splits at 14:30
   * Off-hours [14:00-14:30] = 30min, Business [14:30-15:00] = 30min
   * offHoursValue = (30/60)*60 = 30.00, businessValue = (30/60)*45 = 22.50
   * Validates: Requirements PRICE-AC-008, PRICE-BR-008
   */
  it('MI-14: afternoon boundary split — split at 14:30', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '14:00',
      endTime: '15:00',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalMinutes).toBe(60);
    expect(result.billingMinutes).toBe(60);
    expect(result.businessMinutes).toBe(30);
    expect(result.offHoursMinutes).toBe(30);
    expect(result.offHoursValue).toBe(30);          // 30min / 60 × €60
    expect(result.businessHoursValue).toBe(22.5);   // 30min / 60 × €45
    expect(result.totalValue).toBe(52.5);
    expect(result.isZeroCost).toBe(false);

    // Verify breakdown segments order
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0].isBusinessHours).toBe(false); // off-hours first
    expect(result.breakdown[1].isBusinessHours).toBe(true);  // business second
  });

  /**
   * MI-15: Full-day crossing — session 08:00-19:00 crosses all boundaries
   * Segments: off [08:00-09:00]=60min, business [09:00-13:00]=240min,
   *           off [13:00-14:30]=90min, business [14:30-18:00]=210min, off [18:00-19:00]=60min
   * Total raw = 660min, billing = 660min (already multiple of 15)
   * Business raw = 450min, off-hours raw = 210min
   * Validates: Requirements PRICE-AC-006, PRICE-AC-007, PRICE-AC-008, PRICE-BR-006, PRICE-BR-007, PRICE-BR-008
   */
  it('MI-15: full-day crossing — multiple segments across all boundaries', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '08:00',
      endTime: '19:00',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalMinutes).toBe(660);
    expect(result.billingMinutes).toBe(660); // 660 is divisible by 15
    expect(result.isZeroCost).toBe(false);

    // Business: 450min, Off-hours: 210min (proportionally distributed)
    expect(result.businessMinutes + result.offHoursMinutes).toBe(660);
    expect(result.businessMinutes).toBe(450);
    expect(result.offHoursMinutes).toBe(210);

    // Values: business = 450/60 × 45 = 337.5, off = 210/60 × 60 = 210
    expect(result.businessHoursValue).toBe(337.5);
    expect(result.offHoursValue).toBe(210);
    expect(result.totalValue).toBe(547.5);

    // Verify 5 segments
    expect(result.breakdown.length).toBe(5);
  });

  /**
   * MI-16: Weekend → all off-hours — session 10:00-12:00 on weekend
   * Entire duration at €60/h regardless of time being within normal business window
   * Validates: Requirements PRICE-AC-009, PRICE-BR-010
   */
  it('MI-16: weekend → all off-hours regardless of time', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '10:00',
      endTime: '12:00',
      isWeekendOrHoliday: true,
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalMinutes).toBe(120);
    expect(result.billingMinutes).toBe(120);
    expect(result.businessMinutes).toBe(0);
    expect(result.offHoursMinutes).toBe(120);
    expect(result.businessHoursValue).toBe(0);
    expect(result.offHoursValue).toBe(120); // 120min / 60 × €60
    expect(result.totalValue).toBe(120);
    expect(result.isZeroCost).toBe(false);
  });

  /**
   * MI-17: 15-min rounding — session of 22 minutes rounds to 30 min billing
   * Raw 22min → billing 30min. Proportional distribution applies.
   * Validates: Requirements PRICE-BR-012
   */
  it('MI-17: 15-min rounding — 22 minutes rounds up to 30 min billing', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '10:00',
      endTime: '10:22',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalMinutes).toBe(22);
    expect(result.billingMinutes).toBe(30); // ceil(22/15) * 15 = 30
    expect(result.businessMinutes).toBe(30); // all within business hours
    expect(result.offHoursMinutes).toBe(0);
    // value = 30/60 × €45 = 22.50
    expect(result.totalValue).toBe(22.5);
  });

  /**
   * MI-18: Contrato → zero cost
   * Validates: Requirements PRICE-AC-011
   */
  it('MI-18: Contrato payment method → zero cost result', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '09:00',
      endTime: '10:00',
      paymentMethod: 'Contrato',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.isZeroCost).toBe(true);
    expect(result.totalValue).toBe(0);
    expect(result.businessHoursValue).toBe(0);
    expect(result.offHoursValue).toBe(0);
    expect(result.totalMinutes).toBe(0);
    expect(result.billingMinutes).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  /**
   * MI-19: Garantia → zero cost
   * Validates: Requirements PRICE-AC-011
   */
  it('MI-19: Garantia payment method → zero cost result', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '09:00',
      endTime: '10:00',
      paymentMethod: 'Garantia',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.isZeroCost).toBe(true);
    expect(result.totalValue).toBe(0);
    expect(result.businessHoursValue).toBe(0);
    expect(result.offHoursValue).toBe(0);
    expect(result.totalMinutes).toBe(0);
    expect(result.billingMinutes).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  /**
   * MI-20: Missing times → zeroed result
   * Validates: Requirements PRICE-AC-006
   */
  it('MI-20: missing times — returns zeroed result', () => {
    const input: RemoteAssistancePricingInput = {
      ...baseInput,
      startTime: '',
      endTime: '',
    };

    const result = calculateRemoteAssistancePricing(input);

    expect(result.totalValue).toBe(0);
    expect(result.businessHoursValue).toBe(0);
    expect(result.offHoursValue).toBe(0);
    expect(result.totalMinutes).toBe(0);
    expect(result.billingMinutes).toBe(0);
    expect(result.businessMinutes).toBe(0);
    expect(result.offHoursMinutes).toBe(0);
    expect(result.isZeroCost).toBe(false);
    expect(result.breakdown).toHaveLength(0);
  });
});
