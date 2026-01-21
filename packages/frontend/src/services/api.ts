import type { ApiResponse, ListResponse, BaseContent, ContentType } from '@clever/shared';

// API configuration
const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Error types for mobile-optimized error handling
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
  isRetryable?: boolean;
}

// Request options interface
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

// Search and pagination parameters
export interface SearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

class ApiService {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
  }

  /**
   * Generic HTTP request method with mobile-optimized error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = RETRY_ATTEMPTS, ...fetchOptions } = options;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Merge abort signals if provided
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const url = `${this.baseUrl}${endpoint}`;

    const requestOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    };

    let lastError: ApiError | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw await this.createApiError(response);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = this.handleRequestError(error, attempt, retries);

        // Don't retry on non-retryable errors
        if (!lastError.isRetryable || attempt === retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await this.delay(RETRY_DELAY * Math.pow(2, attempt));
      }
    }

    clearTimeout(timeoutId);
    throw lastError;
  }

  /**
   * Create standardized API error from response
   */
  private async createApiError(response: Response): Promise<ApiError> {
    let message = 'Ocorreu um erro inesperado';
    let code = 'UNKNOWN_ERROR';

    try {
      const errorData = await response.json();
      message = errorData.error || errorData.message || message;
      code = errorData.code || code;
    } catch {
      // If response is not JSON, use status text
      message = response.statusText || message;
    }

    return {
      message,
      code,
      status: response.status,
      isNetworkError: false,
      isTimeoutError: false,
      isRetryable: response.status >= 500 || response.status === 429,
    };
  }

  /**
   * Handle request errors with mobile-specific considerations
   */
  private handleRequestError(error: any, attempt: number, maxRetries: number): ApiError {
    // Network errors (offline, DNS issues, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        message: 'Sem ligação à internet. Verifique a sua ligação.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
        isTimeoutError: false,
        isRetryable: true,
      };
    }

    // Timeout errors
    if (error.name === 'AbortError') {
      return {
        message: 'A ligação demorou muito tempo. Tente novamente.',
        code: 'TIMEOUT_ERROR',
        isNetworkError: false,
        isTimeoutError: true,
        isRetryable: true,
      };
    }

    // API errors
    if (error.message && error.code) {
      return error as ApiError;
    }

    // Generic error
    return {
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      code: 'GENERIC_ERROR',
      isNetworkError: false,
      isTimeoutError: false,
      isRetryable: attempt < maxRetries,
    };
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build query string from search parameters
   */
  private buildQueryString(params: SearchParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  // CRUD Operations

  /**
   * Get list of content items with search and pagination
   */
  async getContentList<T extends BaseContent>(
    contentType: ContentType,
    params: SearchParams = {},
    options: RequestOptions = {}
  ): Promise<ListResponse<T>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/content/${contentType}${queryString ? `?${queryString}` : ''}`;

    return this.request<ListResponse<T>>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Get single content item by ID
   */
  async getContentById<T extends BaseContent>(
    contentType: ContentType,
    id: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(`/content/${contentType}/${id}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Create new content item
   */
  async createContent<T extends BaseContent>(
    contentType: ContentType,
    data: Partial<T>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const endpoint = `/content/${contentType}`;

    return this.request<ApiResponse<T>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Update existing content item
   */
  async updateContent<T extends BaseContent>(
    contentType: ContentType,
    id: string,
    data: Partial<T>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(`/content/${contentType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Delete content item (soft delete)
   */
  async deleteContent(
    contentType: ContentType,
    id: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/content/${contentType}/${id}`, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Search content across multiple types
   */
  async searchContent<T extends BaseContent>(
    query: string,
    contentTypes: ContentType[] = [],
    params: Omit<SearchParams, 'search'> = {},
    options: RequestOptions = {}
  ): Promise<ListResponse<T>> {
    const searchParams = {
      ...params,
      search: query,
      types: contentTypes.length > 0 ? contentTypes.join(',') : undefined,
    };

    const queryString = this.buildQueryString(searchParams);
    const endpoint = `/search${queryString ? `?${queryString}` : ''}`;

    return this.request<ListResponse<T>>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  // Utility methods

  /**
   * Check if the API is available (health check)
   */
  async healthCheck(options: RequestOptions = {}): Promise<boolean> {
    try {
      await this.request('/health', {
        method: 'GET',
        timeout: 5000, // Shorter timeout for health check
        retries: 1,
        ...options,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API status and version information
   */
  async getStatus(options: RequestOptions = {}): Promise<
    ApiResponse<{
      version: string;
      status: string;
      timestamp: string;
    }>
  > {
    return this.request<
      ApiResponse<{
        version: string;
        status: string;
        timestamp: string;
      }>
    >('/status', {
      method: 'GET',
      ...options,
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export content type helpers
export const CONTENT_TYPES: ContentType[] = [
  'clients',
  'contracts',
  'licenses',
  'work-sheets',
  'daily-records',
  'remote-assistance',
  'reminders',
  'pending',
];

// Mobile-specific utilities
export const isMobileConnection = (): boolean => {
  // Check if running on mobile device with potentially slower connection
  if (typeof navigator === 'undefined') return false;

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (connection) {
    // Consider 2G, slow-2g, or save-data as mobile/slow connections
    return (
      connection.effectiveType === '2g' ||
      connection.effectiveType === 'slow-2g' ||
      connection.saveData === true
    );
  }

  // Fallback: check user agent for mobile devices
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Adjust API timeouts based on connection
export const getOptimalTimeout = (): number => {
  return isMobileConnection() ? 15000 : DEFAULT_TIMEOUT; // 15s for mobile, 10s for desktop
};

// Create mobile-optimized API service instance
export const mobileApiService = new ApiService(API_BASE_URL, getOptimalTimeout());
