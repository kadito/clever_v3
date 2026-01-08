<template>
  <button
    @click="handleBack"
    class="back-button inline-flex items-center justify-center text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-touch transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 touch-target"
    :class="variantClasses"
    :aria-label="ariaLabel"
  >
    <!-- Back arrow icon -->
    <svg
      class="w-5 h-5"
      :class="{ 'mr-2': variant === 'inline' && showText }"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 19l-7-7 7-7"
      />
    </svg>
    
    <!-- Optional text for inline variant -->
    <span v-if="variant === 'inline' && showText" class="text-sm font-medium">
      {{ text || 'Voltar' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  to?: string;
  variant?: 'icon' | 'inline';
  text?: string;
  showText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'icon',
  showText: true,
});

const router = useRouter();

// Computed classes based on variant
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'inline':
      return 'px-3 py-2';
    case 'icon':
    default:
      return 'p-2';
  }
});

// Computed aria label
const ariaLabel = computed(() => {
  if (props.variant === 'inline' && props.showText) {
    return undefined; // Text is visible, no need for aria-label
  }
  return 'Voltar';
});

const handleBack = () => {
  if (props.to) {
    // Navigate to specific route
    router.push(props.to);
  } else {
    // Go back in history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to home if no history
      router.push('/');
    }
  }
};
</script>

<style scoped>
/* Mobile-first design with touch-friendly targets */
.back-button {
  /* Ensure minimum touch target size */
  min-height: 44px;
  min-width: 44px;
}

/* Hover effects for desktop */
@media (hover: hover) {
  .back-button:hover {
    transform: translateX(-2px);
  }
}

/* Focus styles for accessibility */
.back-button:focus {
  outline: none;
}

/* Active state for touch feedback */
.back-button:active {
  transform: scale(0.95);
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .back-button {
    /* Slightly larger touch target on mobile */
    min-height: 48px;
    min-width: 48px;
  }
}
</style>