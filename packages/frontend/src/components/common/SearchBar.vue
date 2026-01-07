<template>
  <div class="search-bar">
    <div class="relative">
      <!-- Search input -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            class="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          class="form-input pl-10 pr-4 py-3 w-full text-base"
          @input="handleSearch"
          @keydown.enter="handleEnter"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        
        <!-- Clear button -->
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute inset-y-0 right-0 pr-3 flex items-center touch-target"
          type="button"
          aria-label="Limpar pesquisa"
        >
          <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Search suggestions (placeholder for future implementation) -->
      <div 
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <ul class="py-1">
          <li
            v-for="(suggestion, index) in suggestions"
            :key="index"
            @click="selectSuggestion(suggestion)"
            class="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
          >
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Filter buttons (mobile-optimized) -->
    <div v-if="filters.length > 0" class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="filter in filters"
        :key="filter.key"
        @click="toggleFilter(filter.key)"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-full border transition-colors duration-200',
          {
            'bg-primary-100 text-primary-700 border-primary-300': filter.active,
            'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': !filter.active
          }
        ]"
      >
        {{ filter.label }}
        <span v-if="filter.count !== undefined" class="ml-1 text-xs">
          ({{ filter.count }})
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Filter {
  key: string
  label: string
  active: boolean
  count?: number
}

interface Props {
  placeholder?: string
  modelValue?: string
  filters?: Filter[]
  suggestions?: string[]
  debounceMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pesquisar...',
  modelValue: '',
  filters: () => [],
  suggestions: () => [],
  debounceMs: 300
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [query: string]
  'filter': [filters: Filter[]]
  'clear': []
  'focus': []
  'blur': []
}>()

const searchQuery = ref(props.modelValue)
const showSuggestions = ref(false)
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

const handleSearch = () => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // Debounce search
  searchTimeout.value = setTimeout(() => {
    emit('update:modelValue', searchQuery.value)
    emit('search', searchQuery.value)
  }, props.debounceMs)
}

const handleEnter = () => {
  // Immediate search on Enter
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  emit('update:modelValue', searchQuery.value)
  emit('search', searchQuery.value)
}

const handleFocus = () => {
  showSuggestions.value = true
  emit('focus')
}

const handleBlur = () => {
  // Delay hiding suggestions to allow for clicks
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
  emit('blur')
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('update:modelValue', '')
  emit('search', '')
  emit('clear')
}

const selectSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  emit('update:modelValue', suggestion)
  emit('search', suggestion)
}

const toggleFilter = (filterKey: string) => {
  const updatedFilters = props.filters.map(filter => 
    filter.key === filterKey 
      ? { ...filter, active: !filter.active }
      : filter
  )
  emit('filter', updatedFilters)
}
</script>

<style scoped>
.search-bar {
  @apply w-full;
}

/* Mobile-optimized input styling */
.form-input {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200;
  /* Prevent zoom on iOS */
  font-size: 16px;
}

@media (min-width: 768px) {
  .form-input {
    font-size: 14px;
  }
}

/* Touch-friendly clear button */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Suggestion dropdown styling */
.suggestion-item {
  @apply px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0;
}

/* Filter button animations */
button {
  transition: all 0.2s ease-in-out;
}

button:active {
  transform: scale(0.95);
}

/* Accessibility improvements */
.form-input:focus {
  box-shadow: 0 0 0 3px rgba(117, 174, 147, 0.1);
}

/* Loading state (for future use) */
.search-bar.loading .form-input {
  @apply opacity-50 pointer-events-none;
}

.search-bar.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid theme('colors.primary.500');
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}
</style>