/**
 * MI-13: Frontend pricing computed (RemoteAssistance)
 *
 * Tests verify the branching logic used by the pricing computed in RemoteAssistanceDetailView:
 * - When `remoteAssistance.data.pricingSnapshot` exists: `pricingResult` computed returns values from `snapshot.calculated`
 * - When `remoteAssistance.data.pricingSnapshot` is undefined (legacy): `pricingResult` computed returns values from `calculateRemoteAssistancePricing()`
 * - Both paths return the same shape (same keys) — no visual distinction
 * - `displayRates` returns `snapshot.rates.priceBusinessHours` and `snapshot.rates.priceAfterHours` when snapshot exists
 * - `displayRates` returns `REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS` and `PRICE_AFTER_HOURS` for legacy
 * - `pricingResult` returns null when times are missing (start or end not present)
 *
 * Validates: Requirements PRICE-BR-004, PRICE-AC-006, PRICE-AC-011, PRICE-AC-012
 *
 * Approach: Unit-tests the computation logic directly (same as MI-12).
 * Extracts the same branching logic the computed property uses and tests it as pure functions,
 * avoiding complex Vue component mounting with all its dependencies.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRemoteAssistancePricing,
  REMOTE_ASSISTANCE_CONSTANTS,
} from '@clever/shared';
import type {
  RemoteAssistanceData,
  RemoteAssistancePricingSnapshot,
} from '@clever/shared';

// --------------------------------------------------------------------------
// Helper: replicate the pricing computed logic from RemoteAssistanceDetailView.vue
// --------------------------------------------------------------------------

interface PricingComputedResult {
  totalValue: number;
  businessHoursValue: number;
  offHoursValue: number;
  totalMinutes: number;
  billingMinutes: number;
  businessMinutes: number;
  offHoursMinutes: number;
  isZeroCost: boolean;
}

interface DisplayRatesResult {
  businessRate: number;
  afterHoursRate: number;
}

/**
 * Replicates the `pricingResult` computed from RemoteAssistanceDetailView.vue.
 * If data has a pricingSnapshot, returns snapshot.calculated values.
 * Otherwise, falls back to calculateRemoteAssistancePricing() with current constants.
 */
function computePricingResult(data: (RemoteAssistanceData & { weekendHoliday?: boolean }) | null): PricingComputedResult | null {
  if (!data) return null;

  if (!data.inicioAssistencia || !data.fimAssistencia) {
    return null;
  }

  const snapshot = data.pricingSnapshot;

  if (snapshot) {
    // Anchored record: use stored calculated values (PRICE-BR-004)
    return {
      totalValue: snapshot.calculated.totalValue,
      businessHoursValue: snapshot.calculated.businessHoursValue,
      offHoursValue: snapshot.calculated.offHoursValue,
      totalMinutes: snapshot.calculated.totalMinutes,
      billingMinutes: snapshot.calculated.billingMinutes,
      businessMinutes: snapshot.calculated.businessMinutes,
      offHoursMinutes: snapshot.calculated.offHoursMinutes,
      isZeroCost: snapshot.calculated.isZeroCost,
    };
  }

  // Legacy fallback: dynamic calculation with current constants (PRICE-AC-011)
  return calculateRemoteAssistancePricing({
    startTime: data.inicioAssistencia ?? '',
    endTime: data.fimAssistencia ?? '',
    isWeekendOrHoliday: data.weekendHoliday ?? false,
    paymentMethod: data.paymentMethod ?? '',
  });
}

/**
 * Replicates the `displayRates` computed from RemoteAssistanceDetailView.vue.
 */
function computeDisplayRates(data: (RemoteAssistanceData & { weekendHoliday?: boolean }) | null): DisplayRatesResult {
  const snapshot = data?.pricingSnapshot;
  if (snapshot) {
    return {
      businessRate: snapshot.rates.priceBusinessHours,
      afterHoursRate: snapshot.rates.priceAfterHours,
    };
  }
  // Legacy fallback
  return {
    businessRate: REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS,
    afterHoursRate: REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS,
  };
}

