<template>
  <div class="conta-corrente-form-container">
    <div class="form-header">
      <BackButton :to="cancelRoute" variant="inline" />
      <h1>{{ isEditing ? 'Editar' : 'Novo' }} Registo de Conta Corrente</h1>
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
    <form @submit.prevent="handleSubmit" class="conta-corrente-form" v-if="!loading">
      <!-- Client Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO DO CLIENTE</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="nomeCliente">NOME DO CLIENTE</label>
            <input
              type="text"
              id="nomeCliente"
              v-model="form.nomeCliente"
              class="form-control"
              placeholder="Digite o nome do cliente"
              required
            />
          </div>
        </div>
      </section>

      <!-- Invoice Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO DA FATURA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="tipoFatura">TIPO DE FATURA</label>
            <select id="tipoFatura" v-model="form.tipoFatura" class="form-control" required>
              <option value="">--</option>
              <option value="REMOTA">REMOTA</option>
              <option value="PRESENCIAL">PRESENCIAL</option>
              <option value="OUTROS">OUTROS</option>
            </select>
          </div>

          <div class="form-group">
            <label for="numeroFatura">NÚMERO DA FATURA</label>
            <input
              type="text"
              id="numeroFatura"
              v-model="form.numeroFatura"
              class="form-control"
              placeholder="Número da fatura"
            />
          </div>

          <div class="form-group">
            <label for="valorFatura">VALOR DA FATURA (€)</label>
            <input
              type="number"
              id="valorFatura"
              v-model="form.valorFatura"
              class="form-control"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label for="formaPagamento">FORMA DE PAGAMENTO</label>
            <select id="formaPagamento" v-model="form.formaPagamento" class="form-control">
              <option value="">--</option>
              <option value="TRANSFERÊNCIA">TRANSFERÊNCIA</option>
              <option value="MULTIBANCO">MULTIBANCO</option>
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="CARTÃO">CARTÃO</option>
              <option value="OUTROS">OUTROS</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Dates Section -->
      <section class="form-section">
        <h2>DATAS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="dataFaturaGerada">DATA DA FATURA GERADA</label>
            <input
              type="datetime-local"
              id="dataFaturaGerada"
              v-model="form.dataFaturaGerada"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="dataVencimentoFatura">DATA DE VENCIMENTO</label>
            <input
              type="datetime-local"
              id="dataVencimentoFatura"
              v-model="form.dataVencimentoFatura"
              class="form-control"
            />
          </div>
        </div>
      </section>

      <!-- Work Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO DO TRABALHO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="horasGastas">HORAS GASTAS</label>
            <input
              type="text"
              id="horasGastas"
              v-model="form.horasGastas"
              class="form-control"
              placeholder="Ex: 02:30"
              pattern="^([0-9]{1,2}):([0-5][0-9])$"
            />
            <small class="field-help">Formato: HH:MM (ex: 02:30)</small>
          </div>

          <div class="form-group">
            <label for="pago">ESTADO DO PAGAMENTO</label>
            <select id="pago" v-model="form.pago" class="form-control">
              <option value="">--</option>
              <option value="TRUE">PAGO</option>
              <option value="FALSE">NÃO PAGO</option>
            </select>
          </div>

          <div class="form-group">
            <label for="numeroRemota">NÚMERO REMOTA</label>
            <input
              type="text"
              id="numeroRemota"
              v-model="form.numeroRemota"
              class="form-control"
              placeholder="Número da assistência remota"
              :disabled="form.tipoFatura !== 'REMOTA'"
            />
            <small v-if="form.tipoFatura !== 'REMOTA'" class="field-help">
              Disponível apenas para faturas do tipo "Remota"
            </small>
          </div>

          <div class="form-group">
            <label for="numeroPresencial">NÚMERO PRESENCIAL</label>
            <input
              type="text"
              id="numeroPresencial"
              v-model="form.numeroPresencial"
              class="form-control"
              placeholder="Número da assistência presencial"
              :disabled="form.tipoFatura !== 'PRESENCIAL'"
            />
            <small v-if="form.tipoFatura !== 'PRESENCIAL'" class="field-help">
              Disponível apenas para faturas do tipo "Presencial"
            </small>
          </div>

          <div class="form-group full-width">
            <label for="motivoObs">MOTIVO/OBSERVAÇÕES</label>
            <textarea
              id="motivoObs"
              v-model="form.motivoObs"
              class="form-control"
              rows="3"
              placeholder="Descreva o motivo do serviço, observações ou detalhes relevantes..."
            ></textarea>
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
          {{ isEditing ? 'Atualizar' : 'Criar' }} Registo
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
import { useContaCorrenteStore } from '@/stores/conta-corrente.js';

