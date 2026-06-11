<template>
  <div class="instalacoes-form-container">
    <div class="form-header">
      <BackButton
        :to="cancelRoute"
        variant="inline"
      />
      <h1>{{ isEditing ? 'Editar' : 'Nova' }} Instalação e Programação</h1>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A processar...</p>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="error-alert"
    >
      <p>{{ error }}</p>
      <button
        class="close-btn"
        @click="clearError"
      >
        ×
      </button>
    </div>

    <!-- Form -->
    <form
      v-if="!loading"
      class="instalacoes-form"
      @submit.prevent="handleSubmit"
    >
      <!-- Basic Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÕES BÁSICAS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="nomeCliente">NOME DO CLIENTE</label>
            <input
              id="nomeCliente"
              v-model="formData.nomeCliente"
              type="text"
              class="form-control"
              placeholder="Nome do cliente"
              required
            >
          </div>

          <div class="form-group">
            <label for="numeroEncomenda">NÚMERO DA ENCOMENDA</label>
            <input
              id="numeroEncomenda"
              v-model="formData.numeroEncomenda"
              type="text"
              class="form-control"
              placeholder="Número da encomenda"
            >
          </div>

          <div class="form-group">
            <label for="dataRecepcao">DATA DE RECEPÇÃO</label>
            <input
              id="dataRecepcao"
              v-model="formData.dataRecepcao"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="tecnicoInstalacao">TÉCNICO DA INSTALAÇÃO</label>
            <select
              id="tecnicoInstalacao"
              v-model="formData.tecnicoInstalacao"
              class="form-control"
            >
              <option value="">
                --
              </option>
              <option value="JOSÉ BATISTA">
                JOSÉ BATISTA
              </option>
              <option value="MARIA SILVA">
                MARIA SILVA
              </option>
              <option value="PEDRO SANTOS">
                PEDRO SANTOS
              </option>
              <option value="ALYSSON SOUZA">
                ALYSSON SOUZA
              </option>
              <option value="ANA COSTA">
                ANA COSTA
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Installation Details Section -->
      <section class="form-section">
        <h2>DETALHES DA INSTALAÇÃO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="dataInstalacao">DATA DA INSTALAÇÃO</label>
            <input
              id="dataInstalacao"
              v-model="formData.dataInstalacao"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="dataFinalInstalacao">DATA FINAL DA INSTALAÇÃO</label>
            <input
              id="dataFinalInstalacao"
              v-model="formData.dataFinalInstalacao"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label>TRANSFORMADOR</label>
            <div class="toggle-switch">
              <input
                id="transformador"
                v-model="formData.transformador"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="transformador"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>CABO DE ALIMENTAÇÃO</label>
            <div class="toggle-switch">
              <input
                id="caboAlimentacao"
                v-model="formData.caboAlimentacao"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="caboAlimentacao"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>INSTALAÇÃO DE CÂMERAS</label>
            <div class="toggle-switch">
              <input
                id="instalacaoCameras"
                v-model="formData.instalacaoCameras"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="instalacaoCameras"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="quantidadeCamerasInstaladas">QUANTIDADE DE CÂMERAS INSTALADAS</label>
            <input
              id="quantidadeCamerasInstaladas"
              v-model.number="formData.quantidadeCamerasInstaladas"
              type="number"
              class="form-control"
              min="0"
            >
          </div>

          <div class="form-group full-width">
            <label for="equipamentosUtilizados">EQUIPAMENTOS UTILIZADOS E MODELOS</label>
            <textarea
              id="equipamentosUtilizados"
              v-model="formData.equipamentosUtilizados"
              class="form-control"
              rows="4"
              placeholder="Descreva os equipamentos utilizados e seus modelos"
            />
          </div>
        </div>
      </section>

      <!-- Programming Section -->
      <section class="form-section">
        <h2>PROGRAMAÇÃO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>PROGRAMADO</label>
            <div class="toggle-switch">
              <input
                id="programado"
                v-model="formData.programado"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="programado"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div
            v-if="formData.programado"
            class="form-group"
          >
            <label for="dataProgramacao">DATA DA PROGRAMAÇÃO</label>
            <input
              id="dataProgramacao"
              v-model="formData.dataProgramacao"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div
            v-if="formData.programado"
            class="form-group"
          >
            <label for="finalProgramacao">FINAL DA PROGRAMAÇÃO</label>
            <input
              id="finalProgramacao"
              v-model="formData.finalProgramacao"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div
            v-if="formData.programado"
            class="form-group"
          >
            <label for="programadoPor">PROGRAMADO POR</label>
            <select
              id="programadoPor"
              v-model="formData.programadoPor"
              class="form-control"
            >
              <option value="">
                --
              </option>
              <option value="JOSÉ BATISTA">
                JOSÉ BATISTA
              </option>
              <option value="MARIA SILVA">
                MARIA SILVA
              </option>
              <option value="PEDRO SANTOS">
                PEDRO SANTOS
              </option>
              <option value="ALYSSON SOUZA">
                ALYSSON SOUZA
              </option>
              <option value="ANA COSTA">
                ANA COSTA
              </option>
            </select>
          </div>

          <div
            v-if="formData.programado"
            class="form-group"
          >
            <label for="programadoEmpresa">PROGRAMADO EMPRESA</label>
            <input
              id="programadoEmpresa"
              v-model="formData.programadoEmpresa"
              type="text"
              class="form-control"
              placeholder="Nome da empresa"
            >
          </div>

          <div
            v-if="formData.programado"
            class="form-group"
          >
            <label for="qualSistema">QUAL SISTEMA</label>
            <select
              id="qualSistema"
              v-model="formData.qualSistema"
              class="form-control"
            >
              <option value="">
                --
              </option>
              <option value="PIX REST">
                PIX REST
              </option>
              <option value="VECTRON POS">
                VECTRON POS
              </option>
              <option value="DREAM SOFT">
                DREAM SOFT
              </option>
              <option value="ZSREST">
                ZSREST
              </option>
              <option value="OUTROS">
                OUTROS
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Equipment Section -->
      <section
        v-if="formData.programado"
        class="form-section"
      >
        <h2>EQUIPAMENTO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="equipamento">EQUIPAMENTO</label>
            <input
              id="equipamento"
              v-model="formData.equipamento"
              type="text"
              class="form-control"
              placeholder="Tipo de equipamento"
            >
          </div>

          <div class="form-group">
            <label for="modeloEquipamento">MODELO EQUIPAMENTO</label>
            <input
              id="modeloEquipamento"
              v-model="formData.modeloEquipamento"
              type="text"
              class="form-control"
              placeholder="Modelo do equipamento"
            >
          </div>

          <div class="form-group">
            <label for="numeroSerieEquipamento">NÚMERO DE SÉRIE DO EQUIPAMENTO</label>
            <input
              id="numeroSerieEquipamento"
              v-model="formData.numeroSerieEquipamento"
              type="text"
              class="form-control"
              placeholder="Número de série"
            >
          </div>

          <div class="form-group">
            <label for="numeroSerie">NÚMERO DE SÉRIE</label>
            <input
              id="numeroSerie"
              v-model="formData.numeroSerie"
              type="text"
              class="form-control"
              placeholder="Número de série adicional"
            >
          </div>

          <div class="form-group">
            <label for="modelo">MODELO</label>
            <input
              id="modelo"
              v-model="formData.modelo"
              type="text"
              class="form-control"
              placeholder="Modelo adicional"
            >
          </div>

          <div class="form-group">
            <label for="versaoSistema">VERSÃO DO SISTEMA</label>
            <input
              id="versaoSistema"
              v-model="formData.versaoSistema"
              type="text"
              class="form-control"
              placeholder="Ex: V21 M1"
            >
          </div>
        </div>
      </section>

      <!-- Tests and Configuration Section -->
      <section
        v-if="formData.programado"
        class="form-section"
      >
        <h2>TESTES E CONFIGURAÇÃO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>TESTOU EQUIPAMENTO</label>
            <div class="toggle-switch">
              <input
                id="testouEquipamento"
                v-model="formData.testouEquipamento"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="testouEquipamento"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>ASSISTÊNCIA REMOTA</label>
            <div class="toggle-switch">
              <input
                id="assistenciaRemota"
                v-model="formData.assistenciaRemota"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="assistenciaRemota"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>PREPARAÇÃO DOS PERIFÉRICOS</label>
            <div class="toggle-switch">
              <input
                id="preparacaoPerificos"
                v-model="formData.preparacaoPerificos"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="preparacaoPerificos"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>INSTALAÇÃO DE POS E CPA</label>
            <div class="toggle-switch">
              <input
                id="instalacaoPosECpa"
                v-model="formData.instalacaoPosECpa"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="instalacaoPosECpa"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>MOVIMENTOS A ZERO</label>
            <div class="toggle-switch">
              <input
                id="movimentosZero"
                v-model="formData.movimentosZero"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="movimentosZero"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="anydesk">ANYDESK</label>
            <input
              id="anydesk"
              v-model="formData.anydesk"
              type="text"
              class="form-control"
              placeholder="ID do AnyDesk"
            >
          </div>

          <div class="form-group full-width">
            <label for="testes">TESTES</label>
            <textarea
              id="testes"
              v-model="formData.testes"
              class="form-control"
              rows="3"
              placeholder="Descreva os testes realizados"
            />
          </div>
        </div>
      </section>

      <!-- Training Section -->
      <section
        v-if="formData.programado"
        class="form-section"
      >
        <h2>FORMAÇÃO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>FORMAÇÃO</label>
            <div class="toggle-switch">
              <input
                id="formacao"
                v-model="formData.formacao"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="formacao"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div
            v-if="formData.formacao"
            class="form-group"
          >
            <label for="quemRecebeuFormacao">QUEM RECEBEU FORMAÇÃO</label>
            <input
              id="quemRecebeuFormacao"
              v-model="formData.quemRecebeuFormacao"
              type="text"
              class="form-control"
              placeholder="Nome da pessoa que recebeu formação"
            >
          </div>

          <div
            v-if="formData.formacao"
            class="form-group"
          >
            <label>TESTE PÓS FORMAÇÃO</label>
            <div class="toggle-switch">
              <input
                id="testePosFomacao"
                v-model="formData.testePosFomacao"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="testePosFomacao"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Signature Section -->
      <section class="form-section">
        <h2>ASSINATURA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>ASSINA</label>
            <div class="toggle-switch">
              <input
                id="assina"
                v-model="formData.assina"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="assina"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div
            v-if="formData.assina"
            class="form-group"
          >
            <label for="quemAssinou">QUEM ASSINOU</label>
            <input
              id="quemAssinou"
              v-model="formData.quemAssinou"
              type="text"
              class="form-control"
              placeholder="Nome de quem assinou"
            >
          </div>

          <div class="form-group">
            <label for="assinatura">ASSINATURA (URL)</label>
            <input
              id="assinatura"
              v-model="formData.assinatura"
              type="url"
              class="form-control"
              placeholder="URL da assinatura digital"
            >
          </div>

          <div class="form-group">
            <label for="anexarImagem">ANEXAR IMAGEM (URL)</label>
            <input
              id="anexarImagem"
              v-model="formData.anexarImagem"
              type="url"
              class="form-control"
              placeholder="URL da imagem anexada"
            >
          </div>
        </div>
      </section>

      <!-- Action buttons -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-cancel"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading || !isFormValid"
        >
          <span
            v-if="loading"
            class="btn-spinner"
          />
          {{ isEditing ? 'Atualizar' : 'Criar' }} Instalação
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import { useInstalacoesStore } from '@/stores/instalacoes-programacoes.js';

