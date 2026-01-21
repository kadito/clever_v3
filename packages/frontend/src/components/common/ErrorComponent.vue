<template>
  <div class="error-component bg-red-50 border border-red-200 rounded-touch p-4 mb-4">
    <div class="flex items-start">
      <!-- Error icon -->
      <div class="flex-shrink-0">
        <svg
          class="w-5 h-5 text-red-500 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <!-- Error content -->
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium text-red-800">
          {{ title || 'Erro' }}
        </h3>
        <div class="mt-1 text-sm text-red-700">
          <p>{{ message || 'Ocorreu um erro inesperado.' }}</p>
        </div>
      </div>

      <!-- Close button -->
      <div class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            @click="handleClose"
            class="inline-flex rounded-touch p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-target"
            aria-label="Fechar erro"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title?: string;
  message?: string;
  error?: string | Error;
}

interface Emits {
  close: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed message from error prop if provided
const message = computed(() => {
  if (props.message) return props.message;
  if (props.error) {
    if (typeof props.error === 'string') return props.error;
    if (props.error instanceof Error) return props.error.message;
  }
  return 'Ocorreu um erro inesperado.';
});

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
/* Mobile-first responsive design */
.error-component {
  /* Ensure proper touch targets on mobile */
  min-height: 44px;
}

/* Ensure close button is touch-friendly */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .error-component {
    margin-left: -1rem;
    margin-right: -1rem;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>
