<template>
  <div class="phase3-form">
    <!-- Software Selection (cascading dropdowns) -->
    <fieldset class="form-field">
      <legend class="form-label" :class="{ 'text-red-600': hasError('software') }">Software</legend>

      <!-- Brand dropdown -->
      <div class="dropdown-field">
        <label class="dropdown-label" for="phase3Brand">Marca</label>
        <select
          id="phase3Brand"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !selectedBrand }"
          :disabled="disabled"
          :value="modelValue.software?.brand ?? ''"
          @change="onBrandChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione uma marca...</option>
          <option v-for="h in SOFTWARE_HIERARCHY" :key="h.brand" :value="h.brand">
            {{ h.brand }}
          </option>
        </select>
      </div>

      <!-- Sub-product dropdown (conditional) -->
      <div v-if="currentHierarchy?.subProducts" class="dropdown-field">
        <label class="dropdown-label" for="phase3SubProduct">Sub-produto</label>
        <select
          id="phase3SubProduct"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.subProduct }"
          :disabled="disabled"
          :value="modelValue.software?.subProduct ?? ''"
          @change="onSubProductChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um sub-produto...</option>
          <option v-for="sp in currentHierarchy.subProducts" :key="sp.name" :value="sp.name">
            {{ sp.name }}
          </option>
        </select>
      </div>

      <!-- Module dropdown (conditional — Pix sub-products) -->
      <div v-if="currentSubProduct?.modules" class="dropdown-field">
        <label class="dropdown-label" for="phase3Module">Módulo</label>
        <select
          id="phase3Module"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.module }"
          :disabled="disabled"
          :value="modelValue.software?.module ?? ''"
          @change="onModuleChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um módulo...</option>
          <option v-for="mod in currentSubProduct.modules" :key="mod" :value="mod">
            {{ mod }}
          </option>
        </select>
      </div>

      <!-- Tier dropdown (conditional — Zon Soft sub-products) -->
      <div v-if="currentSubProduct?.tiers" class="dropdown-field">
        <label class="dropdown-label" for="phase3Tier">Plano</label>
        <select
          id="phase3Tier"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.tier }"
          :disabled="disabled"
          :value="modelValue.software?.tier ?? ''"
          @change="onTierChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um plano...</option>
          <option v-for="t in currentSubProduct.tiers" :key="t" :value="t">
            {{ t }}
          </option>
        </select>
      </div>

      <!-- License type dropdown (conditional — PT CERT) -->
      <div v-if="currentHierarchy?.licenseTypes" class="dropdown-field">
        <label class="dropdown-label" for="phase3LicenseType">Tipo de Licença</label>
        <select
          id="phase3LicenseType"
          class="form-select"
          :class="{ 'field-invalid': hasError('software') && !modelValue.software?.licenseType }"
          :disabled="disabled"
          :value="modelValue.software?.licenseType ?? ''"
          @change="onLicenseTypeChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Selecione um tipo...</option>
          <option v-for="lt in currentHierarchy.licenseTypes" :key="lt" :value="lt">
            {{ lt }}
          </option>
        </select>
      </div>

      <span v-if="hasError('software')" class="field-error">Selecione o software completo</span>
    </fieldset>

    <!-- Identificação / Referência -->
    <!-- N.º Licença -->
    <div class="form-field">
      <label class="form-label" for="phase3NumeroLicenca">N.º Licença</label>
      <input
        id="phase3NumeroLicenca"
        type="text"
        class="form-input"
        :value="modelValue.numeroLicenca"
        :disabled="disabled"
        placeholder="Número de licença"
        @input="updateField('numeroLicenca', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- ── Programação Checklist ─────────────────────────────── -->
    <div class="checklist-section">
      <h3 class="checklist-section-title">Verificações de Programação</h3>

      <!-- One collapsible group per checklist category (excludes 'teclas') -->
      <div
        v-for="groupKey in collapsibleGroupKeys"
        :key="groupKey"
        class="checklist-group"
      >
        <!-- Group header: toggle enabled + expand/collapse -->
        <div class="group-header">
          <button
            type="button"
            class="group-header-expand"
            :aria-expanded="expandedGroups[groupKey] && getGroupEnabled(groupKey)"
            :disabled="disabled || !getGroupEnabled(groupKey)"
            @click="toggleExpand(groupKey)"
          >
            <div class="group-header-left">
              <svg
                class="chevron"
                :class="{ 'chevron--expanded': expandedGroups[groupKey] && getGroupEnabled(groupKey) }"
                width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 8l4 4 4-4" />
              </svg>
              <span class="group-name" :class="{ 'group-name--disabled': !getGroupEnabled(groupKey) }">
                {{ PHASE3_CHECKLIST_GROUP_LABELS[groupKey] }}
              </span>
            </div>
            <span
              v-if="getGroupEnabled(groupKey)"
              class="group-progress"
              :class="getGroupProgressClass(groupKey)"
            >
              {{ getGroupCheckedCount(groupKey) }}/{{ PHASE3_CHECKLIST_ITEMS[groupKey].length }}
            </span>
          </button>

          <!-- Enabled toggle -->
          <button
            type="button"
            role="switch"
            :aria-checked="getGroupEnabled(groupKey)"
            :aria-label="`Ativar ${PHASE3_CHECKLIST_GROUP_LABELS[groupKey]}`"
            class="switch group-switch"
            :class="{ 'switch--on': getGroupEnabled(groupKey) }"
            :disabled="disabled"
            @click="toggleGroupEnabled(groupKey)"
          >
            <span class="switch-thumb" />
          </button>
        </div>

        <!-- Items (shown when enabled AND expanded) -->
        <div
          v-if="getGroupEnabled(groupKey) && expandedGroups[groupKey]"
          class="group-items"
        >
          <label
            v-for="itemKey in PHASE3_CHECKLIST_ITEMS[groupKey]"
            :key="itemKey"
            class="checklist-item"
            :class="{ 'checklist-item--indented': isIndented(groupKey, itemKey) }"
          >
            <span class="item-label">{{ PHASE3_CHECKLIST_LABELS[groupKey][itemKey] }}</span>
            <button
              type="button"
              role="switch"
              :aria-checked="getItemValue(groupKey, itemKey)"
              :aria-label="PHASE3_CHECKLIST_LABELS[groupKey][itemKey]"
              class="switch"
              :class="{ 'switch--on': getItemValue(groupKey, itemKey) }"
              :disabled="disabled"
              @click="toggleItem(groupKey, itemKey)"
            >
              <span class="switch-thumb" />
            </button>
          </label>
        </div>
      </div>
    </div>

    <!-- Leituras Guardadas + Apagar Leituras Guardadas (flat toggles) -->
    <div class="form-field">
      <div class="toggle-field">
        <span class="form-label">Leituras Guardadas</span>
        <button
          type="button"
          role="switch"
          :aria-checked="getItemValue('teclas', 'leiturasGuardadas')"
          aria-label="Leituras Guardadas"
          class="switch"
          :class="{ 'switch--on': getItemValue('teclas', 'leiturasGuardadas') }"
          :disabled="disabled"
          @click="toggleItem('teclas', 'leiturasGuardadas')"
        >
          <span class="switch-thumb" />
        </button>
      </div>
    </div>

    <div class="form-field">
      <div class="toggle-field">
        <span class="form-label">Apagar Leituras Guardadas</span>
        <button
          type="button"
          role="switch"
          :aria-checked="getItemValue('teclas', 'apagarLeiturasGuardadas')"
          aria-label="Apagar Leituras Guardadas"
          class="switch"
          :class="{ 'switch--on': getItemValue('teclas', 'apagarLeiturasGuardadas') }"
          :disabled="disabled"
          @click="toggleItem('teclas', 'apagarLeiturasGuardadas')"
        >
          <span class="switch-thumb" />
        </button>
      </div>
    </div>

    <!-- Teste final de todos os equipamentos e acessórios (toggle switch) -->
    <div class="form-field">
      <div class="toggle-field">
        <span class="form-label" :class="{ 'text-red-600': hasError('testeFinalEquipamentos') }">Teste final de todos os equipamentos e acessórios</span>
        <button
          type="button"
          role="switch"
          :aria-checked="modelValue.testeFinalEquipamentos"
          aria-label="Teste final de todos os equipamentos e acessórios"
          class="switch"
          :class="{ 'switch--on': modelValue.testeFinalEquipamentos, 'ring-2 ring-red-500': hasError('testeFinalEquipamentos') }"
          :disabled="disabled"
          @click="updateField('testeFinalEquipamentos', !modelValue.testeFinalEquipamentos)"
        >
          <span class="switch-thumb" />
        </button>
      </div>
      <span v-if="hasError('testeFinalEquipamentos')" class="field-error">Deve ser ativado</span>
    </div>

    <!-- Notas de Programação -->
    <div class="form-field">
      <label class="form-label" for="phase3NotasProgramacao">Notas de Programação</label>
      <textarea
        id="phase3NotasProgramacao"
        class="form-textarea"
        :value="modelValue.notasProgramacao"
        :disabled="disabled"
        placeholder="Notas de verificação da programação..."
        rows="4"
        @input="updateField('notasProgramacao', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { Phase3ProgramacaoData, Phase3ChecklistCategory, SoftwareSelection } from '@clever/shared';
