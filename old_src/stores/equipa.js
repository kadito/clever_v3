import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useEquipaStore = defineStore('equipa', () => {
  // State
  const collaborators = ref([]);
  const selectedCollaborator = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const collaboratorsCount = computed(() => collaborators.value.length);
  const hasCollaborators = computed(() => collaborators.value.length > 0);

  // Actions
  async function fetchCollaborators() {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/equipa');
      if (!response.ok) {
        throw new Error(`Failed to fetch collaborators: ${response.status}`);
      }

      const data = await response.json();
      collaborators.value = data;
      console.log('Collaborators fetched:', data.length);
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching collaborators:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCollaboratorById(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/equipa/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch collaborator: ${response.status}`);
      }

      const collaborator = await response.json();
      selectedCollaborator.value = collaborator;
      console.log('Collaborator fetched:', collaborator);
      return collaborator;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching collaborator:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createCollaborator(collaboratorData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/equipa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collaboratorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create collaborator: ${response.status}`);
      }

      const newCollaborator = await response.json();
      collaborators.value.unshift(newCollaborator);
      console.log('Collaborator created:', newCollaborator);
      return newCollaborator;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating collaborator:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCollaborator(id, collaboratorData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/equipa/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collaboratorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update collaborator: ${response.status}`);
      }

      const updatedCollaborator = await response.json();

      // Update in local store
      const index = collaborators.value.findIndex(c => c.id === id);
      if (index !== -1) {
        collaborators.value[index] = updatedCollaborator;
      }

      // Update selected collaborator if it's the same one
      if (selectedCollaborator.value && selectedCollaborator.value.id === id) {
        selectedCollaborator.value = updatedCollaborator;
      }

      console.log('Collaborator updated:', updatedCollaborator);
      return updatedCollaborator;
    } catch (err) {
      error.value = err.message;
      console.error('Error updating collaborator:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCollaborator(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/equipa/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete collaborator: ${response.status}`);
      }

      // Remove from local store
      const index = collaborators.value.findIndex(c => c.id === id);
      if (index !== -1) {
        collaborators.value.splice(index, 1);
      }

      // Clear selected collaborator if it was deleted
      if (selectedCollaborator.value && selectedCollaborator.value.id === id) {
        selectedCollaborator.value = null;
      }

      console.log('Collaborator deleted:', id);
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting collaborator:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  function clearSelectedCollaborator() {
    selectedCollaborator.value = null;
  }

  return {
    // State
    collaborators,
    selectedCollaborator,
    loading,
    error,
    // Getters
    collaboratorsCount,
    hasCollaborators,
    // Actions
    fetchCollaborators,
    fetchCollaboratorById,
    createCollaborator,
    updateCollaborator,
    deleteCollaborator,
    clearError,
    clearSelectedCollaborator,
  };
});
