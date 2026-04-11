<template>
  <div class="equipment-section">
    <div class="equipment-header">
      <h4>EQUIPAMENTOS CPA</h4>
    </div>

    <div class="equipment-info-callout">
      <span class="info-icon">ℹ️</span>
      <span
        >O desconto aplica-se apenas aos equipamentos adicionais (2º, 3º, etc.). O primeiro
        equipamento não tem desconto.</span
      >
    </div>

    <div class="equipment-list">
      <EquipmentCard
        v-for="(equipment, index) in equipments"
        :key="equipment.id"
        :equipment="equipment"
        :equipment-number="index + 1"
        :show-discount="index > 0"
        @update="updateEquipment(index, $event)"
        @remove="removeEquipment(index)"
      />
    </div>

    <button type="button" class="add-equipment-btn" @click="addEquipment">
      + ADICIONAR EQUIPAMENTO
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ContractEquipment } from '@clever/shared';
import EquipmentCard from './EquipmentCard.vue';

interface Props {
  equipments: ContractEquipment[];
}

interface Emits {
  (
    e: 'equipment-updated',
    data: { action: string; index?: number; equipment?: ContractEquipment }
  ): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const addEquipment = () => {
  const newEquipment: ContractEquipment = {
    id: crypto.randomUUID(),
    modelo: '',
    numeroSerie: '',
    desconto: props.equipments.length === 0 ? 0 : 10, // First equipment has 0% discount
    observacoes: '',
  };

  emit('equipment-updated', { action: 'add', equipment: newEquipment });
};

const updateEquipment = (index: number, equipment: ContractEquipment) => {
  emit('equipment-updated', { action: 'update', index, equipment });
};

const removeEquipment = (index: number) => {
  emit('equipment-updated', { action: 'remove', index });
};
</script>

<style scoped>
.equipment-section {
  @apply my-6;
}

.equipment-header {
  @apply flex justify-between items-center mb-4;
}

.equipment-header h4 {
  @apply text-base font-semibold text-gray-700 m-0;
}

.add-equipment-btn {
  @apply mt-4 bg-green-500 text-white border-none px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 touch-target w-full;
}

.add-equipment-btn:hover {
  @apply bg-green-600;
}

.equipment-info-callout {
  @apply flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4;
}

.info-icon {
  @apply text-blue-600 text-base;
}

.equipment-info-callout span:last-child {
  @apply text-sm text-blue-700 leading-relaxed;
}

.equipment-list {
  @apply space-y-4;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .add-equipment-btn:active {
    @apply bg-green-700;
  }
}

/* Mobile responsiveness improvements */
@media (max-width: 640px) {
  .equipment-info-callout {
    @apply p-2;
  }
}
</style>