// --------------------------------------------------------------------------
// Test data builders
// --------------------------------------------------------------------------

function buildRemoteAssistanceData(overrides?: Partial<RemoteAssistanceData>): RemoteAssistanceData {
  return {
    clientId: 'client-123',
    tipoAssistencia: 'REMOTA',
    tecnicoResponsavel: { userId: 'u1', email: 'tech@test.com', firstName: 'João', lastName: 'Silva', userType: 'User' },
    dataPedido: '2024-01-15',
    dataAssistencia: '2024-01-16',
    inicioAssistencia: '2024-01-16T09:00:00',
    fimAssistencia: '2024-01-16T11:00:00',
    motivoPedido: 'Problema técnico',
    relatorioAssistencia: 'Resolvido remotamente',
    valorAssist: 90,
    paymentMethod: 'Faturação',
    resolvido: true,
    anexos: '',
    anexosFiles: [],
    ...overrides,
  } as RemoteAssistanceData;
}

function buildSnapshot(overrides?: Partial<RemoteAssistancePricingSnapshot>): RemoteAssistancePricingSnapshot {
  return {
    rates: {
      priceBusinessHours: 45,
      priceAfterHours: 60,
      billingIncrementMinutes: 15,
      businessHoursMorningStart: 540,
      businessHoursMorningEnd: 750,
      businessHoursAfternoonStart: 870,
      businessHoursAfternoonEnd: 1080,
      ...overrides?.rates,
    },
    calculated: {
      totalValue: 90,
      businessHoursValue: 90,
      offHoursValue: 0,
      totalMinutes: 120,
      billingMinutes: 120,
      businessMinutes: 120,
      offHoursMinutes: 0,
      isZeroCost: false,
      ...overrides?.calculated,
    },
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('MI-13: Frontend pricing computed (RemoteAssistance)', () => {
  describe('Snapshot path: returns snapshot.calculated values (PRICE-BR-004, PRICE-AC-006)', () => {
    it('returns totalValue from snapshot.calculated, not from dynamic calculation', () => {
      const snapshot = buildSnapshot({ calculated: { totalValue: 150, businessHoursValue: 90, offHoursValue: 60, totalMinutes: 180, billingMinutes: 180, businessMinutes: 120, offHoursMinutes: 60, isZeroCost: false } });
      const data = buildRemoteAssistanceData({ pricingSnapshot: snapshot });

      const result = computePricingResult(data);

      expect(result).not.toBeNull();
      expect(result!.totalValue).toBe(150);
    });

    it('returns businessHoursValue and offHoursValue from snapshot.calculated', () => {
      const snapshot = buildSnapshot({ calculated: { totalValue: 200, businessHoursValue: 135, offHoursValue: 65, totalMinutes: 210, billingMinutes: 210, businessMinutes: 180, offHoursMinutes: 30, isZeroCost: false } });
      const data = buildRemoteAssistanceData({ pricingSnapshot: snapshot });

      const result = computePricingResult(data);

      expect(result!.businessHoursValue).toBe(135);
      expect(result!.offHoursValue).toBe(65);
    });

    it('returns time breakdown from snapshot.calculated', () => {
      const snapshot = buildSnapshot({ calculated: { totalValue: 90, businessHoursValue: 90, offHoursValue: 0, totalMinutes: 120, billingMinutes: 120, businessMinutes: 120, offHoursMinutes: 0, isZeroCost: false } });
      const data = buildRemoteAssistanceData({ pricingSnapshot: snapshot });

      const result = computePricingResult(data);

      expect(result!.totalMinutes).toBe(120);
      expect(result!.billingMinutes).toBe(120);
      expect(result!.businessMinutes).toBe(120);
      expect(result!.offHoursMinutes).toBe(0);
    });

    it('returns isZeroCost from snapshot.calculated', () => {
      const snapshot = buildSnapshot({ calculated: { totalValue: 0, businessHoursValue: 0, offHoursValue: 0, totalMinutes: 60, billingMinutes: 60, businessMinutes: 60, offHoursMinutes: 0, isZeroCost: true } });
      const data = buildRemoteAssistanceData({ pricingSnapshot: snapshot, paymentMethod: 'Contrato' });

      const result = computePricingResult(data);

      expect(result!.isZeroCost).toBe(true);
      expect(result!.totalValue).toBe(0);
    });
  });

  describe('Legacy path: calls calculateRemoteAssistancePricing() with current constants (PRICE-AC-011)', () => {
    it('returns dynamic calculation result when pricingSnapshot is undefined', () => {
      const data = buildRemoteAssistanceData({ pricingSnapshot: undefined });

      const result = computePricingResult(data);

      // Should match calculateRemoteAssistancePricing with same inputs
      const expected = calculateRemoteAssistancePricing({
        startTime: data.inicioAssistencia,
        endTime: data.fimAssistencia,
        isWeekendOrHoliday: false,
        paymentMethod: data.paymentMethod,
      });

      expect(result).not.toBeNull();
      expect(result!.totalValue).toBe(expected.totalValue);
      expect(result!.businessHoursValue).toBe(expected.businessHoursValue);
      expect(result!.offHoursValue).toBe(expected.offHoursValue);
      expect(result!.totalMinutes).toBe(expected.totalMinutes);
      expect(result!.billingMinutes).toBe(expected.billingMinutes);
      expect(result!.businessMinutes).toBe(expected.businessMinutes);
      expect(result!.offHoursMinutes).toBe(expected.offHoursMinutes);
      expect(result!.isZeroCost).toBe(expected.isZeroCost);
    });

    it('uses REMOTE_ASSISTANCE_CONSTANTS rates for legacy records', () => {
      const data = buildRemoteAssistanceData({
        pricingSnapshot: undefined,
        paymentMethod: 'Faturação',
      });

      const result = computePricingResult(data);

      // For a 09:00–11:00 session (fully business hours), the hourly rate should be PRICE_BUSINESS_HOURS
      expect(result).not.toBeNull();
      // businessHoursValue should be calculable from PRICE_BUSINESS_HOURS
      const expectedBizValue = (result!.businessMinutes / 60) * REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS;
      expect(result!.businessHoursValue).toBe(expectedBizValue);
    });

    it('returns null when data is null', () => {
      const result = computePricingResult(null);
      expect(result).toBeNull();
    });
  });

  describe('pricingResult returns null when times are missing', () => {
    it('returns null when inicioAssistencia is empty string', () => {
      const data = buildRemoteAssistanceData({
        pricingSnapshot: undefined,
        inicioAssistencia: '',
      });

      const result = computePricingResult(data);

      expect(result).toBeNull();
    });

    it('returns null when fimAssistencia is empty string', () => {
      const data = buildRemoteAssistanceData({
        pricingSnapshot: undefined,
        fimAssistencia: '',
      });

      const result = computePricingResult(data);

      expect(result).toBeNull();
    });

    it('returns null when both times are missing', () => {
      const data = buildRemoteAssistanceData({
        pricingSnapshot: undefined,
        inicioAssistencia: '',
        fimAssistencia: '',
      });

      const result = computePricingResult(data);

      expect(result).toBeNull();
    });
  });

  describe('Both paths return same shape — no visual distinction (PRICE-AC-012)', () => {
    it('snapshot path and legacy path return objects with identical required keys used by the template', () => {
      const snapshotData = buildRemoteAssistanceData({ pricingSnapshot: buildSnapshot() });
      const legacyData = buildRemoteAssistanceData({ pricingSnapshot: undefined });

      const snapshotResult = computePricingResult(snapshotData);
      const legacyResult = computePricingResult(legacyData);

      expect(snapshotResult).not.toBeNull();
      expect(legacyResult).not.toBeNull();

      // All keys from snapshot path must exist in legacy path (template uses these)
      const snapshotKeys = Object.keys(snapshotResult!).sort();
      const legacyKeys = Object.keys(legacyResult!).sort();

      for (const key of snapshotKeys) {
        expect(legacyKeys).toContain(key);
      }
    });

    it('both paths contain the expected keys used by the template: totalValue, businessHoursValue, offHoursValue, totalMinutes, billingMinutes, businessMinutes, offHoursMinutes, isZeroCost', () => {
      const requiredKeys = [
        'billingMinutes',
        'businessHoursValue',
        'businessMinutes',
        'isZeroCost',
        'offHoursMinutes',
        'offHoursValue',
        'totalMinutes',
        'totalValue',
      ];

      const snapshotData = buildRemoteAssistanceData({ pricingSnapshot: buildSnapshot() });
      const legacyData = buildRemoteAssistanceData({ pricingSnapshot: undefined });

      const snapshotResult = computePricingResult(snapshotData);
      const legacyResult = computePricingResult(legacyData);

      for (const key of requiredKeys) {
        expect(snapshotResult).toHaveProperty(key);
        expect(legacyResult).toHaveProperty(key);
      }
    });

    it('all values are numbers or booleans in both paths (type consistency)', () => {
      const snapshotData = buildRemoteAssistanceData({ pricingSnapshot: buildSnapshot() });
      const legacyData = buildRemoteAssistanceData({ pricingSnapshot: undefined });

      const snapshotResult = computePricingResult(snapshotData)!;
      const legacyResult = computePricingResult(legacyData)!;

      for (const key of Object.keys(snapshotResult) as (keyof PricingComputedResult)[]) {
        const snapshotType = typeof snapshotResult[key];
        const legacyType = typeof legacyResult[key];
        expect(snapshotType).toBe(legacyType);
        expect(['number', 'boolean']).toContain(snapshotType);
      }
    });
  });

  describe('displayRates: snapshot.rates vs REMOTE_ASSISTANCE_CONSTANTS', () => {
    it('returns snapshot.rates.priceBusinessHours and priceAfterHours when snapshot exists', () => {
      const customBusinessRate = 50;
      const customAfterHoursRate = 75;
      const snapshot = buildSnapshot({
        rates: {
          priceBusinessHours: customBusinessRate,
          priceAfterHours: customAfterHoursRate,
          billingIncrementMinutes: 15,
          businessHoursMorningStart: 540,
          businessHoursMorningEnd: 750,
          businessHoursAfternoonStart: 870,
          businessHoursAfternoonEnd: 1080,
        },
      });
      const data = buildRemoteAssistanceData({ pricingSnapshot: snapshot });

      const rates = computeDisplayRates(data);

      expect(rates.businessRate).toBe(customBusinessRate);
      expect(rates.afterHoursRate).toBe(customAfterHoursRate);
      expect(rates.businessRate).not.toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS);
      expect(rates.afterHoursRate).not.toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS);
    });

    it('returns REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS and PRICE_AFTER_HOURS for legacy records (no snapshot)', () => {
      const data = buildRemoteAssistanceData({ pricingSnapshot: undefined });

      const rates = computeDisplayRates(data);

      expect(rates.businessRate).toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS);
      expect(rates.afterHoursRate).toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS);
    });

    it('returns REMOTE_ASSISTANCE_CONSTANTS values when data is null', () => {
      const rates = computeDisplayRates(null);

      expect(rates.businessRate).toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS);
      expect(rates.afterHoursRate).toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS);
    });

    it('uses correct anchored rates even when they differ from current constants', () => {
      // Simulate a scenario where constants have changed since record creation
      const anchoredBusinessRate = 35;
      const anchoredAfterHoursRate = 50;
      const snapshot = buildSnapshot({
        rates: {
          priceBusinessHours: anchoredBusinessRate,
          priceAfterHours: anchoredAfterHoursRate,
          billingIncrementMinutes: 15,
          businessHoursMorningStart: 540,
          businessHoursMorningEnd: 750,
          businessHoursAfternoonStart: 870,
          businessHoursAfternoonEnd: 1080,
        },
      });
      const data = buildRemoteAssistanceData({ pricingSnapshot: snapshot });

      const rates = computeDisplayRates(data);

      expect(rates.businessRate).toBe(anchoredBusinessRate);
      expect(rates.afterHoursRate).toBe(anchoredAfterHoursRate);
      expect(rates.businessRate).not.toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS);
      expect(rates.afterHoursRate).not.toBe(REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS);
    });
  });
});