import {
  SOFTWARE_HIERARCHY,
  PHASE3_CHECKLIST_ITEMS,
  PHASE3_CHECKLIST_LABELS,
  PHASE3_CHECKLIST_GROUP_LABELS,
  PHASE3_CHECKLIST_INDENT,
} from '@clever/shared';

type GroupKey = keyof typeof PHASE3_CHECKLIST_ITEMS;

interface Props {
  modelValue: Phase3ProgramacaoData;
  disabled?: boolean;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase3ProgramacaoData): void;
}>();

// ── Computed helpers ────────────────────────────────────────────────

const groupKeys = computed<GroupKey[]>(() => Object.keys(PHASE3_CHECKLIST_ITEMS) as GroupKey[]);

const collapsibleGroupKeys = computed<GroupKey[]>(() =>
  groupKeys.value.filter((k) => k !== 'teclas')
);

const selectedBrand = computed(() => props.modelValue.software?.brand ?? '');

const currentHierarchy = computed(() => {
  if (!selectedBrand.value) return undefined;
  return SOFTWARE_HIERARCHY.find((h) => h.brand === selectedBrand.value);
});

const currentSubProduct = computed(() => {
  const subProductName = props.modelValue.software?.subProduct;
  if (!subProductName || !currentHierarchy.value?.subProducts) return undefined;
  return currentHierarchy.value.subProducts.find((sp) => sp.name === subProductName);
});

