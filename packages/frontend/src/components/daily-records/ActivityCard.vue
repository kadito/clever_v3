<template>
  <div class="activity-card" :class="{ 'view-mode': !isEditMode }">
    <!-- Card Header -->
    <div class="activity-card-header">
      <div class="activity-type-indicator" :class="activityTypeClass">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            v-if="localActivity.tipoAtividade === 'Interno'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="activity-type-label">{{ localActivity.tipoAtividade }}</span>
      </div>

      <button
        v-if="isEditMode"
        type="button"
        class="remove-button"
        @click="handleRemove"
        aria-label="Remover atividade"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>

    <!-- Card Body -->
    <div class="activity-card-body">
      <!-- Activity Type Selection (Edit Mode) -->
      <div v-if="isEditMode" class="form-field">
        <label class="form-label">Tipo de Atividade *</label>
        <select
          v-model="localActivity.tipoAtividade"
          class="form-select"
          @change="emitUpdate"
        >
          <option value="Interno">Interno</option>
          <option value="Externo">Externo</option>
        </select>
      </div>

      <!-- Link Type Selection -->
      <div class="form-field">
        <label class="form-label">Ligação *</label>
        <select
          v-if="isEditMode"
          v-model="localActivity.tipoLigacao"
          class="form-select"
          @change="handleLinkTypeChange"
        >
          <option value="Nenhuma">Nenhuma</option>
          <option value="Folha de Obra">Folha de Obra</option>
          <option value="Assistência Remota">Assistência Remota</option>
        </select>
        <div v-else class="form-value">{{ localActivity.tipoLigacao }}</div>
      </div>

      <!-- Conditional Fields: Work Sheet Search -->
      <Transition name="field-slide">
        <div v-if="localActivity.tipoLigacao === 'Folha de Obra'" class="form-field">
          <label class="form-label">Folha de Obra *</label>
          <WorkSheetSearchInput
            v-model="localActivity.workSheetId"
            :readonly="!isEditMode"
            :disabled="!isEditMode"
            @work-sheet-selected="handleWorkSheetSelected"
          />
        </div>
      </Transition>

      <!-- Conditional Fields: Remote Assistance Search -->
      <Transition name="field-slide">
        <div v-if="localActivity.tipoLigacao === 'Assistência Remota'" class="form-field">
          <label class="form-label">Assistência Remota *</label>
          <RemoteAssistanceSearchInput
            v-model="localActivity.remoteAssistanceId"
            :readonly="!isEditMode"
            :disabled="!isEditMode"
            @remote-assistance-selected="handleRemoteAssistanceSelected"
          />
        </div>
      </Transition>

      <!-- Subject -->
      <div class="form-field">
        <label class="form-label">Assunto *</label>
        <input
          v-if="isEditMode"
          v-model="localActivity.assunto"
          type="text"
          class="form-input"
          placeholder="Descreva o assunto da atividade"
          @input="emitUpdate"
        />
        <div v-else class="form-value">{{ localActivity.assunto || 'N/A' }}</div>
      </div>

      <!-- Time Tracking Row -->
      <div class="time-tracking-grid">
        <!-- Start Time -->
        <div class="form-field">
          <label class="form-label">Hora Início *</label>
          <input
            v-if="isEditMode"
            v-model="localActivity.horaInicio"
            type="text"
            class="form-input"
            placeholder="HH:MM"
            maxlength="5"
            @input="handleTimeInput($event, 'horaInicio')"
            @blur="validateTimeFormat('horaInicio')"
          />
          <div v-else class="form-value">{{ localActivity.horaInicio || 'N/A' }}</div>
        </div>

        <!-- End Time -->
        <div class="form-field">
          <label class="form-label">Hora Fim *</label>
          <input
            v-if="isEditMode"
            v-model="localActivity.horaFim"
            type="text"
            class="form-input"
            placeholder="HH:MM"
            maxlength="5"
            @input="handleTimeInput($event, 'horaFim')"
            @blur="validateTimeFormat('horaFim')"
          />
          <div v-else class="form-value">{{ localActivity.horaFim || 'N/A' }}</div>
        </div>

        <!-- Break Time -->
        <div class="form-field">
          <label class="form-label">Pausa (min) *</label>
          <input
            v-if="isEditMode"
            v-model.number="localActivity.tempoPausa"
            type="number"
            class="form-input"
            placeholder="0"
            min="0"
            @input="emitUpdate"
          />
          <div v-else class="form-value">{{ localActivity.tempoPausa ?? 0 }} min</div>
        </div>

        <!-- Total Hours (Calculated) -->
        <div class="form-field">
          <label class="form-label">Total Horas</label>
          <div class="form-value total-hours">{{ calculatedTotalHours }}</div>
        </div>
      </div>

      <!-- Description -->
      <div class="form-field">
        <label class="form-label">Descrição</label>
        <textarea
          v-if="isEditMode"
          v-model="localActivity.descricao"
          class="form-textarea"
          rows="3"
          placeholder="Descrição detalhada da atividade (opcional)"
          @input="emitUpdate"
        ></textarea>
        <div v-else class="form-value">{{ localActivity.descricao || 'N/A' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Activity } from '@clever/shared';
import WorkSheetSearchInput from '@/components/common/WorkSheetSearchInput.vue';
import RemoteAssistanceSearchInput from '@/components/common/RemoteAssistanceSearchInput.vue';

// Props
interface Props {
  activity: Activity;
  isEditMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: true,
});

// Emits
interface Emits {
  (e: 'activity-updated', activity: Activity): void;
  (e: 'activity-removed'): void;
}

const emit = defineEmits<Emits>();

// Local state - create a copy of the activity to avoid direct prop mutation
const localActivity = ref<Activity>({ ...props.activity });

