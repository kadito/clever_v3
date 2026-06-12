import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { BaseContent } from '@clever/shared';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Generates 12 month filter options starting from the current month.
 * Labels use pt-PT locale with capitalized first letter.
 */
function buildFilterOptions(now: Date): FilterOption[] {
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

/**
 * Extracts the expiration date from a BaseContent item.
 * - Licenses: uses `dataVencimento`
 * - Contracts: uses the soonest of `fimContratoCPA` / `fimContratoSH`
 * Returns undefined if no valid date is found.
 *
 * Validates: REQ-03, REQ-06
 */
export function getExpirationDate(item: BaseContent): string | undefined {
  const data = item.data as Record<string, unknown>;

  if (item.contentType === 'licenses') {
    const date = data.dataVencimento;
    if (typeof date === 'string' && date.length >= 7) {
      return date;
    }
    return undefined;
  }

  if (item.contentType === 'contracts') {
    const cpaDt = data.fimContratoCPA;
    const shDt = data.fimContratoSH;

    const cpa = typeof cpaDt === 'string' && cpaDt.length >= 7 ? cpaDt : undefined;
    const sh = typeof shDt === 'string' && shDt.length >= 7 ? shDt : undefined;

    if (cpa && sh) {
      return cpa <= sh ? cpa : sh;
    }
    return cpa ?? sh;
  }

  return undefined;
}

/**
 * Composable for expiration month filter state management.
 * Provides both server-side filter params (for API calls) and client-side
 * filterItems function (for immediate UI filtering of loaded data).
 *
 * Validates: REQ-02, REQ-03, REQ-06
 */
export function useExpirationFilter(_contentType?: string): {
  filterOptions: ComputedRef<FilterOption[]>;
  selectedMonth: Ref<string | null>;
  clearFilter: () => void;
  filterParams: ComputedRef<Record<string, string>>;
  filterItems: (items: BaseContent[]) => BaseContent[];
} {
  const filterOptions = computed(() => buildFilterOptions(new Date()));

  const selectedMonth = ref<string | null>(null);

  const clearFilter = (): void => {
    selectedMonth.value = null;
  };

  const filterParams = computed<Record<string, string>>(() => {
    if (selectedMonth.value === null) {
      return {} as Record<string, string>;
    }
    return { expirationMonth: selectedMonth.value };
  });

  /**
   * Client-side filtering of items by expiration month.
   * When no filter is active, returns all items.
   * When filter is active, returns only items whose expiration date matches
   * the selected YYYY-MM prefix.
   */
  const filterItems = (items: BaseContent[]): BaseContent[] => {
    if (selectedMonth.value === null) {
      return items;
    }
    const prefix = selectedMonth.value; // e.g. "2026-06"
    return items.filter((item) => {
      const date = getExpirationDate(item);
      if (!date) return false;
      return date.startsWith(prefix);
    });
  };

  return {
    filterOptions,
    selectedMonth,
    clearFilter,
    filterParams,
    filterItems,
  };
}
