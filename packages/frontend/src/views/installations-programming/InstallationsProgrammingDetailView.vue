<template>
  <ContentDetailTemplate
    :item="installation"
    :is-loading="isLoading"
    :error="error"
    back-route="/installations-programming"
    :show-edit-button="true"
    :show-delete-button="true"
    :show-meta-bar="true"
    :show-audit-trail="true"
    :show-mobile-actions="true"
    :get-title="getTitle"
    :get-subtitle="getSubtitle"
    :get-status="getStatus"
    delete-button-text="Eliminar"
    confirm-delete-title="Confirmar Eliminação"
    :confirm-delete-message="confirmDeleteMessage"
    @edit="handleEdit"
    @delete="handleDelete"
    @back="handleBack"
    @clear-error="clearError"
  >
    <template #content="{ item }">
      <div v-if="item && item.data" class="space-y-6">
        <!-- Phase Navigation -->
        <PhaseNavigation
          v-model:current-phase="currentPhase"
          :completed-phases="item.data.completedPhases || []"
        />

        <!-- Phase 1: Programação -->
        <div v-if="currentPhase === 1" class="space-y-6">
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Programação</h2>
              </div>
              <div class="p-4 sm:p-6">
                <div class="detail-grid">
                  <DetailField label="PLUS" :value="item.data.phase1?.plus" />
                  <DetailField label="Departamento" :value="item.data.phase1?.departamento" />
                  <DetailField label="Cabeçalho" :value="item.data.phase1?.cabecalho" />
                  <DetailField label="Rede" :value="item.data.phase1?.rede" />
                  <DetailField label="Vectron Connect" :value="item.data.phase1?.vectronConnect" />
                  <DetailField label="Anydesk" :value="item.data.phase1?.anydesk" />
                  <DetailField label="Séries / Nº Equipamentos" :value="item.data.phase1?.seriesEquipamentos" />
                </div>
              </div>
            </div>
          </div>

          <!-- Switches de ligação -->
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Ligações</h2>
              </div>
              <div class="p-4 sm:p-6">
                <div class="detail-grid">
                  <BooleanField label="Ligação a CPA" :value="item.data.phase1?.ligacaoCPA" />
                  <BooleanField label="Ligação a Gaveta" :value="item.data.phase1?.ligacaoGaveta" />
                  <BooleanField label="Ligação a Impressora ou Monitor de Pedidos" :value="item.data.phase1?.ligacaoImpressoraMonitor" />
                  <BooleanField label="Ligação a Faturadora" :value="item.data.phase1?.ligacaoFaturadora" />
                  <BooleanField label="Ligação a Display Clientes" :value="item.data.phase1?.ligacaoDisplayClientes" />
                  <BooleanField label="Ligação a Scanner" :value="item.data.phase1?.ligacaoScanner" />
                  <BooleanField label="Ligação a Leitor de Cartões" :value="item.data.phase1?.ligacaoLeitorCartoes" />
                  <BooleanField label="Ligação a Fechadura de Chaves de Operador" :value="item.data.phase1?.ligacaoFechaduraChaves" />
                </div>
              </div>
            </div>
          </div>

          <!-- Turnos -->
          <div v-if="item.data.phase1?.turnos" class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Configuração dos Turnos</h2>
              </div>
              <div class="p-4 sm:p-6">
                <p class="text-sm text-gray-900 whitespace-pre-line">{{ item.data.phase1.turnos }}</p>
              </div>
            </div>
          </div>

          <!-- Vectron (conditional) -->
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Equipamento Vectron</h2>
              </div>
              <div class="p-4 sm:p-6">
                <BooleanField label="Equipamento Vectron" :value="item.data.phase1?.isVectron" />

                <div v-if="item.data.phase1?.isVectron" class="mt-6 space-y-6">
                  <!-- Leitura X -->
                  <div>
                    <h3 class="text-sm font-semibold text-gray-700 mb-3">Programação Leitura X</h3>
                    <div class="detail-grid">
                      <DetailField label="Plus 1" :value="item.data.phase1?.vectronLeituraX?.plus1" />
                      <DetailField label="Plus 2" :value="item.data.phase1?.vectronLeituraX?.plus2" />
                      <DetailField label="Departamentos" :value="item.data.phase1?.vectronLeituraX?.departamentos" />
                      <DetailField label="Operadores" :value="item.data.phase1?.vectronLeituraX?.operadores" />
                      <DetailField label="Transações C/IVA" :value="item.data.phase1?.vectronLeituraX?.transacoesComIVA" />
                    </div>
                  </div>

                  <!-- Consulta Diária -->
                  <div>
                    <h3 class="text-sm font-semibold text-gray-700 mb-3">Tecla Só Consulta Diária</h3>
                    <div class="detail-grid">
                      <DetailField label="Leitura Gerente Normal" :value="item.data.phase1?.vectronConsultaDiaria?.leituraGerenteNormal" />
                      <DetailField label="Leitura Supervisor" :value="item.data.phase1?.vectronConsultaDiaria?.leituraSupervisor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Phase 2: Preparação -->
        <div v-if="currentPhase === 2" class="space-y-6">
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Checklist de Preparação</h2>
              </div>
              <div class="p-4 sm:p-6">
                <PhaseChecklist
                  :model-value="item.data.phase2?.checklist || {}"
                  @update:model-value="() => {}"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Phase 3: Instalação no Cliente -->
        <div v-if="currentPhase === 3" class="space-y-6">
          <!-- Client Info -->
          <ClientInfoSection :client-relation="installation?.relations?.client" />

          <!-- Documentos -->
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Documentos</h2>
              </div>
              <div class="p-4 sm:p-6">
                <div class="detail-grid">
                  <DetailField label="Nº Fatura" :value="item.data.phase3?.nrFatura" />
                  <DetailField label="Nº Guia de Transportes" :value="item.data.phase3?.nrGuiaTransportes" />
                </div>
              </div>
            </div>
          </div>

          <!-- Datas e Horários -->
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Datas e Horários</h2>
              </div>
              <div class="p-4 sm:p-6">
                <div class="detail-grid">
                  <DetailField label="Data de Instalação" :value="formatDate(item.data.phase3?.dataInstalacao)" />
                  <DetailField label="Hora Inicial" :value="item.data.phase3?.horaInicialInstalacao" />
                  <DetailField label="Hora Final" :value="item.data.phase3?.horaFinalInstalacao" />
                  <DetailField label="Data de Formação" :value="formatDate(item.data.phase3?.dataFormacao)" />
                  <DetailField label="Hora Inicial" :value="item.data.phase3?.horaInicialFormacao" />
                  <DetailField label="Hora Final" :value="item.data.phase3?.horaFinalFormacao" />
                  <DetailField label="Quem Recebeu Formação" :value="item.data.phase3?.quemRecebeuFormacao" />
                </div>
              </div>
            </div>
          </div>

          <!-- Material Instalado -->
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Material Instalado</h2>
              </div>
              <div class="p-4 sm:p-6">
                <div class="detail-grid">
                  <BooleanField label="POS" :value="item.data.phase3?.materialInstalado?.pos" />
                  <BooleanField label="CPA" :value="item.data.phase3?.materialInstalado?.cpa" />
                  <BooleanField label="Balança" :value="item.data.phase3?.materialInstalado?.balanca" />
                  <BooleanField label="CCTV" :value="item.data.phase3?.materialInstalado?.cctv" />
                  <BooleanField label="Alarme" :value="item.data.phase3?.materialInstalado?.alarme" />
                  <BooleanField label="Impressora" :value="item.data.phase3?.materialInstalado?.impressora" />
                  <BooleanField label="UPS" :value="item.data.phase3?.materialInstalado?.ups" />
                  <BooleanField label="Router" :value="item.data.phase3?.materialInstalado?.router" />
                  <BooleanField label="Switch" :value="item.data.phase3?.materialInstalado?.switchEquip" />
                  <BooleanField label="Rolos" :value="item.data.phase3?.materialInstalado?.rolos" />
                  <DetailField
                    v-if="item.data.phase3?.materialInstalado?.rolos"
                    label="Quantidade de Rolos"
                    :value="String(item.data.phase3?.materialInstalado?.rolosQuantidade ?? 0)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Phase 4: Testes -->
        <div v-if="currentPhase === 4" class="space-y-6">
          <!-- Anydesk -->
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Teste Anydesk</h2>
              </div>
              <div class="p-4 sm:p-6">
                <BooleanField label="Anydesk Testado" :value="item.data.phase4?.anydeskTestado" />
                <div class="mt-4">
                  <DetailField
                    v-if="item.data.phase4?.anydeskTestado"
                    label="Código Anydesk"
                    :value="item.data.phase4?.anydeskCodigo"
                  />
                  <DetailField
                    v-if="item.data.phase4?.anydeskTestado === false"
                    label="Motivo da Falha"
                    :value="item.data.phase4?.anydeskMotivo"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Vectron Connect -->
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Teste Vectron Connect</h2>
              </div>
              <div class="p-4 sm:p-6">
                <BooleanField label="Vectron Connect Testado" :value="item.data.phase4?.vectronConnectTestado" />
                <div class="mt-4">
                  <DetailField
                    v-if="item.data.phase4?.vectronConnectTestado"
                    label="Código Vectron Connect"
                    :value="item.data.phase4?.vectronConnectCodigo"
                  />
                  <DetailField
                    v-if="item.data.phase4?.vectronConnectTestado === false"
                    label="Motivo da Falha"
                    :value="item.data.phase4?.vectronConnectMotivo"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Phase 5: Finalização -->
        <div v-if="currentPhase === 5" class="space-y-6">
          <div class="detail-section">
            <div class="bg-white rounded-touch border border-gray-200">
              <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50 rounded-t-touch">
                <h2 class="text-lg font-semibold text-gray-900">Finalização</h2>
              </div>
              <div class="p-4 sm:p-6 space-y-4">
                <BooleanField label="DUMP Lido" :value="item.data.phase5?.dumpLido" />
                <BooleanField label="Cópia de Segurança" :value="item.data.phase5?.copiaSeguranca" />
                <BooleanField label="Foto da Instalação" :value="item.data.phase5?.fotoInstalacao" />
                <DetailField
                  v-if="item.data.phase5?.fotoInstalacao"
                  label="URL da Drive"
                  :value="item.data.phase5?.fotoURL"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentDetailTemplate>

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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { BaseContent, ContentWithRelations, TechnicianUser } from '@clever/shared';
import ContentDetailTemplate from '@/components/common/ContentDetailTemplate.vue';
import PhaseNavigation from '@/components/installations-programming/PhaseNavigation.vue';
import PhaseChecklist from '@/components/installations-programming/PhaseChecklist.vue';
import ClientInfoSection from '@/components/common/ClientInfoSection.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import { useApi } from '@/composables/useApi';

