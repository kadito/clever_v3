<template>
  <div class="detail-section">
    <div
      class="bg-white rounded-touch border border-gray-200"
      :class="{
        'border-red-200 bg-red-50': isClientError,
        'border-yellow-200 bg-yellow-50': isClientMissing,
      }"
    >
      <div
        class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch cursor-pointer touch-target"
        :class="{
          'border-red-200 bg-red-100': isClientError,
          'border-yellow-200 bg-yellow-100': isClientMissing,
        }"
        @click="toggleClientDetails"
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center flex-1 min-w-0">
            <div
              class="flex-shrink-0 mr-3 text-gray-600"
              :class="{
                'text-red-600': isClientError,
                'text-yellow-600': isClientMissing,
              }"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2
              class="text-lg font-semibold text-gray-900"
              :class="{
                'text-red-900': isClientError,
                'text-yellow-900': isClientMissing,
              }"
            >
              Informação do Cliente
            </h2>
            <div
              v-if="isClientError"
              class="ml-2"
            >
              <svg
                class="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          
          <!-- Navigate to client detail icon -->
          <button
            v-if="!isClientError && !isClientMissing && clientUuid"
            class="flex-shrink-0 p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors mr-2"
            style="min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;"
            title="Ver detalhes do cliente"
            @click.stop="navigateToClient"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
          
          <div class="flex items-center flex-shrink-0">
            <span class="text-sm text-gray-500 mr-2">
              {{ showClientDetails ? 'Ocultar' : 'Ver mais' }}
            </span>
            <svg
              class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="{ 'transform rotate-180': showClientDetails }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6">
        <!-- Always visible: Essential client info -->
        <div
          v-if="!isClientError && !isClientMissing"
          class="space-y-3"
        >
          <div class="detail-item">
            <label class="detail-label">Nome da Empresa</label>
            <div class="detail-value font-medium">
              {{ clientData?.nomeEmpresa || '-' }}
            </div>
          </div>
          <div
            v-if="clientData?.nomeComercial"
            class="detail-item"
          >
            <label class="detail-label">Nome Comercial</label>
            <div class="detail-value">
              {{ clientData.nomeComercial }}
            </div>
          </div>
        </div>

        <!-- Error state -->
        <div
          v-else-if="isClientError"
          class="text-center py-2"
        >
          <p class="text-red-800 font-medium mb-1">
            {{ getClientErrorMessage() }}
          </p>
          <p
            v-if="clientData?.code"
            class="text-red-600 text-sm"
          >
            Código: {{ clientData.code }}
          </p>
        </div>

        <!-- Missing state -->
        <div
          v-else-if="isClientMissing"
          class="text-center py-2"
        >
          <p class="text-yellow-800 font-medium">
            Cliente não encontrado
          </p>
        </div>

        <!-- Collapsible: Additional client details -->
        <div
          v-if="showClientDetails && !isClientError && !isClientMissing"
          class="mt-4 pt-4 border-t border-gray-200"
        >
          <div class="detail-grid">
            <div
              v-if="clientData?.contribuinte"
              class="detail-item"
            >
              <label class="detail-label">NIF</label>
              <div class="detail-value">
                {{ clientData.contribuinte }}
              </div>
            </div>
            <div
              v-if="clientData?.localidade"
              class="detail-item"
            >
              <label class="detail-label">Localidade</label>
              <div class="detail-value">
                {{ clientData.localidade }}
              </div>
            </div>
            <!-- Show additional fields that might be available -->
            <div
              v-if="clientData?.telefoneContato"
              class="detail-item"
            >
              <label class="detail-label">Telefone</label>
              <div class="detail-value">
                {{ clientData.telefoneContato }}
              </div>
            </div>
            <div
              v-if="clientData?.emailContato"
              class="detail-item"
            >
              <label class="detail-label">Email</label>
              <div class="detail-value">
                {{ clientData.emailContato }}
              </div>
            </div>
            <!-- If no additional fields are available, show a message -->
            <div
              v-if="!hasAdditionalClientFields"
              class="detail-item col-span-full"
            >
              <div class="text-sm text-gray-500 italic text-center py-2">
                Não há informações adicionais disponíveis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { RelationResult } from '@clever/shared';

// Props
interface Props {
  /** The client relation data (resolved relation or error) */
  clientRelation: RelationResult | null | undefined;
}

const props = defineProps<Props>();

const router = useRouter();

// State
const showClientDetails = ref(false);

// Computed properties
const clientData = computed(() => {
  if (!props.clientRelation) return null;
  if (typeof props.clientRelation === 'object' && 'type' in props.clientRelation) {
    // This is an error object
    return props.clientRelation;
  }
  // This is resolved client data
  return props.clientRelation;
});

const isClientError = computed(() => {
  return (
    props.clientRelation &&
    typeof props.clientRelation === 'object' &&
    'type' in props.clientRelation &&
    props.clientRelation.type === 'error'
  );
});

const isClientMissing = computed(() => {
  return props.clientRelation === null;
});

const clientUuid = computed(() => {
  if (isClientError.value || isClientMissing.value || !clientData.value) {
    return null;
  }
  return (clientData.value as any).uuid || null;
});

const hasAdditionalClientFields = computed(() => {
  if (!clientData.value || isClientError.value || isClientMissing.value) {
    return false;
  }

  // Check if any additional fields beyond the essential ones are available
  return !!(
    clientData.value.contribuinte ||
    clientData.value.localidade ||
    clientData.value.telefoneContato ||
    clientData.value.emailContato
  );
});

// Methods
const toggleClientDetails = () => {
  showClientDetails.value = !showClientDetails.value;
};

const navigateToClient = () => {
  if (clientUuid.value) {
    router.push(`/clients/${clientUuid.value}`);
  }
};

const getClientErrorMessage = () => {
  if (!isClientError.value) return '';

  const errorData = clientData.value as any;

  switch (errorData.code) {
    case 404:
      return 'Cliente não encontrado';
    case 500:
      return 'Erro interno do servidor';
    default:
      return errorData.message || 'Erro desconhecido';
  }
};
</script>

<style scoped>
/* Component uses global styles from the parent views */
/* All styling is handled by Tailwind classes */
</style>
