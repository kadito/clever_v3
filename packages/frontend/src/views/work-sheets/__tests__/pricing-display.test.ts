/**
 * Integration Tests for Work Sheet Pricing Display
 *
 * Tests verify:
 * - MI-21: Pricing section is always visible regardless of displacement setting (PRICE-UX-004)
 * - MI-22: Displacement costs only shown when displacement is enabled
 * - MI-23: Rates come from WORK_SHEET_CONSTANTS and total updates reactively
 *
 * Validates: Requirements PRICE-UX-003, PRICE-UX-004
 *
 * Approach: Tests the pricing display behavior using a lightweight component that
 * replicates the pricing template logic from WorkSheetsCreateView. This avoids
 * mounting the full component tree (which has deep dependencies like SignaturePad,
 * ContentCreateTemplate, etc.) while still verifying the integration between
 * calculateWorkSheetPricing, WORK_SHEET_CONSTANTS, and the Vue template rendering.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, defineComponent, ref, nextTick } from 'vue';
import { calculateWorkSheetPricing, WORK_SHEET_CONSTANTS } from '@clever/shared';
import type { WorkSheetPricingInput, WorkSheetPricingResult } from '@clever/shared';

/**
 * Lightweight test component that replicates the pricing section template
 * from WorkSheetsCreateView/UpdateView/DetailView.
 *
 * This mirrors the exact template structure and computed property logic
 * used in the real views, allowing us to test display behavior without
 * the full component dependency tree.
 */
const PricingDisplayTestComponent = defineComponent({
  name: 'PricingDisplayTestComponent',
  props: {
    weekendHoliday: { type: Boolean, default: false },
    hasDisplacement: { type: Boolean, default: false },
    totalKms: { type: Number, default: 0 },
    arrivalTime: { type: String, default: '' },
    departureTime: { type: String, default: '' },
  },
  setup(props) {
    const pricing = computed(() => {
      return calculateWorkSheetPricing({
        weekendHoliday: props.weekendHoliday,
        hasDisplacement: props.hasDisplacement,
        totalKms: props.totalKms,
        arrivalTime: props.arrivalTime,
        departureTime: props.departureTime,
      });
    });

    return { pricing, WORK_SHEET_CONSTANTS };
  },
  template: `
    <div class="pricing-section">
      <h3>Cálculo de Preços <span class="vat-note">(sem IVA)</span></h3>
      <div class="pricing-table">
        <!-- Always shown -->
        <div class="pricing-row" data-testid="hourly-rate-row">
          <span class="pricing-label">Valor Hora:
            <span class="pricing-detail">{{ weekendHoliday ? 'Fim de semana / Feriado' : 'Semana' }}</span>
          </span>
          <span class="pricing-value">{{ pricing.hourlyRate }}€</span>
        </div>
        <div class="pricing-row" data-testid="labor-price-row">
          <span class="pricing-label">Preço Mão Obra:
            <span class="pricing-detail">{{ pricing.laborHours }}h × {{ pricing.hourlyRate }}€</span>
          </span>
          <span class="pricing-value">{{ pricing.laborPrice }}€</span>
        </div>

        <!-- Conditional: displacement costs -->
        <template v-if="pricing.hasDisplacement">
          <div class="pricing-row" data-testid="travel-fee-row">
            <span class="pricing-label">Taxa Deslocação:</span>
            <span class="pricing-value">{{ pricing.travelFee }}€</span>
          </div>
          <div class="pricing-row" data-testid="mileage-row">
            <span class="pricing-label">Preço KMs:
              <span class="pricing-detail">{{ pricing.totalKms }} km × {{ WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM }}€</span>
            </span>
            <span class="pricing-value">{{ pricing.mileagePrice }}€</span>
          </div>
        </template>

        <!-- Always shown -->
        <div class="pricing-row total" data-testid="total-row">
          <span class="pricing-label">PREÇO TOTAL:</span>
          <span class="pricing-value">{{ pricing.totalPrice }}€ <span class="vat-indicator">sem IVA</span></span>
        </div>
      </div>
    </div>
  `,
});

