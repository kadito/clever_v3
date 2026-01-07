<template>
  <Teleport to="body">
    <!-- Error Toast Notifications -->
    <div 
      v-if="hasToastErrors"
      class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full sm:max-w-md"
    >
      <Transition
        v-for="notification in toastErrors"
        :key="notification.id"
        name="toast"
        appear
      >
        <div
          class="bg-white border-l-4 rounded-lg shadow-lg p-4 flex items-start space-x-3"
          :class="getToastClasses(notification.error)"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg 
              v-if="notification.error.isNetworkError"
              class="w-5 h-5 text-orange-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <svg 
              v-else-if="notification.error.isRetryable"
              class="w-5 h-5 text-yellow-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg 
              v-else
              class="w-5 h-5 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">
              {{ getErrorTitle(notification.error) }}
            </p>
            <p class="text-sm text-gray-600 mt-1">
              {{ getErrorMessage(notification.error) }}
            </p>
            
            <!-- Actions -->
            <div v-if="getErrorActions(notification.error).length > 0" class="mt-3 flex space-x-2">
              <button
                v-for="action in getErrorActions(notification.error).slice(0, 2)"
                :key="action.label"
                @click="handleAction(action, notification.id)"
                class="text-xs font-medium px-2 py-1 rounded transition-colors duration-200"
                :class="action.primary 
                  ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                "
              >
                {{ action.label }}
              </button>
            </div>
          </div>
          
          <!-- Dismiss button -->
          <button
            @click="dismissError(notification.id)"
            class="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 touch-target"
            aria-label="Dispensar"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Transition>
    </div>
    
    <!-- Error Modal for Critical Errors -->
    <div
      v-if="hasModalErrors"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <Transition
          name="modal-overlay"
          appear
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        </Transition>
        
        <!-- Modal panel -->
        <Transition
          name="modal-panel"
          appear
        >
          <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div v-for="notification in modalErrors" :key="notification.id">
              <div class="sm:flex sm:items-start">
                <!-- Icon -->
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <!-- Content -->
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {{ getErrorTitle(notification.error) }}
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      {{ getErrorMessage(notification.error) }}
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  v-for="(action, index) in getErrorActions(notification.error)"
                  :key="action.label"
                  @click="handleAction(action, notification.id)"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  :class="[
                    action.primary 
                      ? 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
                    index > 0 ? 'mt-3 sm:mt-0' : ''
                  ]"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useErrorHandler } from '../../composables/useErrorHandler'
import type { ApiError } from '../../services/api'

const { 
  errors, 
  dismissError, 
  getErrorMessage, 
  getErrorActions 
} = useErrorHandler()

// Computed properties
const toastErrors = computed(() => 
  errors.value.filter(notification => notification.config.showToast)
)

const modalErrors = computed(() => 
  errors.value.filter(notification => notification.config.showModal)
)

const hasToastErrors = computed(() => toastErrors.value.length > 0)
const hasModalErrors = computed(() => modalErrors.value.length > 0)

// Methods
const getErrorTitle = (error: ApiError): string => {
  if (error.isNetworkError) return 'Problema de Ligação'
  if (error.isTimeoutError) return 'Tempo Limite Excedido'
  if (error.status === 401) return 'Sessão Expirada'
  if (error.status === 403) return 'Acesso Negado'
  if (error.status === 404) return 'Não Encontrado'
  if (error.status === 500) return 'Erro do Servidor'
  return 'Erro'
}

const getToastClasses = (error: ApiError): string => {
  if (error.isNetworkError) return 'border-orange-500'
  if (error.isRetryable) return 'border-yellow-500'
  return 'border-red-500'
}

const handleAction = (action: any, notificationId: string) => {
  if (action.label === 'Dispensar') {
    dismissError(notificationId)
  } else {
    action.action()
    // Optionally dismiss after action
    if (action.primary) {
      dismissError(notificationId)
    }
  }
}
</script>

<style scoped>
/* Toast transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Modal transitions */
.modal-overlay-enter-active,
.modal-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
  opacity: 0;
}

.modal-panel-enter-active,
.modal-panel-leave-active {
  transition: all 0.3s ease;
}

.modal-panel-enter-from {
  opacity: 0;
  transform: translateY(4px) scale(0.95);
}

.modal-panel-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.95);
}

/* Touch-friendly targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile-specific adjustments */
@media (max-width: 639px) {
  .fixed.top-4.right-4 {
    @apply top-2 right-2 left-2 max-w-none;
  }
}
</style>