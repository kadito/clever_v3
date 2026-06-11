<template>
  <nav
    class="phase-navigation"
    role="tablist"
    aria-label="Fases da instalação"
  >
    <div class="phase-tabs">
      <button
        v-for="phase in phases"
        :key="phase.number"
        role="tab"
        :aria-selected="phase.number === currentPhase"
        :aria-label="`Fase ${phase.number}: ${phase.name} — ${getPhaseStatusLabel(phase.number)}`"
        class="phase-tab"
        :class="getPhaseClasses(phase.number)"
        @click="selectPhase(phase.number)"
      >
        <span
          class="phase-indicator"
          :class="getIndicatorClasses(phase.number)"
        >
          <svg
            v-if="isCompleted(phase.number)"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span
            v-else
            class="phase-number"
          >{{ phase.number }}</span>
        </span>
        <span class="phase-name">{{ phase.name }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PHASE_NAMES } from '@clever/shared';

interface Props {
  currentPhase: number;
  completedPhases: number[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:currentPhase', phase: number): void;
}>();

const phases = computed(() =>
  Object.entries(PHASE_NAMES).map(([key, name]) => ({
    number: Number(key),
    name,
  }))
);


const isCompleted = (phase: number): boolean => props.completedPhases.includes(phase);

const isCurrent = (phase: number): boolean => phase === props.currentPhase;

const getPhaseStatusLabel = (phase: number): string => {
  if (isCompleted(phase)) return 'completa';
  if (isCurrent(phase)) return 'em curso';
  return 'por iniciar';
};

const getPhaseClasses = (phase: number): Record<string, boolean> => ({
  'phase-tab--active': isCurrent(phase),
  'phase-tab--completed': isCompleted(phase) && !isCurrent(phase),
});

const getIndicatorClasses = (phase: number): Record<string, boolean> => ({
  'indicator--active': isCurrent(phase),
  'indicator--completed': isCompleted(phase),
  'indicator--pending': !isCompleted(phase) && !isCurrent(phase),
});

const selectPhase = (phase: number): void => {
  emit('update:currentPhase', phase);
};
</script>

<style scoped>
.phase-navigation {
  @apply w-full overflow-x-auto;
  -webkit-overflow-scrolling: touch;
}

.phase-tabs {
  @apply flex gap-1 p-1;
  min-width: max-content;
}

.phase-tab {
  @apply flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg
         border-2 border-transparent
         transition-all duration-200 cursor-pointer
         text-gray-500 bg-transparent;
  min-width: 72px;
  min-height: 44px;
  font-size: 16px;
  -webkit-tap-highlight-color: transparent;
}

.phase-tab:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  ring-color: #75AE93;
}

.phase-tab--active {
  @apply text-gray-900 border-b-2;
  border-bottom-color: #75AE93;
}

.phase-tab--completed {
  @apply text-gray-700;
}

/* Indicator circle */
.phase-indicator {
  @apply flex items-center justify-center w-8 h-8 rounded-full
         text-sm font-semibold transition-colors duration-200;
}

.indicator--completed {
  background-color: #75AE93;
  @apply text-white;
}

.indicator--active {
  @apply bg-amber-400 text-white;
}

.indicator--pending {
  @apply bg-gray-200 text-gray-500;
}

.phase-number {
  @apply text-xs font-bold;
}

.phase-name {
  @apply text-xs font-medium text-center leading-tight whitespace-nowrap;
}

/* Hide scrollbar but keep functionality */
.phase-navigation::-webkit-scrollbar {
  display: none;
}

.phase-navigation {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
