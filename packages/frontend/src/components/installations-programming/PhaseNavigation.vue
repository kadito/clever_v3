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
        :aria-disabled="isNotStarted(phase.number)"
        :aria-label="`Fase ${phase.number}: ${phase.name} — ${getPhaseStatusLabel(phase.number)}`"
        class="phase-tab"
        :class="getPhaseClasses(phase.number)"
        :disabled="disabled || isNotStarted(phase.number)"
        @click="selectPhase(phase.number)"
      >
        <span
          class="phase-indicator"
          :class="getIndicatorClasses(phase.number)"
        >
          <!-- Lock icon for completed phases -->
          <svg
            v-if="isCompleted(phase.number)"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
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
import { PHASE_NAMES_SEVEN } from '@clever/shared';
import type { PhaseStatus } from '@clever/shared';

interface Props {
  currentPhase: number;
  phaseStatuses: PhaseStatus[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:currentPhase', phase: number): void;
}>();

const phases = computed(() =>
  PHASE_NAMES_SEVEN.map((name, index) => ({
    number: index + 1,
    name,
  }))
);

const getStatus = (phase: number): PhaseStatus => {
  return props.phaseStatuses[phase - 1] ?? 'not_started';
};

const isCompleted = (phase: number): boolean => getStatus(phase) === 'completed';

const isUnlocked = (phase: number): boolean => getStatus(phase) === 'unlocked';

const isInProgress = (phase: number): boolean => getStatus(phase) === 'in_progress';

const isNotStarted = (phase: number): boolean => getStatus(phase) === 'not_started';

const isCurrent = (phase: number): boolean => phase === props.currentPhase;

const isNavigable = (phase: number): boolean => {
  const status = getStatus(phase);
  return status === 'completed' || status === 'unlocked' || status === 'in_progress';
};

const getPhaseStatusLabel = (phase: number): string => {
  const status = getStatus(phase);
  switch (status) {
    case 'completed':
      return 'completa';
    case 'in_progress':
      return 'em curso';
    case 'unlocked':
      return 'desbloqueada';
    case 'not_started':
      return 'por iniciar';
    default:
      return 'por iniciar';
  }
};

const getPhaseClasses = (phase: number): Record<string, boolean> => ({
  'phase-tab--active': isCurrent(phase),
  'phase-tab--completed': isCompleted(phase) && !isCurrent(phase),
  'phase-tab--unlocked': isUnlocked(phase) && !isCurrent(phase),
  'phase-tab--in-progress': isInProgress(phase) && !isCurrent(phase),
  'phase-tab--not-started': isNotStarted(phase),
});

const getIndicatorClasses = (phase: number): Record<string, boolean> => ({
  'indicator--active': isCurrent(phase),
  'indicator--completed': isCompleted(phase) && !isCurrent(phase),
  'indicator--unlocked': (isUnlocked(phase) || isInProgress(phase)) && !isCurrent(phase),
  'indicator--not-started': isNotStarted(phase) && !isCurrent(phase),
});

const selectPhase = (phase: number): void => {
  if (props.disabled || !isNavigable(phase)) return;
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
  @apply text-gray-600;
}

.phase-tab--unlocked {
  @apply text-amber-700;
}

.phase-tab--in-progress {
  @apply text-amber-700;
}

.phase-tab--not-started {
  @apply text-gray-400 cursor-not-allowed opacity-60;
}

/* Indicator circle */
.phase-indicator {
  @apply flex items-center justify-center w-8 h-8 rounded-full
         text-sm font-semibold transition-colors duration-200;
}

.indicator--active {
  background-color: #75AE93;
  @apply text-white;
}

.indicator--completed {
  @apply bg-green-100 text-green-700;
}

.indicator--unlocked {
  @apply bg-amber-400 text-white;
}

.indicator--not-started {
  @apply bg-gray-200 text-gray-400;
}

.phase-number {
  @apply text-xs font-bold;
}

.phase-name {
  @apply text-xs font-medium text-center leading-tight whitespace-nowrap;
}

/* Thin scrollbar on desktop, hidden on mobile */
@media (max-width: 639px) {
  .phase-navigation::-webkit-scrollbar {
    display: none;
  }

  .phase-navigation {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

@media (min-width: 640px) {
  .phase-navigation::-webkit-scrollbar {
    height: 4px;
  }

  .phase-navigation::-webkit-scrollbar-track {
    @apply bg-gray-100 rounded;
  }

  .phase-navigation::-webkit-scrollbar-thumb {
    @apply bg-gray-300 rounded;
  }

  .phase-navigation::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400;
  }
}
</style>
