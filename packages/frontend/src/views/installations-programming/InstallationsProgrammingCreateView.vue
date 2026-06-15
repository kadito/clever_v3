<template>
  <div class="create-view">
    <!-- Header -->
    <div class="view-header">
      <BackButton to="/installations-programming" />
      <div class="header-content">
        <h1 class="view-title">
          Nova Instalação e Programação
        </h1>
        <p class="view-subtitle">
          Preencha os dados iniciais para criar uma nova instalação
        </p>
      </div>
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

    <!-- Phase 1 Form -->
    <form
      class="phase-content"
      @submit.prevent="handleSubmit"
    >
      <h2 class="section-title">
        Fase 1 — Setup
      </h2>

      <Phase1SetupForm
        v-model="formData"
        :disabled="isSaving"
      />

      <!-- Action Buttons -->
      <div class="form-actions">
        <router-link
          to="/installations-programming"
          class="btn btn-cancel"
        >
          Cancelar
        </router-link>
        <button
          type="submit"
          class="btn btn-submit"
          :disabled="isSaving"
        >
          {{ isSaving ? 'A criar...' : 'Criar Instalação' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { InstallationType } from '@clever/shared';
import Phase1SetupForm from '@/components/installations-programming/Phase1SetupForm.vue';
import BackButton from '@/components/common/BackButton.vue';
import { useApi } from '@/composables/useApi';

const router = useRouter();
const api = useApi('installations-programming');

const isSaving = ref(false);
const error = ref<string | null>(null);

// ── Phase 1 form data ───────────────────────────────────────────────
const formData = ref({
  clientId: '',
  installationType: '' as InstallationType,
  equipmentMarca: '',
  equipmentModelo: '',
  equipmentNumeroSerie: '',
  equipmentFornecedor: '',
});

// ── Submit handler ──────────────────────────────────────────────────
const handleSubmit = async (): Promise<void> => {
  isSaving.value = true;
  error.value = null;

  const payload = {
    data: {
      clientId: formData.value.clientId,
      installationType: formData.value.installationType,
      equipmentMarca: formData.value.equipmentMarca,
      equipmentModelo: formData.value.equipmentModelo,
      equipmentNumeroSerie: formData.value.equipmentNumeroSerie,
      equipmentFornecedor: formData.value.equipmentFornecedor,
    },
  };

  console.log('Creating installation with payload:', JSON.stringify(payload, null, 2));

  await api.create(payload as Parameters<typeof api.create>[0])
    .then((response) => {
      if (!response) {
        throw new Error('Erro ao criar registo de instalação');
      }

      console.log('Installation created successfully:', JSON.stringify({ uuid: response.uuid }, null, 2));
      router.push(`/installations-programming/${response.uuid}/editar`);
    })
    .catch((err: unknown) => {
      console.error('Error creating installation:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao criar registo de instalação';
    })
    .finally(() => {
      isSaving.value = false;
    });
};
</script>

<style scoped>
.create-view {
  @apply max-w-2xl mx-auto px-4 py-6;
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

.section-title {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

/* Action buttons */
.form-actions {
  @apply flex gap-3 mt-8 pt-6 border-t border-gray-200;
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

.btn-submit {
  @apply text-white flex-1;
  background-color: #75AE93;
}

.btn-submit:hover:not(:disabled) {
  background-color: #5f9a7d;
}

.btn-submit:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
