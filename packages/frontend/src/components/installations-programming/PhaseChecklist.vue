<template>
  <div class="phase-checklist">
    <div
      v-for="categoryKey in categoryKeys"
      :key="categoryKey"
      class="category"
    >
      <!-- Category Header (collapsible) -->
      <button
        type="button"
        class="category-header"
        :aria-expanded="expandedCategories[categoryKey]"
        :aria-controls="`category-${categoryKey}`"
        @click="toggleCategory(categoryKey)"
      >
        <div class="category-header-left">
          <svg
            class="chevron"
            :class="{ 'chevron--expanded': expandedCategories[categoryKey] }"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 8l4 4 4-4"
            />
          </svg>
          <span class="category-name">{{ CHECKLIST_CATEGORY_LABELS[categoryKey] }}</span>
        </div>
        <span class="category-progress" :class="getCategoryProgressClass(categoryKey)">
          {{ getCategoryCheckedCount(categoryKey) }}/{{ CHECKLIST_CATEGORIES[categoryKey].length }}
        </span>
      </button>

      <!-- Category Items -->
      <div
        v-if="expandedCategories[categoryKey]"
        :id="`category-${categoryKey}`"
        class="category-items"
      >
        <label
          v-for="itemKey in CHECKLIST_CATEGORIES[categoryKey]"
          :key="itemKey"
          class="checklist-item"
        >
          <span class="item-label">{{ CHECKLIST_LABELS[categoryKey]?.[itemKey] ?? itemKey }}</span>
          <button
            type="button"
            role="switch"
            :aria-checked="getItemValue(categoryKey, itemKey)"
            :aria-label="CHECKLIST_LABELS[categoryKey]?.[itemKey] ?? itemKey"
            class="switch"
            :class="{ 'switch--on': getItemValue(categoryKey, itemKey) }"
            @click="toggleItem(categoryKey, itemKey)"
          >
            <span class="switch-thumb" />
          </button>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import {
  CHECKLIST_CATEGORIES,
  CHECKLIST_LABELS,
  CHECKLIST_CATEGORY_LABELS,
} from '@clever/shared';

interface Props {
  modelValue: Record<string, Record<string, boolean>>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, Record<string, boolean>>): void;
}>();

const categoryKeys = computed(() => Object.keys(CHECKLIST_CATEGORIES));

// All categories start collapsed
const expandedCategories = reactive<Record<string, boolean>>(
  Object.fromEntries(categoryKeys.value.map((key) => [key, false]))
);

const toggleCategory = (categoryKey: string): void => {
  expandedCategories[categoryKey] = !expandedCategories[categoryKey];
};

const getItemValue = (categoryKey: string, itemKey: string): boolean => {
  return props.modelValue?.[categoryKey]?.[itemKey] ?? false;
};

const getCategoryCheckedCount = (categoryKey: string): number => {
  const items = CHECKLIST_CATEGORIES[categoryKey];
  return items.filter((itemKey) => getItemValue(categoryKey, itemKey)).length;
};

const getCategoryProgressClass = (categoryKey: string): Record<string, boolean> => {
  const checked = getCategoryCheckedCount(categoryKey);
  const total = CHECKLIST_CATEGORIES[categoryKey].length;
  return {
    'progress--complete': checked === total && total > 0,
    'progress--partial': checked > 0 && checked < total,
  };
};

const toggleItem = (categoryKey: string, itemKey: string): void => {
  const currentValue = getItemValue(categoryKey, itemKey);
  const updatedChecklist: Record<string, Record<string, boolean>> = {
    ...props.modelValue,
    [categoryKey]: {
      ...(props.modelValue?.[categoryKey] ?? {}),
      [itemKey]: !currentValue,
    },
  };
  emit('update:modelValue', updatedChecklist);
};
</script>

<style scoped>
.phase-checklist {
  @apply flex flex-col gap-2;
}

.category {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.category-header {
  @apply w-full flex items-center justify-between px-4 py-3
         bg-gray-50 text-left cursor-pointer
         transition-colors duration-150;
  min-height: 44px;
  font-size: 16px;
  -webkit-tap-highlight-color: transparent;
}

.category-header:active {
  @apply bg-gray-100;
}

.category-header-left {
  @apply flex items-center gap-2;
}

.chevron {
  @apply text-gray-400 transition-transform duration-200 flex-shrink-0;
}

.chevron--expanded {
  transform: rotate(180deg);
}

.category-name {
  @apply font-semibold text-gray-800;
}

.category-progress {
  @apply text-sm font-medium text-gray-400 flex-shrink-0;
}

.progress--partial {
  color: #d4a017;
}

.progress--complete {
  color: #75AE93;
}

.category-items {
  @apply divide-y divide-gray-100;
}

.checklist-item {
  @apply flex items-center justify-between px-4 py-3 cursor-pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.item-label {
  @apply text-gray-700 text-sm flex-1 pr-3;
  font-size: 16px;
}

/* Custom switch */
.switch {
  @apply relative inline-flex flex-shrink-0 rounded-full
         transition-colors duration-200 ease-in-out cursor-pointer;
  width: 44px;
  height: 24px;
  background-color: #d1d5db;
  -webkit-tap-highlight-color: transparent;
}

.switch--on {
  background-color: #75AE93;
}

.switch-thumb {
  @apply inline-block rounded-full bg-white shadow
         transition-transform duration-200 ease-in-out;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  margin-left: 2px;
  transform: translateX(0);
}

.switch--on .switch-thumb {
  transform: translateX(20px);
}

.switch:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  ring-color: #75AE93;
}
</style>
