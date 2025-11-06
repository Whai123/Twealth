// Mobile Performance Optimization Utilities

/**
 * Lazy load images with intersection observer for mobile
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
 if (typeof window === 'undefined') return src;
 
 // Return placeholder for mobile until image is in viewport
 const isMobile = window.innerWidth < 768;
 if (!isMobile) return src;
 
 // Create placeholder data URL for mobile
 const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPgo8L3N2Zz4=';
 return placeholder;
}

/**
 * Detect mobile network speed and adjust loading behavior
 */
export function getNetworkQuality(): 'slow' | 'fast' | 'unknown' {
 if (typeof navigator === 'undefined' || !('connection' in navigator)) {
  return 'unknown';
 }
 
 const connection = (navigator as any).connection;
 if (!connection) return 'unknown';
 
 // Detect slow connections (2G, slow-2g)
 if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
  return 'slow';
 }
 
 // Consider 3G and above as fast
 return 'fast';
}

/**
 * Preload critical resources for mobile
 */
export function preloadCriticalResources() {
 if (typeof window === 'undefined') return;
 
 const isMobile = window.innerWidth < 768;
 if (!isMobile) return;
 
 // Preload critical fonts for mobile
 const criticalFonts = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
 ];
 
 criticalFonts.forEach(font => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = font;
  document.head.appendChild(link);
 });
}

/**
 * Debounce function for mobile input optimization
 */
export function debounce<T extends (...args: any[]) => any>(
 func: T,
 wait: number,
 immediate?: boolean
): (...args: Parameters<T>) => void {
 let timeout: NodeJS.Timeout | null = null;
 
 return function executedFunction(...args: Parameters<T>) {
  const later = () => {
   timeout = null;
   if (!immediate) func(...args);
  };
  
  const callNow = immediate && !timeout;
  
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(later, wait);
  
  if (callNow) func(...args);
 };
}

/**
 * Throttle function for scroll events on mobile
 */
export function throttle<T extends (...args: any[]) => any>(
 func: T,
 limit: number
): (...args: Parameters<T>) => void {
 let inThrottle = false;
 
 return function executedFunction(...args: Parameters<T>) {
  if (!inThrottle) {
   func(...args);
   inThrottle = true;
   setTimeout(() => inThrottle = false, limit);
  }
 };
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
 if (typeof window === 'undefined') return false;
 
 return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
 ) || window.innerWidth < 768;
}

/**
 * Mobile-optimized intersection observer
 */
export function createMobileIntersectionObserver(
 callback: IntersectionObserverCallback,
 options?: IntersectionObserverInit
): IntersectionObserver | null {
 if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
  return null;
 }
 
 const defaultOptions: IntersectionObserverInit = {
  // Larger root margin on mobile for earlier loading
  rootMargin: isMobileDevice() ? '50px' : '10px',
  threshold: 0.1,
  ...options
 };
 
 return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Reduce bundle size by conditionally loading features
 */
export async function loadFeatureOnDemand<T>(
 featureLoader: () => Promise<T>,
 condition: boolean = true
): Promise<T | null> {
 if (!condition) return null;
 
 try {
  return await featureLoader();
 } catch (error) {
  console.warn('Failed to load feature on demand:', error);
  return null;
 }
}

/**
 * Performance monitoring for mobile
 */
export class MobilePerformanceMonitor {
 private static instance: MobilePerformanceMonitor;
 private metrics: Map<string, number> = new Map();
 
 static getInstance(): MobilePerformanceMonitor {
  if (!this.instance) {
   this.instance = new MobilePerformanceMonitor();
  }
  return this.instance;
 }
 
 startTiming(name: string): void {
  this.metrics.set(name, performance.now());
 }
 
 endTiming(name: string): number {
  const startTime = this.metrics.get(name);
  if (startTime === undefined) return 0;
  
  const duration = performance.now() - startTime;
  this.metrics.delete(name);
  
  // Log slow operations on mobile
  if (isMobileDevice() && duration > 100) {
   console.warn(`Slow operation on mobile: ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return duration;
 }
 
 measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
  this.startTiming(name);
  return asyncFn().finally(() => {
   this.endTiming(name);
  });
 }
}