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
  @apply form-section-title-consistent text-base;
}

.dates-grid {
  @apply form-grid-consistent;
}

.form-field {
  @apply flex flex-col gap-2;
}

.form-label {
  @apply form-label-consistent;
}

.form-input {
  @apply form-input-consistent;
}
</style>