describe('Work Sheet Pricing Display — Integration Tests', () => {
  /**
   * MI-21: Pricing section is always visible regardless of displacement setting
   * Validates: Requirements PRICE-UX-004
   *
   * The pricing section (hourly rate + labor price rows) MUST render even when
   * hasDisplacement is false. This verifies the "always visible" requirement.
   */
  describe('MI-21: Pricing section visible without displacement', () => {
    it('renders pricing section with hourly rate and labor price when hasDisplacement=false', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: false,
          arrivalTime: '09:00',
          departureTime: '10:00',
          weekendHoliday: false,
          totalKms: 0,
        },
      });

      // Pricing section must exist
      expect(wrapper.find('.pricing-section').exists()).toBe(true);

      // Hourly rate row must be visible
      expect(wrapper.find('[data-testid="hourly-rate-row"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="hourly-rate-row"]').text()).toContain('Valor Hora');

      // Labor price row must be visible
      expect(wrapper.find('[data-testid="labor-price-row"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="labor-price-row"]').text()).toContain('Preço Mão Obra');

      // Total row must be visible
      expect(wrapper.find('[data-testid="total-row"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="total-row"]').text()).toContain('PREÇO TOTAL');
    });

    it('shows pricing header with "Cálculo de Preços" and VAT note', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: false,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      const section = wrapper.find('.pricing-section');
      expect(section.text()).toContain('Cálculo de Preços');
      expect(section.text()).toContain('sem IVA');
    });

    it('renders non-zero pricing values when times are provided and hasDisplacement=false', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: false,
          weekendHoliday: false,
          arrivalTime: '09:00',
          departureTime: '11:00',
          totalKms: 0,
        },
      });

      // Should show €55 hourly rate and calculated labor price
      const hourlyRow = wrapper.find('[data-testid="hourly-rate-row"]');
      expect(hourlyRow.text()).toContain('55€');

      const laborRow = wrapper.find('[data-testid="labor-price-row"]');
      expect(laborRow.text()).toContain('110€'); // 2h × €55
    });
  });

  /**
   * MI-22: Displacement costs only shown when displacement is enabled
   * Validates: Requirements PRICE-UX-003, PRICE-UX-004
   *
   * When hasDisplacement=false: travel fee and mileage rows are NOT rendered.
   * When hasDisplacement=true: travel fee and mileage rows ARE rendered.
   */
  describe('MI-22: Displacement costs conditional', () => {
    it('does NOT show travel fee and mileage rows when hasDisplacement=false', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: false,
          totalKms: 100,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      expect(wrapper.find('[data-testid="travel-fee-row"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="mileage-row"]').exists()).toBe(false);
    });

    it('shows travel fee and mileage rows when hasDisplacement=true', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: true,
          totalKms: 100,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      expect(wrapper.find('[data-testid="travel-fee-row"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="mileage-row"]').exists()).toBe(true);

      // Verify content
      expect(wrapper.find('[data-testid="travel-fee-row"]').text()).toContain('Taxa Deslocação');
      expect(wrapper.find('[data-testid="mileage-row"]').text()).toContain('Preço KMs');
    });

    it('shows mileage rate from WORK_SHEET_CONSTANTS when displacement enabled', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: true,
          totalKms: 100,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      const mileageRow = wrapper.find('[data-testid="mileage-row"]');
      // Should display "100 km × 0.45€"
      expect(mileageRow.text()).toContain(`${WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM}€`);
      expect(mileageRow.text()).toContain('100 km');
    });

    it('shows correct travel fee (€45) for displacement ≤180km', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: true,
          totalKms: 180,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      const travelRow = wrapper.find('[data-testid="travel-fee-row"]');
      expect(travelRow.text()).toContain('45€');
    });

    it('shows correct travel fee (€60) for displacement >180km', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: true,
          totalKms: 200,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      const travelRow = wrapper.find('[data-testid="travel-fee-row"]');
      expect(travelRow.text()).toContain('60€');
    });
  });

  /**
   * MI-23: Rates come from WORK_SHEET_CONSTANTS and total updates reactively
   * Validates: Requirements PRICE-UX-003
   *
   * Verify hourly rate displayed matches WORK_SHEET_CONSTANTS values (55 weekday, 70 weekend).
   * Verify mileage rate display uses WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM.
   * Verify that the total updates reactively when props change.
   */
  describe('MI-23: Rates from constants and reactive total updates', () => {
    it('displays weekday hourly rate matching WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY (55€)', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          weekendHoliday: false,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      const hourlyRow = wrapper.find('[data-testid="hourly-rate-row"]');
      expect(hourlyRow.text()).toContain(`${WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY}€`);
      expect(hourlyRow.text()).toContain('Semana');
    });

    it('displays weekend hourly rate matching WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY (70€)', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          weekendHoliday: true,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      const hourlyRow = wrapper.find('[data-testid="hourly-rate-row"]');
      expect(hourlyRow.text()).toContain(`${WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY}€`);
      expect(hourlyRow.text()).toContain('Fim de semana / Feriado');
    });

    it('total updates reactively when switching from weekday to weekend', async () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          weekendHoliday: false,
          hasDisplacement: false,
          arrivalTime: '09:00',
          departureTime: '11:00',
          totalKms: 0,
        },
      });

      // Initial: weekday rate → total = 2h × €55 = €110
      let totalRow = wrapper.find('[data-testid="total-row"]');
      expect(totalRow.text()).toContain('110€');

      // Switch to weekend
      await wrapper.setProps({ weekendHoliday: true });
      await nextTick();

      // Updated: weekend rate → total = 2h × €70 = €140
      totalRow = wrapper.find('[data-testid="total-row"]');
      expect(totalRow.text()).toContain('140€');
    });

    it('total updates reactively when enabling displacement', async () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          weekendHoliday: false,
          hasDisplacement: false,
          totalKms: 100,
          arrivalTime: '09:00',
          departureTime: '11:00',
        },
      });

      // Initial: no displacement → total = labor only = 2h × €55 = €110
      let totalRow = wrapper.find('[data-testid="total-row"]');
      expect(totalRow.text()).toContain('110€');

      // Enable displacement
      await wrapper.setProps({ hasDisplacement: true });
      await nextTick();

      // Updated: with displacement → total = labor + travel + mileage
      // labor: 110, travel: 45 (≤180km), mileage: 100×0.45=45 → total = 200
      totalRow = wrapper.find('[data-testid="total-row"]');
      expect(totalRow.text()).toContain('200€');
    });

    it('mileage rate per km uses WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM value', () => {
      const wrapper = mount(PricingDisplayTestComponent, {
        props: {
          hasDisplacement: true,
          totalKms: 50,
          arrivalTime: '09:00',
          departureTime: '10:00',
        },
      });

      const mileageRow = wrapper.find('[data-testid="mileage-row"]');
      // Template displays: "{{ pricing.totalKms }} km × {{ WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM }}€"
      expect(mileageRow.text()).toContain('0.45€');

      // And the calculated mileage price: 50 × 0.45 = 22.5
      expect(mileageRow.find('.pricing-value').text()).toContain('22.5€');
    });

    it('calculateWorkSheetPricing produces correct totals for full integration scenario', () => {
      // Direct integration verification: the function used by all views produces
      // correct results for a typical scenario matching MI-27 (backend test cross-reference)
      const input: WorkSheetPricingInput = {
        weekendHoliday: false,
        hasDisplacement: true,
        totalKms: 100,
        arrivalTime: '09:00',
        departureTime: '11:00',
      };

      const result = calculateWorkSheetPricing(input);

      expect(result.hourlyRate).toBe(WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY);
      expect(result.laborHours).toBe(2);
      expect(result.laborPrice).toBe(2 * WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY);
      expect(result.travelFee).toBe(WORK_SHEET_CONSTANTS.TRAVEL_FEE_SHORT);
      expect(result.mileagePrice).toBe(100 * WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM);
      expect(result.totalPrice).toBe(110 + 45 + 45); // 200€
    });
  });
});
