<template>
  <ContentDetailTemplate
    :item="workSheet"
    :is-loading="isLoading"
    :error="error"
    back-route="/work-sheets"
    :show-edit-button="true"
    :show-delete-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="getWorkSheetTitle"
    :get-subtitle="getWorkSheetSubtitle"
    :get-status="getWorkSheetStatus"
    delete-button-text="Eliminar"
    confirm-delete-title="Confirmar Eliminação"
    confirm-delete-message="Tem a certeza que pretende eliminar esta folha de obra?"
    @edit="handleEdit"
    @delete="handleDelete"
    @back="handleBack"
    @clear-error="clearError"
  >
    <!-- Custom content sections -->
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Client Information Section (First Priority) -->
        <ClientInfoSection :client-relation="workSheet?.relations?.client" />

        <!-- Request Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Informação do Pedido</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Data do Pedido</label>
                  <div class="detail-value">{{ formatDate(item.data.request?.date) }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Data da Assistência</label>
                  <div class="detail-value">
                    {{ formatDate(item.data.request?.assistanceDate) }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Motivo do Pedido</label>
                  <div class="detail-value">{{ item.data.request?.reason || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Time Tracking Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Controlo de Tempo</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Hora Chegada</label>
                  <div class="detail-value">{{ item.data.request?.arrivalTime || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Hora Saída</label>
                  <div class="detail-value">{{ item.data.request?.departureTime || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Total Horas</label>
                  <div class="detail-value">{{ item.data.request?.totalHours || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Information Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Informação do Serviço</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Tipo de Serviço</label>
                  <div class="detail-value">{{ item.data.otherData?.serviceType || '-' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Técnico Responsável</label>
                  <div class="detail-value">{{ getTechnicianDisplayName(item.data.otherData?.technician) }}</div>
                </div>
                <div
                  v-if="item.data.otherData?.serviceObservations"
                  class="detail-item col-span-full"
                >
                  <label class="detail-label">Observações do Serviço</label>
                  <div class="detail-value">{{ item.data.otherData.serviceObservations }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Displacement Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Deslocação</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Deslocação</label>
                  <div class="detail-value">
                    {{ item.data.displacement?.hasDisplacement ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Final Semana - Feriado</label>
                  <div class="detail-value">
                    {{ item.data.displacement?.weekendHoliday ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div v-if="item.data.displacement?.hasDisplacement" class="detail-item">
                  <label class="detail-label">KMs (Ida)</label>
                  <div class="detail-value">{{ item.data.displacement.oneWayKms || 0 }} km</div>
                </div>
                <div v-if="item.data.displacement?.hasDisplacement" class="detail-item">
                  <label class="detail-label">Total KMs (Ida e Volta)</label>
                  <div class="detail-value">{{ item.data.displacement.totalKms || 0 }} km</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Método de Pagamento</label>
                  <div class="detail-value">
                    {{ item.data.displacement?.paymentMethod || 'PENDENTE' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contract Information Section (when payment method is CONTRATO) -->
        <div v-if="item.data.displacement?.paymentMethod === 'CONTRATO'" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200"
               :class="{
                 'border-red-200 bg-red-50': workSheet?.relations?.contract && isRelationError(workSheet.relations.contract),
                 'border-yellow-200 bg-yellow-50': !item.data.contractId
               }">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
              :class="{
                'border-red-200 bg-red-100': workSheet?.relations?.contract && isRelationError(workSheet.relations.contract),
                'border-yellow-200 bg-yellow-100': !item.data.contractId
              }"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center flex-1 min-w-0">
                  <div class="flex-shrink-0 mr-3 text-gray-600"
                       :class="{
                         'text-red-600': workSheet?.relations?.contract && isRelationError(workSheet.relations.contract),
                         'text-yellow-600': !item.data.contractId
                       }">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 class="text-lg font-semibold text-gray-900"
                      :class="{
                        'text-red-900': workSheet?.relations?.contract && isRelationError(workSheet.relations.contract),
                        'text-yellow-900': !item.data.contractId
                      }">
                    Informação do Contrato
                  </h2>
                  <div v-if="workSheet?.relations?.contract && isRelationError(workSheet.relations.contract)" class="ml-2">
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
                
                <!-- Navigate to contract icon -->
                <button
                  v-if="workSheet?.relations?.contract && !isRelationError(workSheet.relations.contract)"
                  @click="navigateToContract"
                  class="flex-shrink-0 p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
                  style="min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;"
                  title="Ver detalhes do contrato"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div class="p-4 sm:p-6">
              <!-- Contract not specified -->
              <div v-if="!item.data.contractId" class="text-center py-2">
                <p class="text-yellow-800 font-medium">Contrato não especificado</p>
              </div>
              
              <!-- Contract error -->
              <div v-else-if="workSheet?.relations?.contract && isRelationError(workSheet.relations.contract)" class="text-center py-2">
                <p class="text-red-800 font-medium mb-1">
                  {{ workSheet.relations.contract.code === 404 ? 'Contrato não encontrado' : 'Erro ao carregar contrato' }}
                </p>
                <p class="text-red-600 text-sm">Código: {{ workSheet.relations.contract.code }}</p>
              </div>
              
              <!-- Contract information -->
              <div v-else-if="workSheet?.relations?.contract" class="detail-grid">
                <div class="detail-item col-span-full">
                  <label class="detail-label">Tipo de Contrato</label>
                  <div class="detail-value font-medium">
                    {{ getContractDisplayName(workSheet.relations.contract) }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Período do Contrato</label>
                  <div class="detail-value">
                    {{ getContractDates(workSheet.relations.contract) }}
                  </div>
                </div>
                <div v-if="workSheet.relations.contract.paymentFrequency" class="detail-item">
                  <label class="detail-label">Frequência de Pagamento</label>
                  <div class="detail-value">
                    {{ workSheet.relations.contract.paymentFrequency }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing Section (always shown) -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">
                Cálculo de Preços <span class="text-sm font-normal text-gray-600">(sem IVA)</span>
              </h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="pricing-table bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
                <div class="pricing-row">
                  <span class="pricing-label">Taxa Deslocação:</span>
                  <span class="pricing-value"
                    >{{ getDisplacementRate() }}€
                    <span class="text-xs text-red-600">sem IVA</span></span
                  >
                </div>
                <div class="pricing-row">
                  <span class="pricing-label">Preço KMs:</span>
                  <span class="pricing-value"
                    >{{ getKmsPrice() }}€ <span class="text-xs text-red-600">sem IVA</span></span
                  >
                </div>
                <div class="pricing-row">
                  <span class="pricing-label">Valor Hora:</span>
                  <span class="pricing-value"
                    >{{ getHourlyRate() }}€ <span class="text-xs text-red-600">sem IVA</span></span
                  >
                </div>
                <div class="pricing-row">
                  <span class="pricing-label">Preço Mão Obra:</span>
                  <span class="pricing-value"
                    >{{ getLaborPrice() }}€ <span class="text-xs text-red-600">sem IVA</span></span
                  >
                </div>
                <div
                  class="pricing-row total bg-primary-600 text-white -mx-4 -mb-4 px-4 py-3 rounded-b-lg font-bold"
                >
                  <span class="pricing-label text-white">PREÇO TOTAL:</span>
                  <span class="pricing-value text-white text-lg"
                    >{{ getTotalPrice() }}€ <span class="text-xs opacity-90">sem IVA</span></span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Material and Equipment Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Material e Equipamentos</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Material Utilizado</label>
                  <div class="detail-value">
                    {{ item.data.otherData?.materialUsed ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Equipamentos</label>
                  <div class="detail-value">
                    {{ item.data.otherData?.equipment ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div
                  v-if="item.data.otherData?.materialUsed && item.data.otherData?.materialDetails"
                  class="detail-item col-span-full"
                >
                  <label class="detail-label">Descrição do Material Utilizado</label>
                  <div class="detail-value">{{ item.data.otherData.materialDetails }}</div>
                </div>
                <div
                  v-if="item.data.otherData?.equipment && item.data.otherData?.equipmentDetails"
                  class="detail-item col-span-full"
                >
                  <label class="detail-label">Descrição dos Equipamentos</label>
                  <div class="detail-value">{{ item.data.otherData.equipmentDetails }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Status and Technical Operations Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">
                Estado do Serviço e Operações Técnicas
              </h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-grid">
                <div class="detail-item">
                  <label class="detail-label">Totalmente Resolvido</label>
                  <div class="detail-value">
                    {{ item.data.otherData?.totallyResolved ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Leitura de Dump</label>
                  <div class="detail-value">
                    {{ item.data.otherData?.dumpReading ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Cópia de Segurança</label>
                  <div class="detail-value">{{ item.data.otherData?.backup ? 'Sim' : 'Não' }}</div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">Verificação do Acesso Remoto</label>
                  <div class="detail-value">
                    {{ item.data.otherData?.remoteAccessCheck ? 'Sim' : 'Não' }}
                  </div>
                </div>
                <div class="detail-item">
                  <label class="detail-label">AnyDesk</label>
                  <div class="detail-value">{{ item.data.otherData?.anydesk ? 'Sim' : 'Não' }}</div>
                </div>
                <div
                  v-if="
                    !item.data.otherData?.totallyResolved && item.data.otherData?.resolutionIssues
                  "
                  class="detail-item col-span-full"
                >
                  <label class="detail-label">Observações sobre Problemas Não Resolvidos</label>
                  <div class="detail-value">{{ item.data.otherData.resolutionIssues }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Report Section -->
        <div class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Relatório de Serviço</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="detail-item">
                <label class="detail-label">Descrição Detalhada do Serviço</label>
                <div class="detail-value">{{ item.data.otherData?.serviceReport || '-' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Client Signature Section -->
        <div v-if="item.data.otherData?.clientSignature" class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Assinatura Cliente</h2>
            </div>
            <div class="p-4 sm:p-6">
              <div class="signature-display w-full">
                <!-- Signature Image at 100% width -->
                <img
                  :src="item.data.otherData.clientSignature"
                  alt="Assinatura do Cliente"
                  class="w-full h-auto border-2 border-gray-300 rounded bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- No Signature State -->
        <div v-else class="detail-section">
          <div class="bg-white rounded-touch border border-gray-200">
            <div
              class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch"
            >
              <h2 class="text-lg font-semibold text-gray-900">Assinatura Cliente</h2>
            </div>
            <div class="p-4 sm:p-6">
              <p class="text-gray-500 italic">Sem assinatura</p>
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { WorkSheet, ContentWithRelations, WorkSheetData, BaseContent, TechnicianUser } from '@clever/shared';
import { isRelationError } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import ClientInfoSection from '@/components/common/ClientInfoSection.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import { useApi } from '@/composables/useApi';
import contractPlansConfig from '@/config/contract-plans.json';

const route = useRoute();
const router = useRouter();
const {
  fetchById,
  currentItem,
  loading: apiLoading,
  error: apiError,
  remove,
} = useApi<ContentWithRelations<WorkSheetData>>('work-sheets');

// State
const workSheet = ref<ContentWithRelations<WorkSheetData> | null>(null);
const isLoading = computed(() => apiLoading.loading.value);
const error = computed(() => apiError.value?.message || null);

// Delete state
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteTitle = ref('Confirmar Eliminação');
const confirmDeleteMessage = ref('');

// Display helper functions for ContentDetailTemplate
const getWorkSheetTitle = (item: BaseContent | null): string => {
  if (!item?.data) return 'Folha de Obra';
  const workSheetItem = item as ContentWithRelations<WorkSheetData>;

  // Try to get client name from relations first, then fallback to data
  let clientName = 'Cliente não especificado';
  if (
    workSheetItem.relations?.client &&
    typeof workSheetItem.relations.client === 'object' &&
    'nomeEmpresa' in workSheetItem.relations.client
  ) {
    clientName =
      workSheetItem.relations.client.nomeComercial ||
      workSheetItem.relations.client.nomeEmpresa ||
      clientName;
  }

  const serviceType = workSheetItem.data.otherData?.serviceType || 'Folha de Obra';
  return `${serviceType} - ${clientName}`;
};

const getWorkSheetSubtitle = (item: BaseContent | null): string => {
  if (!item?.data) return '';
  const workSheetItem = item as ContentWithRelations<WorkSheetData>;
  const assistanceDate = workSheetItem.data.request?.assistanceDate;
  if (assistanceDate) {
    return formatDate(assistanceDate);
  }
  return '';
};

const getWorkSheetStatus = (item: BaseContent | null): string => {
  if (!item?.data) return 'Carregando...';
  const workSheetItem = item as ContentWithRelations<WorkSheetData>;
  if (workSheetItem.data.otherData?.totallyResolved) {
    return 'Resolvido';
  }
  return 'Pendente';
};

// Clear error function
const clearError = () => {
  // Error is managed by the API composable
};

// Event handlers for ContentDetailTemplate
const handleEdit = () => {
  if (!workSheet.value) return;
  router.push(`/work-sheets/${workSheet.value.uuid}/editar`);
};

const handleBack = () => {
  router.push('/work-sheets');
};

// Delete handlers
const getDeleteConfirmationMessage = (): string => {
  if (!workSheet.value) return 'Tem a certeza que pretende eliminar esta folha de obra?';

  const clientName =
    workSheet.value.relations?.client &&
    typeof workSheet.value.relations.client === 'object' &&
    'nomeEmpresa' in workSheet.value.relations.client
      ? workSheet.value.relations.client.nomeComercial ||
        workSheet.value.relations.client.nomeEmpresa
      : 'Cliente não especificado';

  const serviceType = workSheet.value.data.otherData?.serviceType || 'Folha de Obra';
  const assistanceDate = workSheet.value.data.request?.assistanceDate
    ? formatDate(workSheet.value.data.request.assistanceDate)
    : '';

  const identifier = assistanceDate
    ? `${serviceType} - ${clientName} (${assistanceDate})`
    : `${serviceType} - ${clientName}`;

  return `Tem a certeza que pretende eliminar "${identifier}"?`;
};

const handleDelete = () => {
  if (!workSheet.value) return;

  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!workSheet.value) return;

  try {
    isDeleting.value = true;

    console.log(
      'Attempting to delete work sheet:',
      JSON.stringify(
        {
          uuid: workSheet.value.uuid,
          serviceType: workSheet.value.data.otherData?.serviceType,
          assistanceDate: workSheet.value.data.request?.assistanceDate,
        },
        null,
        2
      )
    );

    const success = await remove(workSheet.value.uuid);

    if (apiError.value) {
      console.error(
        'Delete operation failed with API error:',
        JSON.stringify(apiError.value, null, 2)
      );
      // Error is handled by the useApi composable and displayed in the template
      showDeleteConfirm.value = false;
      return;
    }

    if (success) {
      console.log('Work sheet deleted successfully, navigating to /work-sheets');
      router.push('/work-sheets');
    } else {
      console.error('Delete operation failed - useApi returned false');
      // Error will be displayed in the template via the error computed property
      showDeleteConfirm.value = false;
    }
  } catch (err) {
    console.error('Delete operation error:', JSON.stringify(err, null, 2));
    // Error will be displayed in the template via the error computed property
    showDeleteConfirm.value = false;
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Data loading
const loadWorkSheet = async () => {
  const uuid = route.params.uuid as string;
  if (!uuid) {
    return;
  }

  // Validate UUID format to prevent trying to fetch invalid UUIDs like "create"
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    console.error('Invalid UUID format:', uuid);
    router.push('/work-sheets');
    return;
  }

  await fetchById(uuid);

  if (currentItem.value) {
    workSheet.value = currentItem.value as ContentWithRelations<WorkSheetData>;
  }
};

// Utility functions
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-PT');
  } catch {
    return 'Data inválida';
  }
};

// Helper function to extract technician display name from TechnicianUser object
const getTechnicianDisplayName = (technician: TechnicianUser | string | undefined): string => {
  if (!technician) return '-';
  
  // Handle TechnicianUser object structure
  if (typeof technician === 'object' && technician.firstName && technician.lastName) {
    return `${technician.firstName} ${technician.lastName}`;
  }
  
  // Handle TechnicianUser object with only one name
  if (typeof technician === 'object') {
    if (technician.firstName) return technician.firstName;
    if (technician.lastName) return technician.lastName;
    // Fallback to userId if no names available
    if (technician.userId) return `User ${technician.userId.slice(-8)}`;
  }
  
  // Handle legacy string format (backward compatibility)
  if (typeof technician === 'string') {
    return technician;
  }
  
  return '-';
};

// Pricing calculation methods (based on legacy logic)
const getDisplacementRate = (): number => {
  if (!workSheet.value?.data?.displacement?.hasDisplacement) return 0;
  const totalKms = workSheet.value.data.displacement.totalKms || 0;
  return totalKms > 180 ? 50 : 35;
};

const getHourlyRate = (): number => {
  // Always show hourly rate, even without displacement
  if (!workSheet.value?.data?.displacement) return 45; // Default rate
  return workSheet.value.data.displacement.weekendHoliday ? 60 : 45;
};

const getKmsPrice = (): number => {
  if (!workSheet.value?.data?.displacement?.hasDisplacement) return 0;
  const pricePerKm = 0.4;
  const totalKms = workSheet.value.data.displacement.totalKms || 0;
  return Math.round(pricePerKm * totalKms * 100) / 100;
};

const getLaborPrice = (): number => {
  // Calculate labor price even without displacement
  const arrivalTime = workSheet.value?.data?.request?.arrivalTime;
  const departureTime = workSheet.value?.data?.request?.departureTime;

  if (!arrivalTime || !departureTime) return 0;

  try {
    const [arrivalHours, arrivalMinutes] = arrivalTime.split(':').map(Number);
    const [departureHours, departureMinutes] = departureTime.split(':').map(Number);

    const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;
    const departureTotalMinutes = departureHours * 60 + departureMinutes;

    let diffMinutes = departureTotalMinutes - arrivalTotalMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Handle next day
    }

    const totalHours = diffMinutes / 60;
    const chargeableHours = totalHours < 1 ? 1 : totalHours; // Minimum 1 hour
    const hourlyRate = getHourlyRate();

    return Math.round(chargeableHours * hourlyRate * 100) / 100;
  } catch {
    return 0;
  }
};

const getTotalPrice = (): number => {
  // Calculate total price always, including displacement costs only when applicable
  const displacementRate = workSheet.value?.data?.displacement?.hasDisplacement ? getDisplacementRate() : 0;
  const kmsPrice = workSheet.value?.data?.displacement?.hasDisplacement ? getKmsPrice() : 0;
  const laborPrice = getLaborPrice();

  return Math.round((displacementRate + kmsPrice + laborPrice) * 100) / 100;
};

// Contract helper functions
const getPlanName = (contractType: string, planId: string): string => {
  const config = contractPlansConfig as any;
  const typeConfig = config[contractType];
  if (!typeConfig || !typeConfig.plans) return planId;
  
  const plan = typeConfig.plans.find((p: any) => p.id === planId);
  return plan?.name || planId;
};

const getContractDisplayName = (contract: any): string => {
  if (!contract || typeof contract !== 'object') return 'Contrato não especificado';
  
  const parts: string[] = [];
  
  // Add CPA contract info if exists
  if (contract.hasCPAContract && contract.cpaContractType && contract.planIdCPA) {
    const planName = getPlanName(contract.cpaContractType, contract.planIdCPA);
    parts.push(`CPA: ${planName}`);
  }
  
  // Add S&H contract info if exists
  if (contract.hasSHContract && contract.shContractType && contract.planIdSH) {
    const planName = getPlanName(contract.shContractType, contract.planIdSH);
    parts.push(`S&H: ${planName}`);
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Contrato não especificado';
};

const getContractDates = (contract: any): string => {
  if (!contract || typeof contract !== 'object') return '-';
  
  // Try CPA contract dates first
  if (contract.hasCPAContract && contract.inicioContratoCPA) {
    const startDate = formatDate(contract.inicioContratoCPA);
    const endDate = contract.fimContratoCPA ? formatDate(contract.fimContratoCPA) : '';
    
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    } else if (startDate) {
      return `Início: ${startDate}`;
    }
  }
  
  // Try S&H contract dates
  if (contract.hasSHContract && contract.inicioContratoSH) {
    const startDate = formatDate(contract.inicioContratoSH);
    const endDate = contract.fimContratoSH ? formatDate(contract.fimContratoSH) : '';
    
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`;
    } else if (startDate) {
      return `Início: ${startDate}`;
    }
  }
  
  return '-';
};

// Navigation handler for contract button
const navigateToContract = () => {
  if (workSheet.value?.data?.contractId) {
    router.push(`/contracts/${workSheet.value.data.contractId}`);
  }
};

// Lifecycle
onMounted(() => {
  loadWorkSheet();
});
</script>

<style scoped>
/* Pricing table specific styles */
.pricing-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.pricing-row:last-child:not(.total) {
  border-bottom: none;
}

.pricing-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.pricing-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.pricing-row.total .pricing-label {
  color: white;
}

.pricing-row.total .pricing-value {
  color: white;
  font-size: 1.125rem;
}

/* Mobile responsiveness for pricing */
@media (max-width: 640px) {
  .pricing-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .pricing-value {
    width: 100%;
  }
}
</style>
