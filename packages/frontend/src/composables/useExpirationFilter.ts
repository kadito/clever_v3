import { ref, computed, type Ref, type ComputedRef } from 'vue';

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
 * Composable for expiration month filter state management.
 * Filtering is now server-side — this composable provides filter UI state
 * and query parameters to send to the API.
 *
 * Validates: REQ-02, REQ-03, REQ-06
 */
export function useExpirationFilter(): {
  filterOptions: ComputedRef<FilterOption[]>;
  selectedMonth: Ref<string | null>;
  clearFilter: () => void;
  filterParams: ComputedRef<Record<string, string>>;
} {
  const filterOptions = computed(() => buildFilterOptions(new Date()));

  const selectedMonth = ref<string | null>(null);

  const clearFilter = (): void => {
    selectedMonth.value = null;
  };

  const filterParams = computed<Record<string, string>>(() => {
    if (selectedMonth.value === null) {
      return {};
    }
    return { expirationMonth: selectedMonth.value };
  });

  return {
    filterOptions,
    selectedMonth,
    clearFilter,
    filterParams,
  };
}
