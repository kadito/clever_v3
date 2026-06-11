<template>
  <div class="assistencia-form-container">
    <div class="form-header">
      <BackButton
        :to="cancelRoute"
        variant="inline"
      />
      <h1>{{ isEditing ? 'Editar' : 'Nova' }} Assistência Remota</h1>
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
      class="assistencia-form"
      @submit.prevent="handleSubmit"
    >
      <!-- Basic Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO BÁSICA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="cliente">CLIENTE *</label>
            <ClienteSearchSelect
              id="cliente"
              v-model="form.cliente"
              input-id="cliente-search"
              placeholder="Pesquisar cliente..."
              :disabled="clientesStore.loading"
              :required="true"
              store-name
            />
          </div>

          <div class="form-group">
            <label for="tipoAssistencia">TIPO DE ASSISTÊNCIA *</label>
            <select
              id="tipoAssistencia"
              v-model="form.tipoAssistencia"
              class="form-control"
              required
            >
              <option value="">
                Seleccionar tipo
              </option>
              <option value="REMOTA">
                REMOTA
              </option>
              <option value="TELEFÓNICA">
                TELEFÓNICA
              </option>
              <option value="TELEMÓVEL">
                TELEMÓVEL
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="tecnicoResponsavel">TÉCNICO RESPONSÁVEL *</label>
            <select
              id="tecnicoResponsavel"
              v-model="form.tecnicoResponsavel"
              class="form-control"
              required
              :disabled="equipaStore.loading"
            >
              <option value="">
                {{ equipaStore.loading ? 'A carregar colaboradores...' : 'Seleccionar técnico' }}
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
            <label for="quemAtendeu">QUEM ATENDEU</label>
            <input
              id="quemAtendeu"
              v-model="form.quemAtendeu"
              type="text"
              class="form-control"
              placeholder="Nome da pessoa que atendeu"
            >
          </div>
        </div>
      </section>

      <!-- Date and Time Information -->
      <section class="form-section">
        <h2>DATAS E HORÁRIOS</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="dataPedido">DATA DO PEDIDO</label>
            <input
              id="dataPedido"
              v-model="form.dataPedido"
              type="datetime-local"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="dataAssistencia">DATA DA ASSISTÊNCIA *</label>
            <input
              id="dataAssistencia"
              v-model="form.dataAssistencia"
              type="datetime-local"
              class="form-control"
              required
            >
          </div>

          <div class="form-group">
            <label for="inicioAssistencia">INÍCIO DA ASSISTÊNCIA</label>
            <input
              id="inicioAssistencia"
              v-model="form.inicioAssistencia"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': validationErrors.inicioAssistencia }"
              placeholder="HH:MM (ex: 09:30)"
              maxlength="5"
              @input="formatTimeInput('inicioAssistencia', $event)"
              @blur="validateTimeInput('inicioAssistencia')"
            >
            <div
              v-if="validationErrors.inicioAssistencia"
              class="invalid-feedback"
            >
              {{ validationErrors.inicioAssistencia }}
            </div>
          </div>

          <div class="form-group">
            <label for="fimAssistencia">FIM DA ASSISTÊNCIA</label>
            <input
              id="fimAssistencia"
              v-model="form.fimAssistencia"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': validationErrors.fimAssistencia }"
              placeholder="HH:MM (ex: 17:45)"
              maxlength="5"
              @input="formatTimeInput('fimAssistencia', $event)"
              @blur="validateTimeInput('fimAssistencia')"
            >
            <div
              v-if="validationErrors.fimAssistencia"
              class="invalid-feedback"
            >
              {{ validationErrors.fimAssistencia }}
            </div>
          </div>

          <div class="form-group">
            <label for="horasTotal">HORAS TOTAL</label>
            <input
              id="horasTotal"
              type="text"
              :value="calculatedTotalHours"
              class="form-control"
              readonly
            >
          </div>
        </div>
      </section>

      <!-- Description Section -->
      <section class="form-section">
        <h2>DESCRIÇÃO</h2>
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="motivoPedido">MOTIVO DO PEDIDO</label>
            <textarea
              id="motivoPedido"
              v-model="form.motivoPedido"
              class="form-control"
              rows="3"
              placeholder="Descreva o motivo do pedido de assistência"
            />
          </div>

          <div class="form-group full-width">
            <label for="relatorioAssistencia">RELATÓRIO DA ASSISTÊNCIA</label>
            <textarea
              id="relatorioAssistencia"
              v-model="form.relatorioAssistencia"
              class="form-control"
              rows="4"
              placeholder="Descreva o que foi feito durante a assistência"
            />
          </div>
        </div>
      </section>

      <!-- Value Information -->
      <section class="form-section">
        <h2>VALORES</h2>
        <p class="value-note">
          💶 Preço: 30€/hora (09:00-18:00) | 45€/hora (outras horas) - sem IVA
        </p>
        <div class="form-grid">
          <div class="form-group">
            <label for="valorTotal">VALOR (SEM IVA)</label>
            <input
              id="valorTotal"
              type="text"
              :value="calculatedValue.toFixed(2) + ' €'"
              class="form-control value-display"
              readonly
            >
          </div>
        </div>
      </section>

      <!-- Status Section -->
      <section class="form-section">
        <h2>ESTADO</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>CONTRATO</label>
            <div class="toggle-switch">
              <input
                id="contrato"
                v-model="form.contrato"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="contrato"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>GARANTIA</label>
            <div class="toggle-switch">
              <input
                id="garantia"
                v-model="form.garantia"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="garantia"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>RESOLVIDO</label>
            <div class="toggle-switch">
              <input
                id="resolvido"
                v-model="form.resolvido"
                type="checkbox"
                class="toggle-input"
              >
              <label
                for="resolvido"
                class="toggle-label"
              >
                <span class="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        <!-- Relatório textarea - shown when RESOLVIDO is true -->
        <div
          v-if="form.resolvido"
          class="form-group form-group-full"
        >
          <label for="relatorio">RELATÓRIO</label>
          <textarea
            id="relatorio"
            v-model="form.relatorio"
            class="form-control"
            rows="4"
            placeholder="Relatório da resolução"
          />
        </div>

        <div class="form-grid">
          <div class="form-group form-group-full">
            <label for="anexos">ANEXOS</label>
            <input
              id="anexos"
              v-model="form.anexos"
              type="text"
              class="form-control"
              placeholder="Referências a anexos"
            >
          </div>
        </div>
      </section>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="navigateBack"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn btn-primary"
        >
          {{ isEditing ? 'Actualizar' : 'Criar' }} Assistência
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import ClienteSearchSelect from '@/components/ClienteSearchSelect.vue';
import { useAssistenciasRemotasStore } from '@/stores/assistencias-remotas.js';
import { useClientesStore } from '@/stores/clientes.js';
import { useEquipaStore } from '@/stores/equipa.js';

