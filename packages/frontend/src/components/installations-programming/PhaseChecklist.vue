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
        :disabled="disabled"
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
          <span class="category-name">{{ CHECKLIST_CATEGORY_LABELS_SEVEN[categoryKey] }}</span>
        </div>
        <span
          class="category-progress"
          :class="getCategoryProgressClass(categoryKey)"
        >
          {{ getCategoryCheckedCount(categoryKey) }}/{{ CHECKLIST_ITEMS_SEVEN[categoryKey].length }}
        </span>
      </button>

      <!-- Category Items -->
      <div
        v-if="expandedCategories[categoryKey]"
        :id="`category-${categoryKey}`"
        class="category-items"
      >
        <label
          v-for="itemKey in CHECKLIST_ITEMS_SEVEN[categoryKey]"
          :key="itemKey"
          class="checklist-item"
        >
          <span class="item-label">{{ CHECKLIST_LABELS_SEVEN[categoryKey][itemKey] }}</span>
          <button
            type="button"
            role="switch"
            :aria-checked="getItemValue(categoryKey, itemKey)"
            :aria-label="CHECKLIST_LABELS_SEVEN[categoryKey][itemKey]"
            class="switch"
            :class="{ 'switch--on': getItemValue(categoryKey, itemKey) }"
            :disabled="disabled"
            @click="toggleItem(categoryKey, itemKey)"
          >
            <span class="switch-thumb" />
          </button>
        </label>

        <!-- CPA miniPcDetails text area -->
        <div
          v-if="categoryKey === 'cpa'"
          class="mini-pc-details"
        >
          <label class="mini-pc-label" for="miniPcDetails">Mini PC</label>
          <textarea
            id="miniPcDetails"
            class="mini-pc-textarea"
            placeholder="Marca, Modelo, n.º série, materiais"
            :value="modelValue.cpa.miniPcDetails"
            :readonly="disabled"
            :disabled="disabled"
            @input="updateMiniPcDetails(($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import {
  CHECKLIST_ITEMS_SEVEN,
  CHECKLIST_LABELS_SEVEN,
  CHECKLIST_CATEGORY_LABELS_SEVEN,
} from '@clever/shared';
import type { EquipmentChecklist } from '@clever/shared';

type CategoryKey = keyof typeof CHECKLIST_ITEMS_SEVEN;

interface Props {
  modelValue: EquipmentChecklist;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: EquipmentChecklist): void;
}>();

const categoryKeys = computed<CategoryKey[]>(() =>
  Object.keys(CHECKLIST_ITEMS_SEVEN) as CategoryKey[]
);

// All categories start collapsed
const expandedCategories = reactive<Record<CategoryKey, boolean>>(
  Object.fromEntries(categoryKeys.value.map((key) => [key, false])) as Record<CategoryKey, boolean>
);

const toggleCategory = (categoryKey: CategoryKey): void => {
  expandedCategories[categoryKey] = !expandedCategories[categoryKey];
};

const getItemValue = (categoryKey: CategoryKey, itemKey: string): boolean => {
  return props.modelValue?.[categoryKey]?.items?.[itemKey] ?? false;
};

const getCategoryCheckedCount = (categoryKey: CategoryKey): number => {
  const items = CHECKLIST_ITEMS_SEVEN[categoryKey];
  return items.filter((itemKey) => getItemValue(categoryKey, itemKey)).length;
};

const getCategoryProgressClass = (categoryKey: CategoryKey): Record<string, boolean> => {
  const checked = getCategoryCheckedCount(categoryKey);
  const total = CHECKLIST_ITEMS_SEVEN[categoryKey].length;
  return {
    'progress--complete': checked === total && total > 0,
    'progress--partial': checked > 0 && checked < total,
  };
};

const toggleItem = (categoryKey: CategoryKey, itemKey: string): void => {
  if (props.disabled) return;

  const currentValue = getItemValue(categoryKey, itemKey);
  const currentCategory = props.modelValue[categoryKey];
  const updatedItems = {
    ...currentCategory.items,
    [itemKey]: !currentValue,
  };

  const updatedChecklist: EquipmentChecklist = {
    ...props.modelValue,
    [categoryKey]: categoryKey === 'cpa'
      ? { ...currentCategory, items: updatedItems }
      : { items: updatedItems },
  };

  emit('update:modelValue', updatedChecklist);
};

const updateMiniPcDetails = (value: string): void => {
  if (props.disabled) return;

  const updatedChecklist: EquipmentChecklist = {
    ...props.modelValue,
    cpa: {
      ...props.modelValue.cpa,
      miniPcDetails: value,
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

.category-header:disabled {
  @apply cursor-default;
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
  width: 50px;
  height: 26px;
  background-color: #e5e7eb;
  -webkit-tap-highlight-color: transparent;
}

.switch:disabled {
  @apply cursor-not-allowed opacity-60;
}

.switch--on {
  background-color: rgb(117, 174, 147);
}

.switch-thumb {
  @apply absolute rounded-full bg-white
         transition-transform duration-200 ease-in-out;
  top: 50%;
  left: 3px;
  width: 20px;
  height: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
  transform: translateY(-50%) translateX(0);
}

.switch--on .switch-thumb {
  transform: translateY(-50%) translateX(24px);
}

@media (max-width: 640px) {
  .switch {
    width: 48px;
    height: 28px;
  }

  .switch-thumb {
    width: 22px;
    height: 22px;
  }

  .switch--on .switch-thumb {
    transform: translateY(-50%) translateX(20px);
  }
}

.switch:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  ring-color: #75AE93;
}

/* Mini PC Details textarea */
.mini-pc-details {
  @apply px-4 py-3 border-t border-gray-100;
}

.mini-pc-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
  font-size: 16px;
}

.mini-pc-textarea {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:border-transparent
         resize-y;
  min-height: 80px;
  font-size: 16px;
  focus-ring-color: #75AE93;
}

.mini-pc-textarea:focus {
  --tw-ring-color: #75AE93;
}

.mini-pc-textarea:disabled,
.mini-pc-textarea[readonly] {
  @apply bg-gray-50 cursor-not-allowed opacity-75;
}
</style>
