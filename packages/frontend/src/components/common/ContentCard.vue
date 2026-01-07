<template>
  <div 
    class="content-card group"
    :class="{ 'content-card--clickable': clickable }"
    @click="handleClick"
  >
    <!-- Card header -->
    <div class="content-card__header">
      <!-- Icon/Avatar -->
      <div class="content-card__icon">
        <slot name="icon">
          <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <span class="text-primary-600 text-lg">{{ defaultIcon }}</span>
          </div>
        </slot>
      </div>
      
      <!-- Title and subtitle -->
      <div class="content-card__title-section">
        <h3 class="content-card__title">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="content-card__subtitle">
          {{ subtitle }}
        </p>
      </div>
      
      <!-- Actions -->
      <div class="content-card__actions">
        <slot name="actions">
          <button
            v-if="clickable"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-target"
            @click.stop="$emit('action')"
            aria-label="Mais opções"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </slot>
      </div>
    </div>
    
    <!-- Card content -->
    <div v-if="$slots.default || description" class="content-card__content">
      <slot>
        <p v-if="description" class="text-gray-600 text-sm">
          {{ description }}
        </p>
      </slot>
    </div>
    
    <!-- Card footer -->
    <div v-if="$slots.footer || showMetadata" class="content-card__footer">
      <slot name="footer">
        <div v-if="showMetadata" class="flex items-center justify-between text-xs text-gray-500">
          <span v-if="createdAt">
            Criado: {{ formatDate(createdAt) }}
          </span>
          <span v-if="updatedAt">
            Atualizado: {{ formatDate(updatedAt) }}
          </span>
        </div>
      </slot>
    </div>
    
    <!-- Status indicator -->
    <div 
      v-if="status"
      class="content-card__status"
      :class="`content-card__status--${status}`"
    >
      <div class="w-2 h-2 rounded-full"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  subtitle?: string
  description?: string
  clickable?: boolean
  status?: 'active' | 'inactive' | 'pending' | 'error'
  createdAt?: string | Date
  updatedAt?: string | Date
  showMetadata?: boolean
  contentType?: string
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  showMetadata: false
})

const emit = defineEmits<{
  click: []
  action: []
}>()

const defaultIcon = computed(() => {
  const icons: Record<string, string> = {
    'clientes': '👥',
    'contratos': '📋',
    'licencas': '🔑',
    'folhas-obra': '📝',
    'registo-diario': '📅',
    'assistencias-remotas': '🔧',
    'agendamentos': '⏰',
    'equipa': '👨‍💼'
  }
  
  return icons[props.contentType || ''] || '📄'
})

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

const formatDate = (date: string | Date): string => {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
.content-card {
  @apply bg-white rounded-lg border border-gray-200 p-4 relative transition-all duration-200;
}

.content-card--clickable {
  @apply cursor-pointer hover:shadow-md hover:border-primary-200;
}

.content-card--clickable:hover {
  @apply transform -translate-y-0.5;
}

.content-card--clickable:active {
  @apply transform translate-y-0;
}

.content-card__header {
  @apply flex items-start space-x-3 mb-3;
}

.content-card__icon {
  @apply flex-shrink-0;
}

.content-card__title-section {
  @apply flex-1 min-w-0;
}

.content-card__title {
  @apply text-base font-semibold text-gray-900 truncate;
}

.content-card__subtitle {
  @apply text-sm text-gray-600 truncate mt-1;
}

.content-card__actions {
  @apply flex-shrink-0;
}

.content-card__content {
  @apply mb-3;
}

.content-card__footer {
  @apply pt-3 border-t border-gray-100;
}

.content-card__status {
  @apply absolute top-2 right-2;
}

.content-card__status--active .w-2 {
  @apply bg-green-500;
}

.content-card__status--inactive .w-2 {
  @apply bg-gray-400;
}

.content-card__status--pending .w-2 {
  @apply bg-yellow-500;
}

.content-card__status--error .w-2 {
  @apply bg-red-500;
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .content-card {
    @apply p-3;
  }
  
  .content-card__header {
    @apply space-x-2 mb-2;
  }
  
  .content-card__title {
    @apply text-sm;
  }
  
  .content-card__subtitle {
    @apply text-xs;
  }
}

/* Touch feedback for mobile */
@media (hover: none) and (pointer: coarse) {
  .content-card--clickable:hover {
    @apply transform-none shadow-sm;
  }
  
  .content-card--clickable:active {
    @apply bg-gray-50 transform scale-95;
  }
}

/* Accessibility improvements */
.content-card--clickable:focus {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

/* Loading state */
.content-card.loading {
  @apply opacity-50 pointer-events-none;
}

.content-card.loading .content-card__title,
.content-card.loading .content-card__subtitle {
  @apply animate-pulse bg-gray-200 text-transparent rounded;
}

/* Touch target improvements */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>