// Router
const router = useRouter();
const route = useRoute();

// Store
const store = useContaCorrenteStore();
const { loading, error } = storeToRefs(store);
const {
  createContaCorrente,
  updateContaCorrente,
  fetchContaCorrenteById,
  clearError,
  getYearFromDate,
} = store;

// Form state
const isEditing = ref(false);
const contaCorrenteYear = ref(null);
const contaCorrenteId = ref(null);

// Form data
const form = ref({
  nomeCliente: '',
  tipoFatura: '',
  numeroFatura: '',
  valorFatura: '',
  dataFaturaGerada: '',
  dataVencimentoFatura: '',
  formaPagamento: '',
  motivoObs: '',
  horasGastas: '',
  numeroRemota: '',
  pago: '',
  numeroPresencial: '',
});

// Computed
const isFormValid = computed(() => {
  return form.value.nomeCliente.trim() && form.value.tipoFatura.trim();
});

const cancelRoute = computed(() => {
  const from = route.query.from;
  if (from === 'detail' && contaCorrenteYear.value && contaCorrenteId.value) {
    return `/conta-corrente/${contaCorrenteYear.value}/${contaCorrenteId.value}`;
  } else if (from === 'list') {
    return '/conta-corrente/list';
  } else {
    return '/conta-corrente';
  }
});

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    let year = contaCorrenteYear.value;

    // If creating new, determine year from dates or use current year
    if (!isEditing.value) {
      if (form.value.dataFaturaGerada) {
        year = getYearFromDate(form.value.dataFaturaGerada);
      } else if (form.value.dataVencimentoFatura) {
        year = getYearFromDate(form.value.dataVencimentoFatura);
      } else {
        year = new Date().getFullYear().toString();
      }
    }

    if (isEditing.value) {
      await updateContaCorrente(contaCorrenteYear.value, contaCorrenteId.value, form.value);
      router.push(`/conta-corrente/${contaCorrenteYear.value}/${contaCorrenteId.value}`);
    } else {
      const newContaCorrente = await createContaCorrente(year, form.value);
      router.push(`/conta-corrente/${year}/${newContaCorrente.id}`);
    }
  } catch (err) {
    console.error('Error saving conta corrente:', err);
  }
};

const handleCancel = () => {
  router.push(cancelRoute.value);
};

const loadContaCorrenteForEditing = async () => {
  if (contaCorrenteYear.value && contaCorrenteId.value) {
    try {
      const contaCorrente = await fetchContaCorrenteById(
        contaCorrenteYear.value,
        contaCorrenteId.value
      );
      if (contaCorrente) {
        form.value = { ...contaCorrente };
      }
    } catch (err) {
      console.error('Error loading conta corrente:', err);
    }
  }
};

// Watch for changes in tipo fatura to reset related fields
watch(
  () => form.value.tipoFatura,
  newType => {
    if (newType !== 'REMOTA') {
      form.value.numeroRemota = '';
    }
    if (newType !== 'PRESENCIAL') {
      form.value.numeroPresencial = '';
    }
  }
);

// Lifecycle
onMounted(async () => {
  // Check if we're editing
  if (route.params.year && route.params.id) {
    isEditing.value = true;
    contaCorrenteYear.value = route.params.year;
    contaCorrenteId.value = route.params.id;
    await loadContaCorrenteForEditing();
  }
});
</script>

<style scoped>
.conta-corrente-form-container {
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

.conta-corrente-form {
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

.form-control:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.field-help {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
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
  .conta-corrente-form-container {
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
  .conta-corrente-form-container {
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
