import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useEquipamentoUsadoStore = defineStore('equipamentoUsado', () => {
  // State
  const equipamentos = ref([])
  const selectedEquipamento = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const currentYear = ref(new Date().getFullYear().toString())
  const availableYears = ref([])

  // Getters
  const getEquipamentosCount = computed(() => equipamentos.value.length)
  
  const getEquipamentosByStatus = computed(() => {
    const grupos = {
      disponivel: [],
      emprestado: [],
      manutencao: []
    }
    
    equipamentos.value.forEach(equipamento => {
      if (equipamento.clienteEmprestimo && !equipamento.dataRetorno) {
        grupos.emprestado.push(equipamento)
      } else if (equipamento.estadoGeral?.includes('NECESSITA') || equipamento.estadoGeral?.includes('AVARIADO')) {
        grupos.manutencao.push(equipamento)
      } else {
        grupos.disponivel.push(equipamento)
      }
    })
    
    return grupos
  })

  const getEquipamentosEmprestados = computed(() => {
    return equipamentos.value.filter(equipamento => 
      equipamento.clienteEmprestimo && !equipamento.dataRetorno
    )
  })

  // Actions
  async function fetchEquipamentosForYear(year = null) {
    let targetYear = year || currentYear.value
    loading.value = true
    error.value = null
    
    // If no specific year requested, try to find a year with data
    if (!year) {
      await fetchAvailableYears()
      if (availableYears.value.length > 0) {
        // Use the most recent year that has data
        const mostRecentYear = availableYears.value.sort((a, b) => b - a)[0]
        targetYear = mostRecentYear
        currentYear.value = mostRecentYear
      }
    }
    
    try {
      const response = await fetch(`/api/equipamento-usado/${targetYear}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch equipamentos: ${response.status}`)
      }
      
      const data = await response.json()
      equipamentos.value = data.data || []
      
      if (year) {
        currentYear.value = year
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching equipamentos:', err)
      equipamentos.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableYears() {
    try {
      const response = await fetch('/api/equipamento-usado/years')
      if (!response.ok) {
        throw new Error('Failed to fetch available years')
      }
      
      const data = await response.json()
      availableYears.value = data.years || []
    } catch (err) {
      console.error('Error fetching available years:', err)
      availableYears.value = []
    }
  }

  async function fetchEquipamentoById(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/equipamento-usado/${year}/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch equipamento: ${response.status}`)
      }
      
      const equipamento = await response.json()
      selectedEquipamento.value = equipamento
      return equipamento
    } catch (err) {
      error.value = err.message
      console.error('Error fetching equipamento:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEquipamento(year, equipamentoData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/equipamento-usado/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(equipamentoData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create equipamento: ${response.status}`)
      }
      
      const newEquipamento = await response.json()
      
      // Add to local state if we're viewing the same year
      if (year === currentYear.value) {
        equipamentos.value.push(newEquipamento)
      }
      
      return newEquipamento
    } catch (err) {
      error.value = err.message
      console.error('Error creating equipamento:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEquipamento(year, id, equipamentoData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/equipamento-usado/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(equipamentoData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update equipamento: ${response.status}`)
      }
      
      const updatedEquipamento = await response.json()
      
      // Update local state if we're viewing the same year
      if (year === currentYear.value) {
        const index = equipamentos.value.findIndex(e => e.id === id)
        if (index !== -1) {
          equipamentos.value[index] = updatedEquipamento
        }
      }
      
      // Update selected equipamento if it's the same one
      if (selectedEquipamento.value && selectedEquipamento.value.id === id) {
        selectedEquipamento.value = updatedEquipamento
      }
      
      return updatedEquipamento
    } catch (err) {
      error.value = err.message
      console.error('Error updating equipamento:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEquipamento(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/equipamento-usado/${year}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete equipamento: ${response.status}`)
      }
      
      // Remove from local state if we're viewing the same year
      if (year === currentYear.value) {
        const index = equipamentos.value.findIndex(e => e.id === id)
        if (index !== -1) {
          equipamentos.value.splice(index, 1)
        }
      }
      
      // Clear selected equipamento if it was deleted
      if (selectedEquipamento.value && selectedEquipamento.value.id === id) {
        selectedEquipamento.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Error deleting equipamento:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function searchEquipamentos(query, year = null) {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams({ q: query })
      if (year) {
        params.append('year', year)
      }
      
      const response = await fetch(`/api/equipamento-usado/search?${params}`)
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      return data.results || []
    } catch (err) {
      error.value = err.message
      console.error('Error searching equipamentos:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Utilities
  function clearError() {
    error.value = null
  }

  function setCurrentYear(year) {
    currentYear.value = year.toString()
  }

  function clearSelectedEquipamento() {
    selectedEquipamento.value = null
  }

  function getYearFromDate(dateString) {
    return dateString ? new Date(dateString).getFullYear().toString() : new Date().getFullYear().toString()
  }

  function isEquipamentoEmprestado(equipamento) {
    return equipamento.clienteEmprestimo && !equipamento.dataRetorno
  }

  function isEquipamentoDisponivel(equipamento) {
    return !equipamento.clienteEmprestimo || equipamento.dataRetorno
  }

  function getEquipamentoStatus(equipamento) {
    if (equipamento.clienteEmprestimo && !equipamento.dataRetorno) {
      return { status: 'emprestado', label: 'Emprestado', color: 'orange' }
    }
    
    if (equipamento.estadoGeral?.includes('NECESSITA') || equipamento.estadoGeral?.includes('AVARIADO')) {
      return { status: 'manutencao', label: 'Manutenção', color: 'red' }
    }
    
    return { status: 'disponivel', label: 'Disponível', color: 'green' }
  }

  function formatDate(dateString) {
    return dateString ? new Date(dateString).toLocaleDateString('pt-PT') : ''
  }

  function formatDateTime(dateString) {
    return dateString ? new Date(dateString).toLocaleString('pt-PT') : ''
  }

  function getEquipamentoSummary(equipamento) {
    const parts = [equipamento.tipoEquipamento]
    if (equipamento.marca) parts.push(equipamento.marca)
    if (equipamento.modelo) parts.push(equipamento.modelo)
    return parts.join(' - ')
  }

  function getDaysOnLoan(equipamento) {
    if (!equipamento.dataEmprestimo) return 0
    
    const startDate = new Date(equipamento.dataEmprestimo)
    const endDate = equipamento.dataRetorno ? new Date(equipamento.dataRetorno) : new Date()
    
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  }

  return {
    // State
    equipamentos,
    selectedEquipamento,
    loading,
    error,
    currentYear,
    availableYears,
    
    // Getters
    getEquipamentosCount,
    getEquipamentosByStatus,
    getEquipamentosEmprestados,
    
    // Actions
    fetchEquipamentosForYear,
    fetchAvailableYears,
    fetchEquipamentoById,
    createEquipamento,
    updateEquipamento,
    deleteEquipamento,
    searchEquipamentos,
    
    // Utilities
    clearError,
    setCurrentYear,
    clearSelectedEquipamento,
    getYearFromDate,
    isEquipamentoEmprestado,
    isEquipamentoDisponivel,
    getEquipamentoStatus,
    formatDate,
    formatDateTime,
    getEquipamentoSummary,
    getDaysOnLoan
  }
})
