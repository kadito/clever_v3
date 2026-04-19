<template>
  <div class="create-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Nova Instalação e Programação</h1>
        <p class="view-subtitle">Criar um novo registo de instalação no sistema</p>
      </div>
    </div>

    <!-- Phase Navigation -->
    <div class="phase-nav-wrapper">
      <PhaseNavigation
        :current-phase="currentPhase"
        :completed-phases="completedPhases"
        @update:current-phase="currentPhase = $event"
      />
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert">
      <p class="error-text">{{ error }}</p>
      <button type="button" class="error-dismiss" @click="error = null">✕</button>
    </div>

    <!-- Phase Content -->
    <form class="phase-content" @submit.prevent="handleSubmit">

      <!-- ═══════════ Phase 1 — Programação / Preparação ═══════════ -->
      <div v-if="currentPhase === 1" class="phase-section">
        <h2 class="section-title">Programação / Preparação</h2>

        <div class="form-group">
          <label class="form-label" for="p1-tipoProgramacao">Tipo de Programação</label>
          <input id="p1-tipoProgramacao" type="text" class="form-input" v-model="formData.phase1.tipoProgramacao" />
        </div>
        <div class="form-group">
          <label class="form-label" for="p1-numeroSerie">Número de Série</label>
          <input id="p1-numeroSerie" type="text" class="form-input" v-model="formData.phase1.numeroSerie" />
        </div>
        <div class="form-group">
          <label class="form-label" for="p1-numeroEquipamento">Nº Equipamento</label>
          <input id="p1-numeroEquipamento" type="text" class="form-input" v-model="formData.phase1.numeroEquipamento" />
        </div>
        <div class="form-group">
          <label class="form-label" for="p1-leiturasGuardadas">Leituras Guardadas</label>
          <textarea id="p1-leiturasGuardadas" class="form-input form-textarea" v-model="formData.phase1.leiturasGuardadas" rows="3" />
        </div>
        <div class="switch-row">
          <span class="switch-label">Teste Final a todos os equipamentos e acessórios</span>
          <button type="button" role="switch" :aria-checked="formData.phase1.testeFinal" class="switch" :class="{ 'switch--on': formData.phase1.testeFinal }" @click="formData.phase1.testeFinal = !formData.phase1.testeFinal"><span class="switch-thumb" /></button>
        </div>
      </div>

      <!-- ═══════════ Phase 2 — Preparação ═══════════ -->
      <div v-if="currentPhase === 2" class="phase-section">
        <h2 class="section-title">Preparação</h2>
        <PhaseChecklist v-model="formData.phase2.checklist" />
      </div>

      <!-- ═══════════ Phase 3 — Instalação no Cliente ═══════════ -->
      <div v-if="currentPhase === 3" class="phase-section">
        <h2 class="section-title">Instalação no Cliente</h2>

        <!-- Dados Gerais -->
        <h3 class="subsection-title">Dados Gerais</h3>
        <div class="form-group">
          <label class="form-label">Cliente</label>
          <ClientSearchInput
            :model-value="formData.clientId"
            @update:model-value="formData.clientId = $event"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="p3-nrFatura">Nº Fatura</label>
          <input id="p3-nrFatura" type="text" class="form-input" v-model="formData.phase3.nrFatura" />
        </div>
        <div class="form-group">
          <label class="form-label" for="p3-nrGuia">Nº Guia de Transportes</label>
          <input id="p3-nrGuia" type="text" class="form-input" v-model="formData.phase3.nrGuiaTransportes" />
        </div>

        <!-- Detalhes da Instalação -->
        <h3 class="subsection-title">Detalhes da Instalação</h3>
        <div class="form-group">
          <label class="form-label" for="p3-dataInstalacao">Data de Instalação</label>
          <input id="p3-dataInstalacao" type="date" class="form-input" v-model="formData.phase3.dataInstalacao" />
        </div>
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label" for="p3-horaInicialInstalacao">Hora Inicial</label>
            <input id="p3-horaInicialInstalacao" type="time" class="form-input" v-model="formData.phase3.horaInicialInstalacao" />
          </div>
          <div class="form-group form-group--half">
            <label class="form-label" for="p3-horaFinalInstalacao">Hora Final</label>
            <input id="p3-horaFinalInstalacao" type="time" class="form-input" v-model="formData.phase3.horaFinalInstalacao" />
          </div>
        </div>

        <!-- Formação -->
        <h3 class="subsection-title">Formação</h3>
        <div class="form-group">
          <label class="form-label" for="p3-dataFormacao">Data de Formação</label>
          <input id="p3-dataFormacao" type="date" class="form-input" v-model="formData.phase3.dataFormacao" />
        </div>
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label" for="p3-horaInicialFormacao">Hora Inicial</label>
            <input id="p3-horaInicialFormacao" type="time" class="form-input" v-model="formData.phase3.horaInicialFormacao" />
          </div>
          <div class="form-group form-group--half">
            <label class="form-label" for="p3-horaFinalFormacao">Hora Final</label>
            <input id="p3-horaFinalFormacao" type="time" class="form-input" v-model="formData.phase3.horaFinalFormacao" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="p3-quemRecebeuFormacao">Quem Recebeu Formação</label>
          <input id="p3-quemRecebeuFormacao" type="text" class="form-input" v-model="formData.phase3.quemRecebeuFormacao" />
        </div>
        <div class="form-group">
          <label class="form-label" for="p3-tecnicoFormacao">Técnico Responsável pela Formação</label>
          <input id="p3-tecnicoFormacao" type="text" class="form-input" v-model="formData.phase3.tecnicoFormacao" />
        </div>

        <!-- Material Instalado -->
        <h3 class="subsection-title">Material Instalado</h3>
        <div class="switch-row">
          <span class="switch-label">POS</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.pos" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.pos }" @click="formData.phase3.materialInstalado.pos = !formData.phase3.materialInstalado.pos"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">CPA</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.cpa" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.cpa }" @click="formData.phase3.materialInstalado.cpa = !formData.phase3.materialInstalado.cpa"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Balança</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.balanca" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.balanca }" @click="formData.phase3.materialInstalado.balanca = !formData.phase3.materialInstalado.balanca"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">CCTV</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.cctv" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.cctv }" @click="formData.phase3.materialInstalado.cctv = !formData.phase3.materialInstalado.cctv"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Alarme</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.alarme" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.alarme }" @click="formData.phase3.materialInstalado.alarme = !formData.phase3.materialInstalado.alarme"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Impressora</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.impressora" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.impressora }" @click="formData.phase3.materialInstalado.impressora = !formData.phase3.materialInstalado.impressora"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">UPS</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.ups" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.ups }" @click="formData.phase3.materialInstalado.ups = !formData.phase3.materialInstalado.ups"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Router</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.router" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.router }" @click="formData.phase3.materialInstalado.router = !formData.phase3.materialInstalado.router"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Switch</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.switchEquip" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.switchEquip }" @click="formData.phase3.materialInstalado.switchEquip = !formData.phase3.materialInstalado.switchEquip"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Rolos</span>
          <button type="button" role="switch" :aria-checked="formData.phase3.materialInstalado.rolos" class="switch" :class="{ 'switch--on': formData.phase3.materialInstalado.rolos }" @click="formData.phase3.materialInstalado.rolos = !formData.phase3.materialInstalado.rolos"><span class="switch-thumb" /></button>
        </div>
        <!-- Conditional: rolosQuantidade -->
        <div v-if="formData.phase3.materialInstalado.rolos" class="form-group conditional-indent">
          <label class="form-label" for="p3-rolosQuantidade">Quantidade de Rolos</label>
          <input id="p3-rolosQuantidade" type="number" min="0" class="form-input" v-model.number="formData.phase3.materialInstalado.rolosQuantidade" />
        </div>
      </div>

      <!-- ═══════════ Phase 4 — Testes ═══════════ -->
      <div v-if="currentPhase === 4" class="phase-section">
        <h2 class="section-title">Testes</h2>

        <!-- Anydesk -->
        <div class="switch-row">
          <span class="switch-label">Anydesk</span>
          <button type="button" role="switch" :aria-checked="formData.phase4.anydeskTestado" class="switch" :class="{ 'switch--on': formData.phase4.anydeskTestado }" @click="formData.phase4.anydeskTestado = !formData.phase4.anydeskTestado"><span class="switch-thumb" /></button>
        </div>
        <div v-if="formData.phase4.anydeskTestado === true" class="form-group conditional-indent">
          <label class="form-label" for="p4-anydeskCodigo">Código Anydesk</label>
          <input id="p4-anydeskCodigo" type="text" class="form-input" v-model="formData.phase4.anydeskCodigo" />
        </div>
        <div v-if="formData.phase4.anydeskTestado === false" class="form-group conditional-indent">
          <label class="form-label" for="p4-anydeskMotivo">Motivo da Falha</label>
          <input id="p4-anydeskMotivo" type="text" class="form-input" v-model="formData.phase4.anydeskMotivo" />
        </div>

        <!-- Vectron Connect -->
        <div class="switch-row">
          <span class="switch-label">Vectron Connect</span>
          <button type="button" role="switch" :aria-checked="formData.phase4.vectronConnectTestado" class="switch" :class="{ 'switch--on': formData.phase4.vectronConnectTestado }" @click="formData.phase4.vectronConnectTestado = !formData.phase4.vectronConnectTestado"><span class="switch-thumb" /></button>
        </div>
        <div v-if="formData.phase4.vectronConnectTestado === true" class="form-group conditional-indent">
          <label class="form-label" for="p4-vectronConnectCodigo">Código Vectron Connect</label>
          <input id="p4-vectronConnectCodigo" type="text" class="form-input" v-model="formData.phase4.vectronConnectCodigo" />
        </div>
        <div v-if="formData.phase4.vectronConnectTestado === false" class="form-group conditional-indent">
          <label class="form-label" for="p4-vectronConnectMotivo">Motivo da Falha</label>
          <input id="p4-vectronConnectMotivo" type="text" class="form-input" v-model="formData.phase4.vectronConnectMotivo" />
        </div>
      </div>

      <!-- ═══════════ Phase 5 — Finalização ═══════════ -->
      <div v-if="currentPhase === 5" class="phase-section">
        <h2 class="section-title">Finalização</h2>

        <div class="switch-row">
          <span class="switch-label">DUMP Lido</span>
          <button type="button" role="switch" :aria-checked="formData.phase5.dumpLido" class="switch" :class="{ 'switch--on': formData.phase5.dumpLido }" @click="formData.phase5.dumpLido = !formData.phase5.dumpLido"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Cópia de Segurança</span>
          <button type="button" role="switch" :aria-checked="formData.phase5.copiaSeguranca" class="switch" :class="{ 'switch--on': formData.phase5.copiaSeguranca }" @click="formData.phase5.copiaSeguranca = !formData.phase5.copiaSeguranca"><span class="switch-thumb" /></button>
        </div>
        <div class="switch-row">
          <span class="switch-label">Foto da Instalação</span>
          <button type="button" role="switch" :aria-checked="formData.phase5.fotoInstalacao" class="switch" :class="{ 'switch--on': formData.phase5.fotoInstalacao }" @click="formData.phase5.fotoInstalacao = !formData.phase5.fotoInstalacao"><span class="switch-thumb" /></button>
        </div>
        <!-- Conditional: fotoURL file upload -->
        <div v-if="formData.phase5.fotoInstalacao" class="conditional-indent">
          <FileUploadZone
            field-name="fotoURL"
            label="Foto da Instalação"
            :multiple="false"
            :accept-documents="false"
            :disabled="isSaving"
            @files-changed="handleFotoFilesChanged"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <router-link to="/installations-programming" class="btn btn-cancel">Cancelar</router-link>
        <button type="submit" class="btn btn-submit" :disabled="isSaving">
          {{ isSaving ? 'A guardar...' : 'Criar Instalação' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { calculateCompletedPhases } from '@clever/shared';
import type { InstallationsProgrammingData } from '@clever/shared';
import PhaseNavigation from '@/components/installations-programming/PhaseNavigation.vue';
import PhaseChecklist from '@/components/installations-programming/PhaseChecklist.vue';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import FileUploadZone from '@/components/common/FileUploadZone.vue';
import { useApi } from '@/composables/useApi';
import { useFileUpload } from '@/composables/useFileUpload';

const router = useRouter();
const api = useApi('installations-programming');

const currentPhase = ref(1);
const isSaving = ref(false);
const error = ref<string | null>(null);

// ── Form data with default empty values ─────────────────────────────
const formData = reactive({
  clientId: '',
  phase1: {
    tipoProgramacao: '',
    numeroSerie: '',
    numeroEquipamento: '',
    leiturasGuardadas: '',
    testeFinal: false,
  },
  phase2: {
    checklist: {} as Record<string, Record<string, boolean>>,
  },
  phase3: {
    nrFatura: '',
    nrGuiaTransportes: '',
    dataInstalacao: '',
    horaInicialInstalacao: '',
    horaFinalInstalacao: '',
    dataFormacao: '',
    horaInicialFormacao: '',
    horaFinalFormacao: '',
    quemRecebeuFormacao: '',
    tecnicoFormacao: '',
    materialInstalado: {
      pos: false,
      cpa: false,
      balanca: false,
      cctv: false,
      alarme: false,
      impressora: false,
      ups: false,
      router: false,
      switchEquip: false,
      rolos: false,
      rolosQuantidade: 0,
    },
  },
  phase4: {
    anydeskTestado: false,
    anydeskCodigo: '',
    anydeskMotivo: '',
    vectronConnectTestado: false,
    vectronConnectCodigo: '',
    vectronConnectMotivo: '',
  },
  phase5: {
    dumpLido: false,
    copiaSeguranca: false,
    fotoInstalacao: false,
    fotoURL: null as null,
  },
});

// ── File upload state ───────────────────────────────────────────────
const { uploadFiles } = useFileUpload();
const pendingFotoFiles = ref<File[]>([]);

const handleFotoFilesChanged = (payload: { fieldName: string; newFiles: File[]; removedKeys: string[] }): void => {
  pendingFotoFiles.value = payload.newFiles;
};

// ── Computed completed phases ───────────────────────────────────────
const completedPhases = computed(() => {
  const data: InstallationsProgrammingData = {
    technician: {} as any,
    clientId: formData.clientId,
    phase1: formData.phase1,
    phase2: formData.phase2,
    phase3: formData.phase3,
    phase4: formData.phase4,
    phase5: formData.phase5,
    completedPhases: [],
    isCompleted: false,
  };
  return calculateCompletedPhases(data);
});

// ── Submit handler ──────────────────────────────────────────────────
const handleSubmit = async () => {
  isSaving.value = true;
  error.value = null;

  const payload = {
    data: {
      clientId: formData.clientId,
      phase1: formData.phase1,
      phase2: formData.phase2,
      phase3: formData.phase3,
      phase4: formData.phase4,
      phase5: formData.phase5,
    },
  };

  await api.create(payload as any)
    .then(async (response) => {
      if (!response) {
        throw new Error('Erro ao criar registo de instalação');
      }

      // Upload photo file if selected
      if (pendingFotoFiles.value.length > 0) {
        console.log('Uploading photo for new installation:', JSON.stringify({ uuid: response.uuid }, null, 2));
        await uploadFiles('installations-programming', response.uuid, 'phase5.fotoURL', pendingFotoFiles.value)
          .then((refs) => {
            console.log('Photo upload result:', JSON.stringify(refs, null, 2));
          })
          .catch((uploadErr: unknown) => {
            console.error('Photo upload error (non-blocking):', JSON.stringify({ message: (uploadErr as Error).message }, null, 2));
          });
      }

      router.push(`/installations-programming/${response.uuid}`);
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

/* Phase content */
.phase-section {
  @apply space-y-4;
}

.section-title {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

.subsection-title {
  @apply text-base font-semibold text-gray-700 mt-6 mb-3;
}

/* Form groups */
.form-group {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply text-sm font-medium text-gray-700;
}

.form-input {
  @apply block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm
         focus:border-primary focus:ring-1 focus:ring-primary;
  min-height: 44px;
  font-size: 16px;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-row {
  @apply flex gap-3;
}

.form-group--half {
  @apply flex-1;
}

/* Switch rows */
.switch-row {
  @apply flex items-center justify-between py-2;
  min-height: 44px;
}

.switch-label {
  @apply text-sm text-gray-700 flex-1 pr-3;
  font-size: 16px;
}

.switch {
  @apply relative inline-flex flex-shrink-0 rounded-full cursor-pointer transition-colors duration-200 ease-in-out;
  width: 50px;
  height: 26px;
  background-color: #e5e7eb;
  -webkit-tap-highlight-color: transparent;
}

.switch--on {
  background-color: rgb(117, 174, 147);
}

.switch-thumb {
  @apply absolute rounded-full bg-white transition-transform duration-200 ease-in-out;
  top: 50%;
  left: 3px;
  width: 20px;
  height: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
  transform: translateY(-50%) translateX(0);
}

.switch--on .switch-thumb {
  transform: translateY(-50%) translateX(24px);
}

@media (max-width: 640px) {
  .switch {
    width: 48px;
    height: 28px;
  }

  .switch-thumb {
    width: 22px;
    height: 22px;
  }

  .switch--on .switch-thumb {
    transform: translateY(-50%) translateX(20px);
  }
}

.switch:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  ring-color: #75AE93;
}

/* Conditional groups */
.conditional-group {
  @apply pl-4 border-l-2 border-gray-200 mt-2;
}

.conditional-indent {
  @apply pl-4 border-l-2 border-gray-200;
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

/* Focus styles for primary color */
.focus\:border-primary:focus {
  border-color: #75AE93;
}

.focus\:ring-primary:focus {
  --tw-ring-color: #75AE93;
}
</style>