// Router
const route = useRoute();
const router = useRouter();

// Store
const store = useAssistenciasRemotasStore();
const { loading, error, selectedAssistencia, currentYear } = storeToRefs(store);
const { fetchAssistenciaById, clearError } = store;

// Clients store
const clientesStore = useClientesStore();
const { clientes } = storeToRefs(clientesStore);
const { fetchClientes } = clientesStore;

// Equipa store
const equipaStore = useEquipaStore();
const { collaborators } = storeToRefs(equipaStore);
const { fetchCollaborators } = equipaStore;

// Determine if we're editing or creating
const isEditing = computed(() => !!route.params.id);

// Default form structure (removed computed fields)
const defaultForm = {
  cliente: '',
  tipoAssistencia: '',
  tecnicoResponsavel: '',
  quemAtendeu: '',
  dataPedido: '',
  dataAssistencia: '',
  inicioAssistencia: '',
  fimAssistencia: '',
  motivoPedido: '',
  relatorioAssistencia: '',
  valorAssist: 0,
  contratoValor: '€0,00',
  contrato: false,
  garantia: false,
  resolvido: false,
  relatorio: '',
  anexos: '',
};

// Form state
const form = reactive({ ...defaultForm });
const validationErrors = reactive({});

// Constants
const PRICE_BUSINESS_HOURS = 30.0; // Price per hour between 09:00 and 18:00 (without IVA)
const PRICE_AFTER_HOURS = 45.0; // Price per hour outside business hours (without IVA)

// Valid minutes: only 00, 15, 30, 45
const VALID_MINUTES = [0, 15, 30, 45];

