import { ref, onBeforeUnmount, getCurrentInstance } from 'vue';

/**
 * Performance optimization utilities for Vue components
 */
export function usePerformanceOptimizations() {
  const cleanupFunctions: (() => void)[] = [];

  /**
   * Creates a debounced function that delays invoking func until after wait milliseconds
   * have elapsed since the last time the debounced function was invoked.
   */
  const createDebounced = <T extends (...args: any[]) => any>(
    func: T,
    wait: number = 300
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: number | null = null;

    const debouncedFunction = (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
        timeoutId = null;
      }, wait);
    };

    // Add cleanup function
    cleanupFunctions.push(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });

    return debouncedFunction;
  };

  /**
   * Creates a throttled function that only invokes func at most once per every wait milliseconds.
   */
  const createThrottled = <T extends (...args: any[]) => any>(
    func: T,
    wait: number = 300
  ): ((...args: Parameters<T>) => void) => {
    let lastCallTime = 0;
    let timeoutId: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    const throttledFunction = (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgs = args;

      if (now - lastCallTime >= wait) {
        lastCallTime = now;
        func(...args);
      } else if (!timeoutId) {
        timeoutId = setTimeout(
          () => {
            lastCallTime = Date.now();
            if (lastArgs) {
              func(...lastArgs);
            }
            timeoutId = null;
          },
          wait - (now - lastCallTime)
        );
      }
    };

    // Add cleanup function
    cleanupFunctions.push(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });

    return throttledFunction;
  };

  /**
   * Creates a simple cache with automatic cleanup
   */
  const createCache = <K, V>() => {
    const cache = new Map<K, V>();

    const get = (key: K): V | undefined => cache.get(key);
    const set = (key: K, value: V): void => {
      cache.set(key, value);
    };
    const has = (key: K): boolean => cache.has(key);
    const clear = (): void => cache.clear();
    const size = (): number => cache.size;

    // Add cleanup function
    cleanupFunctions.push(() => {
      cache.clear();
    });

    return {
      get,
      set,
      has,
      clear,
      size,
    };
  };

  /**
   * Creates a lazy loader that only executes the loader function once
   */
  const createLazyLoader = <T>(loader: () => Promise<T>) => {
    let promise: Promise<T> | null = null;
    let result: T | null = null;
    let isLoading = ref(false);
    let error = ref<Error | null>(null);

    const load = async (): Promise<T> => {
      if (result !== null) {
        return result;
      }

      if (promise) {
        return promise;
      }

      isLoading.value = true;
      error.value = null;

      promise = loader()
        .then(data => {
          result = data;
          return data;
        })
        .catch(err => {
          error.value = err;
          promise = null; // Allow retry on error
          throw err;
        })
        .finally(() => {
          isLoading.value = false;
        });

      return promise;
    };

    const reset = () => {
      promise = null;
      result = null;
      isLoading.value = false;
      error.value = null;
    };

    // Add cleanup function
    cleanupFunctions.push(() => {
      reset();
    });

    return {
      load,
      reset,
      isLoading: isLoading.value,
      error: error.value,
      result,
    };
  };

  /**
   * Cleanup all performance optimization resources
   */
  const cleanup = () => {
    cleanupFunctions.forEach(fn => fn());
    cleanupFunctions.length = 0;
  };

  // Auto-cleanup on component unmount (only if in component context)
  if (getCurrentInstance()) {
    onBeforeUnmount(cleanup);
  }

  return {
    createDebounced,
    createThrottled,
    createCache,
    createLazyLoader,
    cleanup,
  };
}
