<template>
  <div class="dashboard-grid">
    <router-link
      v-for="contentType in contentTypes"
      :key="contentType"
      :to="{ name: `${contentType}-list` }"
      class="content-tile group"
    >
      <!-- Icon -->
      <div class="content-tile-icon group-hover:scale-110 transition-transform duration-200">
        {{ getContentTypeIcon(contentType) }}
      </div>

      <!-- Title -->
      <h3 class="content-tile-title">
        {{ getContentTypeDisplayName(contentType) }}
      </h3>

      <!-- Arrow indicator -->
      <div class="content-tile-arrow">
        <svg
          class="w-4 h-4 text-primary-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { contentTypes, getContentTypeDisplayName, getContentTypeIcon } from '../../router';
</script>

<style scoped>
.dashboard-grid {
  @apply grid grid-cols-3 gap-3;
}

/* Responsive adjustments for larger screens */
@media (min-width: 768px) {
  .dashboard-grid {
    @apply gap-4;
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    @apply grid-cols-6 gap-4;
  }
}

@media (min-width: 1280px) {
  .dashboard-grid {
    @apply grid-cols-6 gap-6;
  }
}

.content-tile {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col items-center text-center hover:shadow-md transition-all duration-200 cursor-pointer min-h-24 relative;
}

.content-tile:hover {
  @apply transform -translate-y-1 shadow-lg border-primary-200;
}

.content-tile:active {
  @apply transform translate-y-0;
}

.content-tile-icon {
  @apply text-2xl mb-2 flex-shrink-0;
  line-height: 1;
}

.content-tile-title {
  @apply text-sm font-semibold text-gray-900 flex-1 truncate w-full leading-tight;
  /* Ensure text doesn't overflow */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-tile-arrow {
  @apply absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200;
}

/* Mobile-specific adjustments */
@media (max-width: 767px) {
  .dashboard-grid {
    @apply gap-2;
  }

  .content-tile {
    @apply p-2 min-h-20;
  }

  .content-tile-icon {
    @apply text-xl mb-1;
  }

  .content-tile-title {
    @apply text-xs;
  }

  .content-tile-arrow .w-4 {
    @apply w-3 h-3;
  }
}

/* Touch feedback for mobile */
@media (hover: none) and (pointer: coarse) {
  .content-tile:hover {
    @apply transform-none shadow-sm;
  }

  .content-tile:active {
    @apply bg-gray-50 transform scale-95;
  }

  .content-tile-arrow {
    @apply opacity-100;
  }
}

/* Accessibility improvements */
.content-tile:focus {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Loading state (for future use) */
.content-tile.loading {
  @apply opacity-50 pointer-events-none;
}

.content-tile.loading .content-tile-icon {
  @apply animate-pulse;
}
</style>