// Format time input as user types (HH:MM)
const formatTimeInput = (field, event) => {
  let value = event.target.value.replace(/[^\d]/g, ''); // Remove all non-digits

  // Limit to 4 digits
  if (value.length > 4) {
    value = value.slice(0, 4);
  }

  // Format as HH:MM
  if (value.length > 2) {
    value = `${value.slice(0, 2)  }:${  value.slice(2, 4)}`;
  }

  // Update the form field
  form[field] = value;

  // Clear validation errors when user is typing
  if (validationErrors[field]) {
    delete validationErrors[field];
  }

  // Validate time sequence if both times are set
  if (form.inicioAssistencia && form.fimAssistencia) {
    validateTimeSequence();
  }
};

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
  const value = form[field];

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

  // Auto-round minutes to nearest valid value (00, 15, 30, 45) - always round UP
  if (!VALID_MINUTES.includes(minutes)) {
    let roundedMinutes = roundMinutes(minutes);
    let roundedHours = hours;

    // If minutes > 45, we round to 00 of next hour
    if (minutes > 45) {
      roundedMinutes = 0;
      roundedHours = hours + 1;

      // Handle hour overflow (24:00 becomes 00:00 or handle as 24:00)
      if (roundedHours > 24) {
        roundedHours = 24;
        roundedMinutes = 0;
      }
    }

    const roundedTime = `${roundedHours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
    form[field] = roundedTime;

    // Clear any error since we've fixed it
    if (validationErrors[field]) {
      delete validationErrors[field];
    }

    // Re-validate time sequence if both times are set
    if (form.inicioAssistencia && form.fimAssistencia) {
      validateTimeSequence();
    }
    return;
  }

  // Clear error if validation passes
  if (validationErrors[field]) {
    delete validationErrors[field];
  }

  // Validate time sequence if both times are set
  if (form.inicioAssistencia && form.fimAssistencia) {
    validateTimeSequence();
  }
};

// Computed properties
const cancelRoute = computed(() => {
  // If we're coming from the module page, go back there
  const fromModule = route.query.from === 'module';

  if (isEditing.value) {
    return `/assistencias-remotas/${route.params.id}?year=${route.query.year || currentYear.value}`;
  } else {
    return fromModule ? '/assistencias-remotas' : '/assistencias-remotas/list';
  }
});

// Calculated total hours in HH:MM format
const calculatedTotalHours = computed(() => {
  if (!form.inicioAssistencia || !form.fimAssistencia) {
    return '';
  }

  try {
    // Parse time strings (HH:MM format)
    const [startHour, startMin] = form.inicioAssistencia.split(':').map(Number);
    const [endHour, endMin] = form.fimAssistencia.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return '';
    }

    // Convert to minutes since midnight
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle case where end time is next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }

    // Calculate duration in minutes
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes <= 0) {
      return '00:00';
    }

    // Convert back to hours and minutes
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error calculating total hours:', error);
    return '';
  }
});

// Helper function to determine if a time is within business hours (09:00-18:00)
const isBusinessHours = hour => {
  return hour >= 9 && hour < 18;
};

// Calculated value based on time difference and price
const calculatedValue = computed(() => {
  // If CONTRATO or GARANTIA is enabled, value should be 0
  if (form.contrato || form.garantia) {
    return 0;
  }

  if (!form.inicioAssistencia || !form.fimAssistencia) {
    return 0;
  }

  try {
    // Parse time strings (HH:MM format)
    const [startHour, startMin] = form.inicioAssistencia.split(':').map(Number);
    const [endHour, endMin] = form.fimAssistencia.split(':').map(Number);

    // Convert to minutes since midnight
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle case where end time is next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }

    // Calculate duration in minutes
    const durationMinutes = endMinutes - startMinutes;

    // Calculate value based on time of day
    // We need to iterate hour by hour to apply correct pricing
    let totalValue = 0;
    let currentMinutes = startMinutes;

    while (currentMinutes < endMinutes) {
      const currentHour = Math.floor(currentMinutes / 60) % 24;
      const minutesUntilNextHour = 60 - (currentMinutes % 60);
      const minutesInThisHour = Math.min(minutesUntilNextHour, endMinutes - currentMinutes);

      // Apply appropriate rate based on hour
      const pricePerHour = isBusinessHours(currentHour) ? PRICE_BUSINESS_HOURS : PRICE_AFTER_HOURS;
      totalValue += (minutesInThisHour / 60) * pricePerHour;

      currentMinutes += minutesInThisHour;
    }

    return totalValue;
  } catch (error) {
    console.warn('Error calculating value:', error);
    return 0;
  }
});

// Methods
const loadAssistenciaData = async () => {
  if (isEditing.value) {
    try {
      const year = route.query.year || currentYear.value;
      const id = route.params.id;

      console.log('Loading assistencia data for edit:', { id, year });

      // Clear any previous data
      selectedAssistencia.value = null;

      try {
        // Try the store method first
        await fetchAssistenciaById(year, id);
        console.log(
          'Assistencia fetched via store, selectedAssistencia:',
          selectedAssistencia.value
        );
      } catch (storeError) {
        console.warn('Store method failed, trying direct API call:', storeError);

        // Fallback to direct API call
        const response = await fetch(`/api/assistencias-remotas/${year}/${id}`);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const assistencia = await response.json();
        console.log('Assistencia fetched via direct API:', assistencia);

        // Manually set the selectedAssistencia
        selectedAssistencia.value = assistencia;
      }
    } catch (err) {
      console.error('Failed to load assistencia data:', err);
      router.push('/assistencias-remotas/list');
    }
  }
};

// Function to populate form with selected assistencia data
const populateFormFromSelectedAssistencia = () => {
  if (!selectedAssistencia.value || !isEditing.value) return;

  console.log('Populating form with data:', selectedAssistencia.value);

  // Reset form to defaults first
  Object.assign(form, JSON.parse(JSON.stringify(defaultForm)));

  // Populate with selected assistencia data
  const data = selectedAssistencia.value;

  form.cliente = data.cliente || '';
  form.tipoAssistencia = data.tipoAssistencia || '';
  form.tecnicoResponsavel = data.tecnicoResponsavel || '';
  form.quemAtendeu = data.quemAtendeu || '';
  form.motivoPedido = data.motivoPedido || '';
  form.relatorioAssistencia = data.relatorioAssistencia || '';
  // Skip computed fields: horaTotal, minutos, tempo, dias, totalComIva, pertenceAnoContrato
  form.valorAssist = data.valorAssist || 0;
  form.contratoValor = data.contratoValor || '€0,00';
  form.contrato = data.contrato || false;
  form.garantia = data.garantia || false;
  form.resolvido = data.resolvido || false;
  form.relatorio = data.relatorio || '';
  form.anexos = data.anexos || '';

  // Convert dates to the format expected by datetime-local inputs
  if (data.dataPedido) {
    form.dataPedido = formatDateForInput(data.dataPedido);
  }
  if (data.dataAssistencia) {
    form.dataAssistencia = formatDateForInput(data.dataAssistencia);
  }
  if (data.inicioAssistencia) {
    form.inicioAssistencia = formatTimeForInput(data.inicioAssistencia);
  }
  if (data.fimAssistencia) {
    form.fimAssistencia = formatTimeForInput(data.fimAssistencia);
  }

  console.log('Form populated with data:', form);
};

const formatDateForInput = dateString => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

const formatTimeForInput = dateString => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Round to nearest 15-minute interval
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const roundedHours = Math.floor(roundedMinutes / 60) % 24;
    const finalMinutes = roundedMinutes % 60;

    return `${String(roundedHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

const validateForm = () => {
  const errors = {};

  if (!form.cliente) {
    errors.cliente = 'Cliente é obrigatório';
  }

  if (!form.tipoAssistencia) {
    errors.tipoAssistencia = 'Tipo de assistência é obrigatório';
  }

  if (!form.tecnicoResponsavel) {
    errors.tecnicoResponsavel = 'Técnico responsável é obrigatório';
  }

  if (!form.dataAssistencia) {
    errors.dataAssistencia = 'Data da assistência é obrigatória';
  }

  // Validate time inputs format
  if (form.inicioAssistencia) {
    validateTimeInput('inicioAssistencia');
    if (validationErrors.inicioAssistencia) {
      errors.inicioAssistencia = validationErrors.inicioAssistencia;
    }
  }

  if (form.fimAssistencia) {
    validateTimeInput('fimAssistencia');
    if (validationErrors.fimAssistencia) {
      errors.fimAssistencia = validationErrors.fimAssistencia;
    }
  }

  // Validate time sequence: end time must be later than start time
  if (form.inicioAssistencia && form.fimAssistencia) {
    try {
      const [startHour, startMin] = form.inicioAssistencia.split(':').map(Number);
      const [endHour, endMin] = form.fimAssistencia.split(':').map(Number);

      if (!isNaN(startHour) && !isNaN(startMin) && !isNaN(endHour) && !isNaN(endMin)) {
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Check if end time is not later than start time (same day scenario)
        if (endMinutes <= startMinutes) {
          // Only allow this if it's reasonable to assume it's next day (e.g., start at 23:00, end at 01:00)
          // But if the difference is too small, it's likely an error
          const crossMidnightDuration = endMinutes + 24 * 60 - startMinutes;

          // If the cross-midnight duration is less than 30 minutes, it's likely an error
          if (crossMidnightDuration < 30) {
            errors.fimAssistencia = 'Fim da assistência deve ser posterior ao início';
          }
          // If start time is before 20:00 and end time is after 06:00, it's likely an error
          else if (startHour < 20 && endHour > 6) {
            errors.fimAssistencia = 'Fim da assistência deve ser posterior ao início';
          }
        }
      }
    } catch (error) {
      console.warn('Error validating time sequence:', error);
    }
  }

  // Copy validation errors
  Object.assign(validationErrors, errors);

  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    // Get year from assistance date
    const assistanceDate = form.dataAssistencia ? new Date(form.dataAssistencia) : new Date();
    const year = assistanceDate.getFullYear();

    // Prepare form data with calculated value
    const formData = {
      ...form,
      // Set the calculated value as valorAssist
      valorAssist: calculatedValue.value,
      // Add calculated total with IVA
      totalComIva: calculatedValue.value * 1.23,
      // Set year from assistance date
      pertenceAnoContrato: year.toString(),
    };

    // Convert datetime-local values back to ISO strings
    if (formData.dataPedido) {
      formData.dataPedido = new Date(formData.dataPedido).toISOString();
    }
    if (formData.dataAssistencia) {
      formData.dataAssistencia = new Date(formData.dataAssistencia).toISOString();
    }

    // For time fields, create datetime objects combining date and time
    if (formData.dataAssistencia && formData.inicioAssistencia) {
      const baseDate = new Date(formData.dataAssistencia);
      const [startHour, startMin] = formData.inicioAssistencia.split(':').map(Number);
      const startDateTime = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        startHour,
        startMin
      );
      formData.inicioAssistencia = startDateTime.toISOString();
    }

    if (formData.dataAssistencia && formData.fimAssistencia) {
      const baseDate = new Date(formData.dataAssistencia);
      const [endHour, endMin] = formData.fimAssistencia.split(':').map(Number);
      const endDateTime = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        endHour,
        endMin
      );

      // Handle case where end time is next day
      if (formData.inicioAssistencia) {
        const startDateTime = new Date(formData.inicioAssistencia);
        if (endDateTime <= startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }
      }

      formData.fimAssistencia = endDateTime.toISOString();
    }

    if (isEditing.value) {
      const id = route.params.id;
      await store.updateAssistencia(year, id, formData);
      router.push(`/assistencias-remotas/${id}?year=${year}`);
    } else {
      const newAssistencia = await store.createAssistencia(year, formData);
      router.push(`/assistencias-remotas/${newAssistencia.id}?year=${year}`);
    }
  } catch (err) {
    console.error('Error saving assistencia:', err);
  }
};