// Router
const router = useRouter();
const route = useRoute();

// Store
const store = useInstalacoesStore();
const { loading, error } = storeToRefs(store);
const { createInstalacao, updateInstalacao, fetchInstalacaoById, clearError, getYearFromDate } =
  store;

// Form state
const isEditing = ref(false);
const instalacaoYear = ref(null);
const instalacaoId = ref(null);

// Form data
const formData = ref({
  nomeCliente: '',
  numeroEncomenda: '',
  dataRecepcao: '',
  transformador: false,
  caboAlimentacao: false,
  dataInstalacao: '',
  dataFinalInstalacao: '',
  instalacaoCameras: false,
  equipamentosUtilizados: '',
  quantidadeCamerasInstaladas: 0,
  programado: false,
  numeroSerie: '',
  dataProgramacao: '',
  finalProgramacao: '',
  testouEquipamento: false,
  assistenciaRemota: false,
  assinatura: '',
  equipamento: '',
  versaoSistema: '',
  qualSistema: '',
  programadoPor: '',
  programadoEmpresa: '',
  testes: '',
  tipoEquipamento: '',
  preparacaoPerificos: false,
  anydesk: '',
  formacao: false,
  quemRecebeuFormacao: '',
  testePosFomacao: false,
  movimentosZero: false,
  numeroSerieEquipamento: '',
  modeloEquipamento: '',
  modelo: '',
  instalacaoPosECpa: false,
  gravacaoDump: false,
  chaves: false,
  manual: false,
  dumps: false,
  gravacaoFlash: false,
  tecnicoInstalacao: '',
  assina: false,
  quemAssinou: '',
  anexarImagem: '',
});

