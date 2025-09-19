import { useState, useEffect, useCallback, useMemo } from 'react';
import { isMobileDevice, getNetworkQuality, debounce, throttle } from '@/lib/performance';

/**
 * Hook for mobile-optimized data fetching
 */
export function useMobileOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const isMobile = useMemo(() => isMobileDevice(), []);
  const networkQuality = useMemo(() => getNetworkQuality(), []);
  
  // Adjust stale time based on network quality
  const adjustedStaleTime = useMemo(() => {
    const baseStaleTime = options?.staleTime ?? 5 * 60 * 1000; // 5 minutes
    
    if (networkQuality === 'slow') {
      return baseStaleTime * 2; // Cache longer on slow networks
    }
    return baseStaleTime;
  }, [networkQuality, options?.staleTime]);
  
  const executeQuery = useCallback(async () => {
    if (!options?.enabled && options?.enabled !== undefined) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Query failed'));
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, options?.enabled]);
  
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);
  
  return {
    data,
    isLoading,
    error,
    refetch: executeQuery,
    isMobile,
    networkQuality
  };
}

/**
 * Hook for mobile-optimized form inputs with debouncing
 */
export function useMobileInput(initialValue: string = '', delay: number = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  const isMobile = useMemo(() => isMobileDevice(), []);
  
  // Use longer debounce on mobile to reduce API calls
  const adjustedDelay = isMobile ? delay * 1.5 : delay;
  
  const debouncedSetValue = useCallback(
    debounce((newValue: string) => {
      setDebouncedValue(newValue);
    }, adjustedDelay),
    [adjustedDelay]
  );
  
  useEffect(() => {
    debouncedSetValue(value);
  }, [value, debouncedSetValue]);
  
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);
  
  return {
    value,
    debouncedValue,
    onChange: handleChange,
    setValue,
    isMobile
  };
}

/**
 * Hook for mobile-optimized scroll handling
 */
export function useMobileScroll(handler: () => void, delay: number = 100) {
  const isMobile = useMemo(() => isMobileDevice(), []);
  
  // Use throttle for scroll events to improve performance
  const throttledHandler = useCallback(
    throttle(handler, isMobile ? delay * 2 : delay),
    [handler, delay, isMobile]
  );
  
  useEffect(() => {
    window.addEventListener('scroll', throttledHandler, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandler);
  }, [throttledHandler]);
  
  return { isMobile };
}

/**
 * Hook for mobile-optimized image loading
 */
export function useMobileImage(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  
  const isMobile = useMemo(() => isMobileDevice(), []);
  const networkQuality = useMemo(() => getNetworkQuality(), []);
  
  useEffect(() => {
    if (!src) return;
    
    // On slow networks, defer image loading
    if (networkQuality === 'slow') {
      const timer = setTimeout(() => {
        setImageSrc(src);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    setImageSrc(src);
  }, [src, networkQuality]);
  
  useEffect(() => {
    if (!imageSrc) return;
    
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(new Error('Failed to load image'));
    img.src = imageSrc;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);
  
  return {
    src: imageSrc,
    isLoaded,
    error,
    isMobile,
    networkQuality
  };
}

/**
 * Hook for mobile-optimized virtual scrolling
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  const isMobile = useMemo(() => isMobileDevice(), []);
  
  // Increase overscan on mobile for smoother scrolling
  const adjustedOverscan = isMobile ? overscan * 2 : overscan;
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - adjustedOverscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + adjustedOverscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, adjustedOverscan, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, isMobile ? 16 : 8), // Throttle more on mobile
    [isMobile]
  );
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: handleScroll,
    isMobile
  };
}

/**
 * Hook for mobile performance monitoring
 */
export function useMobilePerformanceMonitor() {
  const isMobile = useMemo(() => isMobileDevice(), []);
  
  const measureRender = useCallback((componentName: string) => {
    if (!isMobile) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 16) { // More than one frame (60fps)
        console.warn(`Slow render on mobile: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }, [isMobile]);
  
  return { measureRender, isMobile };
}