// Inline sub-components for detail display
const DetailField = {
  props: { label: String, value: String },
  template: `
    <div class="detail-item">
      <label class="detail-label">{{ label }}</label>
      <div class="detail-value">{{ value || '—' }}</div>
    </div>
  `,
};

const BooleanField = {
  props: { label: String, value: Boolean },
  template: `
    <div class="detail-item">
      <label class="detail-label">{{ label }}</label>
      <div class="detail-value flex items-center">
        <span
          class="inline-block w-3 h-3 rounded-full mr-2"
          :class="value ? 'bg-[#75AE93]' : 'bg-gray-300'"
        ></span>
        {{ value ? 'Sim' : 'Não' }}
      </div>
    </div>
  `,
};

// Router
const route = useRoute();
const router = useRouter();

// Composables
const api = useApi<ContentWithRelations<any>>('installations-programming');

// State
const installation = ref<ContentWithRelations<any> | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentPhase = ref(1);

// Delete state
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteMessage = ref('');

// Clear error
const clearError = () => {
  error.value = null;
};

// Helper: technician display name
const getTechnicianDisplayName = (technician: TechnicianUser | string | undefined): string => {
  if (!technician) return '—';

  if (typeof technician === 'object' && technician.firstName && technician.lastName) {
    return `${technician.firstName} ${technician.lastName}`;
  }

  if (typeof technician === 'object') {
    if (technician.firstName) return technician.firstName;
    if (technician.lastName) return technician.lastName;
    if (technician.userId) return `User ${technician.userId.slice(-8)}`;
  }

  if (typeof technician === 'string') return technician;

  return '—';
};

