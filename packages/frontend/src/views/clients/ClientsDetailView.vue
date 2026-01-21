<template>
  <ContentDetailTemplate
    :item="client"
    :is-loading="isLoading"
    :error="error"
    back-route="/clients"
    :show-edit-button="true"
    :show-delete-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="getClientTitle"
    :get-subtitle="getClientSubtitle"
    :get-status="getClientStatus"
    delete-button-text="Eliminar"
    confirm-delete-title="Confirmar Eliminação"
    confirm-delete-message="Tem a certeza que pretende eliminar este cliente?"
    @edit="handleEdit"
    @delete="handleDelete"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Basic Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Informação Básica</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Nome da Empresa</label>
                  <div class="detail-value">{{ item.data.nomeEmpresa || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Nome Comercial</label>
                  <div class="detail-value">{{ item.data.nomeComercial || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Contribuinte</label>
                  <div class="detail-value">{{ item.data.contribuinte || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Responsável</label>
                  <div class="detail-value">{{ item.data.responsavel || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Contactos</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Telefone</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.telefone"
                      :href="`tel:${item.data.telefone}`"
                      class="contact-link"
                    >
                      {{ item.data.telefone }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Telefone do Contacto</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.telefoneContato"
                      :href="`tel:${item.data.telefoneContato}`"
                      class="contact-link"
                    >
                      {{ item.data.telefoneContato }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">E-mail</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.email"
                      :href="`mailto:${item.data.email}`"
                      class="contact-link"
                    >
                      {{ item.data.email }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">E-mail do Contacto</label>
                  <div class="detail-value">
                    <a
                      v-if="item.data.emailContato"
                      :href="`mailto:${item.data.emailContato}`"
                      class="contact-link"
                    >
                      {{ item.data.emailContato }}
                    </a>
                    <span v-else>-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Address Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Morada</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item col-span-full">
                  <label class="detail-label">Morada</label>
                  <div class="detail-value whitespace-pre-line">{{ item.data.morada || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Código Postal</label>
                  <div class="detail-value">{{ item.data.codigoPostal || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Localidade</label>
                  <div class="detail-value">{{ item.data.localidade || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Information Section -->
        <div v-if="item.data.iban" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Informação Financeira</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item col-span-full">
                  <label class="detail-label">IBAN</label>
                  <div class="detail-value font-mono">{{ item.data.iban }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Services Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Serviços</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="services-grid">
                <div class="service-item">
                  <label class="service-label">AnyDesk</label>
                  <div class="service-status" :class="{ active: item.data.temAnydesk }">
                    {{ item.data.temAnydesk ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">Manutenção</label>
                  <div class="service-status" :class="{ active: item.data.manutencao }">
                    {{ item.data.manutencao ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">Manutenção 24h</label>
                  <div class="service-status" :class="{ active: item.data.manutencao24 }">
                    {{ item.data.manutencao24 ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">DUMPS</label>
                  <div class="service-status" :class="{ active: item.data.dumps }">
                    {{ item.data.dumps ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">ATCUD</label>
                  <div class="service-status" :class="{ active: item.data.atcud }">
                    {{ item.data.atcud ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="service-item">
                  <label class="service-label">Vectron Connect</label>
                  <div class="service-status" :class="{ active: item.data.vectronConnect }">
                    {{ item.data.vectronConnect ? 'Sim' : 'Não' }}
                  </div>
                </div>
              </div>

              <!-- Conditional service fields -->
              <div
                v-if="hasConditionalFields(item.data)"
                class="mt-6 pt-6 border-t border-gray-200"
              >
                <h3 class="text-sm font-semibold text-gray-900 mb-4">Configurações Adicionais</h3>
                <div class="detail-grid">
                  <!-- DUMPS Link -->
                  <div
                    v-if="item.data.dumps && item.data.dumpsLink"
                    class="detail-item col-span-full"
                  >
                    <label class="detail-label">Link Google Drive</label>
                    <div class="detail-value">
                      <a :href="item.data.dumpsLink" target="_blank" class="contact-link">
                        {{ item.data.dumpsLink }}
                      </a>
                    </div>
                  </div>

                  <!-- ATCUD Fields -->
                  <template v-if="item.data.atcud">
                    <div v-if="item.data.seriesDocumentos" class="detail-item">
                      <label class="detail-label">Séries de Documentos</label>
                      <div class="detail-value">{{ item.data.seriesDocumentos }}</div>
                    </div>
                    <div v-if="item.data.atUsername" class="detail-item">
                      <label class="detail-label">AT Username</label>
                      <div class="detail-value">{{ item.data.atUsername }}</div>
                    </div>
                    <div v-if="item.data.atPassword" class="detail-item">
                      <label class="detail-label">AT Password</label>
                      <div class="detail-value">••••••••</div>
                    </div>
                  </template>

                  <!-- Vectron Connect Address -->
                  <div
                    v-if="item.data.vectronConnect && item.data.vectronAddress"
                    class="detail-item col-span-full"
                  >
                    <label class="detail-label">Vectron Address</label>
                    <div class="detail-value font-mono">{{ item.data.vectronAddress }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Software Section -->
        <div v-if="item.data.softwares && item.data.softwares.length > 0" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Software</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="space-y-4">
                <div
                  v-for="(software, index) in item.data.softwares"
                  :key="software.id"
                  class="software-card"
                >
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="text-base font-semibold text-gray-900">
                      {{ software.name }}
                      <span v-if="software.product" class="text-sm font-normal text-gray-600">
                        - {{ software.product }}
                      </span>
                    </h3>
                    <span class="software-badge">{{ Number(index) + 1 }}</span>
                  </div>

                  <div class="detail-grid">
                    <!-- Vectron-specific fields -->
                    <template v-if="software.name === 'Vectron'">
                      <div v-if="software.model" class="detail-item">
                        <label class="detail-label">Modelo</label>
                        <div class="detail-value">{{ software.model }}</div>
                      </div>
                      <div v-if="software.nEquipamento" class="detail-item">
                        <label class="detail-label">Nº Equipamento</label>
                        <div class="detail-value">{{ software.nEquipamento }}</div>
                      </div>
                      <div v-if="software.versaoSoftware" class="detail-item">
                        <label class="detail-label">Versão do Software</label>
                        <div class="detail-value">{{ software.versaoSoftware }}</div>
                      </div>
                    </template>

                    <!-- Pix-specific fields -->
                    <template v-else-if="software.name === 'Pix'">
                      <div
                        v-if="software.modules && software.modules.length > 0"
                        class="detail-item col-span-full"
                      >
                        <label class="detail-label">Módulos</label>
                        <div class="detail-value">
                          <div class="flex flex-wrap gap-1">
                            <span
                              v-for="module in software.modules"
                              :key="module"
                              class="module-badge"
                            >
                              {{ module }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Zon Soft-specific fields -->
                    <template v-else-if="software.name === 'Zon Soft'">
                      <div v-if="software.version" class="detail-item">
                        <label class="detail-label">Versão</label>
                        <div class="detail-value">{{ software.version }}</div>
                      </div>
                    </template>

                    <!-- Pt CERT-specific fields -->
                    <template v-else-if="software.name === 'Pt CERT'">
                      <div v-if="software.licenseType" class="detail-item">
                        <label class="detail-label">Tipo de Licença</label>
                        <div class="detail-value">{{ software.licenseType }}</div>
                      </div>
                    </template>

                    <!-- Common fields (for all except Vectron) -->
                    <template v-if="software.name !== 'Vectron'">
                      <div v-if="software.numeroSerie" class="detail-item">
                        <label class="detail-label">Número Série</label>
                        <div class="detail-value">{{ software.numeroSerie }}</div>
                      </div>
                      <div v-if="software.versaoSoftware" class="detail-item">
                        <label class="detail-label">Versão Software</label>
                        <div class="detail-value">{{ software.versaoSoftware }}</div>
                      </div>
                      <div v-if="software.versaoLicenca" class="detail-item">
                        <label class="detail-label">Versão Licença</label>
                        <div class="detail-value">{{ software.versaoLicenca }}</div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Observations Section -->
        <div v-if="item.data.observacoes" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Observações</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-value whitespace-pre-line">{{ item.data.observacoes }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>

  <!-- Delete Confirmation Dialog -->
  <ConfirmationDialog
    :is-open="showDeleteConfirm"
    :title="confirmDeleteTitle"
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Client, BaseContent } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<Client>('clients');
const errorHandler = useErrorHandler();

// State
const client = ref<Client | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Delete state
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteTitle = ref('Confirmar Eliminação');
const confirmDeleteMessage = ref('');

// Clear error function
const clearError = () => {
  error.value = null;
};

// Display functions for ContentDetailTemplate
const getClientTitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Cliente';
  const client = item as Client;
  return client.data.nomeComercial || client.data.nomeEmpresa || 'Cliente';
};

const getClientSubtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const client = item as Client;
  const parts = [];

  if (client.data.contribuinte) {
    parts.push(`NIF: ${client.data.contribuinte}`);
  }

  if (client.data.localidade) {
    parts.push(client.data.localidade);
  }

  return parts.join(' • ');
};

const getClientStatus = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Cliente';
  const client = item as Client;
  const services = [];

  if (client.data.manutencao24) services.push('Manutenção 24h');
  else if (client.data.manutencao) services.push('Manutenção');

  if (client.data.temAnydesk) services.push('AnyDesk');
  if (client.data.atcud) services.push('ATCUD');

  return services.join(', ') || 'Cliente Ativo';
};

// Helper functions
const hasConditionalFields = (data: any): boolean => {
  return (
    (data.dumps && data.dumpsLink) ||
    (data.atcud && (data.seriesDocumentos || data.atUsername || data.atPassword)) ||
    (data.vectronConnect && data.vectronAddress)
  );
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const client = item as Client;
  router.push(`/clients/${client.uuid}/editar`);
};

const handleBack = () => {
  router.push('/clients');
};

// Delete functionality
const getDeleteConfirmationMessage = (): string => {
  if (!client.value) return 'Tem a certeza que pretende eliminar este cliente?';

  const clientName =
    client.value.data.nomeComercial || client.value.data.nomeEmpresa || 'este cliente';
  return `Tem a certeza que pretende eliminar "${clientName}"? Esta ação não pode ser desfeita.`;
};

const handleDelete = () => {
  if (!client.value) return;

  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!client.value) return;

  try {
    isDeleting.value = true;

    console.log(
      'Attempting to delete client:',
      JSON.stringify(
        {
          uuid: client.value.uuid,
          name: client.value.data.nomeComercial || client.value.data.nomeEmpresa,
        },
        null,
        2
      )
    );

    const success = await api.remove(client.value.uuid);

    // Check if API returned an error
    if (api.error.value) {
      console.error('API returned error:', JSON.stringify(api.error.value, null, 2));
      error.value =
        typeof api.error.value === 'string'
          ? api.error.value
          : api.error.value.message || 'Erro ao eliminar cliente';
      showDeleteConfirm.value = false;
      return;
    }

    if (success) {
      console.log('Client deleted successfully, navigating to /clients');
      // Navigate to clients list after successful deletion
      router.push('/clients');
    } else {
      console.error('Delete operation failed - useApi returned false');
      error.value = 'Não foi possível eliminar este cliente.';
      showDeleteConfirm.value = false;
    }
  } catch (err) {
    console.error('Delete operation error:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao eliminar cliente';
    showDeleteConfirm.value = false;
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Data loading
const loadClient = async () => {
  const clientId = route.params.uuid as string;

  if (!clientId) {
    error.value = 'ID do cliente não fornecido';
    return;
  }

  try {
    isLoading.value = true;
    clearError();

    await api.fetchById(clientId);

    if (api.currentItem.value) {
      client.value = api.currentItem.value;
    } else {
      throw new Error('Cliente não encontrado');
    }
  } catch (err) {
    console.error('Error loading client:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar cliente';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadClient();
});
</script>

<style scoped>
/* Client-specific styling */
.software-card {
  @apply p-4 bg-gray-50 rounded-touch border border-gray-200;
}

.software-badge {
  @apply px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium;
}

.module-badge {
  @apply px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium;
}

.services-grid {
  @apply grid grid-cols-2 sm:grid-cols-3 gap-4;
}

.service-item {
  @apply flex flex-col space-y-1;
}

.service-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.service-status {
  @apply text-sm font-medium text-gray-600;
}

.service-status.active {
  @apply text-green-600;
}

.contact-link {
  @apply text-primary-600 hover:text-primary-800 underline;
}

/* Detail grid responsive adjustments */
.detail-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .detail-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .detail-grid {
    @apply grid-cols-3;
  }
}

.detail-item {
  @apply space-y-1;
}

.detail-item.col-span-full {
  grid-column: 1 / -1;
}

.detail-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.detail-value {
  @apply text-sm text-gray-900 break-words;
}

/* Portuguese text optimization */
.detail-value,
.service-status,
.software-badge,
.module-badge {
  @apply text-portuguese;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .services-grid {
    @apply grid-cols-1;
  }

  .software-card {
    @apply p-3;
  }
}

/* Print styles */
@media print {
  .software-card {
    @apply border border-gray-300 bg-white;
  }

  .contact-link {
    @apply text-black no-underline;
  }
}
</style>
