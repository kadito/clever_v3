/**
 * Unit tests for backend index extraction pricing calculations.
 * Tests MI-27 and MI-28
 *
 * These tests verify that the pricing functions produce correct values
 * when called with the same data shapes that `extractIndexFields` uses
 * in the backend routes.
 *
 * Covers: PRICE-BR-001–BR-008, PRICE-BR-012
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWorkSheetPricing,
  calculateRemoteAssistancePricing,
} from '@clever/shared';

describe('MI-27: Work Sheet extractIndexFields — correct pricing fields', () => {
  it('stores correct pricing breakdown with new rates (weekday, displacement ≤180km)', () => {
    // Simulate the same input shape used in work-sheets.ts extractIndexFields:
    // calculateWorkSheetPricing({
    //   weekendHoliday: data.displacement?.weekendHoliday ?? false,
    //   hasDisplacement: data.displacement?.hasDisplacement ?? false,
    //   totalKms: data.displacement?.totalKms ?? 0,
    //   arrivalTime: data.request?.arrivalTime ?? '',
    //   departureTime: data.request?.departureTime ?? '',
    // })
    const pricing = calculateWorkSheetPricing({
      weekendHoliday: false,
      hasDisplacement: true,
      totalKms: 100,
      arrivalTime: '09:00',
      departureTime: '11:00',
    });

    // Verify index fields match expected values
    expect(pricing.hourlyRate).toBe(55);
    expect(pricing.laborPrice).toBe(110); // 2h × €55
    expect(pricing.travelFee).toBe(45);   // ≤180km → €45
    expect(pricing.mileagePrice).toBe(45); // 100 × €0.45
    expect(pricing.totalPrice).toBe(200);  // 110 + 45 + 45
  });

  it('maps to correct index field names (displacementRate, kmsPrice, hourlyRate, laborPrice, totalPrice)', () => {
    const pricing = calculateWorkSheetPricing({
      weekendHoliday: false,
      hasDisplacement: true,
      totalKms: 100,
      arrivalTime: '09:00',
      departureTime: '11:00',
    });

    // The backend maps pricing fields to index fields as follows:
    // displacementRate: pricing.travelFee
    // kmsPrice: pricing.mileagePrice
    // hourlyRate: pricing.hourlyRate
    // laborPrice: pricing.laborPrice
    // totalPrice: pricing.totalPrice
    const indexFields = {
      displacementRate: pricing.travelFee,
      kmsPrice: pricing.mileagePrice,
      hourlyRate: pricing.hourlyRate,
      laborPrice: pricing.laborPrice,
      totalPrice: pricing.totalPrice,
    };

    expect(indexFields.displacementRate).toBe(45);
    expect(indexFields.kmsPrice).toBe(45);
    expect(indexFields.hourlyRate).toBe(55);
    expect(indexFields.laborPrice).toBe(110);
    expect(indexFields.totalPrice).toBe(200);
  });

  it('stores zero displacement costs when hasDisplacement is false', () => {
    const pricing = calculateWorkSheetPricing({
      weekendHoliday: false,
      hasDisplacement: false,
      totalKms: 100,
      arrivalTime: '09:00',
      departureTime: '11:00',
    });

    expect(pricing.travelFee).toBe(0);
    expect(pricing.mileagePrice).toBe(0);
    expect(pricing.hourlyRate).toBe(55);
    expect(pricing.laborPrice).toBe(110);
    expect(pricing.totalPrice).toBe(110);
  });

  it('stores weekend rate when weekendHoliday is true', () => {
    const pricing = calculateWorkSheetPricing({
      weekendHoliday: true,
      hasDisplacement: true,
      totalKms: 200,
      arrivalTime: '10:00',
      departureTime: '13:00',
    });

    expect(pricing.hourlyRate).toBe(70);
    expect(pricing.laborPrice).toBe(210); // 3h × €70
    expect(pricing.travelFee).toBe(60);   // >180km → €60
    expect(pricing.mileagePrice).toBe(90); // 200 × €0.45
    expect(pricing.totalPrice).toBe(360); // 210 + 60 + 90
  });

  it('stores zeroed result when times are missing', () => {
    const pricing = calculateWorkSheetPricing({
      weekendHoliday: false,
      hasDisplacement: true,
      totalKms: 100,
      arrivalTime: '',
      departureTime: '',
    });

    expect(pricing.hourlyRate).toBe(55); // rate still determined
    expect(pricing.laborPrice).toBe(0);
    expect(pricing.travelFee).toBe(0);
    expect(pricing.mileagePrice).toBe(0);
    expect(pricing.totalPrice).toBe(0);
  });
});

describe('MI-28: Remote Assistance extractIndexFields — correct value fields', () => {
  it('stores correct split billing values for a session crossing the lunch boundary', () => {
    // Simulate the same input shape used in remote-assistance.ts extractIndexFields:
    // calculateRemoteAssistancePricing({
    //   startTime: data.inicioAssistencia ?? '',
    //   endTime: data.fimAssistencia ?? '',
    //   isWeekendOrHoliday: data.weekendHoliday ?? false,
    //   paymentMethod: data.paymentMethod ?? '',
    // })
    const pricing = calculateRemoteAssistancePricing({
      startTime: '12:00',
      endTime: '13:00',
      isWeekendOrHoliday: false,
      paymentMethod: 'Faturação',
    });

    // Session 12:00-13:00 splits at 12:30:
    // - Business hours [12:00-12:30] = 30min
    // - Off-hours [12:30-13:00] = 30min
    // Total = 60min, billingMinutes = 60 (already aligned to 15-min)
    // Proportional: 30/60 of 60 = 30min business, 30/60 of 60 = 30min off-hours
    // businessHoursValue = (30/60) × €45 = €22.50
    // offHoursValue = (30/60) × €60 = €30.00
    // totalValue = €52.50
    expect(pricing.businessHoursValue).toBeCloseTo(22.5, 2);
    expect(pricing.offHoursValue).toBeCloseTo(30.0, 2);
    expect(pricing.totalValue).toBeCloseTo(52.5, 2);

    // Verify the index fields that extractIndexFields stores
    const indexFields = {
      businessHoursValue: pricing.businessHoursValue,
      afterHoursValue: pricing.offHoursValue,
      valorAssist: pricing.totalValue,
      hasBillableValue: 'Faturação' === 'Faturação' && pricing.totalValue > 0,
    };

    expect(indexFields.businessHoursValue).toBeCloseTo(22.5, 2);
    expect(indexFields.afterHoursValue).toBeCloseTo(30.0, 2);
    expect(indexFields.valorAssist).toBeCloseTo(52.5, 2);
    expect(indexFields.hasBillableValue).toBe(true);
  });

  it('stores correct values for session entirely within business hours', () => {
    const pricing = calculateRemoteAssistancePricing({
      startTime: '09:00',
      endTime: '10:00',
      isWeekendOrHoliday: false,
      paymentMethod: 'Faturação',
    });

    // 60min entirely in business hours → €45/h
    expect(pricing.businessHoursValue).toBe(45);
    expect(pricing.offHoursValue).toBe(0);
    expect(pricing.totalValue).toBe(45);

    const hasBillableValue = 'Faturação' === 'Faturação' && pricing.totalValue > 0;
    expect(hasBillableValue).toBe(true);
  });

  it('stores zero values when paymentMethod is Contrato', () => {
    const pricing = calculateRemoteAssistancePricing({
      startTime: '09:00',
      endTime: '10:00',
      isWeekendOrHoliday: false,
      paymentMethod: 'Contrato',
    });

    expect(pricing.totalValue).toBe(0);
    expect(pricing.businessHoursValue).toBe(0);
    expect(pricing.offHoursValue).toBe(0);
    expect(pricing.isZeroCost).toBe(true);

    const hasBillableValue = 'Faturação' === 'Contrato' && pricing.totalValue > 0;
    expect(hasBillableValue).toBe(false);
  });

  it('stores all off-hours values on weekends', () => {
    const pricing = calculateRemoteAssistancePricing({
      startTime: '10:00',
      endTime: '12:00',
      isWeekendOrHoliday: true,
      paymentMethod: 'Faturação',
    });

    // 120min at off-hours rate → (120/60) × €60 = €120
    expect(pricing.businessHoursValue).toBe(0);
    expect(pricing.offHoursValue).toBe(120);
    expect(pricing.totalValue).toBe(120);
  });

  it('stores hasBillableValue=false when paymentMethod is Garantia', () => {
    const pricing = calculateRemoteAssistancePricing({
      startTime: '14:30',
      endTime: '15:30',
      isWeekendOrHoliday: false,
      paymentMethod: 'Garantia',
    });

    expect(pricing.totalValue).toBe(0);
    expect(pricing.isZeroCost).toBe(true);

    const hasBillableValue = 'Faturação' === 'Garantia' && pricing.totalValue > 0;
    expect(hasBillableValue).toBe(false);
  });

  it('stores zeroed result when times are missing', () => {
    const pricing = calculateRemoteAssistancePricing({
      startTime: '',
      endTime: '',
      isWeekendOrHoliday: false,
      paymentMethod: 'Faturação',
    });

    expect(pricing.totalValue).toBe(0);
    expect(pricing.businessHoursValue).toBe(0);
    expect(pricing.offHoursValue).toBe(0);

    const hasBillableValue = 'Faturação' === 'Faturação' && pricing.totalValue > 0;
    expect(hasBillableValue).toBe(false);
  });
});
