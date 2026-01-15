<template>
  <div class="display-toggle-container">
    <div class="toggle-item" :class="{ 'inactive': !isActive }">
      <h3 class="toggle-title">{{ title }}</h3>
      <button
        type="button"
        class="toggle-switch"
        :class="{ 'active': isActive }"
        @click="handleToggle"
      >
        <span class="toggle-slider"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  isActive: boolean
}

interface Emits {
  (e: 'toggle', active: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleToggle = () => {
  emit('toggle', !props.isActive)
}
</script>

<style scoped>
.display-toggle-container {
  @apply mb-4;
}

.toggle-item {
  @apply flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-white transition-all duration-200;
}

.toggle-item.inactive {
  @apply opacity-70 bg-gray-50;
}

.toggle-item.inactive .toggle-title {
  @apply text-gray-400;
}

.toggle-title {
  @apply text-base font-semibold text-gray-700 m-0;
}

.toggle-switch {
  @apply relative bg-gray-300 border-none rounded-full cursor-pointer transition-colors duration-300 touch-target;
  width: 50px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-switch.active {
  @apply bg-green-500;
}

.toggle-slider {
  @apply absolute bg-white rounded-full transition-transform duration-300;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
}

.toggle-switch.active .toggle-slider {
  transform: translateX(26px);
}

/* Touch-friendly interactions */
@media (hover: none) {
  .toggle-switch:active {
    @apply scale-95;
  }
}

/* Ensure accessibility and visual feedback */
.toggle-switch:focus {
  @apply outline-2 outline-green-500 outline-offset-2;
}

.toggle-switch:hover:not(:disabled) {
  @apply opacity-90;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .toggle-item {
    @apply p-3;
  }
  
  .toggle-title {
    @apply text-sm;
  }
}
</style>