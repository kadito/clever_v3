import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useContaCorrenteStore = defineStore('conta-corrente', () => {
  // State
  const contaCorrente = ref([]);
  const selectedContaCorrente = ref(null);
  const availableYears = ref([]);
  const currentYear = ref(new Date().getFullYear().toString());
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const contaCorrenteCount = computed(() => contaCorrente.value.length);
  const hasContaCorrente = computed(() => contaCorrente.value.length > 0);

  // Computed for invoice statistics
  const totalPendingInvoices = computed(
    () => contaCorrente.value.filter(item => item.pago !== 'TRUE' && item.pago !== 'true').length
  );

  const totalPaidInvoices = computed(
    () => contaCorrente.value.filter(item => item.pago === 'TRUE' || item.pago === 'true').length
  );

  const totalInvoiceValue = computed(() =>
    contaCorrente.value.reduce((sum, item) => {
      const value = parseFloat(item.valorFatura) || 0;
      return sum + value;
    }, 0)
  );

  const overdueInvoices = computed(
    () =>
      contaCorrente.value.filter(item => {
        if (item.pago === 'TRUE' || item.pago === 'true') return false;
        if (!item.dataVencimentoFatura) return false;
        const dueDate = new Date(item.dataVencimentoFatura);
        return dueDate < new Date();
      }).length
  );

  const remoteTasks = computed(
    () => contaCorrente.value.filter(item => item.tipoFatura === 'REMOTA').length
  );

  const presentialTasks = computed(
    () => contaCorrente.value.filter(item => item.tipoFatura === 'PRESENCIAL').length
  );

  const otherTasks = computed(
    () => contaCorrente.value.filter(item => item.tipoFatura === 'OUTROS').length
  );

  // API Base URL
  const API_BASE = '/api/conta-corrente';

  // Actions
  async function fetchContaCorrenteForYear(year = null) {
    const targetYear = year || currentYear.value;
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${targetYear}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch conta corrente: ${response.statusText}`);
      }

      const data = await response.json();
      contaCorrente.value = data.contaCorrente || [];

      console.log(
        `Fetched ${contaCorrente.value.length} conta corrente items for year ${targetYear}`
      );
    } catch (err) {
      console.error('Error fetching conta corrente:', err);
      error.value = err.message;
      contaCorrente.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchAvailableYears() {
    try {
      const response = await fetch(`${API_BASE}/years`);

      if (!response.ok) {
        throw new Error(`Failed to fetch years: ${response.statusText}`);
      }

      const data = await response.json();
      availableYears.value = data.years || [];

      console.log('Available years:', availableYears.value);
    } catch (err) {
      console.error('Error fetching available years:', err);
      error.value = err.message;
      availableYears.value = [];
    }
  }

  async function fetchContaCorrenteById(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch conta corrente item: ${response.statusText}`);
      }

      const data = await response.json();
      selectedContaCorrente.value = data.contaCorrente;

      return data.contaCorrente;
    } catch (err) {
      console.error('Error fetching conta corrente item:', err);
      error.value = err.message;
      selectedContaCorrente.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createContaCorrente(year, contaCorrenteData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contaCorrenteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to create conta corrente item: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Add to local state
      contaCorrente.value.push(data.contaCorrente);

      return data.contaCorrente;
    } catch (err) {
      console.error('Error creating conta corrente item:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateContaCorrente(year, id, contaCorrenteData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contaCorrenteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update conta corrente item: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Update local state
      const index = contaCorrente.value.findIndex(item => item.id === id);
      if (index !== -1) {
        contaCorrente.value[index] = data.contaCorrente;
      }

      // Update selected if it matches
      if (selectedContaCorrente.value && selectedContaCorrente.value.id === id) {
        selectedContaCorrente.value = data.contaCorrente;
      }

      return data.contaCorrente;
    } catch (err) {
      console.error('Error updating conta corrente item:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteContaCorrente(year, id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete conta corrente item: ${response.statusText}`
        );
      }

      // Remove from local state
      const index = contaCorrente.value.findIndex(item => item.id === id);
      if (index !== -1) {
        contaCorrente.value.splice(index, 1);
      }

      // Clear selected if it matches
      if (selectedContaCorrente.value && selectedContaCorrente.value.id === id) {
        selectedContaCorrente.value = null;
      }

      return true;
    } catch (err) {
      console.error('Error deleting conta corrente item:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function searchContaCorrente(query, year = null) {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams({ q: query });
      if (year) {
        params.append('year', year);
      }

      const response = await fetch(`${API_BASE}/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to search conta corrente: ${response.statusText}`);
      }

      const data = await response.json();

      return data.results || [];
    } catch (err) {
      console.error('Error searching conta corrente:', err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  // Utility functions
  function clearError() {
    error.value = null;
  }

  function setCurrentYear(year) {
    currentYear.value = year;
  }

  function clearSelectedContaCorrente() {
    selectedContaCorrente.value = null;
  }

  function getYearFromDate(dateString) {
    if (!dateString) return new Date().getFullYear();
    return new Date(dateString).getFullYear();
  }

  function isInvoiceOverdue(item) {
    if (item.pago === 'TRUE' || item.pago === 'true') return false;
    if (!item.dataVencimentoFatura) return false;
    const dueDate = new Date(item.dataVencimentoFatura);
    return dueDate < new Date();
  }

  function isInvoiceDueToday(item) {
    if (item.pago === 'TRUE' || item.pago === 'true') return false;
    if (!item.dataVencimentoFatura) return false;
    const dueDate = new Date(item.dataVencimentoFatura);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  }

  function isInvoiceDueThisWeek(item) {
    if (item.pago === 'TRUE' || item.pago === 'true') return false;
    if (!item.dataVencimentoFatura) return false;
    const dueDate = new Date(item.dataVencimentoFatura);
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    return dueDate >= today && dueDate <= weekFromNow;
  }

  function getInvoiceStatus(item) {
    if (item.pago === 'TRUE' || item.pago === 'true') return 'paid';
    if (isInvoiceOverdue(item)) return 'overdue';
    if (isInvoiceDueToday(item)) return 'due_today';
    if (isInvoiceDueThisWeek(item)) return 'due_soon';
    return 'pending';
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-PT');
  }

  function formatCurrency(value) {
    if (!value && value !== 0) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(numValue);
  }

  return {
    // State
    contaCorrente,
    selectedContaCorrente,
    availableYears,
    currentYear,
    loading,
    error,

    // Getters
    contaCorrenteCount,
    hasContaCorrente,
    totalPendingInvoices,
    totalPaidInvoices,
    totalInvoiceValue,
    overdueInvoices,
    remoteTasks,
    presentialTasks,
    otherTasks,

    // Actions
    fetchContaCorrenteForYear,
    fetchAvailableYears,
    fetchContaCorrenteById,
    createContaCorrente,
    updateContaCorrente,
    deleteContaCorrente,
    searchContaCorrente,

    // Utilities
    clearError,
    setCurrentYear,
    clearSelectedContaCorrente,
    getYearFromDate,
    isInvoiceOverdue,
    isInvoiceDueToday,
    isInvoiceDueThisWeek,
    getInvoiceStatus,
    formatDate,
    formatCurrency,
  };
});
