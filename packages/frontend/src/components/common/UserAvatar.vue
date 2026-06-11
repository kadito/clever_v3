<template>
  <div
    class="user-avatar flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center"
    :class="sizeClasses"
  >
    <!-- User initials -->
    <span
      class="font-medium text-primary-700"
      :class="textSizeClasses"
    >
      {{ initials }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UserContext } from '@clever/shared';

interface Props {
  user: UserContext;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

// Compute user initials
const initials = computed(() => {
  const firstName = props.user.firstName?.trim() || '';
  const lastName = props.user.lastName?.trim() || '';

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  } else if (firstName) {
    return firstName.charAt(0).toUpperCase();
  } else if (lastName) {
    return lastName.charAt(0).toUpperCase();
  } else {
    // Fallback to email initial
    return props.user.email.charAt(0).toUpperCase();
  }
});

// Size classes for the avatar container
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  return sizes[props.size];
});

// Text size classes for the initials
const textSizeClasses = computed(() => {
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  return textSizes[props.size];
});
</script>

<style scoped>
.user-avatar {
  /* Ensure consistent circular shape */
  aspect-ratio: 1;
}

/* Smooth transitions */
.user-avatar {
  transition: all 0.2s ease-in-out;
}

/* Hover effect for interactive contexts */
.user-avatar:hover {
  background-color: theme('colors.primary.200');
}
</style>