// ── Expand state ────────────────────────────────────────────────────

const expandedGroups = reactive<Record<GroupKey, boolean>>(
  Object.fromEntries(groupKeys.value.map((k) => [k, false])) as Record<GroupKey, boolean>
);

const toggleExpand = (key: GroupKey): void => {
  if (!getGroupEnabled(key)) return;
  expandedGroups[key] = !expandedGroups[key];
};

// ── Group helpers ───────────────────────────────────────────────────

const getGroupEnabled = (key: GroupKey): boolean =>
  props.modelValue.programacaoChecklist[key]?.enabled ?? true;

const getItemValue = (groupKey: GroupKey, itemKey: string): boolean =>
  props.modelValue.programacaoChecklist[groupKey]?.items?.[itemKey] ?? false;

const getGroupCheckedCount = (key: GroupKey): number =>
  PHASE3_CHECKLIST_ITEMS[key].filter((itemKey) => getItemValue(key, itemKey)).length;

const getGroupProgressClass = (key: GroupKey): Record<string, boolean> => {
  const checked = getGroupCheckedCount(key);
  const total = PHASE3_CHECKLIST_ITEMS[key].length;
  return {
    'progress--complete': checked === total && total > 0,
    'progress--partial': checked > 0 && checked < total,
  };
};

const isIndented = (groupKey: GroupKey, itemKey: string): boolean =>
  (groupKey === 'leituraX' || groupKey === 'leituraZ') &&
  PHASE3_CHECKLIST_INDENT[itemKey] !== undefined;

// ── Error helpers ───────────────────────────────────────────────────

const hasError = (field: string): boolean => props.validationErrors.includes(field);

// ── Mutators ────────────────────────────────────────────────────────

const updateField = (field: keyof Phase3ProgramacaoData, value: string | boolean): void => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const toggleGroupEnabled = (key: GroupKey): void => {
  if (props.disabled) return;
  const current = props.modelValue.programacaoChecklist[key];
  const newEnabled = !current.enabled;
  if (!newEnabled) expandedGroups[key] = false;
  emit('update:modelValue', {
    ...props.modelValue,
    programacaoChecklist: {
      ...props.modelValue.programacaoChecklist,
      [key]: { ...current, enabled: newEnabled },
    },
  });
};

const toggleItem = (groupKey: GroupKey, itemKey: string): void => {
  if (props.disabled) return;
  const current = props.modelValue.programacaoChecklist[groupKey];
  emit('update:modelValue', {
    ...props.modelValue,
    programacaoChecklist: {
      ...props.modelValue.programacaoChecklist,
      [groupKey]: {
        ...current,
        items: { ...current.items, [itemKey]: !getItemValue(groupKey, itemKey) },
      },
    },
  });
};

const updateSoftware = (selection: SoftwareSelection | null): void => {
  emit('update:modelValue', { ...props.modelValue, software: selection });
};

