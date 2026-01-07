import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useAssistenciasRemotasStore = defineStore('assistenciasRemotas', () => {
  // State
  const assistencias = ref([])
  const selectedAssistencia = ref(null)
  const availableYears = ref([])
  const currentYear = ref(new Date().getFullYear().toString())
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const assistenciasCount = computed(() => assistencias.value.length)
  const hasAssistencias = computed(() => assistencias.value.length > 0)

  // Actions
  async function fetchAssistenciasForYear(year = null) {
    const targetYear = (year || currentYear.value || new Date().getFullYear()).toString()
    loading.value = true
    error.value = null
    
    try {
      console.log('Fetching assistencias for year:', targetYear)
      
      const response = await fetch(`/api/assistencias-remotas/${targetYear}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch assistencias: ${response.status}`)
      }
      
      const data = await response.json()
      assistencias.value = data.data || []
      currentYear.value = targetYear
      console.log('Assistencias fetched:', data.count)
    } catch (err) {
      error.value = err.message
      assistencias.value = [] // Clear data on error
      console.error('Error fetching assistencias:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableYears() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/assistencias-remotas/years')
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

  async function fetchAssistenciaById(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/assistencias-remotas/${year}/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch assistencia: ${response.status}`)
      }
      
      const assistencia = await response.json()
      selectedAssistencia.value = assistencia
      console.log('Assistencia fetched:', assistencia)
      return assistencia
    } catch (err) {
      error.value = err.message
      console.error('Error fetching assistencia:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAssistencia(year, assistenciaData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/assistencias-remotas/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assistenciaData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create assistencia: ${response.status}`)
      }
      
      const newAssistencia = await response.json()
      
      // Add to current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        assistencias.value.unshift(newAssistencia)
      }
      
      console.log('Assistencia created:', newAssistencia)
      return newAssistencia
    } catch (err) {
      error.value = err.message
      console.error('Error creating assistencia:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAssistencia(year, id, assistenciaData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/assistencias-remotas/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assistenciaData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update assistencia: ${response.status}`)
      }
      
      const updatedAssistencia = await response.json()
      
      // Update in current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        const index = assistencias.value.findIndex(a => a.id === id)
        if (index !== -1) {
          assistencias.value[index] = updatedAssistencia
        }
      }
      
      // Update selected assistencia if it's the same one
      if (selectedAssistencia.value && selectedAssistencia.value.id === id) {
        selectedAssistencia.value = updatedAssistencia
      }
      
      console.log('Assistencia updated:', updatedAssistencia)
      return updatedAssistencia
    } catch (err) {
      error.value = err.message
      console.error('Error updating assistencia:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAssistencia(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/assistencias-remotas/${year}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete assistencia: ${response.status}`)
      }
      
      // Remove from current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        const index = assistencias.value.findIndex(a => a.id === id)
        if (index !== -1) {
          assistencias.value.splice(index, 1)
        }
      }
      
      // Clear selected assistencia if it was deleted
      if (selectedAssistencia.value && selectedAssistencia.value.id === id) {
        selectedAssistencia.value = null
      }
      
      console.log('Assistencia deleted:', id)
    } catch (err) {
      error.value = err.message
      console.error('Error deleting assistencia:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function searchAssistencias(query, year = null) {
    loading.value = true
    error.value = null
    
    try {
      const searchParams = new URLSearchParams({ q: query })
      if (year) {
        searchParams.append('year', year)
      }
      
      const response = await fetch(`/api/assistencias-remotas/search?${searchParams}`)
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Search results:', data)
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error searching assistencias:', err)
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

  function clearSelectedAssistencia() {
    selectedAssistencia.value = null
  }

  // Helper function to get year from date string
  function getYearFromDate(dateString) {
    return new Date(dateString).getFullYear()
  }

  return {
    // State
    assistencias,
    selectedAssistencia,
    availableYears,
    currentYear,
    loading,
    error,
    // Getters
    assistenciasCount,
    hasAssistencias,
    // Actions
    fetchAssistenciasForYear,
    fetchAvailableYears,
    fetchAssistenciaById,
    createAssistencia,
    updateAssistencia,
    deleteAssistencia,
    searchAssistencias,
    clearError,
    setCurrentYear,
    clearSelectedAssistencia,
    getYearFromDate
  }
})