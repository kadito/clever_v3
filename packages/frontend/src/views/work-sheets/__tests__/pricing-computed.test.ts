/**
 * MI-12: Frontend pricing computed (WorkSheet)
 *
 * Tests verify the branching logic used by the pricing computed in WorkSheetsDetailView:
 * - When `workSheet.data.pricingSnapshot` exists: returns values from `snapshot.calculated`
 * - When `workSheet.data.pricingSnapshot` is undefined (legacy): returns values from `calculateWorkSheetPricing()`
 * - Both paths return the same shape (same keys) — no visual distinction
 * - `displayMileageRate` returns `snapshot.rates.mileageRatePerKm` when snapshot exists
 * - `displayMileageRate` returns `WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM` for legacy
 *
 * Validates: Requirements PRICE-BR-004, PRICE-AC-003, PRICE-AC-011, PRICE-AC-012
 *
 * Approach: Unit-tests the computation logic directly (Option 1 from task description).
 * Extracts the same branching logic the computed property uses and tests it as pure functions,
 * avoiding complex Vue component mounting with all its dependencies.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWorkSheetPricing,
  WORK_SHEET_CONSTANTS,
} from '@clever/shared';
import type {
  WorkSheetData,
  WorkSheetPricingSnapshot,
} from '@clever/shared';

// --------------------------------------------------------------------------
// Helper: replicate the pricing computed logic from WorkSheetsDetailView.vue
// --------------------------------------------------------------------------

interface PricingComputedResult {
  hourlyRate: number;
  laborHours: number;
  laborPrice: number;
  hasDisplacement: boolean;
  travelFee: number;
  mileagePrice: number;
  totalKms: number;
  totalPrice: number;
}

/**
 * Replicates the `pricing` computed from WorkSheetsDetailView.vue.
 * If data has a pricingSnapshot, returns snapshot.calculated values.
 * Otherwise, falls back to calculateWorkSheetPricing() with current constants.
 */
function computePricing(data: WorkSheetData | null): PricingComputedResult | null {
  if (!data) return null;

  const snapshot = data.pricingSnapshot;

  if (snapshot) {
    // Anchored record: use stored calculated values (PRICE-BR-004)
    return {
      hourlyRate: snapshot.calculated.hourlyRate,
      laborHours: snapshot.calculated.laborHours,
      laborPrice: snapshot.calculated.laborPrice,
      hasDisplacement: data.displacement?.hasDisplacement ?? false,
      travelFee: snapshot.calculated.travelFee,
      mileagePrice: snapshot.calculated.mileagePrice,
      totalKms: data.displacement?.totalKms ?? 0,
      totalPrice: snapshot.calculated.totalPrice,
    };
  }

  // Legacy fallback: dynamic calculation with current constants (PRICE-AC-011)
  return calculateWorkSheetPricing({
    weekendHoliday: data.displacement?.weekendHoliday ?? false,
    hasDisplacement: data.displacement?.hasDisplacement ?? false,
    totalKms: data.displacement?.totalKms ?? 0,
    arrivalTime: data.request?.arrivalTime ?? '',
    departureTime: data.request?.departureTime ?? '',
  });
}

/**
 * Replicates the `displayMileageRate` computed from WorkSheetsDetailView.vue.
 */
function computeDisplayMileageRate(data: WorkSheetData | null): number {
  const snapshot = data?.pricingSnapshot;
  if (snapshot) {
    return snapshot.rates.mileageRatePerKm;
  }
  return WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM;
}

// --------------------------------------------------------------------------
// Test data builders
// --------------------------------------------------------------------------

function buildWorkSheetData(overrides?: Partial<WorkSheetData>): WorkSheetData {
  return {
    clientId: 'client-123',
    request: {
      date: '2024-01-15',
      receivedBy: 'Admin',
      assistanceDate: '2024-01-16',
      reason: 'Manutenção',
      arrivalTime: '09:00',
      departureTime: '11:00',
      totalHours: '2',
    },
    displacement: {
      hasDisplacement: true,
      weekendHoliday: false,
      oneWayKms: 50,
      totalKms: 100,
      paymentMethod: 'TRANSFERÊNCIA BANCÁRIA',
    },
    otherData: {
      serviceType: 'ASSISTÊNCIA PRESENCIAL',
      technician: { userId: 'u1', email: 'tech@test.com', firstName: 'João', lastName: 'Silva', userType: 'User' },
      warranty: false,
      contract: false,
      contractYear: '',
      materialUsed: false,
      equipment: false,
      totallyResolved: true,
      dumpReading: false,
      backup: false,
      remoteAccessCheck: false,
      anydesk: false,
      serviceReport: 'Tudo resolvido',
    },
    ...overrides,
  };
}