// Computed
const isFormValid = computed(() => {
  return formData.value.nomeCliente.trim();
});

const cancelRoute = computed(() => {
  const from = route.query.from;
  if (from === 'detail' && instalacaoYear.value && instalacaoId.value) {
    return `/instalacoes-programacoes/${instalacaoYear.value}/${instalacaoId.value}`;
  } else if (from === 'list') {
    return '/instalacoes-programacoes/list';
  } else {
    return '/instalacoes-programacoes';
  }
});

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    let year = instalacaoYear.value;

    // If creating new, determine year from installation date or use current year
    if (!isEditing.value) {
      if (formData.value.dataInstalacao) {
        year = getYearFromDate(formData.value.dataInstalacao);
      } else if (formData.value.dataRecepcao) {
        year = getYearFromDate(formData.value.dataRecepcao);
      } else {
        year = new Date().getFullYear().toString();
      }
    }

    if (isEditing.value) {
      await updateInstalacao(instalacaoYear.value, instalacaoId.value, formData.value);
      router.push(`/instalacoes-programacoes/${instalacaoYear.value}/${instalacaoId.value}`);
    } else {
      const newInstalacao = await createInstalacao(year, formData.value);
      router.push(`/instalacoes-programacoes/${year}/${newInstalacao.id}`);
    }
  } catch (err) {
    console.error('Error saving instalacao:', err);
  }
};

