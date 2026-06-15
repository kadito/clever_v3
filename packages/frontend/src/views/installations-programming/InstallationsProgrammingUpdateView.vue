<template>
  <div class="update-view">
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="loading-state"
    >
      <p>A carregar registo de instalação...</p>
    </div>

    <!-- Load error state -->
    <div
      v-if="loadError"
      class="error-banner"
      role="alert"
    >
      <p class="error-text">
        {{ loadError }}
      </p>
      <router-link
        to="/installations-programming"
        class="btn btn-cancel"
      >
        Voltar à lista
      </router-link>
    </div>

    <!-- Content (only when loaded) -->
    <template v-if="!isLoading && !loadError && installationData">
      <!-- Header -->
      <div class="view-header">
        <BackButton :to="`/installations-programming/${uuid}`" />
        <div class="header-content">
          <h1 class="view-title">
            Editar Instalação e Programação
          </h1>
          <p class="view-subtitle">
            Fase {{ viewingPhase }} — {{ phaseTitle }}
          </p>
        </div>
      </div>

      <!-- Phase Navigation -->
      <div class="phase-nav-wrapper">
        <PhaseNavigation
          :current-phase="viewingPhase"
          :phase-statuses="installationData.phaseStatuses"
          :disabled="isSaving"
          @update:current-phase="validationErrors = []; viewingPhase = $event"
        />
      </div>

      <!-- Error Banner -->
      <div
        v-if="error"
        class="error-banner"
        role="alert"
      >
        <p class="error-text">
          {{ error }}
        </p>
        <button
          type="button"
          class="error-dismiss"
          @click="error = null"
        >
          ✕
        </button>
      </div>

      <!-- Admin Unlock Button (visible on completed phases for Admin) -->
      <div
        v-if="showUnlockButton"
        class="unlock-section"
      >
        <p class="unlock-info">
          Esta fase está concluída e bloqueada para edição.
        </p>
        <button
          type="button"
          class="btn btn-unlock"
          :disabled="isSaving"
          @click="handleUnlock"
        >
          {{ isSaving ? 'A desbloquear...' : 'Desbloquear' }}
        </button>
      </div>

      <!-- Phase Forms -->
      <div class="phase-content">
        <!-- Phase 1 — Setup -->
        <Phase1SetupForm
          v-if="viewingPhase === 1"
          :model-value="phase1FormData"
          :disabled="isPhaseDisabled"
          :validation-errors="validationErrors"
          @update:model-value="Object.assign(phase1FormData, $event)"
        />

        <!-- Phase 2 — Receção do Material -->
        <Phase2RececaoForm
          v-if="viewingPhase === 2"
          :model-value="installationData.phase2"
          :disabled="isPhaseDisabled"
          :validation-errors="validationErrors"
          @update:model-value="installationData.phase2 = $event"
        />

        <!-- Phase 3 — Programação / Preparação -->
        <Phase3ProgramacaoForm
          v-if="viewingPhase === 3"
          :model-value="installationData.phase3"
          :disabled="isPhaseDisabled"
          :validation-errors="validationErrors"
          @update:model-value="installationData.phase3 = $event"
        />

        <!-- Phase 4 — Preparação Instalação -->
        <Phase4PreparacaoForm
          v-if="viewingPhase === 4"
          :model-value="installationData.phase4"
          :disabled="isPhaseDisabled"
          :validation-errors="validationErrors"
          @update:model-value="installationData.phase4 = $event"
        />

        <!-- Phase 5 — Instalação no Cliente -->
        <Phase5InstalacaoForm
          v-if="viewingPhase === 5"
          :model-value="installationData.phase5"
          :disabled="isPhaseDisabled"
          :validation-errors="validationErrors"
          @update:model-value="installationData.phase5 = $event"
        />

        <!-- Phase 6 — Testes -->
        <Phase6TestesForm
          v-if="viewingPhase === 6"
          :model-value="installationData.phase6"
          :disabled="isPhaseDisabled"
          :validation-errors="validationErrors"
          @update:model-value="installationData.phase6 = $event"
        />

        <!-- Phase 7 — Finalização -->
        <Phase7FinalizacaoForm
          v-if="viewingPhase === 7"
          :model-value="installationData.phase7"
          :disabled="isPhaseDisabled"
          :installation-uuid="uuid"
          :validation-errors="validationErrors"
          @update:model-value="installationData.phase7 = $event"
          @files-changed="handleFilesChanged"
        />

        <!-- Action Buttons (only when phase is editable) -->
        <div
          v-if="!isPhaseDisabled"
          class="form-actions"
        >
          <router-link
            :to="`/installations-programming/${uuid}`"
            class="btn btn-cancel"
          >
            Cancelar
          </router-link>
          <button
            type="button"
            class="btn btn-save"
            :disabled="isSaving"
            @click="handleSave"
          >
            {{ isSaving ? 'A guardar...' : 'Guardar' }}
          </button>
          <button
            type="button"
            class="btn btn-complete"
            :disabled="isSaving"
            @click="handleComplete"
          >
            {{ isSaving ? 'A concluir...' : 'Concluir Fase' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  adaptLegacyData,
  canUnlockPhase,
  PHASE_NAMES_SEVEN,
  getPhaseValidationErrors,
} from '@clever/shared';
import type {
  InstallationSevenPhasesData,
  InstallationType,
  Phase2RececaoData,
  Phase3ProgramacaoData,
  Phase4PreparacaoData,
  Phase5InstalacaoData,
  Phase6TestesData,
  Phase7FinalizacaoData,
} from '@clever/shared';
import PhaseNavigation from '@/components/installations-programming/PhaseNavigation.vue';
import Phase1SetupForm from '@/components/installations-programming/Phase1SetupForm.vue';
import Phase2RececaoForm from '@/components/installations-programming/Phase2RececaoForm.vue';
import Phase3ProgramacaoForm from '@/components/installations-programming/Phase3ProgramacaoForm.vue';
import Phase4PreparacaoForm from '@/components/installations-programming/Phase4PreparacaoForm.vue';
import Phase5InstalacaoForm from '@/components/installations-programming/Phase5InstalacaoForm.vue';
import Phase6TestesForm from '@/components/installations-programming/Phase6TestesForm.vue';
import Phase7FinalizacaoForm from '@/components/installations-programming/Phase7FinalizacaoForm.vue';
import BackButton from '@/components/common/BackButton.vue';
import { useApi } from '@/composables/useApi';
import { usePermissions } from '@/composables/usePermissions';
import { useFileUpload } from '@/composables/useFileUpload';

const route = useRoute();
const router = useRouter();
const api = useApi('installations-programming');
const { userType } = usePermissions();
const { uploadFiles, deleteFile } = useFileUpload();

const uuid = computed(() => route.params.uuid as string);
const initialPhase = Number(route.query.phase) || 0; // 0 means use currentPhase from data

// ── State ───────────────────────────────────────────────────────────
const viewingPhase = ref(1);
const isSaving = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const loadError = ref<string | null>(null);
const validationErrors = ref<string[]>([]);

// ── Installation data (reactive) ────────────────────────────────────
const installationData = ref<InstallationSevenPhasesData | null>(null);

// ── Phase 1 uses top-level fields (not a phase1 object) ─────────────
const phase1FormData = reactive({
  clientId: '',
  installationType: '' as InstallationType,
  equipmentMarca: '',
  equipmentModelo: '',
  equipmentNumeroSerie: '',
  equipmentFornecedor: '',
});

// ── File upload state (Phase 7) ─────────────────────────────────────
const pendingFiles = ref<File[]>([]);
const pendingRemovedKeys = ref<string[]>([]);

const handleFilesChanged = (payload: { fieldName: string; newFiles: File[]; removedKeys: string[] }): void => {
  pendingFiles.value = payload.newFiles;
  pendingRemovedKeys.value = payload.removedKeys;
};

// ── Computed ────────────────────────────────────────────────────────
const phaseTitle = computed(() => PHASE_NAMES_SEVEN[viewingPhase.value - 1] || '');

const isPhaseDisabled = computed(() => {
  if (!installationData.value) return true;
  const status = installationData.value.phaseStatuses[viewingPhase.value - 1];
  // Editable if in_progress or unlocked
  return status !== 'in_progress' && status !== 'unlocked';
});

const showUnlockButton = computed(() => {
  if (!installationData.value) return false;
  const status = installationData.value.phaseStatuses[viewingPhase.value - 1];
  return status === 'completed' && canUnlockPhase(userType.value);
});

// ── Populate form data from loaded record ───────────────────────────
const populateFromData = (data: InstallationSevenPhasesData): void => {
  installationData.value = data;

  // Phase 1 top-level fields
  phase1FormData.clientId = data.clientId || '';
  phase1FormData.installationType = data.installationType || ('' as InstallationType);
  phase1FormData.equipmentMarca = data.equipmentMarca || '';
  phase1FormData.equipmentModelo = data.equipmentModelo || '';
  phase1FormData.equipmentNumeroSerie = data.equipmentNumeroSerie || '';
  phase1FormData.equipmentFornecedor = data.equipmentFornecedor || '';

  // Set viewing phase: use query param if provided, otherwise use currentPhase from data
  viewingPhase.value = initialPhase || data.currentPhase || 1;
};

// ── Load data ───────────────────────────────────────────────────────
const loadInstallation = (): void => {
  if (!uuid.value) {
    loadError.value = 'UUID do registo não encontrado na rota';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  api.fetchById(uuid.value)
    .then(() => {
      if (api.currentItem.value) {
        const rawData = api.currentItem.value.data;
        const adapted = adaptLegacyData(rawData);
        console.log('Loaded installation data:', JSON.stringify({ uuid: uuid.value, currentPhase: adapted.currentPhase, phaseStatuses: adapted.phaseStatuses }, null, 2));
        populateFromData(adapted);
      } else {
        loadError.value = 'Registo de instalação não encontrado';
      }
    })
    .catch((err: unknown) => {
      console.error('Error loading installation:', JSON.stringify(err, null, 2));
      loadError.value = err instanceof Error ? err.message : 'Erro ao carregar registo de instalação';
    })
    .finally(() => {
      isLoading.value = false;
    });
};

onMounted(loadInstallation);

// ── Build phase payload for save/complete ───────────────────────────
const buildPhasePayload = (): Record<string, unknown> => {
  const phase = viewingPhase.value;

  if (phase === 1) {
    return {
      clientId: phase1FormData.clientId,
      installationType: phase1FormData.installationType,
      equipmentMarca: phase1FormData.equipmentMarca,
      equipmentModelo: phase1FormData.equipmentModelo,
      equipmentNumeroSerie: phase1FormData.equipmentNumeroSerie,
      equipmentFornecedor: phase1FormData.equipmentFornecedor,
    };
  }

  if (!installationData.value) return {};

  const phaseKey = `phase${phase}` as keyof InstallationSevenPhasesData;
  return { [phaseKey]: installationData.value[phaseKey] };
};

// ── Build full data snapshot for client-side validation ──────────────
const buildCurrentPhaseData = (): InstallationSevenPhasesData => {
  if (!installationData.value) {
    return {} as InstallationSevenPhasesData;
  }

  // Merge phase1 form data into the installation data for validation
  return {
    ...installationData.value,
    clientId: phase1FormData.clientId,
    installationType: phase1FormData.installationType,
    equipmentMarca: phase1FormData.equipmentMarca,
    equipmentModelo: phase1FormData.equipmentModelo,
    equipmentNumeroSerie: phase1FormData.equipmentNumeroSerie,
    equipmentFornecedor: phase1FormData.equipmentFornecedor,
  };
};

// ── Save (partial) ──────────────────────────────────────────────────
const handleSave = async (): Promise<void> => {
  isSaving.value = true;
  error.value = null;

  const phasePayload = buildPhasePayload();
  const payload = {
    data: {
      ...phasePayload,
      action: 'save',
    },
  };

  console.log('Saving phase data:', JSON.stringify({ phase: viewingPhase.value, payload }, null, 2));

  await api.update(uuid.value, payload as Parameters<typeof api.update>[1])
    .then(async (response) => {
      if (!response) {
        throw new Error('Erro ao guardar dados da fase');
      }

      // Handle file operations for Phase 7
      if (viewingPhase.value === 7) {
        await handleFileOperations();
      }

      // Reload fresh data from API
      await reloadData();
    })
    .catch((err: unknown) => {
      console.error('Error saving phase:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao guardar dados da fase';
    })
    .finally(() => {
      isSaving.value = false;
    });
};

// ── Complete phase ──────────────────────────────────────────────────
const handleComplete = async (): Promise<void> => {
  // Client-side validation — highlight invalid fields
  const currentData = buildCurrentPhaseData();
  const errors = getPhaseValidationErrors(viewingPhase.value, currentData);

  if (errors.length > 0) {
    validationErrors.value = errors;
    error.value = 'Preencha os campos obrigatórios assinalados a vermelho';
    return;
  }

  validationErrors.value = [];
  isSaving.value = true;
  error.value = null;

  const phasePayload = buildPhasePayload();
  const payload = {
    data: {
      ...phasePayload,
      action: 'complete-phase',
      targetPhase: viewingPhase.value,
    },
  };

  console.log('Completing phase:', JSON.stringify({ phase: viewingPhase.value, payload }, null, 2));

  await api.update(uuid.value, payload as Parameters<typeof api.update>[1])
    .then(async (response) => {
      if (!response) {
        throw new Error('Erro ao concluir fase');
      }

      // Handle file operations for Phase 7
      if (viewingPhase.value === 7) {
        await handleFileOperations();
      }

      // Phase 7 completion → navigate to detail view
      if (viewingPhase.value === 7) {
        router.push(`/installations-programming/${uuid.value}`);
        return;
      }

      // Reload fresh data and advance to next phase
      await reloadData();
    })
    .catch((err: unknown) => {
      console.error('Error completing phase:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao concluir fase';
    })
    .finally(() => {
      isSaving.value = false;
    });
};

// ── Admin unlock ────────────────────────────────────────────────────
const handleUnlock = async (): Promise<void> => {
  isSaving.value = true;
  error.value = null;

  const payload = {
    data: {
      action: 'unlock-phase',
      targetPhase: viewingPhase.value,
    },
  };

  console.log('Unlocking phase:', JSON.stringify({ phase: viewingPhase.value }, null, 2));

  await api.update(uuid.value, payload as Parameters<typeof api.update>[1])
    .then(async (response) => {
      if (!response) {
        throw new Error('Erro ao desbloquear fase');
      }

      // Reload fresh data
      await reloadData();
    })
    .catch((err: unknown) => {
      console.error('Error unlocking phase:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao desbloquear fase';
    })
    .finally(() => {
      isSaving.value = false;
    });
};

// ── File operations (Phase 7) ───────────────────────────────────────
const handleFileOperations = async (): Promise<void> => {
  // Delete removed files
  for (const fileKey of pendingRemovedKeys.value) {
    if (!fileKey) continue;
    const parts = fileKey.split('/');
    const shortKey = parts[parts.length - 1];
    console.log('Deleting file:', JSON.stringify({ fileKey, shortKey }, null, 2));
    await deleteFile('installations-programming', uuid.value, shortKey)
      .catch((delErr: unknown) => {
        console.error('File delete error (non-blocking):', JSON.stringify({ message: (delErr as Error).message }, null, 2));
      });
  }

  // Upload new files
  if (pendingFiles.value.length > 0) {
    console.log('Uploading photos:', JSON.stringify({ uuid: uuid.value, count: pendingFiles.value.length }, null, 2));
    await uploadFiles('installations-programming', uuid.value, 'phase7.fotosInstalacao', pendingFiles.value)
      .then((refs) => {
        console.log('Photo upload result:', JSON.stringify(refs, null, 2));
      })
      .catch((uploadErr: unknown) => {
        console.error('Photo upload error (non-blocking):', JSON.stringify({ message: (uploadErr as Error).message }, null, 2));
      });
  }

  // Reset pending state
  pendingFiles.value = [];
  pendingRemovedKeys.value = [];
};

// ── Reload data from API ────────────────────────────────────────────
const reloadData = async (): Promise<void> => {
  await api.fetchById(uuid.value)
    .then(() => {
      if (api.currentItem.value) {
        const adapted = adaptLegacyData(api.currentItem.value.data);
        populateFromData(adapted);
      }
    })
    .catch((err: unknown) => {
      console.error('Error reloading data:', JSON.stringify(err, null, 2));
    });
};
</script>

<style scoped>
.update-view {
  @apply max-w-2xl mx-auto px-4 py-6;
}

.loading-state {
  @apply flex items-center justify-center py-12 text-gray-500;
}

.view-header {
  @apply mb-6;
}

.header-content {
  @apply mt-3;
}

.view-title {
  @apply text-2xl font-bold text-gray-900;
}

.view-subtitle {
  @apply text-sm text-gray-500 mt-1;
}

.phase-nav-wrapper {
  @apply mb-6;
}

/* Error banner */
.error-banner {
  @apply flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6;
}

.error-text {
  @apply text-red-700 text-sm;
}

.error-dismiss {
  @apply text-red-400 hover:text-red-600 ml-3 flex-shrink-0;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Unlock section */
.unlock-section {
  @apply flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6;
}

.unlock-info {
  @apply text-amber-800 text-sm;
}

.btn-unlock {
  @apply bg-amber-500 text-white hover:bg-amber-600 ml-3;
}

/* Phase content */
.phase-content {
  @apply space-y-4;
}

/* Action buttons */
.form-actions {
  @apply flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200;
}

.btn {
  @apply inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors;
  min-height: 44px;
  min-width: 44px;
}

.btn-cancel {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  text-decoration: none;
}

.btn-save {
  @apply text-white;
  background-color: #6b7280;
}

.btn-save:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-save:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-complete {
  @apply text-white flex-1;
  background-color: #75AE93;
}

.btn-complete:hover:not(:disabled) {
  background-color: #5f9a7d;
}

.btn-complete:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-unlock:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
