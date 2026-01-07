import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useRegistoDiarioAtividadeStore = defineStore('registo-diario-atividade', () => {
  // State
  const registros = ref([])
  const selectedRegistro = ref(null)
  const availableYears = ref([])
  const currentYear = ref(new Date().getFullYear().toString())
  const loading = ref(false)
  const error = ref(null)
  
  // Getters
  const registrosCount = computed(() => registros.value.length)
  const hasRegistros = computed(() => registros.value.length > 0)
  
  // Get registros by type (interno/externo)
  const internosCount = computed(() => 
    registros.value.filter(r => 
      r.internoOuExterno === 'INTERNO' || 
      r.interOuExter2 === 'INTERNO' || 
      r.interOuExter3 === 'INTERNO' ||
      r.interOuExter4 === 'INTERNO' ||
      r.interOuExter5 === 'INTERNO' ||
      r.interOuExter6 === 'INTERNO'
    ).length
  )
  
  const externosCount = computed(() => 
    registros.value.filter(r => 
      r.internoOuExterno === 'EXTERNO' || 
      r.interOuExter2 === 'EXTERNO' || 
      r.interOuExter3 === 'EXTERNO' ||
      r.interOuExter4 === 'EXTERNO' ||
      r.interOuExter5 === 'EXTERNO' ||
      r.interOuExter6 === 'EXTERNO'
    ).length
  )

  // Get total hours worked
  const totalHoursWorked = computed(() => {
    let totalMinutes = 0
    
    registros.value.forEach(registro => {
      const hoursFields = [
        registro.totalHoras, registro.totalHoras2, registro.totalHoras3,
        registro.totalHoras4, registro.totalHoras5, registro.totalHoras6
      ]
      
      hoursFields.forEach(hours => {
        if (hours && typeof hours === 'string') {
          const timeParts = hours.split(':')
          if (timeParts.length >= 2) {
            const h = parseInt(timeParts[0]) || 0
            const m = parseInt(timeParts[1]) || 0
            totalMinutes += (h * 60) + m
          }
        }
      })
    })
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  })

  // Get registros with folhas de obra
  const registrosWithFolhas = computed(() => 
    registros.value.filter(r => 
      r.folhaObra === true || 
      r.folhaObra2 === true || 
      r.folhaObra3 === true ||
      r.folhaObra4 || 
      r.folhaObra5 || 
      r.folhaObra6
    ).length
  )

  // Get registros with remote assistance
  const registrosWithRemote = computed(() => 
    registros.value.filter(r => 
      r.assistRemota || 
      r.assistRemota2 === true || 
      r.assistRemota3 === true ||
      r.assistRemota4 || 
      r.assistRemota5 || 
      r.assistRemota6
    ).length
  )

  // Actions
  async function fetchRegistrosForYear(year = null) {
    loading.value = true
    error.value = null
    
    try {
      const targetYear = year || currentYear.value
      const response = await fetch(`/api/registo-diario-atividade/${targetYear}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      registros.value = data.data || []
      
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching registros:', err)
      registros.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableYears() {
    try {
      const response = await fetch('/api/registo-diario-atividade/years')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      availableYears.value = data.years || []
      
      return data.years
    } catch (err) {
      error.value = err.message
      console.error('Error fetching available years:', err)
      availableYears.value = []
      throw err
    }
  }

  async function fetchRegistroById(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/registo-diario-atividade/${year}/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Registro não encontrado')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const registro = await response.json()
      selectedRegistro.value = registro
      
      return registro
    } catch (err) {
      error.value = err.message
      console.error('Error fetching registro:', err)
      selectedRegistro.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createRegistro(year, registroData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/registo-diario-atividade/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registroData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const newRegistro = await response.json()
      
      // Add to local state if we're viewing the same year
      if (year === currentYear.value) {
        registros.value.push(newRegistro)
      }
      
      return newRegistro
    } catch (err) {
      error.value = err.message
      console.error('Error creating registro:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRegistro(year, id, registroData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/registo-diario-atividade/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registroData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const updatedRegistro = await response.json()
      
      // Update local state if we're viewing the same year
      if (year === currentYear.value) {
        const index = registros.value.findIndex(r => r.id === id)
        if (index !== -1) {
          registros.value[index] = updatedRegistro
        }
      }
      
      // Update selected registro if it's the same one
      if (selectedRegistro.value && selectedRegistro.value.id === id) {
        selectedRegistro.value = updatedRegistro
      }
      
      return updatedRegistro
    } catch (err) {
      error.value = err.message
      console.error('Error updating registro:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteRegistro(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/registo-diario-atividade/${year}/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Remove from local state if we're viewing the same year
      if (year === currentYear.value) {
        const index = registros.value.findIndex(r => r.id === id)
        if (index !== -1) {
          registros.value.splice(index, 1)
        }
      }
      
      // Clear selected registro if it's the deleted one
      if (selectedRegistro.value && selectedRegistro.value.id === id) {
        selectedRegistro.value = null
      }
      
      return result
    } catch (err) {
      error.value = err.message
      console.error('Error deleting registro:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function searchRegistros(query, year = null) {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams({ q: query })
      if (year) {
        params.append('year', year)
      }
      
      const response = await fetch(`/api/registo-diario-atividade/search?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error searching registros:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Utility functions
  function clearError() {
    error.value = null
  }

  function setCurrentYear(year) {
    currentYear.value = year
  }

  function clearSelectedRegistro() {
    selectedRegistro.value = null
  }

  function getYearFromDate(dateString) {
    return new Date(dateString).getFullYear().toString()
  }

  function formatTime(timeString) {
    if (!timeString) return ''
    return timeString
  }

  function formatDate(dateString) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

  function formatDateTime(dateString) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString('pt-PT')
  }

  function getTotalClientsForRegistro(registro) {
    let count = 0
    if (registro.cliente) count++
    if (registro.cliente2 && registro.teveCliente2) count++
    if (registro.cliente3 && registro.teveCliente3) count++
    if (registro.cliente4 && registro.teveCliente4) count++
    if (registro.cliente5 && registro.teveCliente5) count++
    if (registro.cliente6 && registro.teveCliente6) count++
    return count
  }

  function getTotalHoursForRegistro(registro) {
    let totalMinutes = 0
    
    const hoursFields = [
      registro.totalHoras, registro.totalHoras2, registro.totalHoras3,
      registro.totalHoras4, registro.totalHoras5, registro.totalHoras6
    ]
    
    hoursFields.forEach(hours => {
      if (hours && typeof hours === 'string') {
        const timeParts = hours.split(':')
        if (timeParts.length >= 2) {
          const h = parseInt(timeParts[0]) || 0
          const m = parseInt(timeParts[1]) || 0
          totalMinutes += (h * 60) + m
        }
      }
    })
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  function getTotalDistanceForRegistro(registro) {
    const distances = [
      registro.distancia01, registro.distancia02, registro.distancia03,
      registro.distancia04, registro.distancia05, registro.distancia06
    ]
    
    return distances.reduce((total, distance) => {
      const num = parseFloat(distance) || 0
      return total + num
    }, 0)
  }

  return {
    // State
    registros,
    selectedRegistro,
    availableYears,
    currentYear,
    loading,
    error,
    
    // Getters
    registrosCount,
    hasRegistros,
    internosCount,
    externosCount,
    totalHoursWorked,
    registrosWithFolhas,
    registrosWithRemote,
    
    // Actions
    fetchRegistrosForYear,
    fetchAvailableYears,
    fetchRegistroById,
    createRegistro,
    updateRegistro,
    deleteRegistro,
    searchRegistros,
    
    // Utilities
    clearError,
    setCurrentYear,
    clearSelectedRegistro,
    getYearFromDate,
    formatTime,
    formatDate,
    formatDateTime,
    getTotalClientsForRegistro,
    getTotalHoursForRegistro,
    getTotalDistanceForRegistro
  }
})
