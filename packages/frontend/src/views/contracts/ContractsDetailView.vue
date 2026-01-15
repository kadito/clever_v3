<template>
  <ContentDetailTemplate
    :item="contract"
    :is-loading="isLoading"
    :error="error"
    back-route="/contracts"
    :show-edit-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="getContractTitle"
    :get-subtitle="getContractSubtitle"
    :get-status="getContractStatus"
    @edit="handleEdit"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <!-- Client Information Section -->
      <div v-if="contract?.relations?.client" class="detail-section">
        <div class="bg-white rounded-touch border border-gray-200">
          <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
            <h2 class="text-lg font-semibold text-gray-900">Cliente</h2>
          </div>
          <div class="p-4 sm:p-6">
            <!-- Client relation display with error handling -->
            <div v-if="isClientError(contract.relations.client)" class="client-error">
              <div class="flex items-center p-3 bg-red-50 border border-red-200 rounded-touch">
                <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p class="text-sm font-medium text-red-800">Erro ao carregar cliente</p>
                  <p class="text-xs text-red-600">{{ getClientErrorMessage(contract.relations.client) }}</p>
                </div>
              </div>
            </div>
            <div v-else-if="isResolvedClient(contract.relations.client)" class="client-info">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Nome da Empresa</label>
                  <div class="detail-value">{{ contract.relations.client.nomeEmpresa || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Nome Comercial</label>
                  <div class="detail-value">{{ contract.relations.client.nomeComercial || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Contribuinte</label>
                  <div class="detail-value">{{ contract.relations.client.contribuinte || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Localidade</label>
                  <div class="detail-value">{{ contract.relations.client.localidade || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CPA Contract Section -->
      <div v-if="contract?.data.hasCPAContract" class="detail-section">
        <div class="bg-white rounded-touch border border-gray-200">
          <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-blue-50 rounded-t-touch">
            <h2 class="text-lg font-semibold text-blue-900">Contrato CPA</h2>
          </div>
          <div class="p-4 sm:p-6">
            <div class="detail-grid">
              <div class="detail-item">
                <label class="detail-label">Tipo de Contrato</label>
                <div class="detail-value">
                  <span class="badge badge-blue">{{ contract.data.cpaContractType || 'CPA' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Plano</label>
                <div class="detail-value">{{ contract.data.planoCPA || contract.data.planIdCPA || '-' }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Distância</label>
                <div class="detail-value">{{ formatDistance(contract.data.distanceCPA) }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Modalidade de Pagamento</label>
                <div class="detail-value">{{ formatPaymentMethod(contract.data.modalidadePagamentoCPA) }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Início do Contrato</label>
                <div class="detail-value">{{ formatDate(contract.data.inicioContratoCPA) }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Fim do Contrato</label>
                <div class="detail-value">{{ formatDate(contract.data.fimContratoCPA) }}</div>
              </div>
              <div v-if="contract.data.hasPOSPackage" class="detail-item">
                <label class="detail-label">Pacote POS</label>
                <div class="detail-value">
                  <span class="badge badge-green">Incluído</span>
                </div>
              </div>
            </div>

            <!-- CPA Equipment -->
            <div v-if="contract.data.cpaEquipments && contract.data.cpaEquipments.length > 0" class="mt-6">
              <h3 class="text-md font-semibold text-gray-900 mb-4">Equipamentos CPA</h3>
              <div class="space-y-3">
                <div 
                  v-for="(equipment, index) in contract.data.cpaEquipments" 
                  :key="equipment.id"
                  class="equipment-card"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-2">
                        <span class="equipment-number">{{ index + 1 }}</span>
                        <h4 class="font-medium text-gray-900">{{ equipment.modelo || 'Modelo não especificado' }}</h4>
                        <span v-if="equipment.desconto > 0" class="badge badge-orange">
                          {{ equipment.desconto }}% desconto
                        </span>
                      </div>
                      <div class="text-sm text-gray-600 space-y-1">
                        <p v-if="equipment.numeroSerie">
                          <strong>Número de Série:</strong> {{ equipment.numeroSerie }}
                        </p>
                        <p v-if="equipment.observacoes">
                          <strong>Observações:</strong> {{ equipment.observacoes }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Legacy CPA Equipment -->
            <div v-else-if="contract.data.modeloCPA || contract.data.numeroSerieCPA" class="mt-6">
              <h3 class="text-md font-semibold text-gray-900 mb-4">Equipamento CPA (Legacy)</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Modelo</label>
                  <div class="detail-value">{{ contract.data.modeloCPA || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Número de Série</label>
                  <div class="detail-value">{{ contract.data.numeroSerieCPA || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- S&H Contract Section -->
      <div v-if="contract?.data.hasSHContract" class="detail-section">
        <div class="bg-white rounded-touch border border-gray-200">
          <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-green-50 rounded-t-touch">
            <h2 class="text-lg font-semibold text-green-900">Contrato S&H</h2>
          </div>
          <div class="p-4 sm:p-6">
            <div class="detail-grid">
              <div class="detail-item">
                <label class="detail-label">Plano</label>
                <div class="detail-value">{{ contract.data.planoSH || contract.data.planIdSH || '-' }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Distância</label>
                <div class="detail-value">{{ formatDistance(contract.data.distanceSH) }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Modalidade de Pagamento</label>
                <div class="detail-value">{{ formatPaymentMethod(contract.data.modalidadePagamentoSH) }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Início do Contrato</label>
                <div class="detail-value">{{ formatDate(contract.data.inicioContratoSH) }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Fim do Contrato</label>
                <div class="detail-value">{{ formatDate(contract.data.fimContratoSH) }}</div>
              </div>
            </div>

            <!-- S&H Equipment -->
            <div v-if="contract.data.modeloPSO || contract.data.numeroSeriePSO || contract.data.softwarePSO" class="mt-6">
              <h3 class="text-md font-semibold text-gray-900 mb-4">Equipamento S&H</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Modelo PSO</label>
                  <div class="detail-value">{{ contract.data.modeloPSO || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Número de Série PSO</label>
                  <div class="detail-value">{{ contract.data.numeroSeriePSO || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Software PSO</label>
                  <div class="detail-value">{{ contract.data.softwarePSO || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Service Details Section -->
      <div class="detail-section">
        <div class="bg-white rounded-touch border border-gray-200">
          <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
            <h2 class="text-lg font-semibold text-gray-900">Detalhes do Serviço</h2>
          </div>
          <div class="p-4 sm:p-6">
            <div class="detail-grid">
              <div class="detail-item">
                <label class="detail-label">Horas de Assistência Anual</label>
                <div class="detail-value">{{ contract?.data.horasAssistenciaAnual || 0 }} horas</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Deslocações por Ano</label>
                <div class="detail-value">{{ contract?.data.deslocacoesPorAno || 0 }}</div>
              </div>
              <div class="detail-item">
                <label class="detail-label">Manutenções por Ano</label>
                <div class="detail-value">{{ contract?.data.manutencoesPorAno || 0 }}</div>
              </div>
              <div v-if="contract?.data.metodoPagamento" class="detail-item">
                <label class="detail-label">Método de Pagamento</label>
                <div class="detail-value">{{ formatPaymentMethod(contract.data.metodoPagamento) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legacy Fields Section (if any exist) -->
      <div v-if="hasLegacyFields(contract?.data)" class="detail-section">
        <div class="bg-white rounded-touch border border-gray-200">
          <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-yellow-50 rounded-t-touch">
            <h2 class="text-lg font-semibold text-yellow-900">Campos Legacy</h2>
          </div>
          <div class="p-4 sm:p-6">
            <div class="detail-grid">
              <div v-if="contract?.data.planoContrato" class="detail-item">
                <label class="detail-label">Plano Contrato (Legacy)</label>
                <div class="detail-value">{{ contract.data.planoContrato }}</div>
              </div>
              <div v-if="contract?.data.temCPA" class="detail-item">
                <label class="detail-label">Tem CPA (Legacy)</label>
                <div class="detail-value">
                  <span class="badge badge-blue">{{ contract.data.temCPA ? 'Sim' : 'Não' }}</span>
                </div>
              </div>
              <div v-if="contract?.data.temPSO" class="detail-item">
                <label class="detail-label">Tem PSO (Legacy)</label>
                <div class="detail-value">
                  <span class="badge badge-green">{{ contract.data.temPSO ? 'Sim' : 'Não' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Custom meta bar -->
    <template #metaBar="{ item }">
      <div class="flex flex-wrap items-center gap-4 text-sm">
        <!-- Contract status -->
        <div class="flex items-center">
          <span class="text-gray-500 mr-2">Estado:</span>
          <span class="badge" :class="getContractStatusBadgeClass(item)">
            {{ getContractStatus(item) }}
          </span>
        </div>

        <!-- Contract types -->
        <div class="flex items-center">
          <span class="text-gray-500 mr-2">Tipos:</span>
          <div class="flex space-x-1">
            <span v-if="item.data.hasCPAContract" class="badge badge-blue">
              {{ item.data.cpaContractType || 'CPA' }}
            </span>
            <span v-if="item.data.hasSHContract" class="badge badge-green">
              S&H
            </span>
          </div>
        </div>

        <!-- Equipment count -->
        <div v-if="getEquipmentCount(item) > 0" class="flex items-center">
          <span class="text-gray-500 mr-2">Equipamentos:</span>
          <span class="text-gray-900">{{ getEquipmentCount(item) }}</span>
        </div>

        <!-- Last updated -->
        <div v-if="item.updatedAt !== item.createdAt" class="flex items-center">
          <span class="text-gray-500 mr-2">Atualizado:</span>
          <span class="text-gray-900">{{ formatDate(item.updatedAt) }}</span>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Contract, BaseContent, ContentWithRelations } from '@clever/shared';
import { hasActiveContract, getContractSummary } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import { useApi } from '@/composables/useApi';
import { useErrorHandler } from '@/composables/useErrorHandler';

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<Contract>('contracts');
const errorHandler = useErrorHandler();

// State
const contract = ref<ContentWithRelations<Contract['data']> | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Clear error function
const clearError = () => {
  error.value = null;
};

// Display functions
const getContractTitle = (item: BaseContent | null): string => {
  if (!item) return 'Contrato';
  
  const contractItem = item as ContentWithRelations<Contract['data']>;
  
  // Check if contractItem has data
  if (!contractItem || !contractItem.data) return 'Contrato';
  
  // Try to get client name from resolved relations first
  if (contractItem.relations?.client) {
    const clientRelation = contractItem.relations.client;
    
    // Check if it's a resolved relation with client data
    if (clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation) {
      return `Contrato - ${clientRelation.nomeComercial || clientRelation.nomeEmpresa}`;
    }
    
    // Check if it's an error
    if (clientRelation && typeof clientRelation === 'object' && 'type' in clientRelation && clientRelation.type === 'error') {
      return 'Contrato - Cliente não encontrado';
    }
  }
  
  // Fallback to stored client name or default
  return `Contrato - ${contractItem.data.clienteName || 'Cliente desconhecido'}`;
};

const getContractSubtitle = (item: BaseContent | null): string => {
  if (!item) return '';
  
  const contractItem = item as ContentWithRelations<Contract['data']>;
  
  // Check if contractItem has data
  if (!contractItem || !contractItem.data) return '';
  
  const summary = getContractSummary(contractItem.data);
  const parts = [];
  
  if (summary.contractTypes.length > 0) {
    parts.push(summary.contractTypes.join(' + '));
  }
  
  if (summary.planNames.length > 0) {
    parts.push(summary.planNames.join(', '));
  }
  
  return parts.join(' • ');
};

const getContractStatus = (item: BaseContent | null): string => {
  if (!item) return 'Carregando...';
  
  const contractItem = item as ContentWithRelations<Contract['data']>;
  
  // Check if contractItem has data
  if (!contractItem || !contractItem.data) return 'Carregando...';
  
  // Check if there's a client relation error
  if (contractItem.relations?.client && typeof contractItem.relations.client === 'object' && 'type' in contractItem.relations.client && contractItem.relations.client.type === 'error') {
    return 'Erro Cliente';
  }
  
  const isActive = hasActiveContract(contractItem.data);
  return isActive ? 'Ativo' : 'Inativo';
};

const getContractStatusBadgeClass = (item: BaseContent | null): string => {
  if (!item) return 'badge-gray';
  
  const contractItem = item as ContentWithRelations<Contract['data']>;
  
  // Check if contractItem has data
  if (!contractItem || !contractItem.data) return 'badge-gray';
  
  // Check if there's a client relation error
  if (contractItem.relations?.client && typeof contractItem.relations.client === 'object' && 'type' in contractItem.relations.client && contractItem.relations.client.type === 'error') {
    return 'badge-red';
  }
  
  const isActive = hasActiveContract(contractItem.data);
  return isActive ? 'badge-green' : 'badge-gray';
};

// Helper functions
const isClientError = (clientRelation: any): boolean => {
  return clientRelation && typeof clientRelation === 'object' && 'type' in clientRelation && clientRelation.type === 'error';
};

const isResolvedClient = (clientRelation: any): boolean => {
  return clientRelation && typeof clientRelation === 'object' && 'nomeEmpresa' in clientRelation;
};

const getClientErrorMessage = (clientRelation: any): string => {
  if (clientRelation && typeof clientRelation === 'object' && 'message' in clientRelation) {
    return clientRelation.message;
  }
  return 'Erro desconhecido';
};

const getEquipmentCount = (item: BaseContent | null): number => {
  if (!item) return 0;
  
  const contractItem = item as ContentWithRelations<Contract['data']>;
  
  // Check if contractItem has data
  if (!contractItem || !contractItem.data) return 0;
  
  let count = 0;
  
  // Count CPA equipments (new format)
  if (contractItem.data.cpaEquipments && contractItem.data.cpaEquipments.length > 0) {
    count += contractItem.data.cpaEquipments.length;
  }
  
  // Count legacy equipment fields
  if (contractItem.data.modeloCPA || contractItem.data.numeroSerieCPA) {
    count += 1;
  }
  
  if (contractItem.data.modeloPSO || contractItem.data.numeroSeriePSO) {
    count += 1;
  }
  
  return count;
};

const hasLegacyFields = (data: Contract['data'] | undefined): boolean => {
  if (!data) return false;
  return !!(data.planoContrato || data.temCPA || data.temPSO);
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDistance = (distance: string | undefined): string => {
  if (!distance) return '-';
  
  const distanceMap: Record<string, string> = {
    'under180km': 'Até 180km',
    'over180km': 'Mais de 180km'
  };
  
  return distanceMap[distance] || distance;
};

const formatPaymentMethod = (method: string | undefined): string => {
  if (!method) return '-';
  
  const methodMap: Record<string, string> = {
    'TRANSFERENCIA_BANCARIA': 'Transferência Bancária',
    'DEBITO_DIRETO': 'Débito Direto',
    'MULTIBANCO': 'Multibanco',
    'CHEQUE': 'Cheque',
    'NUMERARIO': 'Numerário',
    'MB_WAY': 'MB WAY',
    'MENSAL': 'Mensal',
    'TRIMESTRAL': 'Trimestral',
    'SEMESTRAL': 'Semestral',
    'ANUAL': 'Anual'
  };
  
  return methodMap[method] || method;
};

// Event handlers
const handleEdit = (item: BaseContent) => {
  const contractItem = item as ContentWithRelations<Contract['data']>;
  router.push(`/contracts/${contractItem.uuid}/editar`);
};

const handleBack = () => {
  router.push('/contracts');
};

// Data loading
const loadContract = async () => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    error.value = 'ID do contrato não fornecido';
    return;
  }

  try {
    isLoading.value = true;
    clearError();
    
    console.log('Loading contract with UUID:', uuid);
    await api.fetchById(uuid);
    
    console.log('API currentItem after fetch:', JSON.stringify(api.currentItem.value, null, 2));
    
    if (api.currentItem.value) {
      contract.value = api.currentItem.value as ContentWithRelations<Contract['data']>;
      console.log('Contract loaded successfully:', JSON.stringify(contract.value, null, 2));
    } else {
      throw new Error('Contrato não encontrado');
    }
  } catch (err) {
    console.error('Error loading contract:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar contrato';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadContract();
});
</script>

<style scoped>
/* Contract-specific styling */
.detail-section {
  @apply space-y-4;
}

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

.detail-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.detail-value {
  @apply text-sm text-gray-900 break-words;
}

/* Equipment card styling */
.equipment-card {
  @apply bg-gray-50 rounded-touch p-4 border border-gray-200;
}

.equipment-number {
  @apply inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full;
}

/* Client error styling */
.client-error {
  @apply mb-4;
}

/* Badge styling */
.badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.badge-blue {
  @apply bg-blue-100 text-blue-800;
}

.badge-green {
  @apply bg-green-100 text-green-800;
}

.badge-orange {
  @apply bg-orange-100 text-orange-800;
}

.badge-red {
  @apply bg-red-100 text-red-800;
}

.badge-gray {
  @apply bg-gray-100 text-gray-800;
}

/* Portuguese text optimization */
.detail-value,
.equipment-card,
.client-error {
  @apply text-portuguese;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .equipment-number {
    @apply w-5 h-5 text-xs;
  }
  
  .badge {
    @apply px-1.5 py-0.5 text-xs;
  }
}

/* Print styles */
@media print {
  .detail-section {
    break-inside: avoid;
    margin-bottom: 1rem;
  }
  
  .equipment-card {
    border: 1px solid #ccc;
    background: white;
  }
}
</style>