// Helper: format date dd/mm/yyyy
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Display functions for ContentDetailTemplate
const getTitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Instalação';
  const shortId = item.uuid.slice(0, 8).toUpperCase();
  return `IP-${shortId}`;
};

const getSubtitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const inst = item as ContentWithRelations<any>;
  const parts: string[] = [];

  // Client name from relations
  if (inst.relations?.client && typeof inst.relations.client === 'object' && 'nomeEmpresa' in inst.relations.client) {
    const name = inst.relations.client.nomeComercial || inst.relations.client.nomeEmpresa;
    if (name) parts.push(name);
  }

  const techName = getTechnicianDisplayName(inst.data.technician);
  if (techName !== '—') parts.push(techName);

  return parts.join(' • ');
};

const getStatus = (item: BaseContent | null): string => {
  if (!item || !item.data) return '';
  const count = item.data.completedPhases?.length ?? 0;
  if (count === 5) return 'Concluída';
  return `${count}/5 fases completas`;
};

// Event handlers
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  router.push(`/installations-programming/${item.uuid}/editar`);
};

const handleBack = () => {
  router.push('/installations-programming');
};

// Delete functionality
const getDeleteConfirmationMessage = (): string => {
  if (!installation.value) return 'Tem a certeza que pretende eliminar esta instalação?';

  const id = getTitle(installation.value);
  let clientName = 'Cliente';

  if (
    installation.value.relations?.client &&
    typeof installation.value.relations.client === 'object' &&
    'nomeEmpresa' in installation.value.relations.client
  ) {
    clientName = installation.value.relations.client.nomeComercial || installation.value.relations.client.nomeEmpresa || 'Cliente';
  }

  return `Tem a certeza que pretende eliminar a instalação "${id}" para ${clientName}?`;
};

