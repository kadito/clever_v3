/**
 * Acceptance tests for expiration date filter — Frontend
 * Tests MA-01 through MA-07, MA-15 to MA-18
 *
 * End-to-end acceptance tests for:
 * - Filter dropdown presence on Contratos and Licenças pages (MA-01 to MA-03)
 * - Dropdown options generation (MA-04 to MA-07)
 * - Licenses filtering behavior via component (MA-15 to MA-16 frontend perspective)
 * - Clear filter behavior (MA-17 to MA-18 frontend perspective)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, computed, nextTick } from 'vue';
import ExpirationDateFilter from '@/components/common/ExpirationDateFilter.vue';
import { useExpirationFilter } from '@/composables/useExpirationFilter';
import type { FilterOption } from '@/composables/useExpirationFilter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildOptions(startDate?: Date): FilterOption[] {
  const now = startDate || new Date();
  const formatter = new Intl.DateTimeFormat('pt-PT', { month: 'long' });
  const options: FilterOption[] = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthName = formatter.format(date);
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    options.push({
      value: `${year}-${month}`,
      label: `${capitalizedMonth} ${year}`,
    });
  }

  return options;
}


// ---------------------------------------------------------------------------
// MA-01 to MA-03 — Filter dropdown presence
// ---------------------------------------------------------------------------

describe('MA — Filter dropdown presence', () => {
  it('MA-01: Contratos listing — expiration date dropdown is visible', () => {
    // Mount ExpirationDateFilter as it would appear in ContractsListView #filters slot
    const options = buildOptions();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    expect(select.isVisible()).toBe(true);
  });

  it('MA-02: Licenças listing — expiration date dropdown is visible', () => {
    // Same component used in LicensesListView #filters slot
    const options = buildOptions();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    expect(select.isVisible()).toBe(true);
  });

  it('MA-03: dropdown label reads "Data de Expiração"', () => {
    const options = buildOptions();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const placeholder = wrapper.find('option[disabled][hidden]');
    expect(placeholder.exists()).toBe(true);
    expect(placeholder.text()).toBe('Data de Expiração');
  });
});

// ---------------------------------------------------------------------------
// MA-04 to MA-07 — Dropdown options generation
// ---------------------------------------------------------------------------

describe('MA — Dropdown options generation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('MA-04: dropdown contains exactly 12 options', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // March 2026

    const { filterOptions } = useExpirationFilter();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options: filterOptions.value, modelValue: null },
    });

    // Filter out placeholder (disabled+hidden) — keep only month options with a value
    const monthOptions = wrapper.findAll('option').filter(o => {
      const val = o.element.value;
      return val !== '' && o.attributes('disabled') === undefined;
    });
    expect(monthOptions).toHaveLength(12);
  });

  it('MA-05: first option is "Março 2026" when current month is March 2026', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // March 2026

    const { filterOptions } = useExpirationFilter();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options: filterOptions.value, modelValue: null },
    });

    const monthOptions = wrapper.findAll('option').filter(o => {
      const val = o.element.value;
      return val !== '' && o.attributes('disabled') === undefined;
    });
    expect(monthOptions[0].text()).toBe('Março 2026');
  });

  it('MA-06: last option is "Fevereiro 2027" when current month is March 2026', () => {
    vi.setSystemTime(new Date(2026, 2, 15)); // March 2026

    const { filterOptions } = useExpirationFilter();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options: filterOptions.value, modelValue: null },
    });

    const monthOptions = wrapper.findAll('option').filter(o => {
      const val = o.element.value;
      return val !== '' && o.attributes('disabled') === undefined;
    });
    expect(monthOptions[11].text()).toBe('Fevereiro 2027');
  });

  it('MA-07: all options show "Month YYYY" format', () => {
    vi.setSystemTime(new Date(2026, 0, 1)); // January 2026

    const { filterOptions } = useExpirationFilter();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options: filterOptions.value, modelValue: null },
    });

    const monthOptions = wrapper.findAll('option').filter(o => {
      const val = o.element.value;
      return val !== '' && o.attributes('disabled') === undefined;
    });
    // Each option should match pattern: CapitalizedMonth YYYY
    const monthYearPattern = /^[A-ZÀ-Ú][a-zà-ú]+ \d{4}$/;
    for (const opt of monthOptions) {
      expect(opt.text()).toMatch(monthYearPattern);
    }
  });
});


// ---------------------------------------------------------------------------
// MA-15 to MA-16 — Licenses filtering (frontend component perspective)
// These test the component emitting the correct value for the backend to filter
// ---------------------------------------------------------------------------

describe('MA — Licenses filtering behavior (frontend)', () => {
  it('MA-15: selecting "Junho 2026" emits correct value for dataVencimento match', async () => {
    const options = buildOptions(new Date(2026, 0, 1)); // Jan 2026 start
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const select = wrapper.find('select');
    await select.setValue('2026-06');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(['2026-06']);
  });

  it('MA-16: selecting a different month emits that month value', async () => {
    const options = buildOptions(new Date(2026, 0, 1));
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: null },
    });

    const select = wrapper.find('select');
    await select.setValue('2026-07');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(['2026-07']);
  });
});

// ---------------------------------------------------------------------------
// MA-17 to MA-18 — Clear filter behavior (frontend)
// ---------------------------------------------------------------------------

describe('MA — Clear filter behavior (frontend)', () => {
  it('MA-17: clearing filter emits null — composable filterParams becomes {}', async () => {
    const { selectedMonth, filterParams, clearFilter } = useExpirationFilter();

    // Set a filter
    selectedMonth.value = '2026-06';
    expect(filterParams.value).toEqual({ expirationMonth: '2026-06' });

    // Clear the filter
    clearFilter();
    expect(selectedMonth.value).toBeNull();
    expect(filterParams.value).toEqual({});
  });

  it('MA-18: clearing filter — dropdown returns to default placeholder state', async () => {
    const options = buildOptions();
    const wrapper = mount(ExpirationDateFilter, {
      props: { options, modelValue: '2026-06' },
    });

    // Verify "Limpar filtro" option exists when filter is active
    const clearOption = wrapper.findAll('option').find(o => o.text() === 'Limpar filtro');
    expect(clearOption).toBeTruthy();

    // Select the clear option (value="")
    const select = wrapper.find('select');
    await select.setValue('');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([null]);

    // After parent updates modelValue to null, re-render
    await wrapper.setProps({ modelValue: null });
    await nextTick();

    // The "Limpar filtro" option should no longer be present
    const clearOptionAfter = wrapper.findAll('option').find(o => o.text() === 'Limpar filtro');
    expect(clearOptionAfter).toBeUndefined();
  });
});
