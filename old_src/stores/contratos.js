import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useContratosStore = defineStore('contratos', () => {
  // State
  const contratos = ref([]);
  const currentYear = ref(new Date().getFullYear());
  const availableYears = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const selectedContrato = ref(null);

  // Getters
  const contratosCount = computed(() => contratos.value.length);
  const hasContratos = computed(() => contratos.value.length > 0);
  const currentYearString = computed(() => currentYear.value.toString());

  // API Base URL
  const API_BASE = '/api/contratos';

  // Actions
  async function fetchContratosForYear(year = null) {
    const targetYear = year || currentYear.value;
    loading.value = true;
    error.value = null;

    try {
      // Use index-based endpoint with year filter
      const url = targetYear ? `${API_BASE}/list?year=${targetYear}` : `${API_BASE}/list`;
      const response = await fetch(url);

      if (!response.ok) {
        // Try to get error message from JSON response
        let errorMessage = `Failed to fetch contratos for year ${targetYear}: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If not JSON, try text
          const errorText = await response.text();
          if (errorText && !errorText.startsWith('<!DOCTYPE')) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      contratos.value = result.data || [];
      currentYear.value = targetYear;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching contratos:', err);
      contratos.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchAvailableYears() {
    try {
      const response = await fetch(`${API_BASE}/years`);
      if (!response.ok) {
        throw new Error('Failed to fetch available years');
      }
      const result = await response.json();
      availableYears.value = result.years || [];
    } catch (err) {
      console.error('Error fetching years:', err);
      availableYears.value = [];
    }
  }

  async function fetchContratoById(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Contrato not found');
        }
        throw new Error('Failed to fetch contrato');
      }
      const contrato = await response.json();
      selectedContrato.value = contrato;
      return contrato;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching contrato:', err);
      selectedContrato.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createContrato(year, contratoData) {
    loading.value = true;
    error.value = null;

    try {
      // Generate UUID for the new contrato
      const contratoWithId = {
        ...contratoData,
        id: uuidv4(),
      };

      const response = await fetch(`${API_BASE}/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contratoWithId),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contrato');
      }

      const newContrato = await response.json();

      // Add to local state if it's for the current year
      if (year === currentYear.value) {
        contratos.value.push(newContrato);
      }

      return newContrato;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating contrato:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateContrato(year, id, contratoData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contratoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contrato');
      }

      const updatedContrato = await response.json();

      // Update local state if it's for the current year
      if (year === currentYear.value) {
        const index = contratos.value.findIndex(c => c.id === id);
        if (index !== -1) {
          contratos.value[index] = updatedContrato;
        }
      }

      // Update selected contrato if it's the one being edited
      if (selectedContrato.value && selectedContrato.value.id === id) {
        selectedContrato.value = updatedContrato;
      }

      return updatedContrato;
    } catch (err) {
      error.value = err.message;
      console.error('Error updating contrato:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteContrato(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete contrato');
      }

      // Remove from local state if it's for the current year
      if (year === currentYear.value) {
        const index = contratos.value.findIndex(c => c.id === id);
        if (index !== -1) {
          contratos.value.splice(index, 1);
        }
      }

      // Clear selected contrato if it's the one being deleted
      if (selectedContrato.value && selectedContrato.value.id === id) {
        selectedContrato.value = null;
      }

      const result = await response.json();
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting contrato:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function searchContratos(query = null, year = null, month = null) {
    loading.value = true;
    error.value = null;

    try {
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.append('q', query);
      }
      if (year) {
        searchParams.append('year', year);
      }
      if (month) {
        searchParams.append('month', month.toString());
      }

      // At least query or month must be provided
      if (!query && !month) {
        throw new Error('Search query or month is required');
      }

      const response = await fetch(`${API_BASE}/search?${searchParams}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Search failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error searching contratos:', err);
      return { results: [], count: 0 };
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  function setCurrentYear(year) {
    currentYear.value = year;
  }

  function clearSelectedContrato() {
    selectedContrato.value = null;
  }

  // Helper function to get year from date string
  function getYearFromDate(dateString) {
    return new Date(dateString).getFullYear();
  }

  return {
    // State
    contratos,
    currentYear,
    availableYears,
    loading,
    error,
    selectedContrato,

    // Getters
    contratosCount,
    hasContratos,
    currentYearString,

    // Actions
    fetchContratosForYear,
    fetchAvailableYears,
    fetchContratoById,
    createContrato,
    updateContrato,
    deleteContrato,
    searchContratos,
    clearError,
    setCurrentYear,
    clearSelectedContrato,
    getYearFromDate,
  };
});