function buildSnapshot(overrides?: Partial<WorkSheetPricingSnapshot>): WorkSheetPricingSnapshot {
  return {
    rates: {
      hourlyRateWeekday: 60,
      hourlyRateWeekendHoliday: 80,
      mileageRatePerKm: 0.50,
      travelFeeShort: 50,
      travelFeeLong: 70,
      travelFeeThresholdKm: 200,
      minimumHours: 1,
      ...overrides?.rates,
    },
    calculated: {
      hourlyRate: 60,
      laborHours: 2,
      laborPrice: 120,
      travelFee: 50,
      mileagePrice: 50,
      totalPrice: 220,
      ...overrides?.calculated,
    },
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('MI-12: Frontend pricing computed (WorkSheet)', () => {
  describe('Snapshot path: returns snapshot.calculated values (PRICE-BR-004, PRICE-AC-003)', () => {
    it('returns hourlyRate from snapshot.calculated, not from dynamic calculation', () => {
      const snapshot = buildSnapshot({ calculated: { hourlyRate: 60, laborHours: 2, laborPrice: 120, travelFee: 50, mileagePrice: 50, totalPrice: 220 } });
      const data = buildWorkSheetData({ pricingSnapshot: snapshot });

      const result = computePricing(data);

      expect(result).not.toBeNull();
      expect(result!.hourlyRate).toBe(60);
      // If dynamic calculation were used with weekday rate, it would be 55
      expect(result!.hourlyRate).not.toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY);
    });

    it('returns laborHours and laborPrice from snapshot.calculated', () => {
      const snapshot = buildSnapshot({ calculated: { hourlyRate: 80, laborHours: 3.5, laborPrice: 280, travelFee: 0, mileagePrice: 0, totalPrice: 280 } });
      const data = buildWorkSheetData({ pricingSnapshot: snapshot });

      const result = computePricing(data);

      expect(result!.laborHours).toBe(3.5);
      expect(result!.laborPrice).toBe(280);
    });

    it('returns travelFee and mileagePrice from snapshot.calculated', () => {
      const snapshot = buildSnapshot({ calculated: { hourlyRate: 60, laborHours: 2, laborPrice: 120, travelFee: 70, mileagePrice: 75, totalPrice: 265 } });
      const data = buildWorkSheetData({ pricingSnapshot: snapshot });

      const result = computePricing(data);

      expect(result!.travelFee).toBe(70);
      expect(result!.mileagePrice).toBe(75);
    });

    it('returns totalPrice from snapshot.calculated', () => {
      const snapshot = buildSnapshot({ calculated: { hourlyRate: 60, laborHours: 2, laborPrice: 120, travelFee: 50, mileagePrice: 50, totalPrice: 220 } });
      const data = buildWorkSheetData({ pricingSnapshot: snapshot });

      const result = computePricing(data);

      expect(result!.totalPrice).toBe(220);
    });

    it('reads hasDisplacement and totalKms from data fields, not snapshot', () => {
      const snapshot = buildSnapshot();
      const data = buildWorkSheetData({
        pricingSnapshot: snapshot,
        displacement: {
          hasDisplacement: false,
          weekendHoliday: false,
          oneWayKms: 0,
          totalKms: 0,
          paymentMethod: 'PENDENTE',
        },
      });

      const result = computePricing(data);

      // hasDisplacement and totalKms come from data.displacement, not snapshot
      expect(result!.hasDisplacement).toBe(false);
      expect(result!.totalKms).toBe(0);
      // But monetary values still come from snapshot
      expect(result!.totalPrice).toBe(snapshot.calculated.totalPrice);
    });
  });

  describe('Legacy path: calls calculateWorkSheetPricing() with current constants (PRICE-AC-011)', () => {
    it('returns dynamic calculation result when pricingSnapshot is undefined', () => {
      const data = buildWorkSheetData({ pricingSnapshot: undefined });

      const result = computePricing(data);

      // Should match calculateWorkSheetPricing with same inputs
      const expected = calculateWorkSheetPricing({
        weekendHoliday: false,
        hasDisplacement: true,
        totalKms: 100,
        arrivalTime: '09:00',
        departureTime: '11:00',
      });

      expect(result).not.toBeNull();
      expect(result!.hourlyRate).toBe(expected.hourlyRate);
      expect(result!.laborHours).toBe(expected.laborHours);
      expect(result!.laborPrice).toBe(expected.laborPrice);
      expect(result!.travelFee).toBe(expected.travelFee);
      expect(result!.mileagePrice).toBe(expected.mileagePrice);
      expect(result!.totalPrice).toBe(expected.totalPrice);
    });

    it('uses WORK_SHEET_CONSTANTS values for legacy records', () => {
      const data = buildWorkSheetData({
        pricingSnapshot: undefined,
        displacement: {
          hasDisplacement: false,
          weekendHoliday: false,
          oneWayKms: 0,
          totalKms: 0,
          paymentMethod: 'PENDENTE',
        },
      });

      const result = computePricing(data);

      // Weekday rate should be WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY
      expect(result!.hourlyRate).toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY);
    });

    it('uses weekend rate from constants when weekendHoliday is true', () => {
      const data = buildWorkSheetData({
        pricingSnapshot: undefined,
        displacement: {
          hasDisplacement: false,
          weekendHoliday: true,
          oneWayKms: 0,
          totalKms: 0,
          paymentMethod: 'PENDENTE',
        },
      });

      const result = computePricing(data);

      expect(result!.hourlyRate).toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY);
    });

    it('returns null when data is null', () => {
      const result = computePricing(null);
      expect(result).toBeNull();
    });
  });

  describe('Both paths return same shape — no visual distinction (PRICE-AC-012)', () => {
    it('snapshot path and legacy path return objects with identical keys', () => {
      const snapshotData = buildWorkSheetData({ pricingSnapshot: buildSnapshot() });
      const legacyData = buildWorkSheetData({ pricingSnapshot: undefined });

      const snapshotResult = computePricing(snapshotData);
      const legacyResult = computePricing(legacyData);

      expect(snapshotResult).not.toBeNull();
      expect(legacyResult).not.toBeNull();

      const snapshotKeys = Object.keys(snapshotResult!).sort();
      const legacyKeys = Object.keys(legacyResult!).sort();

      expect(snapshotKeys).toEqual(legacyKeys);
    });

    it('both paths return the expected keys: hourlyRate, laborHours, laborPrice, hasDisplacement, travelFee, mileagePrice, totalKms, totalPrice', () => {
      const expectedKeys = [
        'hasDisplacement',
        'hourlyRate',
        'laborHours',
        'laborPrice',
        'mileagePrice',
        'totalKms',
        'totalPrice',
        'travelFee',
      ].sort();

      const snapshotData = buildWorkSheetData({ pricingSnapshot: buildSnapshot() });
      const legacyData = buildWorkSheetData({ pricingSnapshot: undefined });

      const snapshotResult = computePricing(snapshotData);
      const legacyResult = computePricing(legacyData);

      expect(Object.keys(snapshotResult!).sort()).toEqual(expectedKeys);
      expect(Object.keys(legacyResult!).sort()).toEqual(expectedKeys);
    });

    it('all values are numbers or booleans in both paths (type consistency)', () => {
      const snapshotData = buildWorkSheetData({ pricingSnapshot: buildSnapshot() });
      const legacyData = buildWorkSheetData({ pricingSnapshot: undefined });

      const snapshotResult = computePricing(snapshotData)!;
      const legacyResult = computePricing(legacyData)!;

      for (const key of Object.keys(snapshotResult) as (keyof PricingComputedResult)[]) {
        const snapshotType = typeof snapshotResult[key];
        const legacyType = typeof legacyResult[key];
        expect(snapshotType).toBe(legacyType);
        expect(['number', 'boolean']).toContain(snapshotType);
      }
    });
  });

  describe('displayMileageRate: snapshot.rates.mileageRatePerKm vs WORK_SHEET_CONSTANTS', () => {
    it('returns snapshot.rates.mileageRatePerKm when snapshot exists', () => {
      const customRate = 0.65;
      const snapshot = buildSnapshot({ rates: { hourlyRateWeekday: 60, hourlyRateWeekendHoliday: 80, mileageRatePerKm: customRate, travelFeeShort: 50, travelFeeLong: 70, travelFeeThresholdKm: 200, minimumHours: 1 } });
      const data = buildWorkSheetData({ pricingSnapshot: snapshot });

      const rate = computeDisplayMileageRate(data);

      expect(rate).toBe(customRate);
      expect(rate).not.toBe(WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM);
    });

    it('returns WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM for legacy records (no snapshot)', () => {
      const data = buildWorkSheetData({ pricingSnapshot: undefined });

      const rate = computeDisplayMileageRate(data);

      expect(rate).toBe(WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM);
    });

    it('returns WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM when data is null', () => {
      const rate = computeDisplayMileageRate(null);

      expect(rate).toBe(WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM);
    });

    it('uses correct anchored rate even when it differs from current constant', () => {
      // Simulate a scenario where constants have changed since record creation
      const anchoredRate = 0.35; // Different from current 0.45
      const snapshot = buildSnapshot({ rates: { hourlyRateWeekday: 50, hourlyRateWeekendHoliday: 65, mileageRatePerKm: anchoredRate, travelFeeShort: 40, travelFeeLong: 55, travelFeeThresholdKm: 150, minimumHours: 1 } });
      const data = buildWorkSheetData({ pricingSnapshot: snapshot });

      const rate = computeDisplayMileageRate(data);

      expect(rate).toBe(anchoredRate);
      expect(rate).not.toBe(WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM);
    });
  });
});
