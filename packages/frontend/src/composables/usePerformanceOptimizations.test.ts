import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePerformanceOptimizations } from './usePerformanceOptimizations'

describe('usePerformanceOptimizations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createDebounced', () => {
    it('should debounce function calls', () => {
      const { createDebounced, cleanup } = usePerformanceOptimizations()
      const mockFn = vi.fn()
      const debouncedFn = createDebounced(mockFn, 100)

      // Call multiple times quickly
      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast forward time
      vi.advanceTimersByTime(100)

      // Should have been called once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
      
      // Manual cleanup for test
      cleanup()
    })

    it('should reset debounce timer on new calls', () => {
      const { createDebounced, cleanup } = usePerformanceOptimizations()
      const mockFn = vi.fn()
      const debouncedFn = createDebounced(mockFn, 100)

      debouncedFn('arg1')
      vi.advanceTimersByTime(50)
      
      debouncedFn('arg2') // This should reset the timer
      vi.advanceTimersByTime(50)
      
      // Should not have been called yet (timer was reset)
      expect(mockFn).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(50)
      
      // Now it should be called
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg2')
      
      // Manual cleanup for test
      cleanup()
    })
  })

  describe('createThrottled', () => {
    it('should throttle function calls', () => {
      const { createThrottled, cleanup } = usePerformanceOptimizations()
      const mockFn = vi.fn()
      const throttledFn = createThrottled(mockFn, 100)

      // First call should execute immediately
      throttledFn('arg1')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')

      // Subsequent calls within the throttle period should be ignored
      throttledFn('arg2')
      throttledFn('arg3')
      expect(mockFn).toHaveBeenCalledTimes(1)

      // After the throttle period, the last call should execute
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('arg3')
      
      // Manual cleanup for test
      cleanup()
    })
  })

  describe('createCache', () => {
    it('should create a functional cache', () => {
      const { createCache, cleanup } = usePerformanceOptimizations()
      const cache = createCache<string, number>()

      // Test set and get
      cache.set('key1', 100)
      expect(cache.get('key1')).toBe(100)
      expect(cache.has('key1')).toBe(true)
      expect(cache.size()).toBe(1)

      // Test non-existent key
      expect(cache.get('key2')).toBeUndefined()
      expect(cache.has('key2')).toBe(false)

      // Test clear
      cache.clear()
      expect(cache.size()).toBe(0)
      expect(cache.has('key1')).toBe(false)
      
      // Manual cleanup for test
      cleanup()
    })
  })

  describe('createLazyLoader', () => {
    it('should load data only once', async () => {
      const { createLazyLoader, cleanup } = usePerformanceOptimizations()
      const mockLoader = vi.fn().mockResolvedValue('loaded data')
      const lazyLoader = createLazyLoader(mockLoader)

      // First load
      const result1 = await lazyLoader.load()
      expect(result1).toBe('loaded data')
      expect(mockLoader).toHaveBeenCalledTimes(1)

      // Second load should return cached result
      const result2 = await lazyLoader.load()
      expect(result2).toBe('loaded data')
      expect(mockLoader).toHaveBeenCalledTimes(1) // Still only called once
      
      // Manual cleanup for test
      cleanup()
    })

    it('should handle loading errors', async () => {
      const { createLazyLoader, cleanup } = usePerformanceOptimizations()
      const mockLoader = vi.fn().mockRejectedValue(new Error('Load failed'))
      const lazyLoader = createLazyLoader(mockLoader)

      // First load should fail
      await expect(lazyLoader.load()).rejects.toThrow('Load failed')
      expect(mockLoader).toHaveBeenCalledTimes(1)

      // Second load should retry (not cached on error)
      await expect(lazyLoader.load()).rejects.toThrow('Load failed')
      expect(mockLoader).toHaveBeenCalledTimes(2)
      
      // Manual cleanup for test
      cleanup()
    })

    it('should reset properly', async () => {
      const { createLazyLoader, cleanup } = usePerformanceOptimizations()
      const mockLoader = vi.fn().mockResolvedValue('loaded data')
      const lazyLoader = createLazyLoader(mockLoader)

      // Load data
      await lazyLoader.load()
      expect(mockLoader).toHaveBeenCalledTimes(1)

      // Reset and load again
      lazyLoader.reset()
      await lazyLoader.load()
      expect(mockLoader).toHaveBeenCalledTimes(2) // Should call loader again
      
      // Manual cleanup for test
      cleanup()
    })
  })
})