const validateTimeSequence = () => {
  if (!form.inicioAssistencia || !form.fimAssistencia) return;

  try {
    const [startHour, startMin] = form.inicioAssistencia.split(':').map(Number);
    const [endHour, endMin] = form.fimAssistencia.split(':').map(Number);

    if (!isNaN(startHour) && !isNaN(startMin) && !isNaN(endHour) && !isNaN(endMin)) {
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Check if end time is not later than start time (same day scenario)
      if (endMinutes <= startMinutes) {
        // Only allow this if it's reasonable to assume it's next day
        const crossMidnightDuration = endMinutes + 24 * 60 - startMinutes;

        // If the cross-midnight duration is less than 30 minutes, it's likely an error
        if (crossMidnightDuration < 30) {
          validationErrors.fimAssistencia = 'Fim da assistência deve ser posterior ao início';
        }
        // If start time is before 20:00 and end time is after 06:00, it's likely an error
        else if (startHour < 20 && endHour > 6) {
          validationErrors.fimAssistencia = 'Fim da assistência deve ser posterior ao início';
        } else {
          // Valid cross-midnight scenario, clear any previous errors
          delete validationErrors.fimAssistencia;
        }
      } else {
        // End time is later than start time on same day, clear any previous errors
        delete validationErrors.fimAssistencia;
      }
    }
  } catch (error) {
    console.warn('Error validating time sequence:', error);
  }
};

