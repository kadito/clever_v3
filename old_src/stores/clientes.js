import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useClientesStore = defineStore('clientes', () => {
  // State
  const clientes = ref([])
  const selectedCliente = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const clientesCount = computed(() => clientes.value.length)
  const hasClientes = computed(() => clientes.value.length > 0)

  // Actions
  async function fetchClientes() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/clientes')
      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`)
      }
      
      const data = await response.json()
      clientes.value = data
      console.log('Clientes fetched:', data.length)
    } catch (err) {
      error.value = err.message
      console.error('Error fetching clientes:', err)
    } finally {
      loading.value = false
    }
  }

  function searchClientes(query) {
    if (!query || query.trim().length < 2) {
      return {
        results: clientes.value,
        count: clientes.value.length
      }
    }

    const searchTerm = query.trim().toLowerCase()
    
    const results = clientes.value.filter(cliente => {
      // Search in multiple fields
      const nomeComercial = (cliente.nomeComercial || '').toLowerCase()
      const nomeEmpresa = (cliente.nomeEmpresa || '').toLowerCase()
      const contribuinte = (cliente.contribuinte || '').toLowerCase()
      const localidade = (cliente.localidade || '').toLowerCase()
      const responsavel = (cliente.responsavel || '').toLowerCase()
      const telefoneContato = (cliente.telefoneContato || '').toLowerCase()
      const email = (cliente.email || '').toLowerCase()
      
      return nomeComercial.includes(searchTerm) ||
             nomeEmpresa.includes(searchTerm) ||
             contribuinte.includes(searchTerm) ||
             localidade.includes(searchTerm) ||
             responsavel.includes(searchTerm) ||
             telefoneContato.includes(searchTerm) ||
             email.includes(searchTerm)
    })

    console.log(`Client-side search for "${query}": ${results.length} results`)
    
    return {
      results,
      count: results.length
    }
  }

  async function fetchClienteById(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/clientes/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch client: ${response.status}`)
      }
      
      const cliente = await response.json()
      selectedCliente.value = cliente
      console.log('Cliente fetched:', cliente)
      return cliente
    } catch (err) {
      error.value = err.message
      console.error('Error fetching cliente:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createCliente(clienteData) {
    loading.value = true
    error.value = null
    
    try {
      // Generate UUID for the new cliente and any nested objects
      const clienteWithId = {
        ...clienteData,
        id: uuidv4(),
        // Generate UUIDs for software entries
        softwares: clienteData.softwares?.map(software => ({
          ...software,
          id: software.id || uuidv4()
        })) || []
      }
      
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clienteWithId)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create client: ${response.status}`)
      }
      
      const newCliente = await response.json()
      clientes.value.unshift(newCliente)
      console.log('Cliente created:', newCliente)
      return newCliente
    } catch (err) {
      error.value = err.message
      console.error('Error creating cliente:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCliente(id, clienteData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clienteData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update client: ${response.status}`)
      }
      
      const updatedCliente = await response.json()
      
      // Update in local store
      const index = clientes.value.findIndex(c => c.id === id)
      if (index !== -1) {
        clientes.value[index] = updatedCliente
      }
      
      // Update selected cliente if it's the same one
      if (selectedCliente.value && selectedCliente.value.id === id) {
        selectedCliente.value = updatedCliente
      }
      
      console.log('Cliente updated:', updatedCliente)
      return updatedCliente
    } catch (err) {
      error.value = err.message
      console.error('Error updating cliente:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCliente(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete client: ${response.status}`)
      }
      
      // Remove from local store
      const index = clientes.value.findIndex(c => c.id === id)
      if (index !== -1) {
        clientes.value.splice(index, 1)
      }
      
      // Clear selected cliente if it was deleted
      if (selectedCliente.value && selectedCliente.value.id === id) {
        selectedCliente.value = null
      }
      
      console.log('Cliente deleted:', id)
    } catch (err) {
      error.value = err.message
      console.error('Error deleting cliente:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function clearSelectedCliente() {
    selectedCliente.value = null
  }

  return {
    // State
    clientes,
    selectedCliente,
    loading,
    error,
    // Getters
    clientesCount,
    hasClientes,
    // Actions
    fetchClientes,
    searchClientes,
    fetchClienteById,
    createCliente,
    updateCliente,
    deleteCliente,
    clearError,
    clearSelectedCliente
  }
}) 