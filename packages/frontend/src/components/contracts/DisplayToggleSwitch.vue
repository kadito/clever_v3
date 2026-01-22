<template>
  <div class="display-toggle-container">
    <div class="toggle-item" :class="{ inactive: !isActive }">
      <h3 class="toggle-title">{{ title }}</h3>
      <button
        type="button"
        class="toggle-switch"
        :class="{ active: isActive, disabled: disabled }"
        :disabled="disabled"
        :aria-pressed="isActive"
        :aria-label="`${isActive ? 'Desativar' : 'Ativar'} ${title}`"
        @click="handleToggle"
      >
        <span class="toggle-slider" :class="{ active: isActive }"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  isActive: boolean;
  disabled?: boolean;
}

interface Emits {
  (e: 'toggle', active: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleToggle = () => {
  if (!props.disabled) {
    emit('toggle', !props.isActive);
  }
};
</script>

<style scoped>
.display-toggle-container {
  @apply mb-4;
}

.toggle-item {
  @apply form-section-consistent flex justify-between items-center p-4;
  @apply transition-all duration-300 ease-in-out;
}

.toggle-item.inactive {
  @apply opacity-70 bg-gray-50;
}

.toggle-item.inactive .toggle-title {
  @apply text-gray-400;
}

.toggle-title {
  @apply form-section-title-consistent text-base m-0;
}

.toggle-switch {
  @apply toggle-switch-consistent;
  @apply active:scale-95;
  width: 50px;
  height: 26px;
}

.toggle-switch:disabled {
  @apply cursor-not-allowed opacity-50;
}

.toggle-switch.active {
  @apply bg-primary-500;
}

.toggle-switch.disabled {
  @apply bg-gray-200 cursor-not-allowed;
}

.toggle-slider {
  @apply absolute bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm;
  top: 50%;
  left: 3px;
  width: 20px;
  height: 20px;
  transform: translateY(-50%) translateX(0);
}

.toggle-slider.active {
  transform: translateY(-50%) translateX(24px);
}

/* Enhanced hover states using consistent styling */
.toggle-switch:hover:not(:disabled) {
  @apply shadow-md;
}

.toggle-switch:hover:not(:disabled):not(.active) {
  @apply bg-gray-400;
}

.toggle-switch:hover:not(:disabled).active {
  @apply bg-primary-600;
}

/* Enhanced focus states for accessibility */
.toggle-switch:focus {
  @apply focus-primary;
}

.toggle-switch:focus:not(.active) {
  @apply ring-gray-400;
}

/* Touch-friendly interactions */
@media (hover: none) {
  .toggle-switch:active:not(:disabled) {
    @apply scale-95;
  }

  .toggle-switch:active:not(:disabled):not(.active) {
    @apply bg-gray-400;
  }

  .toggle-switch:active:not(:disabled).active {
    @apply bg-primary-600;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .toggle-item {
    @apply p-3;
  }

  .toggle-title {
    @apply text-sm;
  }

  .toggle-switch {
    width: 48px;
    height: 28px;
  }

  .toggle-slider {
    width: 22px;
    height: 22px;
    left: 3px;
  }

  .toggle-slider.active {
    transform: translateY(-50%) translateX(20px);
  }
}
</style>