const navigateBack = () => {
  router.push(cancelRoute.value);
};

// Lifecycle hooks
onMounted(async () => {
  console.log('AssistenciasRemotasForm mounted, isEditing:', isEditing.value);

  // Fetch clients for dropdown
  try {
    await fetchClientes();
  } catch (error) {
    console.error('Error fetching clients:', error);
  }

  // Fetch collaborators for dropdown
  try {
    await fetchCollaborators();
    console.log('Collaborators loaded:', collaborators.value.length);
  } catch (error) {
    console.error('Error loading collaborators:', error);
  }

  // Set default date to now if creating new
  if (!isEditing.value) {
    const now = new Date();
    form.dataPedido = formatDateForInput(now);
    form.dataAssistencia = formatDateForInput(now);
    selectedAssistencia.value = null;
    console.log('Create mode: form will show empty fields with default dates');
  } else {
    // Load data for edit mode
    try {
      await loadAssistenciaData();
    } catch (error) {
      console.error('Error in onMounted:', error);
    }
  }
});

// Watch for time changes to validate sequence
watch([() => form.inicioAssistencia, () => form.fimAssistencia], () => {
  // Clear previous time validation errors when times change
  if (validationErrors.fimAssistencia) {
    delete validationErrors.fimAssistencia;
  }

  // Validate time sequence if both times are set
  if (form.inicioAssistencia && form.fimAssistencia) {
    validateTimeSequence();
  }
});

