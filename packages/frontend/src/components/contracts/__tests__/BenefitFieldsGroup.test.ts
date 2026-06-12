import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BenefitFieldsGroup from '../BenefitFieldsGroup.vue';

describe('MI-11: BenefitFieldsGroup field visibility', () => {
  describe('CPA contract type', () => {
    it('renders manutenções input for CPA', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'auto',
          deslocacoesPorAno: 1,
          manutencoesPorAno: 1,
        },
      });
      expect(wrapper.find('[data-testid="manutencoes-input"]').exists()).toBe(true);
    });

    it('renders deslocações input for CPA', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'auto',
          deslocacoesPorAno: 1,
          manutencoesPorAno: 1,
        },
      });
      expect(wrapper.find('[data-testid="deslocacoes-input"]').exists()).toBe(true);
    });

    it('does NOT render horas input for CPA', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'auto',
          deslocacoesPorAno: 1,
          manutencoesPorAno: 1,
        },
      });
      expect(wrapper.find('[data-testid="horas-assistencia-input"]').exists()).toBe(false);
    });
  });

  describe('S&H contract type', () => {
    it('renders horas input for S&H', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'S&H',
          mode: 'auto',
          deslocacoesPorAno: 2,
          horasAssistencia: 10,
        },
      });
      expect(wrapper.find('[data-testid="horas-assistencia-input"]').exists()).toBe(true);
    });

    it('renders deslocações input for S&H', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'S&H',
          mode: 'auto',
          deslocacoesPorAno: 2,
          horasAssistencia: 10,
        },
      });
      expect(wrapper.find('[data-testid="deslocacoes-input"]').exists()).toBe(true);
    });

    it('does NOT render manutenções input for S&H', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'S&H',
          mode: 'auto',
          deslocacoesPorAno: 2,
          horasAssistencia: 10,
        },
      });
      expect(wrapper.find('[data-testid="manutencoes-input"]').exists()).toBe(false);
    });
  });
});

describe('MI-12: BenefitFieldsGroup mode behavior', () => {
  describe('auto mode', () => {
    it('fields are disabled in auto mode', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'auto',
          deslocacoesPorAno: 1,
          manutencoesPorAno: 1,
        },
      });
      const deslocacoes = wrapper.find('[data-testid="deslocacoes-input"]');
      const manutencoes = wrapper.find('[data-testid="manutencoes-input"]');
      expect((deslocacoes.element as HTMLInputElement).disabled).toBe(true);
      expect((manutencoes.element as HTMLInputElement).disabled).toBe(true);
    });

    it('shows auto-mode info text', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'auto',
          deslocacoesPorAno: 1,
          manutencoesPorAno: 1,
        },
      });
      expect(wrapper.find('[data-testid="auto-mode-info"]').exists()).toBe(true);
    });

    it('does NOT show manual-mode banner', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'auto',
          deslocacoesPorAno: 1,
          manutencoesPorAno: 1,
        },
      });
      expect(wrapper.find('[data-testid="manual-mode-banner"]').exists()).toBe(false);
    });
  });

  describe('manual mode', () => {
    it('fields are NOT disabled in manual mode', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'manual',
          deslocacoesPorAno: 0,
          manutencoesPorAno: 0,
        },
      });
      const deslocacoes = wrapper.find('[data-testid="deslocacoes-input"]');
      const manutencoes = wrapper.find('[data-testid="manutencoes-input"]');
      expect((deslocacoes.element as HTMLInputElement).disabled).toBe(false);
      expect((manutencoes.element as HTMLInputElement).disabled).toBe(false);
    });

    it('shows manual-mode banner', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'manual',
          deslocacoesPorAno: 0,
          manutencoesPorAno: 0,
        },
      });
      expect(wrapper.find('[data-testid="manual-mode-banner"]').exists()).toBe(true);
    });

    it('does NOT show auto-mode info', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'manual',
          deslocacoesPorAno: 0,
          manutencoesPorAno: 0,
        },
      });
      expect(wrapper.find('[data-testid="auto-mode-info"]').exists()).toBe(false);
    });

    it('shows error messages when showErrors=true and values are empty', () => {
      const wrapper = mount(BenefitFieldsGroup, {
        props: {
          contractType: 'CPA',
          mode: 'manual',
          deslocacoesPorAno: '' as unknown as number,
          manutencoesPorAno: '' as unknown as number,
          showErrors: true,
        },
      });
      expect(wrapper.find('[data-testid="deslocacoes-error"]').exists()).toBe(true);
    });
  });
});
