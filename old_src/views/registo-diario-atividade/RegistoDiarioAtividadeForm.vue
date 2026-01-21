<template>
  <div class="registo-form-container">
    <div class="form-header">
      <BackButton :to="cancelRoute" variant="inline" />
      <h1>{{ isEditing ? 'Editar' : 'Novo' }} Registo Diário de Atividade</h1>
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
    <form @submit.prevent="handleSubmit" class="registo-form" v-if="!loading">
      <!-- General Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÕES GERAIS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="dataRegistro">DATA DO REGISTO</label>
            <input
              type="datetime-local"
              id="dataRegistro"
              v-model="formData.dataRegistro"
              class="form-control"
              required
            />
          </div>
        </div>
      </section>

      <!-- Primary Activity Section -->
      <section class="form-section">
        <h2>ATIVIDADE PRINCIPAL</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="cliente">CLIENTE</label>
            <ClienteSearchSelect
              id="cliente"
              v-model="formData.cliente"
              input-id="cliente-search"
              placeholder="Pesquisar cliente..."
              :disabled="clientesStore.loading"
              :required="true"
              store-name
            />
          </div>

          <div class="form-group">
            <label for="internoOuExterno">TIPO DE ATIVIDADE</label>
            <select id="internoOuExterno" v-model="formData.internoOuExterno" class="form-control">
              <option value="">--</option>
              <option value="INTERNO">INTERNO</option>
              <option value="EXTERNO">EXTERNO</option>
            </select>
          </div>

          <div class="form-group">
            <label for="assunto">ASSUNTO</label>
            <input
              type="text"
              id="assunto"
              v-model="formData.assunto"
              class="form-control"
              placeholder="Assunto da atividade"
            />
          </div>

          <div class="form-group">
            <label for="horaInicio">HORA INÍCIO</label>
            <input
              type="text"
              id="horaInicio"
              v-model="formData.horaInicio"
              class="form-control time-input"
              :class="{ 'is-invalid': validationErrors.horaInicio }"
              placeholder="HH:MM (ex: 09:30)"
              maxlength="5"
              @input="formatTimeInput($event, 'horaInicio')"
              @blur="validateTimeInput('horaInicio')"
            />
            <div v-if="validationErrors.horaInicio" class="invalid-feedback">
              {{ validationErrors.horaInicio }}
            </div>
          </div>

          <div class="form-group">
            <label for="horaFim">HORA FIM</label>
            <input
              type="text"
              id="horaFim"
              v-model="formData.horaFim"
              class="form-control time-input"
              :class="{ 'is-invalid': validationErrors.horaFim }"
              placeholder="HH:MM (ex: 17:45)"
              maxlength="5"
              @input="formatTimeInput($event, 'horaFim')"
              @blur="validateTimeInput('horaFim')"
            />
            <div v-if="validationErrors.horaFim" class="invalid-feedback">
              {{ validationErrors.horaFim }}
            </div>
          </div>

          <div class="form-group">
            <label for="tempoPausa">TEMPO PAUSA (MINUTOS)</label>
            <input
              type="number"
              id="tempoPausa"
              v-model.number="formData.tempoPausa"
              class="form-control"
              placeholder="0"
              min="0"
              step="1"
            />
          </div>

          <div class="form-group">
            <label for="totalHorasCalculado">TOTAL HORAS</label>
            <input
              type="text"
              id="totalHorasCalculado"
              v-model="formData.totalHorasCalculado"
              class="form-control"
              placeholder="00:00:00"
              readonly
            />
          </div>

          <div class="form-group">
            <label for="respRegisto">RESPONSÁVEL PELO REGISTO</label>
            <select
              id="respRegisto"
              v-model="formData.respRegisto"
              class="form-control"
              :disabled="equipaStore.loading"
            >
              <option value="">
                {{ equipaStore.loading ? 'A carregar colaboradores...' : '--' }}
              </option>
              <option
                v-for="collaborator in collaborators"
                :key="collaborator.id"
                :value="collaborator.name"
              >
                {{ collaborator.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Descrição field - full width below all other inputs -->
        <div class="form-group form-group-full">
          <label for="descricao">DESCRIÇÃO</label>
          <textarea
            id="descricao"
            v-model="formData.descricao"
            class="form-control"
            rows="3"
            placeholder="Descrição detalhada da atividade"
          ></textarea>
        </div>
      </section>

      <!-- Secondary Activity Section -->
      <section class="form-section" v-if="showSecondaryActivity">
        <h2>ATIVIDADE SECUNDÁRIA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="cliente2">CLIENTE 2</label>
            <input
              type="text"
              id="cliente2"
              v-model="formData.cliente2"
              class="form-control"
              placeholder="Nome do segundo cliente"
            />
          </div>

          <div class="form-group">
            <label for="interOuExter2">TIPO DE ATIVIDADE</label>
            <select id="interOuExter2" v-model="formData.interOuExter2" class="form-control">
              <option value="">--</option>
              <option value="INTERNO">INTERNO</option>
              <option value="EXTERNO">EXTERNO</option>
            </select>
          </div>

          <div class="form-group">
            <label for="assunto2">ASSUNTO</label>
            <input
              type="text"
              id="assunto2"
              v-model="formData.assunto2"
              class="form-control"
              placeholder="Assunto da atividade"
            />
          </div>

          <div class="form-group">
            <label for="totalHoras2">TOTAL DE HORAS</label>
            <input
              type="text"
              id="totalHoras2"
              v-model="formData.totalHoras2"
              class="form-control"
              placeholder="00:00:00"
            />
          </div>

          <div class="form-group">
            <label for="respRegisto2">RESPONSÁVEL PELO REGISTO</label>
            <select
              id="respRegisto2"
              v-model="formData.respRegisto2"
              class="form-control"
              :disabled="equipaStore.loading"
            >
              <option value="">
                {{ equipaStore.loading ? 'A carregar colaboradores...' : '--' }}
              </option>
              <option
                v-for="collaborator in collaborators"
                :key="collaborator.id"
                :value="collaborator.name"
              >
                {{ collaborator.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="descricao2">DESCRIÇÃO</label>
            <textarea
              id="descricao2"
              v-model="formData.descricao2"
              class="form-control"
              rows="3"
              placeholder="Descrição detalhada da atividade"
            ></textarea>
          </div>

          <div class="form-group">
            <label>TEVE CLIENTE 2</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="teveCliente2"
                v-model="formData.teveCliente2"
                class="toggle-input"
              />
              <label for="teveCliente2" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>FOLHA DE OBRA</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="folhaObra2"
                v-model="formData.folhaObra2"
                class="toggle-input"
              />
              <label for="folhaObra2" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>ASSISTÊNCIA REMOTA</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="assistRemota2"
                v-model="formData.assistRemota2"
                class="toggle-input"
              />
              <label for="assistRemota2" class="toggle-label">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Distances Section - Only shown for EXTERNO activities -->
      <section class="form-section" v-if="formData.internoOuExterno === 'EXTERNO'">
        <h2>DISTÂNCIAS E DESLOCAÇÕES</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="kmsSaidaSede">KMS SAÍDA SEDE</label>
            <input
              type="number"
              id="kmsSaidaSede"
              v-model.number="formData.kmsSaidaSede"
              class="form-control"
              min="0"
              step="0.1"
              placeholder="0.0"
            />
          </div>

          <div class="form-group">
            <label for="kmsChegadaSede">KMS CHEGADA SEDE</label>
            <input
              type="number"
              id="kmsChegadaSede"
              v-model.number="formData.kmsChegadaSede"
              class="form-control"
              min="0"
              step="0.1"
              placeholder="0.0"
            />
          </div>

          <div class="form-group">
            <label for="horaSaida">HORA SAÍDA</label>
            <input
              type="text"
              id="horaSaida"
              v-model="formData.horaSaida"
              class="form-control time-input"
              placeholder="HH:MM"
              maxlength="5"
              @input="formatTimeInput($event, 'horaSaida')"
            />
          </div>

          <div class="form-group">
            <label for="horaChegada">HORA CHEGADA</label>
            <input
              type="text"
              id="horaChegada"
              v-model="formData.horaChegada"
              class="form-control time-input"
              placeholder="HH:MM"
              maxlength="5"
              @input="formatTimeInput($event, 'horaChegada')"
            />
          </div>

          <div class="form-group">
            <label for="kmsAbastecimento">KMS ABASTECIMENTO</label>
            <input
              type="number"
              id="kmsAbastecimento"
              v-model.number="formData.kmsAbastecimento"
              class="form-control"
              min="0"
              step="0.1"
              placeholder="0.0"
            />
          </div>
        </div>
      </section>

      <!-- Additional Activities Section -->
      <section class="form-section">
        <h2>ATIVIDADES ADICIONAIS</h2>

        <div class="add-activity-buttons">
          <button
            type="button"
            @click="addAtividadeAdicional('FOLHA DE OBRA')"
            class="btn btn-add-activity btn-folha-obra"
          >
            Folha de Obra
          </button>
          <div class="button-divider">+</div>
          <button
            type="button"
            @click="addAtividadeAdicional('ASSISTENCIA REMOTA')"
            class="btn btn-add-activity btn-assistencia-remota"
          >
            Assistencia remota
          </button>
        </div>

        <div v-if="formData.atividadesAdicionais.length === 0" class="no-activities-message">
          <p>Nenhuma atividade adicional adicionada</p>
        </div>

        <div
          v-for="(atividade, index) in formData.atividadesAdicionais"
          :key="atividade.id"
          class="activity-card"
        >
          <div class="activity-header">
            <h3>{{ atividade.tipo }} {{ index + 1 }}</h3>
            <button
              type="button"
              @click="removeAtividadeAdicional(index)"
              class="btn btn-remove-activity"
              title="Remover atividade"
            >
              ❌
            </button>
          </div>

          <div class="form-grid">
            <!-- Reference Field - First input -->
            <div class="form-group">
              <label :for="`referencia-${atividade.id}`">
                {{
                  atividade.tipo === 'FOLHA DE OBRA'
                    ? 'REFERÊNCIA FOLHA DE OBRA'
                    : 'REFERÊNCIA ASSISTÊNCIA REMOTA'
                }}
              </label>
              <input
                :id="`referencia-${atividade.id}`"
                type="text"
                v-model="atividade.referencia"
                class="form-control"
                :placeholder="
                  atividade.tipo === 'FOLHA DE OBRA' ? 'Ex: FO-2024-001' : 'Ex: AR-2024-001'
                "
                required
              />
            </div>

            <!-- Cliente -->
            <div class="form-group">
              <label :for="`cliente-${atividade.id}`">CLIENTE</label>
              <select
                :id="`cliente-${atividade.id}`"
                v-model="atividade.cliente"
                class="form-control"
                required
              >
                <option value="">--</option>
                <option
                  v-for="cliente in clientes"
                  :key="cliente.id"
                  :value="cliente.nomeComercial"
                >
                  {{ cliente.nomeComercial }}
                </option>
              </select>
            </div>

            <!-- Tipo de Atividade -->
            <div class="form-group">
              <label :for="`tipoAtividade-${atividade.id}`">TIPO DE ATIVIDADE</label>
              <select
                :id="`tipoAtividade-${atividade.id}`"
                v-model="atividade.tipoAtividade"
                class="form-control"
              >
                <option value="">--</option>
                <option value="INTERNO">INTERNO</option>
                <option value="EXTERNO">EXTERNO</option>
              </select>
            </div>

            <!-- Assunto -->
            <div class="form-group">
              <label :for="`assunto-${atividade.id}`">ASSUNTO</label>
              <input
                :id="`assunto-${atividade.id}`"
                type="text"
                v-model="atividade.assunto"
                class="form-control"
                placeholder="Assunto da atividade"
              />
            </div>

            <!-- Hora Início -->
            <div class="form-group">
              <label :for="`horaInicio-${atividade.id}`">HORA INÍCIO</label>
              <input
                :id="`horaInicio-${atividade.id}`"
                type="text"
                v-model="atividade.horaInicio"
                class="form-control time-input"
                placeholder="HH:MM"
                maxlength="5"
                @input="formatTimeInputForActivity($event, atividade, 'horaInicio')"
              />
            </div>

            <!-- Hora Fim -->
            <div class="form-group">
              <label :for="`horaFim-${atividade.id}`">HORA FIM</label>
              <input
                :id="`horaFim-${atividade.id}`"
                type="text"
                v-model="atividade.horaFim"
                class="form-control time-input"
                placeholder="HH:MM"
                maxlength="5"
                @input="formatTimeInputForActivity($event, atividade, 'horaFim')"
              />
            </div>

            <!-- Tempo Pausa -->
            <div class="form-group">
              <label :for="`tempoPausa-${atividade.id}`">TEMPO PAUSA (MINUTOS)</label>
              <input
                :id="`tempoPausa-${atividade.id}`"
                type="number"
                v-model.number="atividade.tempoPausa"
                class="form-control"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <!-- Total Horas -->
            <div class="form-group">
              <label :for="`totalHoras-${atividade.id}`">TOTAL HORAS</label>
              <input
                :id="`totalHoras-${atividade.id}`"
                type="text"
                v-model="atividade.totalHoras"
                class="form-control"
                placeholder="00:00:00"
                readonly
              />
            </div>

            <!-- Responsável pelo Registo -->
            <div class="form-group">
              <label :for="`responsavel-${atividade.id}`">RESPONSÁVEL PELO REGISTO</label>
              <select
                :id="`responsavel-${atividade.id}`"
                v-model="atividade.responsavel"
                class="form-control"
                :disabled="equipaStore.loading"
              >
                <option value="">
                  {{ equipaStore.loading ? 'A carregar colaboradores...' : '--' }}
                </option>
                <option
                  v-for="collaborator in collaborators"
                  :key="collaborator.id"
                  :value="collaborator.name"
                >
                  {{ collaborator.name }}
                </option>
              </select>
            </div>

            <!-- Descrição -->
            <div class="form-group form-group-full">
              <label :for="`descricao-${atividade.id}`">DESCRIÇÃO</label>
              <textarea
                :id="`descricao-${atividade.id}`"
                v-model="atividade.descricao"
                class="form-control"
                rows="3"
                placeholder="Descrição detalhada da atividade"
              ></textarea>
            </div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import ClienteSearchSelect from '@/components/ClienteSearchSelect.vue';
import { useRegistoDiarioAtividadeStore } from '@/stores/registo-diario-atividade.js';
import { useClientesStore } from '@/stores/clientes.js';
import { useEquipaStore } from '@/stores/equipa.js';

// Router
const router = useRouter();
const route = useRoute();

// Stores
const store = useRegistoDiarioAtividadeStore();
const clientesStore = useClientesStore();
const equipaStore = useEquipaStore();

const { loading, error } = storeToRefs(store);
const { clientes } = storeToRefs(clientesStore);
const { collaborators } = storeToRefs(equipaStore);

const { createRegistro, updateRegistro, fetchRegistroById, clearError, getYearFromDate } = store;

const { fetchClientes } = clientesStore;
const { fetchCollaborators } = equipaStore;

// Form state
const isEditing = ref(false);
const registroYear = ref(null);
const registroId = ref(null);
const showSecondaryActivity = ref(false);
const validationErrors = reactive({});

// Constants
const VALID_MINUTES = [0, 15, 30, 45];

// Round minutes to nearest valid value (00, 15, 30, 45) - always round UP
const roundMinutes = minutes => {
  // Always round UP to the next valid minute
  if (minutes === 0) return 0;

  if (minutes <= 15) return 15;
  if (minutes <= 30) return 30;
  if (minutes <= 45) return 45;

  // If minutes > 45, round to 00 of next hour (which means we need to handle hour increment)
  // But for simplicity, we'll just return 45 as the max valid minute
  // The hour increment will be handled separately if needed
  return 45;
};

// Validate time input format and values
const validateTimeInput = field => {
  const value = formData.value[field];

  if (!value) {
    // Clear error if field is empty (optional field)
    if (validationErrors[field]) {
      delete validationErrors[field];
    }
    return;
  }

  // Check format HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-4]):([0-5][0-9])$/;
  if (!timeRegex.test(value)) {
    validationErrors[field] = 'Formato inválido. Use HH:MM (ex: 09:30)';
    return;
  }

  const [hours, minutes] = value.split(':').map(Number);

  // Validate hours (0-24)
  if (hours < 0 || hours > 24) {
    validationErrors[field] = 'Horas devem estar entre 0 e 24';
    return;
  }

  // Validate minutes (0-59) - allow any minute value
  if (minutes < 0 || minutes > 59) {
    validationErrors[field] = 'Minutos devem estar entre 0 e 59';
    return;
  }

  // Clear error if validation passes
  if (validationErrors[field]) {
    delete validationErrors[field];
  }

  // Recalculate total hours
  calculateTotalHours();
};

// Form data
const formData = ref({
  dataRegistro: new Date().toISOString().slice(0, 16),
  cliente: '',
  horaInicio: '',
  horaFim: '',
  tempoPausa: 0,
  totalHorasCalculado: '',
  atividadesAdicionais: [],
  cliente2: '',
  cliente3: '',
  cliente4: '',
  cliente5: '',
  cliente6: '',
  assunto: '',
  assunto2: '',
  assunto3: '',
  assunto4: '',
  assunto5: '',
  assunto6: '',
  internoOuExterno: '',
  interOuExter2: '',
  interOuExter3: '',
  interOuExter4: '',
  interOuExter5: '',
  interOuExter6: '',
  descricao: '',
  descricao2: '',
  descricao3: '',
  descricao4: '',
  descricao5: '',
  descricao6: '',
  totalHoras: '',
  totalHoras2: '',
  totalHoras3: '',
  totalHoras4: '',
  totalHoras5: '',
  totalHoras6: '',
  respRegisto: '',
  respRegisto2: '',
  respRegisto3: '',
  respRegisto4: '',
  respRegisto5: '',
  respRegisto6: '',
  teveCliente2: false,
  teveCliente3: false,
  teveCliente4: false,
  teveCliente5: false,
  teveCliente6: false,
  kmsAbastecimento: 0,
  kmsSaidaSede: 0,
  kmsChegadaSede: 0,
  horaSaida: '',
  horaChegada: '',
});

// Computed
const isFormValid = computed(() => {
  return formData.value.dataRegistro && formData.value.cliente.trim();
});

const cancelRoute = computed(() => {
  const from = route.query.from;
  if (from === 'detail' && registroYear.value && registroId.value) {
    return `/registo-diario-atividade/${registroYear.value}/${registroId.value}`;
  } else if (from === 'list') {
    return '/registo-diario-atividade/list';
  } else {
    return '/registo-diario-atividade';
  }
});

// Methods
const toggleSecondaryActivity = () => {
  showSecondaryActivity.value = !showSecondaryActivity.value;
};

const calculateTotalHours = () => {
  if (!formData.value.horaInicio || !formData.value.horaFim) {
    formData.value.totalHorasCalculado = '';
    return;
  }

  try {
    // Parse times (assuming HH:MM format)
    const [startHour, startMin] = formData.value.horaInicio.split(':').map(Number);
    const [endHour, endMin] = formData.value.horaFim.split(':').map(Number);

    // Create date objects for calculation
    const startTime = new Date(2000, 0, 1, startHour, startMin);
    const endTime = new Date(2000, 0, 1, endHour, endMin);

    // Handle case where end time is next day
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    // Calculate difference in minutes
    const diffMinutes = (endTime - startTime) / (1000 * 60);

    // Subtract pause time
    const totalMinutes = diffMinutes - (formData.value.tempoPausa || 0);

    if (totalMinutes <= 0) {
      formData.value.totalHorasCalculado = '00:00:00';
      return;
    }

    // Convert to HH:MM:SS format
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);

    formData.value.totalHorasCalculado = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating total hours:', error);
    formData.value.totalHorasCalculado = '';
  }
};

const formatTimeInput = (event, field) => {
  // Get the input value and remove non-digit characters
  let value = event.target.value.replace(/[^\d]/g, '');

  // Limit to 4 digits
  if (value.length > 4) {
    value = value.slice(0, 4);
  }

  // Format as HH:MM
  if (value.length > 2) {
    value = value.slice(0, 2) + ':' + value.slice(2, 4);
  }

  // Update the form field
  formData.value[field] = value;

  // Update the input value
  event.target.value = value;

  // Clear validation errors when user is typing
  if (validationErrors[field]) {
    delete validationErrors[field];
  }

  // Recalculate total hours
  calculateTotalHours();
};

const addAtividadeAdicional = tipo => {
  formData.value.atividadesAdicionais.push({
    id: Date.now(), // Simple ID for tracking
    tipo: tipo, // FOLHA DE OBRA or ASSISTENCIA REMOTA
    referencia: '',
    cliente: '',
    tipoAtividade: '',
    assunto: '',
    horaInicio: '',
    horaFim: '',
    tempoPausa: 0,
    totalHoras: '',
    responsavel: '',
    descricao: '',
  });
};

const removeAtividadeAdicional = index => {
  formData.value.atividadesAdicionais.splice(index, 1);
};

const formatTimeInputForActivity = (event, atividade, field) => {
  // Get the input value and remove non-digit characters
  let value = event.target.value.replace(/[^\d]/g, '');

  // Format as HH:MM
  if (value.length > 2) {
    value = value.slice(0, 2) + ':' + value.slice(2, 4);
  }

  // Update the activity field
  atividade[field] = value;

  // Update the input value
  event.target.value = value;

  // Calculate total hours for this activity
  calculateTotalHoursForActivity(atividade);
};

const calculateTotalHoursForActivity = atividade => {
  if (!atividade.horaInicio || !atividade.horaFim) {
    atividade.totalHoras = '';
    return;
  }

  try {
    // Parse times (assuming HH:MM format)
    const [startHour, startMin] = atividade.horaInicio.split(':').map(Number);
    const [endHour, endMin] = atividade.horaFim.split(':').map(Number);

    // Create date objects for calculation
    const startTime = new Date(2000, 0, 1, startHour, startMin);
    const endTime = new Date(2000, 0, 1, endHour, endMin);

    // Handle case where end time is next day
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    // Calculate difference in minutes
    const diffMinutes = (endTime - startTime) / (1000 * 60);

    // Subtract pause time
    const totalMinutes = diffMinutes - (atividade.tempoPausa || 0);

    if (totalMinutes <= 0) {
      atividade.totalHoras = '00:00:00';
      return;
    }

    // Convert to HH:MM:SS format
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes % 1) * 60);

    atividade.totalHoras = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating total hours for activity:', error);
    atividade.totalHoras = '';
  }
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    const year = getYearFromDate(formData.value.dataRegistro);

    if (isEditing.value) {
      await updateRegistro(registroYear.value, registroId.value, formData.value);
      router.push(`/registo-diario-atividade/${registroYear.value}/${registroId.value}`);
    } else {
      const newRegistro = await createRegistro(year, formData.value);
      router.push(`/registo-diario-atividade/${year}/${newRegistro.id}`);
    }
  } catch (err) {
    console.error('Error saving registro:', err);
  }
};

