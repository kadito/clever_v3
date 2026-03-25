import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExpirationDateFilter from './ExpirationDateFilter.vue';
import type { FilterOption } from '@/composables/useExpirationFilter';

/**
 * Generates 12 sample filter options for testing.
 */
function makeSampleOptions(): FilterOption[] {
  const months = [
    'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Janeiro', 'Fevereiro',
  ];
  return months.map((name, i) => {
    const date = new Date(2026, 2 + i, 1); // start from March 2026
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return { value: `${year}-${month}`, label: `${name} ${year}` };
  });
}

// ---------------------------------------------------------------------------
// MI-18 through MI-21 — ExpirationDateFilter Vue component
// ---------------------------------------------------------------------------
describe('ExpirationDateFilter', () => {
  const options = makeSampleOptions();

  /**
   * MI-18 — Renders placeholder option
   * Validates: REQ-01
   */
  it('MI-18: renders placeholder option with "Data de Expiração"', () => {
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);

    // The first option should be the placeholder
    const firstOption = select.findAll('option')[0];
    expect(firstOption.text()).toBe('Data de Expiração');
    expect(firstOption.attributes('disabled')).toBeDefined();
  });

  /**
   * MI-19 — Renders all 12 options
   * Validates: REQ-02
   */
  it('MI-19: renders all 12 options plus placeholder', () => {
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const allOptions = wrapper.findAll('option');
    // 1 placeholder + 12 month options (no "Limpar filtro" when modelValue is null)
    expect(allOptions).toHaveLength(13);
  });

  /**
   * MI-20 — Emits value on selection
   * Validates: REQ-03
   */
  it('MI-20: emits update:modelValue with selected value', async () => {
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const select = wrapper.find('select');
    await select.setValue('2026-06');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(['2026-06']);
  });

  /**
   * MI-21 — Emits null on clear (placeholder selected)
   * Validates: REQ-04
   */
  it('MI-21: emits null when placeholder / clear option is selected', async () => {
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: '2026-06' },
    });

    const select = wrapper.find('select');
    // Selecting empty string triggers the clear path
    await select.setValue('');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([null]);
  });
});