const onBrandChange = (brand: string): void => {
  if (!brand) { updateSoftware(null); return; }
  updateSoftware({ brand });
};

const onSubProductChange = (subProduct: string): void => {
  if (!props.modelValue.software) return;
  updateSoftware({ brand: props.modelValue.software.brand, subProduct });
};

const onModuleChange = (module: string): void => {
  if (!props.modelValue.software) return;
  updateSoftware({ ...props.modelValue.software, module });
};

const onTierChange = (tier: string): void => {
  if (!props.modelValue.software) return;
  updateSoftware({ ...props.modelValue.software, tier });
};

const onLicenseTypeChange = (licenseType: string): void => {
  if (!props.modelValue.software) return;
  updateSoftware({ ...props.modelValue.software, licenseType });
};
</script>

<style scoped>
.phase3-form {
  @apply flex flex-col gap-4;
}

.form-field {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
  font-size: 16px;
}

.dropdown-field {
  @apply flex flex-col gap-1 mt-2;
}

.dropdown-label {
  @apply block text-xs font-medium text-gray-500;
  font-size: 14px;
}

.form-select {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 bg-white
         focus:outline-none focus:ring-2 focus:border-transparent
         appearance-none;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.form-select:focus { --tw-ring-color: #75AE93; }
.form-select:disabled { @apply bg-gray-50 cursor-not-allowed opacity-75; }

.form-input,
.form-textarea {
  @apply w-full rounded-md border border-gray-300 px-3 py-2
         text-gray-700 placeholder-gray-400
         focus:outline-none focus:ring-2 focus:border-transparent;
  min-height: 44px;
  font-size: 16px;
  --tw-ring-color: #75AE93;
}

.form-input:focus,
.form-textarea:focus { --tw-ring-color: #75AE93; }

.form-input:disabled,
.form-textarea:disabled { @apply bg-gray-50 cursor-not-allowed opacity-75; }

.field-invalid { @apply border-red-500; }

.field-error { @apply text-xs text-red-600 mt-0.5; }

.form-textarea { resize: vertical; }

/* Checklist section */
.checklist-section { @apply flex flex-col gap-2; }

.checklist-section-title {
  @apply text-sm font-semibold text-gray-700 mb-1;
  font-size: 16px;
}

.checklist-group {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.group-header {
  @apply flex items-center bg-gray-50;
  min-height: 44px;
}

.group-header-expand {
  @apply flex-1 flex items-center justify-between px-4 py-3
         text-left cursor-pointer transition-colors duration-150;
  min-height: 44px;
  font-size: 16px;
  background: transparent;
  border: none;
  -webkit-tap-highlight-color: transparent;
}

.group-header-expand:active { @apply bg-gray-100; }
.group-header-expand:disabled { @apply cursor-default; }

.group-header-left { @apply flex items-center gap-2; }

.chevron {
  @apply text-gray-400 transition-transform duration-200 flex-shrink-0;
}

.chevron--expanded { transform: rotate(180deg); }

.group-name { @apply font-semibold text-gray-800; }
.group-name--disabled { @apply text-gray-400; }

.group-progress { @apply text-sm font-medium text-gray-400 flex-shrink-0; }
.progress--partial { color: #d4a017; }
.progress--complete { color: #75AE93; }

.group-switch { @apply mr-3 flex-shrink-0; }

.group-items { @apply divide-y divide-gray-100; }

.checklist-item {
  @apply flex items-center justify-between px-4 py-3 cursor-pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

/* Visual indent for child items */
.checklist-item--indented { @apply pl-10; }

.item-label {
  @apply text-gray-700 text-sm flex-1 pr-3;
  font-size: 16px;
}

/* Toggle field layout */
.toggle-field {
  @apply flex items-center justify-between;
  min-height: 44px;
}

/* Switch */
.switch {
  @apply relative inline-flex flex-shrink-0 rounded-full
         transition-colors duration-200 ease-in-out cursor-pointer;
  width: 50px;
  height: 26px;
  background-color: #e5e7eb;
  -webkit-tap-highlight-color: transparent;
}

.switch:disabled { @apply cursor-not-allowed opacity-60; }
.switch--on { background-color: rgb(117, 174, 147); }

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

.switch--on .switch-thumb { transform: translateY(-50%) translateX(24px); }

@media (max-width: 640px) {
  .switch { width: 48px; height: 28px; }
  .switch-thumb { width: 22px; height: 22px; }
  .switch--on .switch-thumb { transform: translateY(-50%) translateX(20px); }
}

.switch:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  ring-color: #75AE93;
}
</style>
