import { ref, computed } from 'vue';
import type { ApiError } from '../services/api';

// Error display configuration
interface ErrorDisplayConfig {
  showToast: boolean;
  showModal: boolean;
  autoHide: boolean;
  hideDelay: number;
}

// Error notification interface
interface ErrorNotification {
  id: string;
  error: ApiError;
  timestamp: Date;
  dismissed: boolean;
  config: ErrorDisplayConfig;
}

// Global error state
const errors = ref<ErrorNotification[]>([]);
const nextId = ref(1);

/**
 * Composable for handling and displaying API errors in a mobile-friendly way
 */
export function useErrorHandler() {
  // Default configuration for mobile-optimized error display
  const defaultConfig: ErrorDisplayConfig = {
    showToast: true,
    showModal: false,
    autoHide: true,
    hideDelay: 5000, // 5 seconds
  };

  // Computed properties
  const activeErrors = computed(() => errors.value.filter(notification => !notification.dismissed));

  const hasErrors = computed(() => activeErrors.value.length > 0);

  const networkErrors = computed(() =>
    activeErrors.value.filter(notification => notification.error.isNetworkError)
  );

  const retryableErrors = computed(() =>
    activeErrors.value.filter(notification => notification.error.isRetryable)
  );

  // Methods

  /**
   * Add error to the global error state
   */
  const addError = (error: ApiError, config: Partial<ErrorDisplayConfig> = {}): string => {
    const id = `error-${nextId.value++}`;
    const finalConfig = { ...defaultConfig, ...config };

    const notification: ErrorNotification = {
      id,
      error,
      timestamp: new Date(),
      dismissed: false,
      config: finalConfig,
    };

    errors.value.push(notification);

    // Auto-hide if configured
    if (finalConfig.autoHide) {
      setTimeout(() => {
        dismissError(id);
      }, finalConfig.hideDelay);
    }

    return id;
  };

  /**
   * Dismiss specific error
   */
  const dismissError = (id: string) => {
    const notification = errors.value.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
    }
  };

  /**
   * Dismiss all errors
   */
  const dismissAllErrors = () => {
    errors.value.forEach(notification => {
      notification.dismissed = true;
    });
  };

  /**
   * Clear dismissed errors from memory
   */
  const clearDismissedErrors = () => {
    errors.value = errors.value.filter(notification => !notification.dismissed);
  };

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = (error: ApiError): string => {
    // Network-specific messages for mobile users
    if (error.isNetworkError) {
      return 'Sem ligação à internet. Verifique a sua ligação e tente novamente.';
    }

    if (error.isTimeoutError) {
      return 'A ligação demorou muito tempo. Tente novamente.';
    }

    // HTTP status specific messages
    switch (error.status) {
      case 400:
        return 'Dados inválidos. Verifique os campos e tente novamente.';
      case 401:
        return 'Sessão expirada. Faça login novamente.';
      case 403:
        return 'Não tem permissão para realizar esta ação.';
      case 404:
        return 'O item solicitado não foi encontrado.';
      case 409:
        return 'Conflito de dados. O item pode ter sido modificado por outro utilizador.';
      case 429:
        return 'Muitas tentativas. Aguarde um momento e tente novamente.';
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      case 503:
        return 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
      default:
        return error.message || 'Ocorreu um erro inesperado.';
    }
  };

  /**
   * Get error action suggestions
   */
  const getErrorActions = (
    error: ApiError
  ): Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }> => {
    const actions: Array<{
      label: string;
      action: () => void;
      primary?: boolean;
    }> = [];

    // Retry action for retryable errors
    if (error.isRetryable) {
      actions.push({
        label: 'Tentar Novamente',
        action: () => {
          // This will be implemented by the component using the error
        },
        primary: true,
      });
    }

    // Network-specific actions
    if (error.isNetworkError) {
      actions.push({
        label: 'Verificar Ligação',
        action: () => {
          // Open network settings or show connection status
          if ('navigator' in window && 'onLine' in navigator) {
            if (!navigator.onLine) {
              alert('Dispositivo offline. Verifique a sua ligação à internet.');
            } else {
              alert('Ligação ativa. O problema pode ser temporário.');
            }
          }
        },
      });
    }

    // Always provide dismiss action
    actions.push({
      label: 'Dispensar',
      action: () => {
        // Will be handled by the component
      },
    });

    return actions;
  };

  /**
   * Handle error with automatic categorization and display
   */
  const handleError = (
    error: ApiError,
    context?: string,
    config?: Partial<ErrorDisplayConfig>
  ): string => {
    // Add context to error message if provided
    const contextualError = context ? { ...error, message: `${context}: ${error.message}` } : error;

    // Determine display configuration based on error type
    const errorConfig: Partial<ErrorDisplayConfig> = {
      ...config,
    };

    // Critical errors should show modal
    if (error.status === 401 || error.status === 403) {
      errorConfig.showModal = true;
      errorConfig.showToast = false;
      errorConfig.autoHide = false;
    }

    // Network errors should persist longer
    if (error.isNetworkError) {
      errorConfig.hideDelay = 10000; // 10 seconds
    }

    return addError(contextualError, errorConfig);
  };

  /**
   * Create error handler function for use in components
   */
  const createErrorHandler = (context: string) => {
    return (error: ApiError, config?: Partial<ErrorDisplayConfig>) => {
      return handleError(error, context, config);
    };
  };

  return {
    // State
    errors: activeErrors,
    hasErrors,
    networkErrors,
    retryableErrors,

    // Methods
    addError,
    dismissError,
    dismissAllErrors,
    clearDismissedErrors,
    handleError,
    createErrorHandler,

    // Utilities
    getErrorMessage,
    getErrorActions,
  };
}

// Global error handler instance
export const globalErrorHandler = useErrorHandler();

// Vue error handler integration
export const setupGlobalErrorHandler = (app: any) => {
  app.config.errorHandler = (error: any, instance: any, info: string) => {
    console.error('Vue Error:', error, info);

    // Convert to ApiError format
    const apiError: ApiError = {
      message: error.message || 'Erro na aplicação',
      code: 'VUE_ERROR',
      isNetworkError: false,
      isTimeoutError: false,
      isRetryable: false,
    };

    globalErrorHandler.handleError(apiError, `Erro Vue (${info})`);
  };
};
