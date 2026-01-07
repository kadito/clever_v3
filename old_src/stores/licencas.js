import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useLicencasStore = defineStore('licencas', () => {
  // State
  const licencas = ref([])
  const selectedLicenca = ref(null)
  const availableYears = ref([])
  const currentYear = ref(new Date().getFullYear().toString())
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const licencasCount = computed(() => licencas.value.length)
  const hasLicencas = computed(() => licencas.value.length > 0)

  // Computed for license statistics
  const activeLicenses = computed(() => 
    licencas.value.filter(l => {
      if (!l.dataFim) return true
      const endDate = new Date(l.dataFim)
      return endDate > new Date()
    }).length
  )
  
  const expiredLicenses = computed(() => 
    licencas.value.filter(l => {
      if (!l.dataFim) return false
      const endDate = new Date(l.dataFim)
      return endDate <= new Date()
    }).length
  )
  
  const expiringLicenses = computed(() => 
    licencas.value.filter(l => {
      if (!l.dataFim) return false
      const endDate = new Date(l.dataFim)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return endDate > new Date() && endDate <= thirtyDaysFromNow
    }).length
  )

  // API Base URL
  const API_BASE = '/api/licencas'

  // Actions
  async function fetchLicencasForYear(year = null) {
    loading.value = true
    error.value = null
    
    try {
      // Use /list endpoint with index for better performance
      const targetYear = year || null
      
      console.log('Fetching licencas for year:', targetYear || 'all years')
      
      const url = targetYear ? `${API_BASE}/list?year=${targetYear}` : `${API_BASE}/list`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch licencas: ${response.status}`)
      }
      
      const data = await response.json()
      licencas.value = data.data || []
      
      if (targetYear) {
        currentYear.value = targetYear
      }
      
      console.log('Licencas fetched:', licencas.value.length)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching licencas:', err)
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

  async function fetchLicencaById(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch licenca: ${response.status}`)
      }
      
      const licenca = await response.json()
      selectedLicenca.value = licenca
      console.log('Licenca fetched:', licenca)
      return licenca
    } catch (err) {
      error.value = err.message
      console.error('Error fetching licenca:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createLicenca(year, licencaData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${year}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(licencaData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create licenca: ${response.status}`)
      }
      
      const newLicenca = await response.json()
      
      // Add to current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        licencas.value.unshift(newLicenca)
      }
      
      console.log('Licenca created:', newLicenca)
      return newLicenca
    } catch (err) {
      error.value = err.message
      console.error('Error creating licenca:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateLicenca(year, id, licencaData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(licencaData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update licenca: ${response.status}`)
      }
      
      const updatedLicenca = await response.json()
      
      // Update in current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        const index = licencas.value.findIndex(l => l.id === id)
        if (index !== -1) {
          licencas.value[index] = updatedLicenca
        }
      }
      
      // Update selected licenca if it's the same one
      if (selectedLicenca.value && selectedLicenca.value.id === id) {
        selectedLicenca.value = updatedLicenca
      }
      
      console.log('Licenca updated:', updatedLicenca)
      return updatedLicenca
    } catch (err) {
      error.value = err.message
      console.error('Error updating licenca:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteLicenca(year, id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/${year}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete licenca: ${response.status}`)
      }
      
      // Remove from current list if we're viewing the same year
      if (currentYear.value === year.toString()) {
        const index = licencas.value.findIndex(l => l.id === id)
        if (index !== -1) {
          licencas.value.splice(index, 1)
        }
      }
      
      // Clear selected licenca if it was deleted
      if (selectedLicenca.value && selectedLicenca.value.id === id) {
        selectedLicenca.value = null
      }
      
      console.log('Licenca deleted:', id)
    } catch (err) {
      error.value = err.message
      console.error('Error deleting licenca:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function searchLicencas(query, year = null) {
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
      console.error('Error searching licencas:', err)
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

  function clearSelectedLicenca() {
    selectedLicenca.value = null
  }

  // Helper function to get year from date string
  function getYearFromDate(dateString) {
    return new Date(dateString).getFullYear()
  }

  // Helper function to calculate expiration date from start date and modalidade
  function calculateExpirationFromStart(startDate, modalidade) {
    if (!startDate) return null
    
    try {
      const date = new Date(startDate)
      if (isNaN(date.getTime())) return null
      
      const expiration = new Date(date)
      
      switch (modalidade?.toUpperCase()) {
        case 'MENSAL':
          expiration.setMonth(expiration.getMonth() + 1)
          break
        case 'TRIMESTRAL':
          expiration.setMonth(expiration.getMonth() + 3)
          break
        case 'SEMESTRAL':
          expiration.setMonth(expiration.getMonth() + 6)
          break
        case 'ANUAL':
          expiration.setFullYear(expiration.getFullYear() + 1)
          break
        default:
          expiration.setFullYear(expiration.getFullYear() + 1)
      }
      
      return expiration
    } catch {
      return null
    }
  }

  // Helper function to get validation date from licenca
  // Priority: dataVencimento > next payment date (if duracaoContrato > modalidade) > calculated from dataInicio + modalidade > dataFim (legacy)
  function getValidationDate(licenca) {
    // First priority: dataVencimento
    if (licenca.dataVencimento) {
      const date = new Date(licenca.dataVencimento)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    
    // Second priority: calculate next payment date if duracaoContrato > modalidade period
    if (licenca.dataInicio && licenca.modalidade && licenca.duracaoContrato) {
      const durationMonths = parseDuration(licenca.duracaoContrato)
      const paymentFrequencyMonths = getPaymentFrequencyMonths(licenca.modalidade)
      
      // If contract duration is greater than payment frequency, calculate next payment date
      if (durationMonths && durationMonths > paymentFrequencyMonths) {
        const paymentSchedule = calculatePaymentSchedule(licenca)
        const now = new Date()
        now.setHours(0, 0, 0, 0) // Reset time to compare dates only
        
        // Find the next payment date (closest future date) - must be strictly in the future
        for (const paymentDate of paymentSchedule) {
          const dateToCompare = new Date(paymentDate)
          dateToCompare.setHours(0, 0, 0, 0)
          // Only return dates that are strictly in the future (not today or past)
          if (dateToCompare > now) {
            return dateToCompare
          }
        }
        
        // If all payment dates are in the past, return the last one
        if (paymentSchedule.length > 0) {
          const lastDate = new Date(paymentSchedule[paymentSchedule.length - 1])
          lastDate.setHours(0, 0, 0, 0)
          return lastDate
        }
      }
      
      // Otherwise, use first expiration date (dataInicio + modalidade)
      const calculatedDate = calculateExpirationFromStart(licenca.dataInicio, licenca.modalidade)
      if (calculatedDate) {
        return calculatedDate
      }
    } else if (licenca.dataInicio && licenca.modalidade) {
      // No duracaoContrato, use first expiration date
      const calculatedDate = calculateExpirationFromStart(licenca.dataInicio, licenca.modalidade)
      if (calculatedDate) {
        return calculatedDate
      }
    }
    
    // Legacy: dataFim (for backward compatibility)
    if (licenca.dataFim) {
      const date = new Date(licenca.dataFim)
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    
    return null
  }

  // Helper function to check if license is expired
  function isLicenseExpired(licenca) {
    const validationDate = getValidationDate(licenca)
    if (!validationDate) return false
    return validationDate <= new Date()
  }

  // Helper function to check if license is expiring soon
  function isLicenseExpiringSoon(licenca) {
    const validationDate = getValidationDate(licenca)
    if (!validationDate) return false
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return validationDate > new Date() && validationDate <= thirtyDaysFromNow
  }

  // Helper function to get license status
  function getLicenseStatus(licenca) {
    if (isLicenseExpired(licenca)) return 'expired'
    if (isLicenseExpiringSoon(licenca)) return 'expiring'
    return 'active'
  }

  // Helper function to format date for display
  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-PT')
  }

  // Helper function to parse duration string (e.g., "12 meses", "24 meses", or numeric "12")
  function parseDuration(durationString) {
    if (!durationString) return null
    // Handle numeric format directly
    if (typeof durationString === 'number') {
      return durationString
    }
    // Handle string format with "meses" or "months"
    const match = String(durationString).match(/(\d+)\s*(?:meses?|months?)/i)
    if (match) {
      return parseInt(match[1])
    }
    // Try to parse as number directly
    const num = parseInt(durationString)
    if (!isNaN(num)) {
      return num
    }
    return null
  }

  // Helper function to get payment frequency in months
  function getPaymentFrequencyMonths(modalidade) {
    switch (modalidade?.toUpperCase()) {
      case 'MENSAL':
        return 1
      case 'TRIMESTRAL':
        return 3
      case 'SEMESTRAL':
        return 6
      case 'ANUAL':
        return 12
      default:
        return 12 // Default to annual
    }
  }

  // Helper function to calculate payment schedule
  // Returns array of payment dates when duracaoContrato > modalidade period
  function calculatePaymentSchedule(licenca) {
    if (!licenca.dataInicio || !licenca.modalidade || !licenca.duracaoContrato) {
      return []
    }

    const startDate = new Date(licenca.dataInicio)
    if (isNaN(startDate.getTime())) {
      return []
    }

    const durationMonths = parseDuration(licenca.duracaoContrato)
    if (!durationMonths) {
      return []
    }

    const paymentFrequencyMonths = getPaymentFrequencyMonths(licenca.modalidade)
    
    // Only calculate schedule if contract duration is greater than payment frequency
    if (durationMonths <= paymentFrequencyMonths) {
      return []
    }

    const paymentDates = []
    const currentDate = new Date(startDate)
    
    // Calculate all payment dates
    while (paymentDates.length * paymentFrequencyMonths < durationMonths) {
      paymentDates.push(new Date(currentDate))
      currentDate.setMonth(currentDate.getMonth() + paymentFrequencyMonths)
    }

    return paymentDates
  }

  return {
    // State
    licencas,
    selectedLicenca,
    availableYears,
    currentYear,
    loading,
    error,
    // Getters
    licencasCount,
    hasLicencas,
    activeLicenses,
    expiredLicenses,
    expiringLicenses,
    // Actions
    fetchLicencasForYear,
    fetchAvailableYears,
    fetchLicencaById,
    createLicenca,
    updateLicenca,
    deleteLicenca,
    searchLicencas,
    clearError,
    setCurrentYear,
    clearSelectedLicenca,
    getYearFromDate,
    calculateExpirationFromStart,
    getValidationDate,
    isLicenseExpired,
    isLicenseExpiringSoon,
    getLicenseStatus,
    formatDate,
    parseDuration,
    getPaymentFrequencyMonths,
    calculatePaymentSchedule
  }
})