// Watch for external changes to activity prop
watch(
  () => props.activity,
  (newActivity) => {
    localActivity.value = { ...newActivity };
  },
  { deep: true }
);

// Computed properties
const activityTypeClass = computed(() => {
  return localActivity.value.tipoAtividade === 'Interno'
    ? 'activity-type-interno'
    : 'activity-type-externo';
});

const calculatedTotalHours = computed(() => {
  const { horaInicio, horaFim, tempoPausa } = localActivity.value;

  if (!horaInicio || !horaFim || tempoPausa === undefined || tempoPausa === null) {
    return '00:00';
  }

  // Validate time format
  if (!isValidTimeFormat(horaInicio) || !isValidTimeFormat(horaFim)) {
    return '00:00';
  }

  try {
    const totalHours = calculateTotalHours(horaInicio, horaFim, tempoPausa);
    localActivity.value.totalHoras = totalHours;
    return totalHours;
  } catch (error) {
    console.error('Error calculating total hours:', error);
    return '00:00';
  }
});

// Methods
const isValidTimeFormat = (time: string): boolean => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const calculateTotalHours = (horaInicio: string, horaFim: string, tempoPausa: number): string => {
  const startMinutes = timeToMinutes(horaInicio);
  const endMinutes = timeToMinutes(horaFim);

  let workMinutes: number;

  if (endMinutes < startMinutes) {
    // Overnight activity: add 24 hours (1440 minutes)
    workMinutes = endMinutes + 1440 - startMinutes;
  } else {
    workMinutes = endMinutes - startMinutes;
  }

  // Subtract break time
  const totalMinutes = workMinutes - tempoPausa;

  if (totalMinutes < 0) {
    return '00:00'; // Invalid: break time exceeds work time
  }

  return minutesToTime(totalMinutes);
};

const handleTimeInput = (event: Event, field: 'horaInicio' | 'horaFim') => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/[^0-9]/g, ''); // Remove non-digits

  // Auto-format: XXXX → XX:XX
  if (value.length === 4) {
    const hours = value.substring(0, 2);
    const minutes = value.substring(2, 4);
    value = `${hours}:${minutes}`;
    localActivity.value[field] = value;
    input.value = value;
  } else if (value.length > 2 && !value.includes(':')) {
    // Add colon after 2 digits
    value = value.substring(0, 2) + ':' + value.substring(2);
    localActivity.value[field] = value;
    input.value = value;
  }

  emitUpdate();
};

const validateTimeFormat = (field: 'horaInicio' | 'horaFim') => {
  const value = localActivity.value[field];
  if (value && !isValidTimeFormat(value)) {
    console.warn(`Invalid time format for ${field}: ${value}`);
  }
};

const handleLinkTypeChange = () => {
  // Clear previous selections when link type changes
  if (localActivity.value.tipoLigacao === 'Nenhuma') {
    localActivity.value.workSheetId = undefined;
    localActivity.value.remoteAssistanceId = undefined;
  } else if (localActivity.value.tipoLigacao === 'Folha de Obra') {
    localActivity.value.remoteAssistanceId = undefined;
  } else if (localActivity.value.tipoLigacao === 'Assistência Remota') {
    localActivity.value.workSheetId = undefined;
  }

  emitUpdate();
};

const handleWorkSheetSelected = () => {
  emitUpdate();
};

const handleRemoteAssistanceSelected = () => {
  emitUpdate();
};

const handleRemove = () => {
  emit('activity-removed');
};

const emitUpdate = () => {
  // Emit the updated activity
  emit('activity-updated', { ...localActivity.value });
};
</script>

<style scoped>
.activity-card {
  @apply bg-white rounded-touch border border-gray-300 shadow-sm overflow-hidden;
  transition: all 0.2s ease;
}

.activity-card:hover {
  @apply shadow-md;
}

.activity-card.view-mode {
  @apply bg-gray-50;
}

/* Card Header */
.activity-card-header {
  @apply flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200;
}

.activity-type-indicator {
  @apply flex items-center gap-2 px-3 py-2 rounded-full font-medium text-sm;
  min-height: 44px;
}

.activity-type-interno {
  @apply bg-blue-100 text-blue-800;
}

.activity-type-externo {
  @apply bg-green-100 text-green-800;
}

.activity-type-label {
  @apply font-semibold;
}

.remove-button {
  @apply p-2 text-red-600 hover:bg-red-50 rounded-touch transition-colors;
  min-width: 44px;
  min-height: 44px;
}

.remove-button:hover {
  @apply bg-red-100;
}

/* Card Body */
.activity-card-body {
  @apply p-4 space-y-4;
}

/* Form Fields */
.form-field {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input,
.form-select,
.form-textarea {
  @apply block w-full rounded-touch border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
  min-height: 44px;
  font-size: 16px; /* Prevent zoom on iOS */
}

.form-textarea {
  @apply resize-none;
  min-height: 88px; /* 2 * 44px for touch target */
}

.form-value {
  @apply text-gray-900 py-2;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.form-value.total-hours {
  @apply font-semibold text-primary-600 text-lg;
}

/* Time Tracking Grid */
.time-tracking-grid {
  @apply grid grid-cols-2 gap-4;
}

@media (min-width: 640px) {
  .time-tracking-grid {
    @apply grid-cols-4;
  }
}

/* Transitions */
.field-slide-enter-active,
.field-slide-leave-active {
  transition: all 0.3s ease;
}

.field-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.field-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile Optimizations */
@media (max-width: 640px) {
  .time-tracking-grid {
    @apply grid-cols-1;
  }
}

/* Print Styles */
@media print {
  .remove-button {
    @apply hidden;
  }

  .activity-card {
    @apply shadow-none border-gray-400;
    break-inside: avoid;
  }
}
</style>