const handleDelete = () => {
  if (!installation.value) return;
  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!installation.value) return;

  isDeleting.value = true;

  await api.remove(installation.value.uuid).then((success) => {
    if (api.error.value) {
      console.error('Delete operation failed with API error:', JSON.stringify(api.error.value, null, 2));
      error.value = typeof api.error.value === 'string'
        ? api.error.value
        : api.error.value.message || 'Erro ao eliminar instalação';
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
  }).catch((err) => {
    console.error('Delete operation error:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao eliminar instalação';
    showDeleteConfirm.value = false;
  }).finally(() => {
    isDeleting.value = false;
  });
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Data loading
const loadInstallation = async () => {
  const installationId = route.params.uuid as string;

  if (!installationId) {
    error.value = 'ID da instalação não fornecido';
    return;
  }

  isLoading.value = true;
  clearError();

  await api.fetchById(installationId).then(() => {
    if (api.currentItem.value) {
      installation.value = api.currentItem.value;
      console.log('Installation loaded:', JSON.stringify({
        uuid: installation.value.uuid,
        completedPhases: installation.value.data.completedPhases,
        isCompleted: installation.value.data.isCompleted,
      }, null, 2));
    } else {
      throw new Error('Instalação não encontrada');
    }
  }).catch((err) => {
    console.error('Error loading installation:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao carregar instalação';
  }).finally(() => {
    isLoading.value = false;
  });
};

// Lifecycle
onMounted(() => {
  loadInstallation();
});
</script>

<style scoped>
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

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .detail-grid {
    @apply gap-3;
  }

  .detail-label {
    @apply text-xs;
  }

  .detail-value {
    @apply text-sm;
  }
}
</style>
