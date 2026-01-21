import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useInstalacoesStore = defineStore('instalacoes-programacoes', () => {
  // State
  const instalacoes = ref([]);
  const selectedInstalacao = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const availableYears = ref([]);
  const currentYear = ref(new Date().getFullYear());

  // Getters
  const getInstalacoesCount = computed(() => instalacoes.value.length);

  const getProgrammedCount = computed(
    () => instalacoes.value.filter(instalacao => instalacao.programado).length
  );

  const getNotProgrammedCount = computed(
    () => instalacoes.value.filter(instalacao => !instalacao.programado).length
  );

  const getCamerasInstallationCount = computed(
    () => instalacoes.value.filter(instalacao => instalacao.instalacaoCameras).length
  );

  const getPosInstallationCount = computed(
    () => instalacoes.value.filter(instalacao => instalacao.instalacaoPosECpa).length
  );

  // Actions
  async function fetchInstalacoesForYear(year = null) {
    loading.value = true;
    error.value = null;

    try {
      const targetYear = year || currentYear.value;
      const response = await fetch(`/api/instalacoes-programacoes/${targetYear}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      instalacoes.value = data.data || [];

      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching instalações:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAvailableYears() {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/instalacoes-programacoes/years');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      availableYears.value = data.years || [];

      return data.years;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching available years:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchInstalacaoById(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/instalacoes-programacoes/${year}/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      selectedInstalacao.value = data;

      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching instalação:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createInstalacao(year, instalacaoData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/instalacoes-programacoes/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instalacaoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newInstalacao = await response.json();

      // Add to local state if we're viewing the same year
      if (year == currentYear.value) {
        instalacoes.value.push(newInstalacao);
      }

      return newInstalacao;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating instalação:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateInstalacao(year, id, instalacaoData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/instalacoes-programacoes/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instalacaoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const updatedInstalacao = await response.json();

      // Update local state if we're viewing the same year
      if (year == currentYear.value) {
        const index = instalacoes.value.findIndex(i => i.id === id);
        if (index !== -1) {
          instalacoes.value[index] = updatedInstalacao;
        }
      }

      // Update selected if it's the same item
      if (selectedInstalacao.value && selectedInstalacao.value.id === id) {
        selectedInstalacao.value = updatedInstalacao;
      }

      return updatedInstalacao;
    } catch (err) {
      error.value = err.message;
      console.error('Error updating instalação:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteInstalacao(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/instalacoes-programacoes/${year}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Remove from local state if we're viewing the same year
      if (year == currentYear.value) {
        const index = instalacoes.value.findIndex(i => i.id === id);
        if (index !== -1) {
          instalacoes.value.splice(index, 1);
        }
      }

      // Clear selected if it's the same item
      if (selectedInstalacao.value && selectedInstalacao.value.id === id) {
        selectedInstalacao.value = null;
      }

      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting instalação:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function searchInstalacoes(query, year = null) {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams({ q: query });
      if (year) {
        params.append('year', year);
      }

      const response = await fetch(`/api/instalacoes-programacoes/search?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error searching instalações:', err);
      throw err;
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

  function clearSelectedInstalacao() {
    selectedInstalacao.value = null;
  }

  // Helper functions
  function getYearFromDate(dateString) {
    return dateString ? new Date(dateString).getFullYear() : new Date().getFullYear();
  }

  function isInstallationComplete(instalacao) {
    return instalacao.dataFinalInstalacao && new Date(instalacao.dataFinalInstalacao) <= new Date();
  }

  function isProgrammingComplete(instalacao) {
    return (
      instalacao.programado &&
      instalacao.finalProgramacao &&
      new Date(instalacao.finalProgramacao) <= new Date()
    );
  }

  function getInstallationStatus(instalacao) {
    if (!instalacao.dataInstalacao) return 'not-started';
    if (!instalacao.dataFinalInstalacao) return 'in-progress';
    if (isInstallationComplete(instalacao)) return 'completed';
    return 'in-progress';
  }

  function formatDate(dateString) {
    return dateString ? new Date(dateString).toLocaleDateString('pt-PT') : '';
  }

  function formatDateTime(dateString) {
    return dateString ? new Date(dateString).toLocaleString('pt-PT') : '';
  }

  return {
    // State
    instalacoes,
    selectedInstalacao,
    loading,
    error,
    availableYears,
    currentYear,

    // Getters
    getInstalacoesCount,
    getProgrammedCount,
    getNotProgrammedCount,
    getCamerasInstallationCount,
    getPosInstallationCount,

    // Actions
    fetchInstalacoesForYear,
    fetchAvailableYears,
    fetchInstalacaoById,
    createInstalacao,
    updateInstalacao,
    deleteInstalacao,
    searchInstalacoes,
    clearError,
    setCurrentYear,
    clearSelectedInstalacao,

    // Helper functions
    getYearFromDate,
    isInstallationComplete,
    isProgrammingComplete,
    getInstallationStatus,
    formatDate,
    formatDateTime,
  };
});
