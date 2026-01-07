import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useAgendamentosStore = defineStore('agendamentos', () => {
  // State
  const agendamentos = ref([])
  const selectedAgendamento = ref(null)
  const availableYears = ref([])
  const currentYear = ref(new Date().getFullYear().toString())
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const agendamentosCount = computed(() => agendamentos.value.length)
  const hasAgendamentos = computed(() => agendamentos.value.length > 0)

  // Computed for task statistics
  const pendingTasks = computed(() => 
    agendamentos.value.filter(a => !a.tarefaConcluida).length
  )
  
  const completedTasks = computed(() => 
    agendamentos.value.filter(a => a.tarefaConcluida).length
  )
  
  const postponedTasks = computed(() => 
    agendamentos.value.filter(a => a.houveAdiamento).length
  )
  
  const installationTasks = computed(() => 
    agendamentos.value.filter(a => a.instalacao).length
  )

  // API Base URL
  const API_BASE = '/api/agendamentos'

  // Actions
  async function fetchAgendamentosForYear(year = null) {
    const targetYear = year || currentYear.value
    loading.value = true
    error.value = null
    
    try {
      console.log('Fetching agendamentos for year:', targetYear)
      
      const response = await fetch(`${API_BASE}/${targetYear}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agendamentos: ${response.status}`)
      }
      
      const data = await response.json()
      agendamentos.value = data.data || []
      currentYear.value = targetYear
      console.log('Agendamentos fetched:', data.count)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching agendamentos:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableYears() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/years`)
      if (!response.ok) {
        throw new Error(`Failed to fetch years: ${response.status}`)
      }
      
      const data = await response.json()
      availableYears.value = data.years || []
      console.log('Available years:', data.years)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching years:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAgendamentoById(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agendamento: ${response.status}`)
      }
      
      const agendamento = await response.json()
      selectedAgendamento.value = agendamento
      console.log('Agendamento fetched:', agendamento)
      return agendamento
    } catch (err) {
      error.value = err.message
      console.error('Error fetching agendamento:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAgendamento(year, agendamentoData) {
    loading.value = true
    error.value = null
    
    try {
      // Generate UUID for the new agendamento
      const agendamentoWithId = {
        ...agendamentoData,
        id: uuidv4()
      }
      
      const response = await fetch(`${API_BASE}/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agendamentoWithId)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create agendamento: ${response.status}`)
      }
      
      const newAgendamento = await response.json()
      
      // Add to current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        agendamentos.value.unshift(newAgendamento)
      }
      
      console.log('Agendamento created:', newAgendamento)
      return newAgendamento
    } catch (err) {
      error.value = err.message
      console.error('Error creating agendamento:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAgendamento(year, id, agendamentoData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agendamentoData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update agendamento: ${response.status}`)
      }
      
      const updatedAgendamento = await response.json()
      
      // Update in current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        const index = agendamentos.value.findIndex(a => a.id === id)
        if (index !== -1) {
          agendamentos.value[index] = updatedAgendamento
        }
      }
      
      // Update selected agendamento if it's the same one
      if (selectedAgendamento.value && selectedAgendamento.value.id === id) {
        selectedAgendamento.value = updatedAgendamento
      }
      
      console.log('Agendamento updated:', updatedAgendamento)
      return updatedAgendamento
    } catch (err) {
      error.value = err.message
      console.error('Error updating agendamento:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAgendamento(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete agendamento: ${response.status}`)
      }
      
      // Remove from current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        const index = agendamentos.value.findIndex(a => a.id === id)
        if (index !== -1) {
          agendamentos.value.splice(index, 1)
        }
      }
      
      // Clear selected agendamento if it was deleted
      if (selectedAgendamento.value && selectedAgendamento.value.id === id) {
        selectedAgendamento.value = null
      }
      
      console.log('Agendamento deleted:', id)
    } catch (err) {
      error.value = err.message
      console.error('Error deleting agendamento:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function searchAgendamentos(query, year = null) {
    loading.value = true
    error.value = null
    
    try {
      const searchParams = new URLSearchParams({ q: query })
      if (year) {
        searchParams.append('year', year)
      }
      
      const response = await fetch(`${API_BASE}/search?${searchParams}`)
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Search results:', data)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error searching agendamentos:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function setCurrentYear(year) {
    currentYear.value = year.toString()
  }

  function clearSelectedAgendamento() {
    selectedAgendamento.value = null
  }

  // Helper function to get year from date string
  function getYearFromDate(dateString) {
    return new Date(dateString).getFullYear()
  }

  // Helper function to check if task is overdue
  function isTaskOverdue(agendamento) {
    if (!agendamento.dataPrevistaAssistencia || agendamento.tarefaConcluida) {
      return false
    }
    const today = new Date()
    const scheduledDate = new Date(agendamento.dataPrevistaAssistencia)
    return scheduledDate < today
  }

  // Helper function to check if task is due today
  function isTaskDueToday(agendamento) {
    if (!agendamento.dataPrevistaAssistencia || agendamento.tarefaConcluida) {
      return false
    }
    const today = new Date()
    const scheduledDate = new Date(agendamento.dataPrevistaAssistencia)
    
    return today.toDateString() === scheduledDate.toDateString()
  }

  // Helper function to check if task is due this week
  function isTaskDueThisWeek(agendamento) {
    if (!agendamento.dataPrevistaAssistencia || agendamento.tarefaConcluida) {
      return false
    }
    const today = new Date()
    const scheduledDate = new Date(agendamento.dataPrevistaAssistencia)
    const weekFromNow = new Date()
    weekFromNow.setDate(today.getDate() + 7)
    
    return scheduledDate >= today && scheduledDate <= weekFromNow
  }

  // Helper function to get task priority
  function getTaskPriority(agendamento) {
    if (isTaskOverdue(agendamento)) return 'high'
    if (isTaskDueToday(agendamento)) return 'medium'
    if (isTaskDueThisWeek(agendamento)) return 'low'
    return 'normal'
  }

  return {
    // State
    agendamentos,
    selectedAgendamento,
    availableYears,
    currentYear,
    loading,
    error,
    // Getters
    agendamentosCount,
    hasAgendamentos,
    pendingTasks,
    completedTasks,
    postponedTasks,
    installationTasks,
    // Actions
    fetchAgendamentosForYear,
    fetchAvailableYears,
    fetchAgendamentoById,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
    searchAgendamentos,
    clearError,
    setCurrentYear,
    clearSelectedAgendamento,
    getYearFromDate,
    isTaskOverdue,
    isTaskDueToday,
    isTaskDueThisWeek,
    getTaskPriority
  }
})
