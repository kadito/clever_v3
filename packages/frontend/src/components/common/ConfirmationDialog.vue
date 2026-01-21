<template>
  <Teleport to="body">
    <!-- Backdrop overlay -->
    <Transition
      name="backdrop"
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click="handleBackdropClick"
        @keydown.escape="handleCancel"
        tabindex="-1"
      >
        <!-- Dialog container -->
        <Transition
          name="dialog"
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="isOpen"
            class="bg-white rounded-touch shadow-xl max-w-md w-full mx-auto"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="messageId"
            @click.stop
          >
            <!-- Dialog header -->
            <div class="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200">
              <div class="flex items-center">
                <!-- Warning icon -->
                <div class="flex-shrink-0">
                  <svg
                    class="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>

                <!-- Title -->
                <div class="ml-3 flex-1">
                  <h3 :id="titleId" class="text-lg font-semibold text-gray-900">
                    {{ title }}
                  </h3>
                </div>
              </div>
            </div>

            <!-- Dialog content -->
            <div class="px-4 py-4 sm:px-6 sm:py-5">
              <p :id="messageId" class="text-sm text-gray-700 leading-relaxed">
                {{ message }}
              </p>
            </div>

            <!-- Dialog actions -->
            <div
              class="px-4 py-4 sm:px-6 sm:py-5 border-t border-gray-200 bg-gray-50 rounded-b-touch"
            >
              <div
                class="flex flex-col-reverse sm:flex-row sm:justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3"
              >
                <!-- Cancel button -->
                <button
                  ref="cancelButtonRef"
                  @click="handleCancel"
                  :disabled="isLoading"
                  class="btn-secondary w-full sm:w-auto touch-target"
                  :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
                >
                  {{ cancelText }}
                </button>

                <!-- Confirm button -->
                <button
                  ref="confirmButtonRef"
                  @click="handleConfirm"
                  :disabled="isLoading"
                  class="btn-danger w-full sm:w-auto touch-target flex items-center justify-center"
                  :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
                >
                  <!-- Loading spinner -->
                  <svg
                    v-if="isLoading"
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {{ confirmText }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
  close: [];
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  isLoading: false,
});

const emit = defineEmits<Emits>();

// Template refs
const confirmButtonRef = ref<HTMLButtonElement>();
const cancelButtonRef = ref<HTMLButtonElement>();

// Generate unique IDs for accessibility
const titleId = `confirmation-title-${Math.random().toString(36).substr(2, 9)}`;
const messageId = `confirmation-message-${Math.random().toString(36).substr(2, 9)}`;

// Event handlers
const handleConfirm = () => {
  if (!props.isLoading) {
    emit('confirm');
  }
};

const handleCancel = () => {
  if (!props.isLoading) {
    emit('cancel');
    emit('close');
  }
};

const handleBackdropClick = () => {
  // Only close on backdrop click if not loading
  if (!props.isLoading) {
    handleCancel();
  }
};

// Keyboard event handler
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return;

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      handleCancel();
      break;
    case 'Enter':
      event.preventDefault();
      handleConfirm();
      break;
    case 'Tab':
      // Trap focus within dialog
      trapFocus(event);
      break;
  }
};

// Focus management
const trapFocus = (event: KeyboardEvent) => {
  const focusableElements = [confirmButtonRef.value, cancelButtonRef.value].filter(
    Boolean
  ) as HTMLElement[];

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

// Focus management when dialog opens/closes
watch(
  () => props.isOpen,
  async isOpen => {
    if (isOpen) {
      // Focus the cancel button by default (safer option)
      await nextTick();
      cancelButtonRef.value?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }
);

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  // Ensure body scroll is restored
  document.body.style.overflow = '';
});
</script>

<style scoped>
/* Mobile-first responsive design */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Button styles */
.btn-secondary {
  @apply px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-touch shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200;
}

.btn-danger {
  @apply px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-touch shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200;
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .touch-target {
    min-height: 48px; /* Slightly larger on mobile */
    padding: 12px 16px;
  }
}

/* Ensure proper z-index stacking */
.fixed {
  z-index: 9999;
}

/* Backdrop blur effect for modern browsers */
@supports (backdrop-filter: blur(4px)) {
  .fixed.bg-black.bg-opacity-50 {
    @apply bg-opacity-30;
    backdrop-filter: blur(4px);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bg-white {
    @apply border-2 border-gray-900;
  }

  .btn-secondary {
    @apply border-2 border-gray-900;
  }

  .btn-danger {
    @apply border-2 border-red-900;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-opacity,
  .transition-all {
    transition: none;
  }

  .animate-spin {
    animation: none;
  }
}

/* Print styles */
@media print {
  .fixed {
    display: none;
  }
}
</style>
