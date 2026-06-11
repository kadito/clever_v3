<template>
  <div class="form-container">
    <div class="form-header">
      <BackButton
        :to="cancelRoute"
        variant="inline"
      />
      <h1>{{ isEditing ? 'Editar' : 'Novo' }} Equipamento</h1>
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
      class="form"
      @submit.prevent="handleSubmit"
    >
      <!-- Equipment Information -->
      <section class="form-section">
        <h2>📦 INFORMAÇÕES DO EQUIPAMENTO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="tipoEquipamento">TIPO DE EQUIPAMENTO *</label>
            <select
              id="tipoEquipamento"
              v-model="form.tipoEquipamento"
              class="form-control"
              required
            >
              <option value="">
                Seleccionar tipo
              </option>
              <option value="POS">
                POS
              </option>
              <option value="Terminal de Pagamento">
                Terminal de Pagamento
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="marca">MARCA</label>
            <input
              id="marca"
              v-model="form.marca"
              type="text"
              class="form-control"
              placeholder="Ex: SAM4S, INGENICO, EPSON..."
            >
          </div>

          <div class="form-group">
            <label for="modelo">MODELO</label>
            <input
              id="modelo"
              v-model="form.modelo"
              type="text"
              class="form-control"
              placeholder="Ex: SPL-4700, iCT220..."
            >
          </div>

          <div class="form-group">
            <label for="numeroSerie">NÚMERO DE SÉRIE</label>
            <input
              id="numeroSerie"
              v-model="form.numeroSerie"
              type="text"
              class="form-control"
              placeholder="Número de série do equipamento"
            >
          </div>
        </div>
      </section>

      <!-- Loan Information -->
      <section class="form-section">
        <h2>📤 INFORMAÇÕES DO EMPRÉSTIMO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="clienteEmprestimo">CLIENTE</label>
            <select
              id="clienteEmprestimo"
              v-model="form.clienteEmprestimo"
              class="form-control"
              :disabled="clientesStore.loading"
            >
              <option
                value=""
                disabled
              >
                {{ clientesStore.loading ? 'A carregar clientes...' : 'Seleccionar cliente' }}
              </option>
              <option
                v-for="cliente in clientes"
                :key="cliente.id"
                :value="cliente.nomeComercial"
              >
                {{ cliente.nomeComercial }}
              </option>
            </select>
            <div
              v-if="clientesStore.error"
              class="error-message"
            >
              Erro ao carregar clientes: {{ clientesStore.error }}
            </div>
          </div>

          <div class="form-group">
            <label for="dataEmprestimo">DATA DE EMPRÉSTIMO</label>
            <input
              id="dataEmprestimo"
              v-model="form.dataEmprestimo"
              type="date"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="dataRetorno">DATA DE TÉRMINO DO EMPRÉSTIMO</label>
            <input
              id="dataRetorno"
              v-model="form.dataRetorno"
              type="date"
              class="form-control"
            >
          </div>
        </div>
      </section>

      <!-- Condition Assessment -->
      <section class="form-section">
        <h2>🔍 AVALIAÇÃO DO ESTADO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="visor">VISOR</label>
            <select
              id="visor"
              v-model="form.visor"
              class="form-control"
            >
              <option value="">
                Seleccionar estado
              </option>
              <option value="EQUIPAMENTO EM ÓTIMAS CONDIÇÕES">
                Ótimas condições
              </option>
              <option value="EQUIPAMENTO EM BOAS CONDIÇÕES">
                Boas condições
              </option>
              <option value="EQUIPAMENTO NECESSITA MANUTENÇÃO">
                Necessita manutenção
              </option>
              <option value="EQUIPAMENTO AVARIADO">
                Avariado
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="corpoEquipamento">CORPO DO EQUIPAMENTO</label>
            <select
              id="corpoEquipamento"
              v-model="form.corpoEquipamento"
              class="form-control"
            >
              <option value="">
                Seleccionar estado
              </option>
              <option value="EQUIPAMENTO EM ÓTIMAS CONDIÇÕES">
                Ótimas condições
              </option>
              <option value="EQUIPAMENTO EM BOAS CONDIÇÕES">
                Boas condições
              </option>
              <option value="EQUIPAMENTO NECESSITA MANUTENÇÃO">
                Necessita manutenção
              </option>
              <option value="EQUIPAMENTO AVARIADO">
                Avariado
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="transformadorCabos">TRANSFORMADOR E CABOS</label>
            <select
              id="transformadorCabos"
              v-model="form.transformadorCabos"
              class="form-control"
            >
              <option value="">
                Seleccionar estado
              </option>
              <option value="EQUIPAMENTO EM ÓTIMAS CONDIÇÕES">
                Ótimas condições
              </option>
              <option value="EQUIPAMENTO EM BOAS CONDIÇÕES">
                Boas condições
              </option>
              <option value="EQUIPAMENTO NECESSITA MANUTENÇÃO">
                Necessita manutenção
              </option>
              <option value="EQUIPAMENTO AVARIADO">
                Avariado
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="estadoGeral">ESTADO GERAL</label>
            <select
              id="estadoGeral"
              v-model="form.estadoGeral"
              class="form-control"
            >
              <option value="">
                Seleccionar estado
              </option>
              <option value="EQUIPAMENTO EM ÓTIMAS CONDIÇÕES">
                Ótimas condições
              </option>
              <option value="EQUIPAMENTO EM BOAS CONDIÇÕES">
                Boas condições
              </option>
              <option value="EQUIPAMENTO NECESSITA MANUTENÇÃO">
                Necessita manutenção
              </option>
              <option value="EQUIPAMENTO AVARIADO">
                Avariado
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Technical Notes -->
      <section class="form-section">
        <h2>📝 NOTAS TÉCNICAS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="notas">NOTAS</label>
            <textarea
              id="notas"
              v-model="form.notas"
              class="form-control"
              rows="4"
              placeholder="Especificações técnicas, problemas identificados, software instalado..."
            />
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
          {{ isEditing ? 'Atualizar' : 'Criar' }} Equipamento
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
import { useEquipamentoUsadoStore } from '@/stores/equipamento-usado';
import { useClientesStore } from '@/stores/clientes';

