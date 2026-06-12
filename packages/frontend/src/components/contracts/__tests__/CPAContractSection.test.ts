import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CPAContractSection from '../CPAContractSection.vue';

const stubs = {
  CPAEquipmentManager: true,
  ContractDatesSection: true,
  BenefitFieldsGroup: true,
  DynamicPlanDetails: true,
};

function makeEquipment(id: string) {
  return { id, modelo: 'Model', numeroSerie: 'SN-' + id, observacoes: '' };
}

function createWrapper(overrides: Record<string, any> = {}) {
  return mount(CPAContractSection, {
    props: {
      formData: {
        planIdCPA: '',
        deslocacoesPorAnoCPA: 0,
        manutencoesPorAnoCPA: 0,
        precoCPA: undefined,
        hasPOSPackage: false,
        inicioContratoCPA: '',
        fimContratoCPA: '',
        modalidadePagamentoCPA: '',
        ...overrides.formData,
      },
      cpaEquipments: overrides.cpaEquipments ?? [makeEquipment('1')],
      selectedPlanDetails: overrides.selectedPlanDetails ?? null,
      isLoadingPlan: overrides.isLoadingPlan ?? false,
    },
    global: { stubs },
  });
}

describe('MI-13: CPAContractSection unified type', () => {
  it('does not render a "TIPO DE CONTRATO CPA" element', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).not.toContain('TIPO DE CONTRATO CPA');
  });

  it('does not render a "DISTÂNCIA" element for CPA section', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).not.toContain('DISTÂNCIA');
  });

  it('plan dropdown has exactly 3 plan options (+ empty option = 4 total)', () => {
    const wrapper = createWrapper();
    const select = wrapper.find('select');
    const options = select.findAll('option');
    // 1 empty placeholder + 3 plans = 4 total
    expect(options.length).toBe(4);
    // Verify plan names
    const optionTexts = options.map(o => o.text().trim());
    expect(optionTexts).toContain('ESSENTIAL CARE');
    expect(optionTexts).toContain('PROFESSIONAL CARE');
    expect(optionTexts).toContain('PREMIUM CARE');
  });

  it('POS package section is visible when plan is cpa_premium', () => {
    const wrapper = createWrapper({
      formData: { planIdCPA: 'cpa_premium' },
    });
    // POS package section should be rendered
    const posSection = wrapper.find('.pos-package-section');
    expect(posSection.exists()).toBe(true);
  });

  it('POS package section is hidden for non-premium plans', () => {
    const wrapper = createWrapper({
      formData: { planIdCPA: 'cpa_essential' },
    });
    const posSection = wrapper.find('.pos-package-section');
    expect(posSection.exists()).toBe(false);
  });

  it('POS package section is hidden when no plan selected', () => {
    const wrapper = createWrapper({
      formData: { planIdCPA: '' },
    });
    const posSection = wrapper.find('.pos-package-section');
    expect(posSection.exists()).toBe(false);
  });
});