const handleCancel = () => {
  router.push(cancelRoute.value);
};

const loadInstalacaoForEditing = async () => {
  if (instalacaoYear.value && instalacaoId.value) {
    try {
      const instalacao = await fetchInstalacaoById(instalacaoYear.value, instalacaoId.value);
      if (instalacao) {
        formData.value = { ...instalacao };
      }
    } catch (err) {
      console.error('Error loading instalacao:', err);
    }
  }
};

// Lifecycle
onMounted(async () => {
  // Check if we're editing
  if (route.params.year && route.params.id) {
    isEditing.value = true;
    instalacaoYear.value = route.params.year;
    instalacaoId.value = route.params.id;
    await loadInstalacaoForEditing();
  }
});
</script>

<style scoped>
.instalacoes-form-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.loading-state {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-alert p {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #721c24;
}

.instalacoes-form {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Form section styling */
.form-section {
  background: white;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h2 {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  align-items: start;
}

/* Form group styling with better alignment */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 60px;
  justify-content: flex-start;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

/* For toggle switches, ensure proper vertical alignment */
.form-group .toggle-switch {
  margin-top: 0.25rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Toggle switch styling */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.toggle-input {
  display: none;
}

.toggle-label {
  position: relative;
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-input:checked + .toggle-label {
  background: var(--primary-color);
}

.toggle-input:checked + .toggle-label .toggle-slider {
  transform: translateX(26px);
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #5a6268;
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .instalacoes-form-container {
    padding: 0.5rem;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .form-header h1 {
    font-size: 1.3rem;
  }

  .form-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .form-section h2 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .form-group {
    min-height: auto;
  }

  .form-group label {
    font-size: 0.85rem;
  }

  .form-control {
    padding: 0.65rem;
    font-size: 0.9rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .instalacoes-form-container {
    padding: 0.25rem;
  }

  .form-section {
    padding: 0.75rem;
  }

  .form-section h2 {
    font-size: 0.9rem;
  }

  .form-group label {
    font-size: 0.8rem;
  }

  .form-control {
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  .form-header h1 {
    font-size: 1.2rem;
  }
}
</style>
