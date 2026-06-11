<template>
  <div class="equipa-container">
    <div class="equipa-header">
      <BackButton
        to="/equipa"
        variant="inline"
      />
    </div>

    <!-- Controls -->
    <div class="list-controls">
      <div class="controls-left">
        <h2>Colaboradores ({{ collaborators.length }})</h2>
      </div>

      <button
        :disabled="loading"
        class="btn btn-refresh"
        @click="refreshData"
      >
        🔄 Atualizar
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <p>A carregar colaboradores...</p>
    </div>

    <!-- Error State -->
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

    <!-- Collaborators List -->
    <div
      v-if="!loading && collaborators.length > 0"
      class="collaborators-list"
    >
      <div
        v-for="collaborator in collaborators"
        :key="collaborator.id"
        class="collaborator-item"
        @click="navigateToDetail(collaborator)"
      >
        <div class="collaborator-main">
          <h3>{{ collaborator.name }}</h3>
        </div>
        <div class="collaborator-actions">
          <button
            class="action-btn"
            @click.stop="showActions(collaborator)"
          >
            ⋮
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && collaborators.length === 0"
      class="empty-state"
    >
      <h3>Nenhum colaborador encontrado</h3>
      <p>Não há colaboradores cadastrados no sistema.</p>
    </div>

    <!-- Actions Modal -->
    <div
      v-if="showActionsModal"
      class="actions-modal-overlay"
      @click="closeActions"
    >
      <div
        class="actions-modal"
        @click.stop
      >
        <h3>{{ selectedCollaboratorForActions?.name }}</h3>
        <div class="modal-actions">
          <button
            class="modal-btn view-btn"
            @click="viewCollaborator"
          >
            📋 Ver Detalhes
          </button>
          <button
            class="modal-btn edit-btn"
            @click="editCollaborator"
          >
            ✏️ Editar
          </button>
          <button
            class="modal-btn delete-btn"
            @click="deleteCollaboratorAction"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button
      class="fab"
      @click="navigateToCreate"
    >
      ➕
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import { useEquipaStore } from '@/stores/equipa.js';

// Router
const router = useRouter();

// Store
const store = useEquipaStore();
const { collaborators, loading, error } = storeToRefs(store);
const { fetchCollaborators, clearError, deleteCollaborator: deleteCollaboratorFromStore } = store;

// Local state
const showActionsModal = ref(false);
const selectedCollaboratorForActions = ref(null);

// Methods
const refreshData = async () => {
  await fetchCollaborators();
};

const navigateToDetail = collaborator => {
  router.push(`/equipa/${collaborator.id}`);
};

const navigateToCreate = () => {
  router.push('/equipa/new?from=list');
};

const showActions = collaborator => {
  selectedCollaboratorForActions.value = collaborator;
  showActionsModal.value = true;
};

const closeActions = () => {
  showActionsModal.value = false;
  selectedCollaboratorForActions.value = null;
};

const viewCollaborator = () => {
  if (selectedCollaboratorForActions.value) {
    navigateToDetail(selectedCollaboratorForActions.value);
  }
  closeActions();
};

const editCollaborator = () => {
  if (selectedCollaboratorForActions.value) {
    router.push(`/equipa/${selectedCollaboratorForActions.value.id}/edit`);
  }
  closeActions();
};

const deleteCollaboratorAction = async () => {
  if (
    selectedCollaboratorForActions.value &&
    confirm('Tem certeza que deseja eliminar este colaborador?')
  ) {
    try {
      await deleteCollaboratorFromStore(selectedCollaboratorForActions.value.id);
      closeActions();
    } catch (err) {
      console.error('Error deleting collaborator:', err);
      // Error is already handled by the store
    }
  }
};

// Lifecycle
onMounted(async () => {
  await fetchCollaborators();
});
</script>

<style scoped>
.equipa-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.equipa-header {
  margin-bottom: 1rem;
}

.list-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.controls-left h2 {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.btn-refresh {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.collaborators-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.collaborator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.collaborator-item:last-child {
  border-bottom: none;
}

.collaborator-item:hover {
  background-color: #f8f9fa;
}

.collaborator-main {
  flex: 1;
}

.collaborator-main h3 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.collaborator-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #e9ecef;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

/* Actions Modal */
.actions-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.actions-modal {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 280px;
  max-width: 90vw;
}

.actions-modal h3 {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  text-align: center;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-btn {
  background: var(--primary-color);
  color: white;
}

.view-btn:hover {
  background: var(--primary-hover);
}

.edit-btn {
  background: #f39c12;
  color: white;
}

.edit-btn:hover {
  background: #e67e22;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 100;
}

.fab:hover {
  transform: translateY(-5px);
  background: var(--primary-hover);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .equipa-container {
    padding: 0.5rem;
  }

  .list-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .controls-left h2 {
    text-align: center;
  }

  .collaborator-item {
    padding: 0.75rem;
  }

  .collaborator-main h3 {
    font-size: 0.9rem;
  }

  .actions-modal {
    padding: 1rem;
    min-width: 260px;
  }

  .fab {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .controls-left h2 {
    font-size: 1.1rem;
  }

  .collaborator-item {
    padding: 0.5rem;
  }

  .modal-btn {
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
  }
}
</style>
