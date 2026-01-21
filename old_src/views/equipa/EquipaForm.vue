<template>
  <div class="equipa-form-container">
    <div class="form-header">
      <BackButton :to="cancelRoute" variant="inline" />
      <h1>{{ isEditing ? 'Editar' : 'Novo' }} Colaborador</h1>
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
    <form @submit.prevent="handleSubmit" class="equipa-form" v-if="!loading">
      <!-- Basic Information Section -->
      <section class="form-section">
        <h2>INFORMAÇÃO BÁSICA</h2>
        <div class="form-grid">
          <div class="form-group">
            <label for="name">NOME *</label>
            <input
              type="text"
              id="name"
              v-model="formData.name"
              class="form-control"
              required
              placeholder="Nome do colaborador"
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
          {{ isEditing ? 'Atualizar' : 'Criar' }} Colaborador
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
import { useEquipaStore } from '@/stores/equipa.js';

// Router
const router = useRouter();
const route = useRoute();

// Store
const store = useEquipaStore();
const { loading, error } = storeToRefs(store);
const { createCollaborator, updateCollaborator, fetchCollaboratorById, clearError } = store;

// Form state
const isEditing = ref(false);
const collaboratorId = ref(null);

// Form data
const formData = ref({
  name: '',
});

// Computed
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0;
});

const cancelRoute = computed(() => {
  const from = route.query.from;
  if (from === 'detail' && collaboratorId.value) {
    return `/equipa/${collaboratorId.value}`;
  } else if (from === 'list') {
    return '/equipa/list';
  } else {
    return '/equipa';
  }
});

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    if (isEditing.value) {
      await updateCollaborator(collaboratorId.value, formData.value);
      router.push(`/equipa/${collaboratorId.value}`);
    } else {
      const newCollaborator = await createCollaborator(formData.value);
      router.push(`/equipa/${newCollaborator.id}`);
    }
  } catch (err) {
    console.error('Error saving collaborator:', err);
  }
};

const handleCancel = () => {
  router.push(cancelRoute.value);
};

const loadCollaboratorForEditing = async () => {
  if (collaboratorId.value) {
    try {
      const collaborator = await fetchCollaboratorById(collaboratorId.value);
      if (collaborator) {
        formData.value = {
          name: collaborator.name,
        };
      }
    } catch (err) {
      console.error('Error loading collaborator:', err);
    }
  }
};

// Lifecycle
onMounted(async () => {
  // Check if we're editing
  if (route.params.id) {
    isEditing.value = true;
    collaboratorId.value = route.params.id;
    await loadCollaboratorForEditing();
  }
});
</script>

<style scoped>
.equipa-form-container {
  max-width: 800px;
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

.equipa-form {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  color: #2c3e50;
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
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.btn-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .equipa-form-container {
    padding: 0.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
