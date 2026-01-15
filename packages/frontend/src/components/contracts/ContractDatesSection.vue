<template>
  <div class="contract-dates-section">
    <h4>DATAS DO CONTRATO</h4>
    <div class="dates-grid">
      <div class="form-field">
        <label class="form-label">DATA DE INÍCIO</label>
        <input 
          :value="startDate"
          @input="$emit('update:start-date', $event.target.value)"
          type="date"
          class="form-input"
        />
      </div>
      
      <div class="form-field">
        <label class="form-label">DATA DE FIM</label>
        <input 
          :value="endDate"
          @input="$emit('update:end-date', $event.target.value)"
          type="date"
          class="form-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  startDate: string
  endDate: string
}

interface Emits {
  (e: 'update:start-date', date: string): void
  (e: 'update:end-date', date: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.contract-dates-section {
  @apply space-y-4;
}

.contract-dates-section h4 {
  @apply text-base font-semibold text-gray-700;
}

.dates-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .dates-grid {
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
  @apply px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm transition-colors duration-200;
  min-height: 44px; /* Touch-friendly minimum height */
}

.form-input:focus {
  @apply outline-none border-green-500 ring-2 ring-green-200;
}
</style>