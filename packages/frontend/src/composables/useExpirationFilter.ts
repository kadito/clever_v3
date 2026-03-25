import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { BaseContent } from '@clever/shared';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Extracts the expiration date from a content item based on its contentType.
 *
 * - Licenses: reads `data.dataVencimento`
 * - Contracts: takes the soonest of `data.fimContratoCPA` and `data.fimContratoSH`
 * - Returns undefined if no valid dates are present
 */
export function getExpirationDate(item: BaseContent): string | undefined {
  const data = item.data;

  if (item.contentType === 'licenses') {
    const date = data.dataVencimento;
    return typeof date === 'string' && date.length >= 7 ? date : undefined;
  }

  if (item.contentType === 'contracts') {
    const cpa = typeof data.fimContratoCPA === 'string' && data.fimContratoCPA.length >= 7
      ? data.fimContratoCPA
      : undefined;
    const sh = typeof data.fimContratoSH === 'string' && data.fimContratoSH.length >= 7
      ? data.fimContratoSH
      : undefined;

    if (cpa && sh) {
      return cpa <= sh ? cpa : sh;
    }
    return cpa ?? sh;
  }

  return undefined;
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
 * Composable for filtering content items by expiration month.
 *
 * Validates: REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07
 */
export function useExpirationFilter(contentType: 'contracts' | 'licenses'): {
  filterOptions: ComputedRef<FilterOption[]>;
  selectedMonth: Ref<string | null>;
  clearFilter: () => void;
  filterItems: (items: BaseContent[]) => BaseContent[];
} {
  const filterOptions = computed(() => buildFilterOptions(new Date()));

  const selectedMonth = ref<string | null>(null);

  const clearFilter = (): void => {
    selectedMonth.value = null;
  };

  const filterItems = (items: BaseContent[]): BaseContent[] => {
    if (selectedMonth.value === null) {
      return items;
    }

    const target = selectedMonth.value;

    return items.filter((item) => {
      const expDate = getExpirationDate(item);
      if (expDate === undefined) {
        return false;
      }
      return expDate.substring(0, 7) === target;
    });
  };

  return {
    filterOptions,
    selectedMonth,
    clearFilter,
    filterItems,
  };
}
