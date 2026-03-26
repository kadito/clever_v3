/**
 * Integration tests for expiration date filter — Frontend
 * Tests MI-16 through MI-25
 *
 * Covers:
 * - useExpirationFilter composable filterOptions (MI-16 to MI-19)
 * - useExpirationFilter composable filterParams (MI-20 to MI-21)
 * - ExpirationDateFilter Vue component rendering and events (MI-22 to MI-25)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { useExpirationFilter } from '@/composables/useExpirationFilter';
import ExpirationDateFilter from '@/components/common/ExpirationDateFilter.vue';
import type { FilterOption } from '@/composables/useExpirationFilter';

// ---------------------------------------------------------------------------
// MI-16 to MI-19 — useExpirationFilter composable filterOptions
// ---------------------------------------------------------------------------

describe('useExpirationFilter — filterOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('MI-16: generates exactly 12 options', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026

    const { filterOptions } = useExpirationFilter();

    expect(filterOptions.value).toHaveLength(12);
  });

  it('MI-17: first option is current month', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026

    const { filterOptions } = useExpirationFilter();
    const first = filterOptions.value[0];

    expect(first.value).toBe('2026-03');
    expect(first.label).toBe('Março 2026');
  });

  it('MI-18: last option is 11 months ahead', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026

    const { filterOptions } = useExpirationFilter();
    const last = filterOptions.value[11];

    expect(last.value).toBe('2027-02');
    expect(last.label).toBe('Fevereiro 2027');
  });

  it('MI-19: month names are capitalized Portuguese', () => {
    vi.setSystemTime(new Date(2026, 0, 1)); // January 1, 2026

    const { filterOptions } = useExpirationFilter();
    const first = filterOptions.value[0];

    expect(first.label).toBe('Janeiro 2026');
    // First character should be uppercase
    expect(first.label[0]).toBe(first.label[0].toUpperCase());
  });
});

// ---------------------------------------------------------------------------
// MI-20 to MI-21 — useExpirationFilter composable filterParams
// ---------------------------------------------------------------------------

describe('useExpirationFilter — filterParams', () => {
  it('MI-20: returns { expirationMonth } when month selected', () => {
    const { selectedMonth, filterParams } = useExpirationFilter();

    selectedMonth.value = '2026-06';

    expect(filterParams.value).toEqual({ expirationMonth: '2026-06' });
  });

  it('MI-21: returns {} when no month selected', () => {
    const { selectedMonth, filterParams } = useExpirationFilter();

    selectedMonth.value = null;

    expect(filterParams.value).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// MI-22 to MI-25 — ExpirationDateFilter component
// ---------------------------------------------------------------------------

function buildOptions(): FilterOption[] {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months.map((name, i) => ({
    value: `2026-${String(i + 1).padStart(2, '0')}`,
    label: `${name} 2026`,
  }));
}

describe('ExpirationDateFilter component', () => {
  it('MI-22: renders placeholder option', () => {
    const wrapper = mount(ExpirationDateFilter, {
      props: { options: buildOptions(), modelValue: null },
    });

    const select = wrapper.find('select');
    const placeholderOption = select.find('option[disabled][hidden]');

    expect(placeholderOption.exists()).toBe(true);
    expect(placeholderOption.text()).toBe('Data de Expiração');
  });

  it('MI-23: renders all 12 options', () => {
    const options = buildOptions();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    // 12 month options + 1 placeholder (no clear option when modelValue is null)
    const allOptions = wrapper.findAll('option');
    expect(allOptions).toHaveLength(12 + 1);
  });

  it('MI-24: emits value on selection', async () => {
    const options = buildOptions();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const select = wrapper.find('select');
    await select.setValue('2026-06');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(['2026-06']);
  });

  it('MI-25: emits null on clear', async () => {
    const options = buildOptions();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: '2026-06' },
    });

    // When modelValue is set, the "Limpar filtro" option should be visible
    const clearOption = wrapper.findAll('option').find(o => o.text() === 'Limpar filtro');
    expect(clearOption).toBeTruthy();

    // Select the clear option (value="")
    const select = wrapper.find('select');
    await select.setValue('');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([null]);
  });
});