// Watch for changes in selectedAssistencia to populate the form
watch(
  selectedAssistencia,
  (newValue, oldValue) => {
    console.log('selectedAssistencia watcher triggered:', {
      newValue,
      oldValue,
      isEditing: isEditing.value,
    });

    if (newValue && isEditing.value) {
      console.log('selectedAssistencia changed, populating form:', newValue);
      populateFormFromSelectedAssistencia();
    }
  },
  { immediate: true }
);

// Watch for route changes to reload data if needed
watch(
  () => route.params.id,
  async (newId, oldId) => {
    console.log('Route param id changed:', { newId, oldId });

    if (newId && newId !== oldId && isEditing.value) {
      console.log('Route changed to edit different assistencia, reloading data');
      await loadAssistenciaData();
    }
  }
);
</script>

<style scoped>
.assistencia-form-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h1 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

.loading-state {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
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

.assistencia-form {
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

.value-note {
  background: #e7f3ff;
  border-left: 4px solid #2196f3;
  padding: 0.75rem 1rem;
  margin: -0.5rem 0 1rem 0;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #1565c0;
  font-weight: 500;
}

.value-display {
  background-color: #f8f9fa;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.value-with-tax {
  color: #2196f3;
  background-color: #e7f3ff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  align-items: start;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group-full {
  grid-column: 1 / -1;
  width: 100%;
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

/* Toggle switch styling - matching Folhas de Obra */
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

.toggle-input:focus + .toggle-label {
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(117, 174, 147, 0.3);
}

.form-actions {
  padding: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .assistencia-form {
    padding: 1rem;
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
    min-height: 50px;
  }

  .form-group label {
    font-size: 0.85rem;
  }

  /* Adjust toggle switch for mobile */
  .toggle-label {
    width: 45px;
    height: 22px;
  }

  .toggle-slider {
    width: 18px;
    height: 18px;
    top: 2px;
    left: 2px;
  }

  .toggle-input:checked + .toggle-label .toggle-slider {
    transform: translateX(23px);
  }
}

@media (max-width: 480px) {
  .form-section {
    padding: 0.75rem;
  }

  .form-section h2 {
    font-size: 0.9rem;
  }

  .form-group label {
    font-size: 0.8rem;
  }

  .toggle-label {
    width: 40px;
    height: 20px;
  }

  .toggle-slider {
    width: 16px;
    height: 16px;
    top: 2px;
    left: 2px;
  }

  .toggle-input:checked + .toggle-label .toggle-slider {
    transform: translateX(20px);
  }
}

/* Computed values styling */
.computed-values {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
}

.computed-values h3 {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.computed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.computed-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.computed-item label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.computed-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
}

@media (max-width: 768px) {
  .computed-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
