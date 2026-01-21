<template>
  <div class="agendamentos-form-container">
    <div class="form-header">
      <BackButton :to="cancelRoute" variant="inline" />
      <h1>{{ isEditing ? 'Editar' : 'Novo' }} Agendamento</h1>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>A processar...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-btn">×</button>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="agendamentos-form" v-if="!loading">
      <!-- Basic Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÕES BÁSICAS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="nomeCliente">NOME DO CLIENTE</label>
            <input
              type="text"
              id="nomeCliente"
              v-model="formData.nomeCliente"
              class="form-control"
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div class="form-group">
            <label for="dataPedido">DATA DO PEDIDO</label>
            <input
              type="datetime-local"
              id="dataPedido"
              v-model="formData.dataPedido"
              class="form-control"
              required
            />
          </div>

          <div class="form-group full-width">
            <label for="motivo">MOTIVO</label>
            <textarea
              id="motivo"
              v-model="formData.motivo"
              class="form-control"
              rows="3"
              placeholder="Descreva o motivo do agendamento"
              required
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Scheduling Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÕES DO AGENDAMENTO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="dataPrevistaAssistencia">DATA PREVISTA PARA ASSISTÊNCIA</label>
            <input
              type="datetime-local"
              id="dataPrevistaAssistencia"
              v-model="formData.dataPrevistaAssistencia"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="responsavelAgendamento">RESPONSÁVEL PELO AGENDAMENTO</label>
            <select
              id="responsavelAgendamento"
              v-model="formData.responsavelAgendamento"
              class="form-control"
            >
              <option value="">--</option>
              <option value="JOSÉ BATISTA">JOSÉ BATISTA</option>
              <option value="MARIA SILVA">MARIA SILVA</option>
              <option value="PEDRO SANTOS">PEDRO SANTOS</option>
              <option value="ALYSSON SOUZA">ALYSSON SOUZA</option>
              <option value="ANA COSTA">ANA COSTA</option>
            </select>
          </div>

          <div class="form-group">
            <label for="tecnico">TÉCNICO</label>
            <select id="tecnico" v-model="formData.tecnico" class="form-control">
              <option value="">--</option>
              <option value="JOSÉ BATISTA">JOSÉ BATISTA</option>
              <option value="MARIA SILVA">MARIA SILVA</option>
              <option value="PEDRO SANTOS">PEDRO SANTOS</option>
              <option value="ALYSSON SOUZA">ALYSSON SOUZA</option>
              <option value="ANA COSTA">ANA COSTA</option>
            </select>
          </div>

          <div class="form-group">
            <label for="assunto">ASSUNTO</label>
            <select id="assunto" v-model="formData.assunto" class="form-control">
              <option value="">--</option>
              <option value="Instalação">Instalação</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Reparação">Reparação</option>
              <option value="Cobrança">Cobrança</option>
              <option value="Formação">Formação</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Task Status Section -->
      <section class="form-section">
        <h2>ESTADO DA TAREFA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>INSTALAÇÃO</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="instalacao"
                v-model="formData.instalacao"
                class="toggle-input"
              />
              <label for="instalacao" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>HOUVE ADIAMENTO</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="houveAdiamento"
                v-model="formData.houveAdiamento"
                class="toggle-input"
              />
              <label for="houveAdiamento" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>TAREFA CONCLUÍDA</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="tarefaConcluida"
                v-model="formData.tarefaConcluida"
                class="toggle-input"
              />
              <label for="tarefaConcluida" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Postponement Information Section (shown only if there was postponement) -->
      <section class="form-section" v-if="formData.houveAdiamento">
        <h2>INFORMAÇÕES DO ADIAMENTO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="motivoAdiamento">MOTIVO DO ADIAMENTO</label>
            <textarea
              id="motivoAdiamento"
              v-model="formData.motivoAdiamento"
              class="form-control"
              rows="2"
              placeholder="Descreva o motivo do adiamento"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="novaData">NOVA DATA</label>
            <input
              type="datetime-local"
              id="novaData"
              v-model="formData.novaData"
              class="form-control"
            />
          </div>
        </div>
      </section>

      <!-- References Section -->
      <section class="form-section">
        <h2>REFERÊNCIAS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="folhaObra">FOLHA DE OBRA</label>
            <input
              type="text"
              id="folhaObra"
              v-model="formData.folhaObra"
              class="form-control"
              placeholder="Número da folha de obra"
            />
          </div>

          <div class="form-group">
            <label for="assistenciaRemota">ASSISTÊNCIA REMOTA</label>
            <input
              type="text"
              id="assistenciaRemota"
              v-model="formData.assistenciaRemota"
              class="form-control"
              placeholder="Número da assistência remota"
            />
          </div>

          <div class="form-group">
            <label for="contrato">CONTRATO</label>
            <input
              type="text"
              id="contrato"
              v-model="formData.contrato"
              class="form-control"
              placeholder="Número do contrato"
            />
          </div>
        </div>
      </section>

      <!-- Action buttons -->
      <div class="form-actions">
        <button type="button" @click="handleCancel" class="btn btn-cancel" :disabled="loading">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading || !isFormValid">
          <span v-if="loading" class="btn-spinner"></span>
          {{ isEditing ? 'Atualizar' : 'Criar' }} Agendamento
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import { useAgendamentosStore } from '@/stores/agendamentos.js';

