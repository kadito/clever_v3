<template>
  <div class="detail-view">
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
        <BackButton to="/installations-programming" />
        <div class="header-content">
          <div class="header-top-row">
            <div class="header-title-group">
              <h1 class="view-title">
                {{ pageTitle }}
              </h1>
              <p class="view-subtitle">
                {{ pageSubtitle }}
              </p>
            </div>
            <!-- Status Badge -->
            <span
              class="status-badge"
              :class="statusBadgeClass"
            >
              {{ statusLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons (desktop) -->
      <div class="actions-row hidden sm:flex">
        <router-link
          :to="`/installations-programming/${uuid}/editar`"
          class="btn btn-edit"
        >
          Editar
        </router-link>
        <button
          v-if="permissions.canDelete"
          type="button"
          class="btn btn-delete"
          @click="handleDelete"
        >
          Eliminar
        </button>
      </div>

      <!-- Phase Navigation -->
      <div class="phase-nav-wrapper">
        <PhaseNavigation
          :current-phase="viewingPhase"
          :phase-statuses="navigablePhaseStatuses"
          :disabled="false"
          @update:current-phase="viewingPhase = $event"
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

      <!-- Phase Forms (all disabled / read-only) -->
      <div class="phase-content">
        <!-- Phase 1 — Setup -->
        <Phase1SetupForm
          v-if="viewingPhase === 1"
          :model-value="phase1FormData"
          :disabled="true"
          @update:model-value="() => {}"
        />

        <!-- Phase 2 — Receção do Material -->
        <Phase2RececaoForm
          v-if="viewingPhase === 2"
          :model-value="installationData.phase2"
          :disabled="true"
          @update:model-value="() => {}"
        />

        <!-- Phase 3 — Programação / Preparação -->
        <Phase3ProgramacaoForm
          v-if="viewingPhase === 3"
          :model-value="installationData.phase3"
          :disabled="true"
          @update:model-value="() => {}"
        />

        <!-- Phase 4 — Preparação Instalação -->
        <Phase4PreparacaoForm
          v-if="viewingPhase === 4"
          :model-value="installationData.phase4"
          :disabled="true"
          @update:model-value="() => {}"
        />

        <!-- Phase 5 — Instalação no Cliente -->
        <Phase5InstalacaoForm
          v-if="viewingPhase === 5"
          :model-value="installationData.phase5"
          :disabled="true"
          @update:model-value="() => {}"
        />

        <!-- Phase 6 — Testes -->
        <Phase6TestesForm
          v-if="viewingPhase === 6"
          :model-value="installationData.phase6"
          :disabled="true"
          @update:model-value="() => {}"
        />

        <!-- Phase 7 — Finalização -->
        <Phase7FinalizacaoForm
          v-if="viewingPhase === 7"
          :model-value="installationData.phase7"
          :disabled="true"
          :installation-uuid="uuid"
          @update:model-value="() => {}"
        />
      </div>

      <!-- Mobile action bar -->
      <div class="mobile-actions sm:hidden">
        <router-link
          :to="`/installations-programming/${uuid}/editar`"
          class="btn btn-edit flex-1 justify-center"
        >
          Editar
        </router-link>
        <button
          v-if="permissions.canDelete"
          type="button"
          class="btn btn-delete flex-1 justify-center"
          @click="handleDelete"
        >
          Eliminar
        </button>
      </div>
    </template>
  </div>

  <!-- Delete Confirmation Dialog -->
  <ConfirmationDialog
    :is-open="showDeleteConfirm"
    title="Confirmar Eliminação"
    :message="confirmDeleteMessage"
    :is-loading="isDeleting"
    confirm-text="Confirmar"
    cancel-text="Cancelar"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
    @close="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  adaptLegacyData,
} from '@clever/shared';
import type {
  InstallationSevenPhasesData,
  InstallationType,
  PhaseStatus,
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
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import { useApi } from '@/composables/useApi';
import { usePermissions } from '@/composables/usePermissions';

const route = useRoute();
const router = useRouter();
const api = useApi('installations-programming');
const { permissions } = usePermissions();

const uuid = computed(() => route.params.uuid as string);
const initialPhase = Number(route.query.phase) || 0;

// ── State ───────────────────────────────────────────────────────────
const viewingPhase = ref(1);
const isLoading = ref(true);
const error = ref<string | null>(null);
const loadError = ref<string | null>(null);

// ── Delete state ────────────────────────────────────────────────────
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);

// ── Installation data ───────────────────────────────────────────────
const installationData = ref<InstallationSevenPhasesData | null>(null);
const clientName = ref('');

// ── Phase 1 uses top-level fields ───────────────────────────────────
const phase1FormData = computed(() => ({
  clientId: installationData.value?.clientId || '',
  installationType: installationData.value?.installationType || ('' as InstallationType),
  equipmentMarca: installationData.value?.equipmentMarca || '',
  equipmentModelo: installationData.value?.equipmentModelo || '',
  equipmentNumeroSerie: installationData.value?.equipmentNumeroSerie || '',
  equipmentFornecedor: installationData.value?.equipmentFornecedor || '',
}));

// ── Computed ────────────────────────────────────────────────────────

/** Page title: short ID */
const pageTitle = computed((): string => {
  const shortId = uuid.value ? uuid.value.slice(0, 8).toUpperCase() : '';
  return `IP-${shortId}`;
});

/** Page subtitle: client name + technician */
const pageSubtitle = computed((): string => {
  if (!installationData.value) return '';
  const parts: string[] = [];
  if (clientName.value) parts.push(clientName.value);
  const tech = installationData.value.technician;
  if (tech) {
    const name = [tech.firstName, tech.lastName].filter(Boolean).join(' ');
    if (name) parts.push(name);
  }
  return parts.join(' • ');
});

/** Overall status label */
const statusLabel = computed((): string => {
  if (!installationData.value) return '';
  if (installationData.value.status === 'complete') return 'Completa';
  return `Em curso — Fase ${installationData.value.currentPhase}`;
});

/** Status badge styling class */
const statusBadgeClass = computed((): string => {
  if (!installationData.value) return '';
  return installationData.value.status === 'complete'
    ? 'status-badge--complete'
    : 'status-badge--in-progress';
});

/**
 * In detail view, Admin can navigate to ALL phases.
 * User can navigate to completed + current (phases up to currentPhase).
 * We make all phases up to currentPhase appear as navigable by mapping
 * not_started phases (that are before/at current) to 'in_progress' for
 * PhaseNavigation's rendering logic.
 */
const navigablePhaseStatuses = computed((): PhaseStatus[] => {
  if (!installationData.value) return Array(7).fill('not_started') as PhaseStatus[];

  const statuses = [...installationData.value.phaseStatuses];

  // In detail view, all phases up to currentPhase should be navigable
  // Override not_started phases that are before or at currentPhase to allow navigation
  for (let i = 0; i < statuses.length; i++) {
    if (statuses[i] === 'not_started' && i < installationData.value.currentPhase) {
      statuses[i] = 'in_progress';
    }
  }

  return statuses;
});

/** Confirmation message for delete dialog */
const confirmDeleteMessage = computed((): string => {
  const id = pageTitle.value;
  const client = clientName.value || 'Cliente';
  return `Tem a certeza que pretende eliminar a instalação "${id}" para ${client}?`;
});

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
        installationData.value = adapted;

        // Extract client name from relations
        const relations = api.currentItem.value.relations;
        if (relations?.client && typeof relations.client === 'object' && 'nomeEmpresa' in relations.client) {
          const rel = relations.client as Record<string, string>;
          clientName.value = rel.nomeComercial || rel.nomeEmpresa || '';
        }

        // Set viewing phase
        viewingPhase.value = initialPhase || adapted.currentPhase || 1;

        console.log('Installation loaded (detail):', JSON.stringify({
          uuid: uuid.value,
          currentPhase: adapted.currentPhase,
          status: adapted.status,
          phaseStatuses: adapted.phaseStatuses,
        }, null, 2));
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

// ── Delete handlers ─────────────────────────────────────────────────
const handleDelete = (): void => {
  showDeleteConfirm.value = true;
};

const confirmDelete = async (): Promise<void> => {
  isDeleting.value = true;

  await api.remove(uuid.value)
    .then((success) => {
      if (api.error.value) {
        console.error('Delete operation failed with API error:', JSON.stringify(api.error.value, null, 2));
        error.value = typeof api.error.value === 'string'
          ? api.error.value
          : (api.error.value as { message?: string }).message || 'Erro ao eliminar instalação';
        showDeleteConfirm.value = false;
        return;
      }

      if (success) {
        router.push('/installations-programming');
      } else {
        console.error('Delete operation failed - useApi returned false');
        error.value = 'Não foi possível eliminar esta instalação.';
        showDeleteConfirm.value = false;
      }
    })
    .catch((err: unknown) => {
      console.error('Delete operation error:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao eliminar instalação';
      showDeleteConfirm.value = false;
    })
    .finally(() => {
      isDeleting.value = false;
    });
};

const cancelDelete = (): void => {
  showDeleteConfirm.value = false;
};
</script>

<style scoped>
.detail-view {
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

.header-top-row {
  @apply flex items-start justify-between gap-3;
}

.header-title-group {
  @apply min-w-0 flex-1;
}

.view-title {
  @apply text-2xl font-bold text-gray-900;
}

.view-subtitle {
  @apply text-sm text-gray-500 mt-1;
}

/* Status badge */
.status-badge {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap;
}

.status-badge--complete {
  @apply bg-green-100 text-green-800;
}

.status-badge--in-progress {
  @apply bg-amber-100 text-amber-800;
}

/* Actions row (desktop) */
.actions-row {
  @apply flex items-center gap-3 mb-6;
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

/* Phase content */
.phase-content {
  @apply space-y-4;
}

/* Button styles */
.btn {
  @apply inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors;
  min-height: 44px;
  min-width: 44px;
  text-decoration: none;
}

.btn-edit {
  @apply text-white;
  background-color: #75AE93;
}

.btn-edit:hover {
  background-color: #5f9a7d;
}

.btn-delete {
  @apply bg-red-50 text-red-700 hover:bg-red-100;
}

.btn-cancel {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  text-decoration: none;
}

/* Mobile action bar */
.mobile-actions {
  @apply fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}
</style>
