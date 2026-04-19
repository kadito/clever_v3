<template>
  <div class="update-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <p>A carregar registo de instalação...</p>
    </div>

    <!-- Load error state -->
    <div v-if="loadError" class="error-banner" role="alert">
      <p class="error-text">{{ loadError }}</p>
      <router-link to="/installations-programming" class="btn btn-cancel">Voltar à lista</router-link>
    </div>

    <!-- Content (only when loaded) -->
    <template v-if="!isLoading && !loadError">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <h1 class="view-title">Editar Instalação e Programação</h1>
          <p class="view-subtitle">Atualizar registo de instalação existente</p>
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

        <!-- ═══════════ Phase 1 — Programação ═══════════ -->
        <div v-if="currentPhase === 1" class="phase-section">
          <h2 class="section-title">Programação</h2>

          <div class="form-group">
            <label class="form-label" for="p1-plus">PLUS</label>
            <input id="p1-plus" type="text" class="form-input" v-model="formData.phase1.plus" />
          </div>
          <div class="form-group">
            <label class="form-label" for="p1-departamento">Departamento</label>
            <input id="p1-departamento" type="text" class="form-input" v-model="formData.phase1.departamento" />
          </div>
          <div class="form-group">
            <label class="form-label" for="p1-cabecalho">Cabeçalho</label>
            <input id="p1-cabecalho" type="text" class="form-input" v-model="formData.phase1.cabecalho" />
          </div>
          <div class="form-group">
            <label class="form-label" for="p1-rede">Rede</label>
            <input id="p1-rede" type="text" class="form-input" v-model="formData.phase1.rede" />
          </div>
          <div class="form-group">
            <label class="form-label" for="p1-vectronConnect">Vectron Connect</label>
            <input id="p1-vectronConnect" type="text" class="form-input" v-model="formData.phase1.vectronConnect" />
          </div>
          <div class="form-group">
            <label class="form-label" for="p1-anydesk">Anydesk</label>
            <input id="p1-anydesk" type="text" class="form-input" v-model="formData.phase1.anydesk" />
          </div>
          <div class="form-group">
            <label class="form-label" for="p1-seriesEquipamentos">Séries / Nº Equipamentos</label>
            <input id="p1-seriesEquipamentos" type="text" class="form-input" v-model="formData.phase1.seriesEquipamentos" />
          </div>

          <!-- Switches de ligações -->
          <h3 class="subsection-title">Ligações</h3>

          <div class="switch-row">
            <span class="switch-label">Ligação a CPA</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoCPA" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoCPA }" @click="formData.phase1.ligacaoCPA = !formData.phase1.ligacaoCPA"><span class="switch-thumb" /></button>
          </div>
          <div class="switch-row">
            <span class="switch-label">Ligação a Gaveta</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoGaveta" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoGaveta }" @click="formData.phase1.ligacaoGaveta = !formData.phase1.ligacaoGaveta"><span class="switch-thumb" /></button>
          </div>
          <div class="switch-row">
            <span class="switch-label">Ligação a Impressora ou Monitor de Pedidos</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoImpressoraMonitor" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoImpressoraMonitor }" @click="formData.phase1.ligacaoImpressoraMonitor = !formData.phase1.ligacaoImpressoraMonitor"><span class="switch-thumb" /></button>
          </div>
          <div class="switch-row">
            <span class="switch-label">Ligação a Faturadora</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoFaturadora" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoFaturadora }" @click="formData.phase1.ligacaoFaturadora = !formData.phase1.ligacaoFaturadora"><span class="switch-thumb" /></button>
          </div>
          <div class="switch-row">
            <span class="switch-label">Ligação a Display Clientes</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoDisplayClientes" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoDisplayClientes }" @click="formData.phase1.ligacaoDisplayClientes = !formData.phase1.ligacaoDisplayClientes"><span class="switch-thumb" /></button>
          </div>
          <div class="switch-row">
            <span class="switch-label">Ligação a Scanner</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoScanner" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoScanner }" @click="formData.phase1.ligacaoScanner = !formData.phase1.ligacaoScanner"><span class="switch-thumb" /></button>
          </div>
          <div class="switch-row">
            <span class="switch-label">Ligação a Leitor de Cartões</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoLeitorCartoes" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoLeitorCartoes }" @click="formData.phase1.ligacaoLeitorCartoes = !formData.phase1.ligacaoLeitorCartoes"><span class="switch-thumb" /></button>
          </div>
          <div class="switch-row">
            <span class="switch-label">Ligação a Fechadura de Chaves de Operador</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.ligacaoFechaduraChaves" class="switch" :class="{ 'switch--on': formData.phase1.ligacaoFechaduraChaves }" @click="formData.phase1.ligacaoFechaduraChaves = !formData.phase1.ligacaoFechaduraChaves"><span class="switch-thumb" /></button>
          </div>

          <!-- Turnos -->
          <div class="form-group">
            <label class="form-label" for="p1-turnos">Configuração dos Turnos</label>
            <textarea id="p1-turnos" class="form-input form-textarea" v-model="formData.phase1.turnos" rows="3" />
          </div>

          <!-- Vectron switch -->
          <div class="switch-row">
            <span class="switch-label">Equipamento Vectron</span>
            <button type="button" role="switch" :aria-checked="formData.phase1.isVectron" class="switch" :class="{ 'switch--on': formData.phase1.isVectron }" @click="formData.phase1.isVectron = !formData.phase1.isVectron"><span class="switch-thumb" /></button>
          </div>

          <!-- Conditional: Vectron Leitura X -->
          <div v-if="formData.phase1.isVectron" class="conditional-group">
            <h3 class="subsection-title">Programação Leitura X</h3>
            <div class="form-group">
              <label class="form-label" for="p1-vlx-plus1">Plus 1</label>
              <input id="p1-vlx-plus1" type="text" class="form-input" v-model="formData.phase1.vectronLeituraX.plus1" />
            </div>
            <div class="form-group">
              <label class="form-label" for="p1-vlx-plus2">Plus 2</label>
              <input id="p1-vlx-plus2" type="text" class="form-input" v-model="formData.phase1.vectronLeituraX.plus2" />
            </div>
            <div class="form-group">
              <label class="form-label" for="p1-vlx-departamentos">Departamentos</label>
              <input id="p1-vlx-departamentos" type="text" class="form-input" v-model="formData.phase1.vectronLeituraX.departamentos" />
            </div>
            <div class="form-group">
              <label class="form-label" for="p1-vlx-operadores">Operadores</label>
              <input id="p1-vlx-operadores" type="text" class="form-input" v-model="formData.phase1.vectronLeituraX.operadores" />
            </div>
            <div class="form-group">
              <label class="form-label" for="p1-vlx-transacoes">Transações C/IVA</label>
              <input id="p1-vlx-transacoes" type="text" class="form-input" v-model="formData.phase1.vectronLeituraX.transacoesComIVA" />
            </div>
          </div>

          <!-- Conditional: Vectron Consulta Diária -->
          <div v-if="formData.phase1.isVectron" class="conditional-group">
            <h3 class="subsection-title">Tecla Só Consulta Diária</h3>
            <div class="form-group">
              <label class="form-label" for="p1-vcd-gerente">Leitura Gerente Normal</label>
              <input id="p1-vcd-gerente" type="text" class="form-input" v-model="formData.phase1.vectronConsultaDiaria.leituraGerenteNormal" />
            </div>
            <div class="form-group">
              <label class="form-label" for="p1-vcd-supervisor">Leitura Supervisor</label>
              <input id="p1-vcd-supervisor" type="text" class="form-input" v-model="formData.phase1.vectronConsultaDiaria.leituraSupervisor" />
            </div>
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

          <!-- Instalação dates/times -->
          <h3 class="subsection-title">Instalação</h3>
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

          <!-- Formação dates/times -->
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
              :existing-files="existingFotoFiles"
              :disabled="isSaving"
              @files-changed="handleFotoFilesChanged"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <router-link :to="`/installations-programming/${uuid}`" class="btn btn-cancel">Cancelar</router-link>
          <button type="submit" class="btn btn-submit" :disabled="isSaving">
            {{ isSaving ? 'A guardar...' : 'Guardar Alterações' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { calculateCompletedPhases } from '@clever/shared';
import type { InstallationsProgrammingData, FileReference } from '@clever/shared';
import PhaseNavigation from '@/components/installations-programming/PhaseNavigation.vue';
import PhaseChecklist from '@/components/installations-programming/PhaseChecklist.vue';
import ClientSearchInput from '@/components/common/ClientSearchInput.vue';
import FileUploadZone from '@/components/common/FileUploadZone.vue';
import { useApi } from '@/composables/useApi';
import { useFileUpload } from '@/composables/useFileUpload';

const route = useRoute();
const router = useRouter();
const api = useApi('installations-programming');

const uuid = computed(() => route.params.uuid as string);
const currentPhase = ref(1);
const isSaving = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);
const loadError = ref<string | null>(null);

// ── Form data with default empty values ─────────────────────────────
const formData = reactive({
  clientId: '',
  phase1: {
    plus: '',
    departamento: '',
    cabecalho: '',
    rede: '',
    vectronConnect: '',
    anydesk: '',
    seriesEquipamentos: '',
    ligacaoCPA: false,
    ligacaoGaveta: false,
    ligacaoImpressoraMonitor: false,
    ligacaoFaturadora: false,
    ligacaoDisplayClientes: false,
    ligacaoScanner: false,
    ligacaoLeitorCartoes: false,
    ligacaoFechaduraChaves: false,
    turnos: '',
    isVectron: false,
    vectronLeituraX: {
      plus1: '',
      plus2: '',
      departamentos: '',
      operadores: '',
      transacoesComIVA: '',
    },
    vectronConsultaDiaria: {
      leituraGerenteNormal: '',
      leituraSupervisor: '',
    },
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
    fotoURL: null as FileReference | null,
  },
});

// ── File upload state ───────────────────────────────────────────────
const { uploadFiles, deleteFile } = useFileUpload();
const existingFotoFiles = ref<FileReference[]>([]);
const pendingFotoFiles = ref<File[]>([]);
const pendingRemovedKeys = ref<string[]>([]);

const handleFotoFilesChanged = (payload: { fieldName: string; newFiles: File[]; removedKeys: string[] }): void => {
  pendingFotoFiles.value = payload.newFiles;
  pendingRemovedKeys.value = payload.removedKeys;
};

// ── Pre-fill form data from loaded record ───────────────────────────
const populateFormData = (data: InstallationsProgrammingData): void => {
  formData.clientId = data.clientId || '';

  // Phase 1
  const p1 = data.phase1 || {};
  formData.phase1.plus = p1.plus || '';
  formData.phase1.departamento = p1.departamento || '';
  formData.phase1.cabecalho = p1.cabecalho || '';
  formData.phase1.rede = p1.rede || '';
  formData.phase1.vectronConnect = p1.vectronConnect || '';
  formData.phase1.anydesk = p1.anydesk || '';
  formData.phase1.seriesEquipamentos = p1.seriesEquipamentos || '';
  formData.phase1.ligacaoCPA = p1.ligacaoCPA ?? false;
  formData.phase1.ligacaoGaveta = p1.ligacaoGaveta ?? false;
  formData.phase1.ligacaoImpressoraMonitor = p1.ligacaoImpressoraMonitor ?? false;
  formData.phase1.ligacaoFaturadora = p1.ligacaoFaturadora ?? false;
  formData.phase1.ligacaoDisplayClientes = p1.ligacaoDisplayClientes ?? false;
  formData.phase1.ligacaoScanner = p1.ligacaoScanner ?? false;
  formData.phase1.ligacaoLeitorCartoes = p1.ligacaoLeitorCartoes ?? false;
  formData.phase1.ligacaoFechaduraChaves = p1.ligacaoFechaduraChaves ?? false;
  formData.phase1.turnos = p1.turnos || '';
  formData.phase1.isVectron = p1.isVectron ?? false;

  const vlx = p1.vectronLeituraX || {};
  formData.phase1.vectronLeituraX.plus1 = vlx.plus1 || '';
  formData.phase1.vectronLeituraX.plus2 = vlx.plus2 || '';
  formData.phase1.vectronLeituraX.departamentos = vlx.departamentos || '';
  formData.phase1.vectronLeituraX.operadores = vlx.operadores || '';
  formData.phase1.vectronLeituraX.transacoesComIVA = vlx.transacoesComIVA || '';

  const vcd = p1.vectronConsultaDiaria || {};
  formData.phase1.vectronConsultaDiaria.leituraGerenteNormal = vcd.leituraGerenteNormal || '';
  formData.phase1.vectronConsultaDiaria.leituraSupervisor = vcd.leituraSupervisor || '';

  // Phase 2
  formData.phase2.checklist = data.phase2?.checklist || {};

  // Phase 3
  const p3 = data.phase3 || {};
  formData.phase3.nrFatura = p3.nrFatura || '';
  formData.phase3.nrGuiaTransportes = p3.nrGuiaTransportes || '';
  formData.phase3.dataInstalacao = p3.dataInstalacao || '';
  formData.phase3.horaInicialInstalacao = p3.horaInicialInstalacao || '';
  formData.phase3.horaFinalInstalacao = p3.horaFinalInstalacao || '';
  formData.phase3.dataFormacao = p3.dataFormacao || '';
  formData.phase3.horaInicialFormacao = p3.horaInicialFormacao || '';
  formData.phase3.horaFinalFormacao = p3.horaFinalFormacao || '';
  formData.phase3.quemRecebeuFormacao = p3.quemRecebeuFormacao || '';

  const mat = p3.materialInstalado || {};
  formData.phase3.materialInstalado.pos = mat.pos ?? false;
  formData.phase3.materialInstalado.cpa = mat.cpa ?? false;
  formData.phase3.materialInstalado.balanca = mat.balanca ?? false;
  formData.phase3.materialInstalado.cctv = mat.cctv ?? false;
  formData.phase3.materialInstalado.alarme = mat.alarme ?? false;
  formData.phase3.materialInstalado.impressora = mat.impressora ?? false;
  formData.phase3.materialInstalado.ups = mat.ups ?? false;
  formData.phase3.materialInstalado.router = mat.router ?? false;
  formData.phase3.materialInstalado.switchEquip = mat.switchEquip ?? false;
  formData.phase3.materialInstalado.rolos = mat.rolos ?? false;
  formData.phase3.materialInstalado.rolosQuantidade = mat.rolosQuantidade ?? 0;

  // Phase 4
  const p4 = data.phase4 || {};
  formData.phase4.anydeskTestado = p4.anydeskTestado ?? false;
  formData.phase4.anydeskCodigo = p4.anydeskCodigo || '';
  formData.phase4.anydeskMotivo = p4.anydeskMotivo || '';
  formData.phase4.vectronConnectTestado = p4.vectronConnectTestado ?? false;
  formData.phase4.vectronConnectCodigo = p4.vectronConnectCodigo || '';
  formData.phase4.vectronConnectMotivo = p4.vectronConnectMotivo || '';

  // Phase 5
  const p5 = data.phase5 || {};
  formData.phase5.dumpLido = p5.dumpLido ?? false;
  formData.phase5.copiaSeguranca = p5.copiaSeguranca ?? false;
  formData.phase5.fotoInstalacao = p5.fotoInstalacao ?? false;
  // Only accept valid FileReference objects, ignore old string values
  formData.phase5.fotoURL = (p5.fotoURL && typeof p5.fotoURL === 'object' && p5.fotoURL.key) ? p5.fotoURL : null;

  // Populate existing files for FileUploadZone — only if valid FileReference
  if (p5.fotoURL && typeof p5.fotoURL === 'object' && p5.fotoURL.key && p5.fotoURL.name) {
    existingFotoFiles.value = [p5.fotoURL];
  } else {
    existingFotoFiles.value = [];
  }
};

// ── Load existing record on mount ───────────────────────────────────
onMounted(() => {
  if (!uuid.value) {
    loadError.value = 'UUID do registo não encontrado na rota';
    isLoading.value = false;
    return;
  }

  api.fetchById(uuid.value)
    .then(() => {
      if (api.currentItem.value) {
        populateFormData(api.currentItem.value.data as InstallationsProgrammingData);
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
});

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

// ── Submit handler — partial merge via PUT ──────────────────────────
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

  await api.update(uuid.value, payload as any)
    .then(async (response) => {
      if (!response) {
        throw new Error('Erro ao atualizar registo de instalação');
      }

      // Delete removed files
      for (const fileKey of pendingRemovedKeys.value) {
        if (!fileKey) continue;
        // Extract the fileId.ext from the full R2 key
        const parts = fileKey.split('/');
        const shortKey = parts[parts.length - 1];
        console.log('Deleting file:', JSON.stringify({ fileKey, shortKey }, null, 2));
        await deleteFile('installations-programming', uuid.value, shortKey)
          .catch((delErr: unknown) => {
            console.error('File delete error (non-blocking):', JSON.stringify({ message: (delErr as Error).message }, null, 2));
          });
      }

      // Upload new files
      if (pendingFotoFiles.value.length > 0) {
        console.log('Uploading new photo for installation:', JSON.stringify({ uuid: uuid.value }, null, 2));
        await uploadFiles('installations-programming', uuid.value, 'phase5.fotoURL', pendingFotoFiles.value)
          .then((refs) => {
            console.log('Photo upload result:', JSON.stringify(refs, null, 2));
          })
          .catch((uploadErr: unknown) => {
            console.error('Photo upload error (non-blocking):', JSON.stringify({ message: (uploadErr as Error).message }, null, 2));
          });
      }

      router.push(`/installations-programming/${uuid.value}`);
    })
    .catch((err: unknown) => {
      console.error('Error updating installation:', JSON.stringify(err, null, 2));
      error.value = err instanceof Error ? err.message : 'Erro ao atualizar registo de instalação';
    })
    .finally(() => {
      isSaving.value = false;
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