const handleCancel = () => {
  router.push(cancelRoute.value);
};

const loadRegistroForEditing = async () => {
  if (registroYear.value && registroId.value) {
    try {
      const registro = await fetchRegistroById(registroYear.value, registroId.value);
      if (registro) {
        formData.value = { ...registro };
        // Show secondary activity if there's data for it
        if (registro.cliente2 || registro.assunto2 || registro.descricao2) {
          showSecondaryActivity.value = true;
        }
        // Recalculate total hours after loading data
        calculateTotalHours();
      }
    } catch (err) {
      console.error('Error loading registro:', err);
    }
  }
};

// Watchers
watch(
  () => formData.value.tempoPausa,
  () => {
    calculateTotalHours();
  }
);

watch(
  () => formData.value.horaInicio,
  () => {
    calculateTotalHours();
  }
);

watch(
  () => formData.value.horaFim,
  () => {
    calculateTotalHours();
  }
);

// Watch additional activities for changes in pause time
watch(
  () => formData.value.atividadesAdicionais,
  newActivities => {
    newActivities.forEach(atividade => {
      // Recalculate total hours when pause time changes
      if (atividade.horaInicio && atividade.horaFim) {
        calculateTotalHoursForActivity(atividade);
      }
    });
  },
  { deep: true }
);

