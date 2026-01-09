<template>
  <ContentDetailTemplate
    :item="license"
    :is-loading="isLoading"
    :error="error"
    back-route="/licenses"
    :show-edit-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="getLicenseTitle"
    :get-subtitle="getLicenseSubtitle"
    :get-status="getLicenseStatus"
    @edit="handleEdit"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Basic Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Informação Básica</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Cliente</label>
                  <div class="detail-value">{{ item.data.clientName || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Versão</label>
                  <div class="detail-value">{{ item.data.versao || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Número de Série</label>
                  <div class="detail-value font-mono">{{ item.data.numeroSerie || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Estado</label>
                  <div class="detail-value">
                    <span class="status-badge" :class="getStatusClass(getLicenseStatus(item))">
                      {{ getLicenseStatus(item) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Client Information Section -->
        <div v-if="clientInfo" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Informação do Cliente</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Nome da Empresa</label>
                  <div class="detail-value">{{ clientInfo.nomeEmpresa || '-' }}</div>
                </div>
                <div v-if="clientInfo.nomeComercial" class="detail-item">
                  <label class="detail-label">Nome Comercial</label>
                  <div class="detail-value">{{ clientInfo.nomeComercial }}</div>
                </div>
                <div v-if="clientInfo.contribuinte" class="detail-item">
                  <label class="detail-label">NIF</label>
                  <div class="detail-value font-mono">{{ clientInfo.contribuinte }}</div>
                </div>
                <div v-if="clientInfo.localidade" class="detail-item">
                  <label class="detail-label">Localidade</label>
                  <div class="detail-value">{{ clientInfo.localidade }}</div>
                </div>
                <div v-if="clientInfo.telefoneContato" class="detail-item">
                  <label class="detail-label">Telefone</label>
                  <div class="detail-value">{{ clientInfo.telefoneContato }}</div>
                </div>
                <div v-if="clientInfo.emailContato" class="detail-item">
                  <label class="detail-label">Email</label>
                  <div class="detail-value">{{ clientInfo.emailContato }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- License Period Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Período da Licença</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Data de Início</label>
                  <div class="detail-value">{{ formatDate(item.data.dataInicio) }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Data de Vencimento</label>
                  <div class="detail-value">
                    <span :class="getExpirationClass(item.data.dataVencimento)">
                      {{ formatDate(item.data.dataVencimento) }}
                    </span>
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Modalidade</label>
                  <div class="detail-value">{{ item.data.modalidade || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Duração do Contrato</label>
                  <div class="detail-value">{{ item.data.duracaoContrato || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Software Section -->
        <div v-if="item.data.software && item.data.software.name && item.data.software.name.length > 0" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Software</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="software-list">
                <div 
                  v-for="(softwareName, index) in item.data.software.name" 
                  :key="index"
                  class="software-card"
                >
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="text-base font-semibold text-gray-900">{{ softwareName }}</h3>
                    <span class="software-badge">{{ Number(index) + 1 }}</span>
                  </div>
                  
                  <div class="detail-grid">
                    <!-- Show software-specific fields based on the software type -->
                    <template v-if="softwareName === 'Vectron'">
                      <div v-if="item.data.software.model" class="detail-item">
                        <label class="detail-label">Modelo</label>
                        <div class="detail-value">{{ item.data.software.model }}</div>
                      </div>
                      <div v-if="item.data.software.nEquipamento" class="detail-item">
                        <label class="detail-label">Nº Equipamento</label>
                        <div class="detail-value">{{ item.data.software.nEquipamento }}</div>
                      </div>
                    </template>
                    
                    <template v-else-if="softwareName === 'Pix'">
                      <div v-if="item.data.software.product" class="detail-item">
                        <label class="detail-label">Produto</label>
                        <div class="detail-value">{{ item.data.software.product }}</div>
                      </div>
                      <div v-if="item.data.software.modules && item.data.software.modules.length > 0" class="detail-item col-span-full">
                        <label class="detail-label">Módulos</label>
                        <div class="detail-value">
                          <div class="flex flex-wrap gap-1">
                            <span 
                              v-for="module in item.data.software.modules" 
                              :key="module"
                              class="module-badge"
                            >
                              {{ module }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </template>
                    
                    <template v-else-if="softwareName === 'Zon Soft'">
                      <div v-if="item.data.software.version" class="detail-item">
                        <label class="detail-label">Versão</label>
                        <div class="detail-value">{{ item.data.software.version }}</div>
                      </div>
                    </template>
                    
                    <template v-else-if="softwareName === 'Pt CERT'">
                      <div v-if="item.data.software.licenseType" class="detail-item">
                        <label class="detail-label">Tipo de Licença</label>
                        <div class="detail-value">{{ item.data.software.licenseType }}</div>
                      </div>
                    </template>
                    
                    <!-- Common fields for all software types -->
                    <div v-if="item.data.software.numeroSerie" class="detail-item">
                      <label class="detail-label">Número Série</label>
                      <div class="detail-value font-mono">{{ item.data.software.numeroSerie }}</div>
                    </div>
                    <div v-if="item.data.software.versaoSoftware" class="detail-item">
                      <label class="detail-label">Versão Software</label>
                      <div class="detail-value">{{ item.data.software.versaoSoftware }}</div>
                    </div>
                    <div v-if="item.data.software.versaoLicenca" class="detail-item">
                      <label class="detail-label">Versão Licença</label>
                      <div class="detail-value">{{ item.data.software.versaoLicenca }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoices Section -->
        <div v-if="item.data.invoices && item.data.invoices.length > 0" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
              <h2 class="text-lg font-semibold text-gray-900">Faturas</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="space-y-4">
                <div 
                  v-for="invoice in item.data.invoices" 
                  :key="invoice.id"
                  class="invoice-card"
                >
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="text-base font-semibold text-gray-900">
                      Fatura {{ invoice.numeroFatura || invoice.id }}
                    </h3>
                    <span class="invoice-badge">{{ invoice.ano || 'N/A' }}</span>
                  </div>
                  
                  <div class="detail-grid">
                    <div v-if="invoice.numeroFatura" class="detail-item">
                      <label class="detail-label">Número</label>
                      <div class="detail-value">{{ invoice.numeroFatura }}</div>
                    </div>
                    <div v-if="invoice.dataFatura" class="detail-item">
                      <label class="detail-label">Data da Fatura</label>
                      <div class="detail-value">{{ formatDate(invoice.dataFatura) }}</div>
                    </div>
                    <div v-if="invoice.dataAviso" class="detail-item">
                      <label class="detail-label">Data do Aviso</label>
                      <div class="detail-value">{{ formatDate(invoice.dataAviso) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { License, BaseContent, Client } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<License>('licenses');
const clientsApi = useApi<Client>('clients');
const errorHandler = useErrorHandler();

// State
const license = ref<License | null>(null);
const clientInfo = ref<any>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Display functions for ContentDetailTemplate
const getLicenseTitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Licença';
  const license = item as License;
  const softwareNames = license.data.software?.name || [];
  return softwareNames.length > 0 ? softwareNames.join(', ') : 'Licença';
};

const getLicenseSubtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const license = item as License;
  const parts = [];
  
  if (license.data.clientName) {
    parts.push(license.data.clientName);
  }
  
  if (license.data.versao) {
    parts.push(`v${license.data.versao}`);
  }
  
  if (license.data.modalidade) {
    parts.push(license.data.modalidade);
  }
  
  return parts.join(' • ');
};

const getLicenseStatus = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Licença';
  const license = item as License;
  
  // Determine status based on expiration
  if (license.data.dataVencimento) {
    const expirationDate = new Date(license.data.dataVencimento);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return 'Expirada';
    } else if (daysUntilExpiration <= 30) {
      return 'A Expirar';
    } else {
      return 'Ativa';
    }
  }
  
  return 'Ativa';
};

// Helper functions
const getStatusClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'ativa':
    case 'ativo':
      return 'status-active';
    case 'expirada':
    case 'expirado':
      return 'status-expired';
    case 'a expirar':
      return 'status-expiring';
    case 'suspensa':
    case 'suspenso':
      return 'status-suspended';
    default:
      return 'status-default';
  }
};

const getExpirationClass = (dateString?: string): string => {
  if (!dateString) return '';
  
  const expirationDate = new Date(dateString);
  const now = new Date();
  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) {
    return 'text-red-600 font-semibold';
  } else if (daysUntilExpiration <= 30) {
    return 'text-orange-600 font-semibold';
  } else {
    return 'text-green-600';
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const license = item as License;
  router.push(`/licenses/${license.uuid}/editar`);
};

const handleBack = () => {
  router.push('/licenses');
};

// Data loading
const loadLicense = async () => {
  const licenseId = route.params.uuid as string;
  
  if (!licenseId) {
    error.value = 'ID da licença não fornecido';
    return;
  }
  
  try {
    isLoading.value = true;
    clearError();
    
    await api.fetchById(licenseId);
    
    if (api.currentItem.value) {
      license.value = api.currentItem.value;
      
      // Load client information if clientId exists
      if (license.value.data.clientId) {
        await loadClientInfo(license.value.data.clientId);
      }
    } else {
      throw new Error('Licença não encontrada');
    }
  } catch (err) {
    console.error('Error loading license:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar licença';
  } finally {
    isLoading.value = false;
  }
};

const loadClientInfo = async (clientId: string) => {
  try {
    await clientsApi.fetchById(clientId);
    
    if (clientsApi.currentItem.value) {
      clientInfo.value = clientsApi.currentItem.value.data;
    }
  } catch (err) {
    console.error('Error loading client info:', err);
    // Don't show error for client info, just log it
  }
};

// Lifecycle
onMounted(() => {
  loadLicense();
});
</script>

<style scoped>
/* License-specific styling */
.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.status-active {
  @apply bg-green-100 text-green-800;
}

.status-expired {
  @apply bg-red-100 text-red-800;
}

.status-expiring {
  @apply bg-orange-100 text-orange-800;
}

.status-suspended {
  @apply bg-gray-100 text-gray-800;
}

.status-default {
  @apply bg-blue-100 text-blue-800;
}

.software-list {
  @apply space-y-4;
}

.software-card {
  @apply p-4 bg-gray-50 rounded-touch border border-gray-200;
}

.software-badge {
  @apply px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium;
}

.module-badge {
  @apply px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium;
}

.invoice-card {
  @apply p-4 bg-gray-50 rounded-touch border border-gray-200;
}

.invoice-badge {
  @apply px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium;
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
.status-badge {
  @apply text-portuguese;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .detail-grid {
    @apply grid-cols-1;
  }
}

/* Print styles */
@media print {
  .contact-link {
    @apply text-black no-underline;
  }
  
  .status-badge {
    @apply border border-gray-300 bg-white text-black;
  }
}
</style>