// Router
const router = useRouter();
const route = useRoute();

// Store
const store = useAgendamentosStore();
const { loading, error } = storeToRefs(store);
const { createAgendamento, updateAgendamento, fetchAgendamentoById, clearError, getYearFromDate } =
  store;

// Form state
const isEditing = ref(false);
const agendamentoYear = ref(null);
const agendamentoId = ref(null);

// Form data
const formData = ref({
  nomeCliente: '',
  dataPedido: new Date().toISOString().slice(0, 16),
  motivo: '',
  dataPrevistaAssistencia: '',
  responsavelAgendamento: '',
  tecnico: '',
  assunto: '',
  instalacao: false,
  houveAdiamento: false,
  tarefaConcluida: false,
  folhaObra: '',
  assistenciaRemota: '',
  contrato: '',
  motivoAdiamento: '',
  novaData: '',
});

// Computed
const isFormValid = computed(() => {
  return (
    formData.value.nomeCliente.trim() && formData.value.dataPedido && formData.value.motivo.trim()
  );
});

const cancelRoute = computed(() => {
  const from = route.query.from;
  if (from === 'detail' && agendamentoYear.value && agendamentoId.value) {
    return `/agendamentos/${agendamentoYear.value}/${agendamentoId.value}`;
  } else if (from === 'list') {
    return '/agendamentos/list';
  } else {
    return '/agendamentos';
  }
});

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    const year = getYearFromDate(formData.value.dataPedido);

    if (isEditing.value) {
      await updateAgendamento(agendamentoYear.value, agendamentoId.value, formData.value);
      router.push(`/agendamentos/${agendamentoYear.value}/${agendamentoId.value}`);
    } else {
      const newAgendamento = await createAgendamento(year, formData.value);
      router.push(`/agendamentos/${year}/${newAgendamento.id}`);
    }
  } catch (err) {
    console.error('Error saving agendamento:', err);
  }
};

const handleCancel = () => {
  router.push(cancelRoute.value);
};

const loadAgendamentoForEditing = async () => {
  if (agendamentoYear.value && agendamentoId.value) {
    try {
      const agendamento = await fetchAgendamentoById(agendamentoYear.value, agendamentoId.value);
      if (agendamento) {
        formData.value = { ...agendamento };
      }
    } catch (err) {
      console.error('Error loading agendamento:', err);
    }
  }
};

// Watch for postponement changes to clear related fields
watch(
  () => formData.value.houveAdiamento,
  hasPostponement => {
    if (!hasPostponement) {
      formData.value.motivoAdiamento = '';
      formData.value.novaData = '';
    }
  }
);

// Lifecycle
onMounted(async () => {
  // Check if we're editing
  if (route.params.year && route.params.id) {
    isEditing.value = true;
    agendamentoYear.value = route.params.year;
    agendamentoId.value = route.params.id;
    await loadAgendamentoForEditing();
  }
});
</script>

<style scoped>
.agendamentos-form-container {
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

.agendamentos-form {
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
  .agendamentos-form-container {
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
  .agendamentos-form-container {
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
