import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DynamicPlanDetails from './DynamicPlanDetails.vue';

describe('DynamicPlanDetails', () => {
  const mockCPAPlan = {
    id: 'cpa_essential',
    name: 'ESSENTIAL CARE',
    description: 'Assistência Remota: De Segunda a Sexta entre as 9:00 e as 19:00',
    maintenancePerYear: 1,
    callouts: 'Intervenções necessárias adicionais',
    remoteSupport: 'De Segunda a Sexta entre as 9:00 e as 19:00',
    weekendSupport: false,
    prices: {
      under180km: {
        monthly: 30.0,
        quarterly: 130.0,
        semiannual: 185.0,
        annual: 330.0,
      },
      over180km: {
        monthly: 35.0,
        quarterly: 150.0,
        semiannual: 215.0,
        annual: 390.0,
      },
    },
  };

  const mockSHPlan = {
    id: 'sh_simple',
    name: 'SIMPLE',
    description: 'Pacote de 10:00/ano\nDuas deslocações/ano',
    hoursPerYear: 10,
    displacementsIncluded: 2,
    remoteSupport: 'Segunda a Sexta-Feira entre as 9:00 e as 23:00',
    weekendSupport: false,
    prices: {
      under180km: {
        monthly: 30.0,
        quarterly: 130.0,
        annual: 330.0,
      },
      over180km: {
        monthly: 35.0,
        quarterly: 150.0,
        annual: 390.0,
      },
    },
  };

  it('displays CPA plan details correctly', () => {
    const wrapper = mount(DynamicPlanDetails, {
      props: {
        planDetails: mockCPAPlan,
        selectedPayment: '',
        distance: 'under180km',
      },
    });

    expect(wrapper.find('.plan-title').text()).toBe('ESSENTIAL CARE');
    expect(wrapper.find('.feature-description').text()).toContain('Assistência Remota');
    expect(wrapper.text()).toContain('1 manutenções por ano');
    expect(wrapper.text()).toContain('De Segunda a Sexta entre as 9:00 e as 19:00');
  });

  it('displays S&H plan details correctly', () => {
    const wrapper = mount(DynamicPlanDetails, {
      props: {
        planDetails: mockSHPlan,
        selectedPayment: '',
        distance: 'under180km',
      },
    });

    expect(wrapper.find('.plan-title').text()).toBe('SIMPLE');
    expect(wrapper.text()).toContain('10 horas por ano');
    expect(wrapper.text()).toContain('2 deslocações incluídas');
  });

  it('displays payment options based on distance for CPA plans', () => {
    const wrapper = mount(DynamicPlanDetails, {
      props: {
        planDetails: mockCPAPlan,
        selectedPayment: '',
        distance: 'under180km',
      },
    });

    const paymentOptions = wrapper.findAll('.payment-option');
    expect(paymentOptions.length).toBeGreaterThan(0);

    // Check that prices are displayed
    const text = wrapper.text();
    expect(text).toContain('30,00');
    expect(text).toContain('330,00');
  });

  it('emits payment selection event', async () => {
    const wrapper = mount(DynamicPlanDetails, {
      props: {
        planDetails: mockCPAPlan,
        selectedPayment: '',
        distance: 'under180km',
      },
    });

    const firstPaymentOption = wrapper.find('.payment-option');
    await firstPaymentOption.trigger('click');

    expect(wrapper.emitted('payment-selected')).toBeTruthy();
    expect(wrapper.emitted('payment-selected')?.[0]).toEqual(['MENSAL']);
  });

  it('highlights selected payment option', () => {
    const wrapper = mount(DynamicPlanDetails, {
      props: {
        planDetails: mockCPAPlan,
        selectedPayment: 'MENSAL',
        distance: 'under180km',
      },
    });

    const selectedOption = wrapper.find('.payment-option.selected');
    expect(selectedOption.exists()).toBe(true);
    expect(selectedOption.text()).toContain('MENSAL');
  });

  it('handles different distance pricing correctly', () => {
    const wrapperUnder = mount(DynamicPlanDetails, {
      props: {
        planDetails: mockCPAPlan,
        selectedPayment: '',
        distance: 'under180km',
      },
    });

    const wrapperOver = mount(DynamicPlanDetails, {
      props: {
        planDetails: mockCPAPlan,
        selectedPayment: '',
        distance: 'over180km',
      },
    });

    // Under 180km should show 30,00
    expect(wrapperUnder.text()).toContain('30,00');

    // Over 180km should show 35,00
    expect(wrapperOver.text()).toContain('35,00');
  });
});
