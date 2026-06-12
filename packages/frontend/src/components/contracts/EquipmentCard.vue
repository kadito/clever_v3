<template>
  <div class="equipment-card">
    <div class="equipment-header">
      <h5>EQUIPAMENTO {{ equipmentNumber }}</h5>
      <button
        v-if="equipmentNumber > 1"
        type="button"
        class="remove-btn"
        @click="$emit('remove')"
      >
        ✕
      </button>
    </div>

    <div class="equipment-fields">
      <div class="form-field">
        <label class="form-label">MODELO</label>
        <input
          v-model="localEquipment.modelo"
          type="text"
          class="form-input"
          placeholder="Ex: GEST 15"
          @input="updateEquipment"
        >
      </div>

      <div class="form-field">
        <label class="form-label">Nº SÉRIE</label>
        <input
          v-model="localEquipment.numeroSerie"
          type="text"
          class="form-input"
          placeholder="Ex: 1234567"
          @input="updateEquipment"
        >
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">OBSERVAÇÕES</label>
      <textarea
        v-model="localEquipment.observacoes"
        class="form-textarea"
        rows="3"
        placeholder="Observações sobre este equipamento..."
        @input="updateEquipment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ContractEquipment } from '@clever/shared';

interface Props {
  equipment: ContractEquipment;
  equipmentNumber: number;
}

interface Emits {
  (e: 'update', equipment: ContractEquipment): void;
  (e: 'remove'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localEquipment = ref<ContractEquipment>({ ...props.equipment });

// Watch for external changes to equipment prop
watch(
  () => props.equipment,
  newEquipment => {
    localEquipment.value = { ...newEquipment };
  },
  { deep: true }
);

const updateEquipment = () => {
  emit('update', { ...localEquipment.value });
};
</script>

<style scoped>
.equipment-card {
  @apply border border-gray-200 rounded-lg p-4 bg-white;
}

.equipment-header {
  @apply flex justify-between items-center mb-4;
}

.equipment-header h5 {
  @apply text-sm font-semibold text-gray-700 m-0;
}

.remove-btn {
  @apply p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 touch-target;
}

.equipment-fields {
  @apply grid grid-cols-1 gap-4 mb-4;
}

@media (min-width: 768px) {
  .equipment-fields {
    @apply grid-cols-2;
  }
}

.form-field {
  @apply flex flex-col gap-2;
}

.form-label {
  @apply font-medium text-gray-700 text-sm;
}

.form-input {
  @apply px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm transition-colors duration-200 touch-target;
}

.form-input:focus {
  @apply outline-none border-green-500 ring-2 ring-green-200;
}

.form-textarea {
  @apply px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm resize-none transition-colors duration-200 touch-target;
}

.form-textarea:focus {
  @apply outline-none border-green-500 ring-2 ring-green-200;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .remove-btn:active {
    @apply bg-red-100;
  }
}

/* Mobile responsiveness improvements */
@media (max-width: 640px) {
  .equipment-card {
    @apply p-3;
  }

  .equipment-fields {
    @apply gap-3;
  }

  .form-input,
  .form-textarea {
    @apply py-3;
  }
}
</style>