// Router
const router = useRouter();
const route = useRoute();

// Stores
const equipamentoUsadoStore = useEquipamentoUsadoStore();
const { loading, error } = storeToRefs(equipamentoUsadoStore);
const { createEquipamento, updateEquipamento, fetchEquipamentoById, clearError, getYearFromDate } =
  equipamentoUsadoStore;

// Clientes Store
const clientesStore = useClientesStore();
const { clientes } = storeToRefs(clientesStore);
const { fetchClientes } = clientesStore;

// Form state
const isEditing = ref(false);
const equipamentoYear = ref(null);
const equipamentoId = ref(null);

// Form data with defaults
const form = ref({
  tipoEquipamento: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  clienteEmprestimo: '',
  dataEmprestimo: '',
  dataRetorno: '',
  visor: '',
  corpoEquipamento: '',
  transformadorCabos: '',
  estadoGeral: '',
  notas: '',
});

// Validation
const isFormValid = computed(() => {
  return form.value.tipoEquipamento && form.value.tipoEquipamento.trim() !== '';
});

// Cancel route logic
const cancelRoute = computed(() => {
  const from = route.query.from;
  if (from === 'detail' && equipamentoYear.value && equipamentoId.value) {
    return `/equipamento-usado/${equipamentoYear.value}/${equipamentoId.value}`;
  } else if (from === 'list') {
    return '/equipamento-usado/list';
  } else {
    return '/equipamento-usado';
  }
});

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    let year = equipamentoYear.value;

    // If creating new, determine year from loan date or use current year
    if (!isEditing.value) {
      if (form.value.dataEmprestimo) {
        year = getYearFromDate(form.value.dataEmprestimo);
      } else {
        year = new Date().getFullYear().toString();
      }
    }

    if (isEditing.value) {
      await updateEquipamento(equipamentoYear.value, equipamentoId.value, form.value);
      router.push(`/equipamento-usado/${equipamentoYear.value}/${equipamentoId.value}`);
    } else {
      const newEquipamento = await createEquipamento(year, form.value);
      router.push(`/equipamento-usado/${year}/${newEquipamento.id}`);
    }
  } catch (err) {
    console.error('Form submission error:', err);
  }
};

const handleCancel = () => {
  router.push(cancelRoute.value);
};

// Watchers
watch(
  () => form.value.dataEmprestimo,
  newDate => {
    // Clear return date if loan date is cleared
    if (!newDate && form.value.dataRetorno) {
      form.value.dataRetorno = '';
    }
  }
);

watch(
  () => form.value.clienteEmprestimo,
  newClient => {
    // Clear loan-related fields if client is cleared
    if (!newClient) {
      form.value.dataEmprestimo = '';
      form.value.dataRetorno = '';
    }
  }
);

// Lifecycle
onMounted(async () => {
  // Fetch clients for dropdown
  await fetchClientes();

  const year = route.params.year;
  const id = route.params.id;

  if (year && id) {
    // Editing mode
    isEditing.value = true;
    equipamentoYear.value = year;
    equipamentoId.value = parseInt(id);

    try {
      const equipamento = await fetchEquipamentoById(year, parseInt(id));

      // Populate form with existing data
      Object.keys(form.value).forEach(key => {
        if (equipamento[key] !== undefined) {
          // Convert dates to YYYY-MM-DD format for date inputs
          if ((key.includes('data') || key.includes('Data')) && equipamento[key]) {
            form.value[key] = new Date(equipamento[key]).toISOString().split('T')[0];
          } else {
            form.value[key] = equipamento[key] || '';
          }
        }
      });
    } catch (err) {
      console.error('Error loading equipamento:', err);
    }
  }
});
</script>

<style scoped>
.form-container {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-header h1 {
  margin: 0;
  color: var(--primary-dark);
  font-size: 1.8rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #721c24;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h2 {
  margin: 0 0 1.5rem 0;
  color: var(--primary-dark);
  font-size: 1.2rem;
  border-bottom: 2px solid var(--primary-light);
  padding-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.1);
}

.form-control::placeholder {
  color: #6c757d;
  opacity: 0.7;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 2rem 0;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s ease;
  min-width: 140px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #5a6268;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .form-container {
    padding: 0.5rem;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    min-width: auto;
  }
}

/* Responsive improvements for smaller screens */
@media (max-width: 480px) {
  .form-section {
    padding: 1rem;
  }

  .form-section h2 {
    font-size: 1.1rem;
  }

  .form-control {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
</style>
