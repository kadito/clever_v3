import { describe, it, expect } from 'vitest';
import { extractWorkSheetDebtTransaction } from '../balance-extraction';
import type { WorkSheet } from '../types/work-sheets/types';
import type { WorkSheetPricingSnapshot } from '../types/work-sheets/types';

/**
 * MI-11: extractWorkSheetDebtTransaction()
 * Validates: Requirements PRICE-BR-009
 *
 * Tests verify that balance extraction reads anchored price from pricingSnapshot
 * when available, and falls back to calculateWorkSheetTotals for legacy records.
 */
describe('MI-11: extractWorkSheetDebtTransaction() with anchored pricing', () => {
  /**
   * Helper to build a minimal WorkSheet object matching the real interface shape.
   */
  function buildMockWorkSheet(overrides: {
    warranty?: boolean;
    paymentMethod?: string;
    pricingSnapshot?: WorkSheetPricingSnapshot;
    arrivalTime?: string;
    departureTime?: string;
    hasDisplacement?: boolean;
    totalKms?: number;
    weekendHoliday?: boolean;
  }): WorkSheet {
    return {
      uuid: 'test-uuid-1234',
      contentType: 'work-sheets',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'test-user',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'test-user',
      version: 1,
      isDeleted: false,
      data: {
        clientId: 'client-uuid-1234',
        request: {
          date: '2024-01-01',
          receivedBy: 'Test',
          assistanceDate: '2024-01-01',
          reason: 'Test reason',
          arrivalTime: overrides.arrivalTime ?? '09:00',
          departureTime: overrides.departureTime ?? '11:00',
          totalHours: '02:00',
        },
        displacement: {
          hasDisplacement: overrides.hasDisplacement ?? true,
          weekendHoliday: overrides.weekendHoliday ?? false,
          oneWayKms: (overrides.totalKms ?? 100) / 2,
          totalKms: overrides.totalKms ?? 100,
          paymentMethod: (overrides.paymentMethod ?? 'PENDENTE') as WorkSheet['data']['displacement']['paymentMethod'],
        },
        otherData: {
          serviceType: 'ASSISTÊNCIA PRESENCIAL',
          technician: {
            userId: 'tech-1',
            email: 'tech@test.com',
            firstName: 'Test',
            lastName: 'Tech',
            userType: 'User' as const,
          },
          warranty: overrides.warranty ?? false,
          contract: false,
          contractYear: '',
          materialUsed: false,
          equipment: false,
          totallyResolved: true,
          dumpReading: true,
          backup: true,
          remoteAccessCheck: true,
          anydesk: true,
          serviceReport: 'Test report',
        },
        pricingSnapshot: overrides.pricingSnapshot,
      },
    };
  }

  function buildSnapshot(totalPrice: number): WorkSheetPricingSnapshot {
    return {
      rates: {
        hourlyRateWeekday: 55,
        hourlyRateWeekendHoliday: 70,
        mileageRatePerKm: 0.45,
        travelFeeShort: 45,
        travelFeeLong: 60,
        travelFeeThresholdKm: 180,
        minimumHours: 1,
      },
      calculated: {
        hourlyRate: 55,
        laborHours: 2,
        laborPrice: 110,
        travelFee: 45,
        mileagePrice: 45,
        totalPrice,
      },
    };
  }

  it('uses pricingSnapshot.calculated.totalPrice as balanceChange when it is finite', () => {
    const snapshot = buildSnapshot(200);
    const workSheet = buildMockWorkSheet({ pricingSnapshot: snapshot });

    const result = extractWorkSheetDebtTransaction(workSheet);

    expect(result.balanceChange).toBe(200);
  });

  it('falls back to calculateWorkSheetTotals when pricingSnapshot is undefined (legacy record)', () => {
    const workSheet = buildMockWorkSheet({
      pricingSnapshot: undefined,
      arrivalTime: '09:00',
      departureTime: '11:00',
      hasDisplacement: true,
      totalKms: 100,
      weekendHoliday: false,
    });

    const result = extractWorkSheetDebtTransaction(workSheet);

    // The legacy calculateWorkSheetTotals uses old rates (€45 weekday, €40/€55 displacement)
    // It should produce a totalPrice > 0 for a 2-hour job with 100km displacement
    expect(result.balanceChange).toBeDefined();
    expect(result.balanceChange).toBeGreaterThan(0);
    // Verify it's a number (from the deprecated function)
    expect(Number.isFinite(result.balanceChange)).toBe(true);
  });

  it('falls back to dynamic calculation when pricingSnapshot.calculated.totalPrice is NaN', () => {
    const snapshot = buildSnapshot(NaN);
    const workSheet = buildMockWorkSheet({
      pricingSnapshot: snapshot,
      arrivalTime: '09:00',
      departureTime: '11:00',
      hasDisplacement: true,
      totalKms: 100,
      weekendHoliday: false,
    });

    const result = extractWorkSheetDebtTransaction(workSheet);

    // Should NOT be NaN — should fall back to calculateWorkSheetTotals
    expect(Number.isNaN(result.balanceChange)).toBe(false);
    expect(result.balanceChange).toBeGreaterThan(0);
  });

  it('uses 0 as valid anchored value when pricingSnapshot.calculated.totalPrice is 0', () => {
    const snapshot = buildSnapshot(0);
    const workSheet = buildMockWorkSheet({ pricingSnapshot: snapshot });

    const result = extractWorkSheetDebtTransaction(workSheet);

    // 0 is a valid finite number — should NOT trigger fallback
    expect(result.balanceChange).toBe(0);
  });
});