// Lifecycle
onMounted(async () => {
  // Fetch clients data for the dropdown
  try {
    await fetchClientes();
  } catch (error) {
    console.error('Error loading clients:', error);
  }

  // Fetch collaborators data for the dropdown
  try {
    await fetchCollaborators();
  } catch (error) {
    console.error('Error loading collaborators:', error);
  }

  // Check if we're editing
  if (route.params.year && route.params.id) {
    isEditing.value = true;
    registroYear.value = route.params.year;
    registroId.value = route.params.id;
    await loadRegistroForEditing();
  }
});
</script>

<style scoped>
.registo-form-container {
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

.registo-form {
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

/* Full-width form group for descriptions */
.form-group-full {
  grid-column: 1 / -1;
  width: 100%;
  margin-top: 1rem;
}

/* When form-group-full is outside form-grid, ensure it takes full width */
.form-section > .form-group-full {
  display: block;
  width: 100%;
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

.form-control[readonly] {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #e9ecef;
}

/* Time input styling */
.time-input {
  font-family: monospace;
  letter-spacing: 0.1em;
}

/* Additional Activities Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
}

.add-activity-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.btn-add-activity {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 120px;
}

.btn-add-activity:hover {
  background: var(--primary-hover);
}

.btn-folha-obra {
  background: #28a745;
}

.btn-folha-obra:hover {
  background: #218838;
}

.btn-assistencia-remota {
  background: #17a2b8;
}

.btn-assistencia-remota:hover {
  background: #138496;
}

.button-divider {
  font-size: 1.2rem;
  font-weight: bold;
  color: #6c757d;
  margin: 0 0.25rem;
}

.no-activities-message {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px dashed #dee2e6;
}

.activity-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.activity-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.btn-remove-activity {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: auto;
  width: auto;
  height: auto;
  line-height: 1;
}

.btn-remove-activity:hover {
  background: #c82333;
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

.secondary-activity-toggle {
  display: flex;
  justify-content: center;
  padding: 1rem;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
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
  .registo-form-container {
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

  .btn-remove-activity {
    width: auto;
  }

  .add-activity-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-add-activity {
    width: 100%;
    min-width: auto;
  }

  .button-divider {
    display: none;
  }
}

@media (max-width: 480px) {
  .registo-form-container {
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
