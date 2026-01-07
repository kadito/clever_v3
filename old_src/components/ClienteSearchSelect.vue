<template>
  <div class="cliente-search-select">
    <div class="search-input-wrapper">
      <input
        type="text"
        :id="inputId"
        v-model="searchQuery"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        @click="handleFocus"
        :placeholder="selectedCliente ? (selectedCliente.name || selectedCliente.nomeComercial || selectedCliente.nomeEmpresa) : placeholder"
        :disabled="disabled || loading"
        :required="required"
        class="form-control search-input"
        autocomplete="off"
      />
      <span v-if="loading" class="search-loading">⏳</span>
      <span v-else class="search-icon">🔍</span>
    </div>
    
    <!-- Dropdown with search results -->
    <div 
      v-if="showDropdown" 
      class="dropdown-results"
    >
      <div v-if="filteredClientes.length === 0 && !loading && searchQuery.length === 0" class="dropdown-item no-results">
        Comece a escrever para pesquisar...
      </div>
      <div v-else-if="filteredClientes.length === 0 && !loading && searchQuery.length > 0" class="dropdown-item no-results">
        Nenhum cliente encontrado
      </div>
      <div v-else-if="loading" class="dropdown-item no-results">
        A carregar...
      </div>
      <div 
        v-for="cliente in filteredClientes" 
        :key="cliente.id"
        @mousedown.prevent="selectCliente(cliente)"
        class="dropdown-item"
        :class="{ 'selected': selectedCliente?.id === cliente.id }"
      >
        <div class="cliente-name">{{ cliente.name || cliente.nomeComercial || cliente.nomeEmpresa || 'Sem nome' }}</div>
        <div class="cliente-meta">
          <span v-if="cliente.nif || cliente.contribuinte" class="cliente-nif">NIF: {{ cliente.nif || cliente.contribuinte }}</span>
          <span v-if="cliente.responsavel" class="cliente-responsavel">{{ cliente.responsavel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useClientesStore } from '@/stores/clientes.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  inputId: {
    type: String,
    default: 'cliente-search'
  },
  placeholder: {
    type: String,
    default: 'Pesquisar cliente...'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  // If true, stores cliente name instead of ID (for backward compatibility)
  storeName: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const clientesStore = useClientesStore()
const { clientes, loading } = storeToRefs(clientesStore)

const searchQuery = ref('')
const showDropdown = ref(false)
const selectedCliente = ref(null)
const searchTimeout = ref(null)

const searchResults = ref([])

// Filter clientes based on search query
const filteredClientes = computed(() => {
  // If we have search results from API and a query, use those
  if (searchQuery.value && searchQuery.value.length >= 2 && searchResults.value.length > 0) {
    return searchResults.value
  }
  
  // If no search query or query is too short, show all loaded clientes (limited)
  if (!searchQuery.value || searchQuery.value.length < 2) {
    // Show first 50 clientes if no search query
    return clientes.value.slice(0, 50)
  }
  
  // Filter from loaded clientes for short queries
  const query = searchQuery.value.toLowerCase()
  return clientes.value.filter(cliente => {
    const name = (cliente.nomeComercial || cliente.nomeEmpresa || '').toLowerCase()
    const nif = (cliente.contribuinte || '').toLowerCase()
    const responsavel = (cliente.responsavel || '').toLowerCase()
    
    return name.includes(query) || nif.includes(query) || responsavel.includes(query)
  }).slice(0, 50) // Limit to 50 results
})

// Handle search input
const handleSearch = async () => {
  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // If user is typing something different from selected cliente, clear selection
  const currentDisplayName = selectedCliente.value ? (selectedCliente.value.nomeComercial || selectedCliente.value.nomeEmpresa || selectedCliente.value.name || '') : ''
  if (searchQuery.value !== currentDisplayName) {
    selectedCliente.value = null
    emit('update:modelValue', '')
  }
  
  // If search query is long enough, use API search
  if (searchQuery.value && searchQuery.value.length >= 2) {
    searchTimeout.value = setTimeout(async () => {
      try {
        const response = await fetch(`/api/clientes/search?q=${encodeURIComponent(searchQuery.value)}`)
        if (response.ok) {
          const data = await response.json()
          // Store search results - these are index entries with id, name, nif, responsavel
          searchResults.value = data.results || []
        }
      } catch (error) {
        console.error('Error searching clientes:', error)
        searchResults.value = []
      }
    }, 300) // Debounce API calls
  } else {
    // Clear search results and load all clientes if search is cleared
    searchResults.value = []
    if (clientes.value.length === 0) {
      await clientesStore.fetchClientes()
    }
  }
  
  showDropdown.value = true
}

// Handle focus
const handleFocus = () => {
  showDropdown.value = true
  // Load clientes if not loaded
  if (clientes.value.length === 0 && !loading.value) {
    clientesStore.fetchClientes()
  }
  // If there's a selected cliente and user clicks, allow them to search again
  // Don't clear automatically - let them decide
}

// Handle blur - delay to allow click events
const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Select a cliente
const selectCliente = async (cliente) => {
  // If cliente is from search results (index entry), fetch full cliente data
  let fullCliente = cliente
  if (cliente.id && (!cliente.nomeComercial && !cliente.nomeEmpresa && cliente.name)) {
    // This is an index entry, fetch full cliente
    try {
      fullCliente = await clientesStore.fetchClienteById(cliente.id)
      if (!fullCliente) {
        // Fallback to index entry if fetch fails
        fullCliente = cliente
      }
    } catch (error) {
      console.error('Error fetching full cliente:', error)
      fullCliente = cliente
    }
  }
  
  selectedCliente.value = fullCliente
  const displayName = fullCliente.nomeComercial || fullCliente.nomeEmpresa || fullCliente.name || ''
  searchQuery.value = displayName
  
  // Emit the value based on storeName prop
  const value = props.storeName ? displayName : fullCliente.id
  emit('update:modelValue', value)
  emit('change', fullCliente)
  
  showDropdown.value = false
  searchResults.value = [] // Clear search results
}

// Watch for external changes to modelValue
watch(() => props.modelValue, async (newValue, oldValue) => {
  // Only update if value actually changed
  if (newValue === oldValue) return
  
  if (!newValue) {
    selectedCliente.value = null
    searchQuery.value = ''
    return
  }
  
  // Find cliente by ID or name in loaded clientes
  let cliente = clientes.value.find(c => 
    c.id === newValue || c.nomeComercial === newValue || c.nomeEmpresa === newValue
  )
  
  // If not found and it looks like an ID, try fetching
  if (!cliente && newValue && newValue.length > 10) {
    try {
      cliente = await clientesStore.fetchClienteById(newValue)
    } catch (error) {
      console.error('Error fetching cliente:', error)
    }
  }
  
  if (cliente) {
    selectedCliente.value = cliente
    const displayName = cliente.nomeComercial || cliente.nomeEmpresa || ''
    // Only update searchQuery if user isn't actively typing
    if (!showDropdown.value) {
      searchQuery.value = displayName
    }
  }
}, { immediate: true })

// Load clientes on mount
onMounted(async () => {
  if (clientes.value.length === 0) {
    await clientesStore.fetchClientes()
  }
  
  // If modelValue is set, find and select the cliente
  if (props.modelValue) {
    const cliente = clientes.value.find(c => 
      c.id === props.modelValue || c.nomeComercial === props.modelValue || c.nomeEmpresa === props.modelValue
    )
    if (cliente) {
      selectedCliente.value = cliente
      searchQuery.value = cliente.nomeComercial || cliente.nomeEmpresa || ''
    }
  }
})
</script>

<style scoped>
.cliente-search-select {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
}

.search-input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.search-loading,
.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 1rem;
}

.dropdown-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: -1px;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.selected {
  background-color: var(--primary-light);
  color: var(--primary-dark);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.cliente-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.cliente-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6c757d;
}

.cliente-nif,
.cliente-responsavel {
  display: inline-block;
}

.no-results {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 1rem;
}


/* Mobile optimizations */
@media (max-width: 768px) {
  .dropdown-results {
    max-height: 200px;
  }
  
  .dropdown-item {
    padding: 0.5rem 0.75rem;
  }
  
  .cliente-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>

