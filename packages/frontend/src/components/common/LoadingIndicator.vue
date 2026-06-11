<template>
  <div
    class="loading-indicator"
    :class="sizeClass"
  >
    <div
      v-if="type === 'spinner'"
      class="loading-spinner"
      :class="spinnerSizeClass"
    >
      <div class="spinner-ring" />
    </div>

    <div
      v-else-if="type === 'dots'"
      class="loading-dots"
    >
      <div class="dot" />
      <div class="dot" />
      <div class="dot" />
    </div>

    <div
      v-else-if="type === 'pulse'"
      class="loading-pulse"
      :class="pulseSizeClass"
    >
      <div class="pulse-circle" />
    </div>

    <div
      v-else-if="type === 'skeleton'"
      class="loading-skeleton"
      :class="skeletonSizeClass"
    >
      <div class="skeleton-line" />
      <div class="skeleton-line short" />
      <div class="skeleton-line" />
    </div>

    <span
      v-if="text"
      class="loading-text"
      :class="textSizeClass"
    >
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'md',
  text: '',
  color: 'primary',
});

const sizeClass = computed(() => {
  const sizeMap = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
    xl: 'loading-xl',
  };
  return sizeMap[props.size];
});

const spinnerSizeClass = computed(() => {
  const sizeMap = {
    xs: 'spinner-xs',
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
    xl: 'spinner-xl',
  };
  return `${sizeMap[props.size]} spinner-${props.color}`;
});

const pulseSizeClass = computed(() => {
  const sizeMap = {
    xs: 'pulse-xs',
    sm: 'pulse-sm',
    md: 'pulse-md',
    lg: 'pulse-lg',
    xl: 'pulse-xl',
  };
  return `${sizeMap[props.size]} pulse-${props.color}`;
});

const skeletonSizeClass = computed(() => {
  const sizeMap = {
    xs: 'skeleton-xs',
    sm: 'skeleton-sm',
    md: 'skeleton-md',
    lg: 'skeleton-lg',
    xl: 'skeleton-xl',
  };
  return sizeMap[props.size];
});

const textSizeClass = computed(() => {
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };
  return sizeMap[props.size];
});
</script>

<style scoped>
.loading-indicator {
  @apply flex items-center justify-center gap-3;
}

.loading-indicator.loading-xs {
  @apply gap-1;
}

.loading-indicator.loading-sm {
  @apply gap-2;
}

.loading-indicator.loading-md {
  @apply gap-3;
}

.loading-indicator.loading-lg {
  @apply gap-4;
}

.loading-indicator.loading-xl {
  @apply gap-5;
}

/* Spinner styles */
.loading-spinner {
  @apply relative;
}

.spinner-ring {
  @apply border-2 border-gray-300 rounded-full animate-spin;
}

.spinner-xs .spinner-ring {
  @apply w-3 h-3 border;
}

.spinner-sm .spinner-ring {
  @apply w-4 h-4 border;
}

.spinner-md .spinner-ring {
  @apply w-5 h-5 border-2;
}

.spinner-lg .spinner-ring {
  @apply w-6 h-6 border-2;
}

.spinner-xl .spinner-ring {
  @apply w-8 h-8 border-2;
}

/* Color variations for spinner */
.spinner-primary .spinner-ring {
  @apply border-t-primary-500;
}

.spinner-secondary .spinner-ring {
  @apply border-t-secondary-500;
}

.spinner-white .spinner-ring {
  @apply border-gray-400 border-t-white;
}

.spinner-gray .spinner-ring {
  @apply border-t-gray-500;
}

/* Dots styles */
.loading-dots {
  @apply flex items-center gap-1;
}

.dot {
  @apply w-2 h-2 bg-primary-500 rounded-full animate-pulse;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Pulse styles */
.loading-pulse {
  @apply relative;
}

.pulse-circle {
  @apply rounded-full animate-pulse-primary;
}

.pulse-xs .pulse-circle {
  @apply w-3 h-3;
}

.pulse-sm .pulse-circle {
  @apply w-4 h-4;
}

.pulse-md .pulse-circle {
  @apply w-5 h-5;
}

.pulse-lg .pulse-circle {
  @apply w-6 h-6;
}

.pulse-xl .pulse-circle {
  @apply w-8 h-8;
}

/* Color variations for pulse */
.pulse-primary .pulse-circle {
  @apply bg-primary-500;
}

.pulse-secondary .pulse-circle {
  @apply bg-secondary-500;
}

.pulse-white .pulse-circle {
  @apply bg-white;
}

.pulse-gray .pulse-circle {
  @apply bg-gray-500;
}

/* Skeleton styles */
.loading-skeleton {
  @apply space-y-2 w-full;
}

.skeleton-line {
  @apply bg-gray-200 rounded animate-pulse;
}

.skeleton-line.short {
  @apply w-3/4;
}

.skeleton-xs .skeleton-line {
  @apply h-2;
}

.skeleton-sm .skeleton-line {
  @apply h-3;
}

.skeleton-md .skeleton-line {
  @apply h-4;
}

.skeleton-lg .skeleton-line {
  @apply h-5;
}

.skeleton-xl .skeleton-line {
  @apply h-6;
}

/* Loading text */
.loading-text {
  @apply text-gray-600 font-medium;
}

/* Animation keyframes */
@keyframes pulse-primary {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring,
  .dot,
  .pulse-circle,
  .skeleton-line {
    animation: none;
  }

  .loading-dots .dot {
    @apply opacity-50;
  }

  .loading-pulse .pulse-circle {
    @apply opacity-50;
  }

  .loading-skeleton .skeleton-line {
    @apply opacity-50;
  }
}
</style>
