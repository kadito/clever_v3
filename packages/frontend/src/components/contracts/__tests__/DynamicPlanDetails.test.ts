import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DynamicPlanDetails from '../DynamicPlanDetails.vue';

const cpaPlan = {
  id: 'cpa_essential',
  name: 'ESSENTIAL CARE',
  description: 'Test',
  parameters: { manutencoesPorAno: 1, deslocacoesPorAno: 1 },
  schedule: { deslocacao: 'Seg-Sex 9-19h', remoteSupport: 'Seg-Sex 9-19h' },
  weekendSupport: false,
  prices: { mensal: 40, semestral: 225, anual: 425 },
};

const shPlan = {
  id: 'sh_simple',
  name: 'SIMPLE',
  description: 'Test',
  parameters: { manutencoesPorAno: 0, deslocacoesPorAno: 2, horasPorAno: 10 },
  schedule: { deslocacao: 'Seg-Sex 9-19h', remoteSupport: 'Seg-Sex 9-23h' },
  weekendSupport: false,
  prices: { under180km: { mensal: 35, anual: 390 }, over180km: { mensal: 40, anual: 450 } },
};

describe('MI-14: DynamicPlanDetails simplified pricing', () => {
  describe('CPA flat pricing (no distance)', () => {
    it('shows 3 payment options (MENSAL, SEMESTRAL, ANUAL)', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: cpaPlan,
          selectedPayment: '',
          contractType: 'CPA',
        },
      });
      const paymentButtons = wrapper.findAll('.payment-option');
      expect(paymentButtons.length).toBe(3);
      const periodTexts = paymentButtons.map(btn => btn.find('.payment-period').text());
      expect(periodTexts).toContain('MENSAL');
      expect(periodTexts).toContain('SEMESTRAL');
      expect(periodTexts).toContain('ANUAL');
    });

    it('does not show distance notice for CPA', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: cpaPlan,
          selectedPayment: '',
          contractType: 'CPA',
        },
      });
      expect(wrapper.find('.distance-notice').exists()).toBe(false);
    });
  });

  describe('S&H distance-based pricing', () => {
    it('shows 2 payment options (MENSAL, ANUAL) when distance is provided', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: shPlan,
          selectedPayment: '',
          contractType: 'S&H',
          distance: 'under180km',
        },
      });
      const paymentButtons = wrapper.findAll('.payment-option');
      expect(paymentButtons.length).toBe(2);
      const periodTexts = paymentButtons.map(btn => btn.find('.payment-period').text());
      expect(periodTexts).toContain('MENSAL');
      expect(periodTexts).toContain('ANUAL');
    });

    it('shows distance-required notice when no distance is provided', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: shPlan,
          selectedPayment: '',
          contractType: 'S&H',
        },
      });
      expect(wrapper.find('.distance-notice').exists()).toBe(true);
    });
  });

  describe('No equipment cost calculation', () => {
    it('does not contain "equipment cost" text in CPA output', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: cpaPlan,
          selectedPayment: '',
          contractType: 'CPA',
        },
      });
      const text = wrapper.text().toLowerCase();
      expect(text).not.toContain('equipment cost');
      expect(text).not.toContain('desconto');
    });

    it('does not contain "equipment cost" text in S&H output', () => {
      const wrapper = mount(DynamicPlanDetails, {
        props: {
          planDetails: shPlan,
          selectedPayment: '',
          contractType: 'S&H',
          distance: 'under180km',
        },
      });
      const text = wrapper.text().toLowerCase();
      expect(text).not.toContain('equipment cost');
      expect(text).not.toContain('desconto');
    });
  });
});
