import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
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
        planIdCPA: 'cpa_essential',
        deslocacoesPorAnoCPA: 1,
        manutencoesPorAnoCPA: 1,
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

describe('MI-10: Equipment count mode logic', () => {
  describe('Mode computed', () => {
    it('mode is auto when 1 equipment', () => {
      const wrapper = createWrapper({ cpaEquipments: [makeEquipment('1')] });
      // The BenefitFieldsGroup stub receives mode prop
      const benefitFields = wrapper.findComponent({ name: 'BenefitFieldsGroup' });
      expect(benefitFields.exists()).toBe(true);
      expect(benefitFields.props('mode')).toBe('auto');
    });

    it('mode is manual when 2+ equipments', () => {
      const wrapper = createWrapper({
        cpaEquipments: [makeEquipment('1'), makeEquipment('2')],
      });
      const benefitFields = wrapper.findComponent({ name: 'BenefitFieldsGroup' });
      expect(benefitFields.exists()).toBe(true);
      expect(benefitFields.props('mode')).toBe('manual');
    });

    it('mode is manual when 3 equipments', () => {
      const wrapper = createWrapper({
        cpaEquipments: [makeEquipment('1'), makeEquipment('2'), makeEquipment('3')],
      });
      const benefitFields = wrapper.findComponent({ name: 'BenefitFieldsGroup' });
      expect(benefitFields.props('mode')).toBe('manual');
    });
  });

  describe('Auto → Manual transition (1→2 equips)', () => {
    it('emits clear events for deslocacoesPorAnoCPA, manutencoesPorAnoCPA, and precoCPA', async () => {
      const wrapper = createWrapper({
        cpaEquipments: [makeEquipment('1')],
        formData: {
          planIdCPA: 'cpa_essential',
          deslocacoesPorAnoCPA: 1,
          manutencoesPorAnoCPA: 1,
        },
      });

      // Transition: 1 → 2 equipments
      await wrapper.setProps({
        cpaEquipments: [makeEquipment('1'), makeEquipment('2')],
      });
      await nextTick();

      const emitted = wrapper.emitted('update-field') || [];
      const fieldUpdates = emitted.map(([field, value]) => ({ field, value }));

      expect(fieldUpdates).toContainEqual({ field: 'deslocacoesPorAnoCPA', value: '' });
      expect(fieldUpdates).toContainEqual({ field: 'manutencoesPorAnoCPA', value: '' });
      expect(fieldUpdates).toContainEqual({ field: 'precoCPA', value: undefined });
    });
  });

  describe('Manual → Auto transition (2→1 equips)', () => {
    it('emits restore events with plan base values', async () => {
      const wrapper = createWrapper({
        cpaEquipments: [makeEquipment('1'), makeEquipment('2')],
        formData: {
          planIdCPA: 'cpa_essential',
          deslocacoesPorAnoCPA: '',
          manutencoesPorAnoCPA: '',
          precoCPA: 500,
        },
      });

      // Transition: 2 → 1 equipment (should restore from cpa_essential: deslocacoes=1, manutencoes=1)
      await wrapper.setProps({
        cpaEquipments: [makeEquipment('1')],
      });
      await nextTick();

      const emitted = wrapper.emitted('update-field') || [];
      const fieldUpdates = emitted.map(([field, value]) => ({ field, value }));

      // cpa_essential has parameters.deslocacoesPorAno=1, parameters.manutencoesPorAno=1
      expect(fieldUpdates).toContainEqual({ field: 'deslocacoesPorAnoCPA', value: 1 });
      expect(fieldUpdates).toContainEqual({ field: 'manutencoesPorAnoCPA', value: 1 });
      expect(fieldUpdates).toContainEqual({ field: 'precoCPA', value: undefined });
    });

    it('restores values from cpa_professional plan', async () => {
      const wrapper = createWrapper({
        cpaEquipments: [makeEquipment('1'), makeEquipment('2')],
        formData: {
          planIdCPA: 'cpa_professional',
          deslocacoesPorAnoCPA: '',
          manutencoesPorAnoCPA: '',
          precoCPA: 800,
        },
      });

      await wrapper.setProps({
        cpaEquipments: [makeEquipment('1')],
      });
      await nextTick();

      const emitted = wrapper.emitted('update-field') || [];
      const fieldUpdates = emitted.map(([field, value]) => ({ field, value }));

      // cpa_professional has parameters.deslocacoesPorAno=2, parameters.manutencoesPorAno=1
      expect(fieldUpdates).toContainEqual({ field: 'deslocacoesPorAnoCPA', value: 2 });
      expect(fieldUpdates).toContainEqual({ field: 'manutencoesPorAnoCPA', value: 1 });
    });
  });

  describe('Plan change in auto mode', () => {
    it('repopulates parameters from new plan when mode is auto', async () => {
      const wrapper = createWrapper({
        cpaEquipments: [makeEquipment('1')],
        formData: {
          planIdCPA: 'cpa_essential',
          deslocacoesPorAnoCPA: 1,
          manutencoesPorAnoCPA: 1,
        },
      });

      // Simulate plan selection via the select element
      const select = wrapper.find('select');
      await select.setValue('cpa_premium');
      await nextTick();

      const emitted = wrapper.emitted('update-field') || [];
      const fieldUpdates = emitted.map(([field, value]) => ({ field, value }));

      // cpa_premium has parameters.deslocacoesPorAno=3, parameters.manutencoesPorAno=2
      expect(fieldUpdates).toContainEqual({ field: 'deslocacoesPorAnoCPA', value: 3 });
      expect(fieldUpdates).toContainEqual({ field: 'manutencoesPorAnoCPA', value: 2 });
    });

    it('emits plan-selected event on plan change', async () => {
      const wrapper = createWrapper({
        cpaEquipments: [makeEquipment('1')],
        formData: { planIdCPA: 'cpa_essential' },
      });

      const select = wrapper.find('select');
      await select.setValue('cpa_professional');
      await nextTick();

      const planSelected = wrapper.emitted('plan-selected') || [];
      expect(planSelected).toContainEqual(['cpa_professional']);
    });
  });
});
