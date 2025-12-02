import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualList } from '@/hooks/use-mobile-performance';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  overscan?: number;
  className?: string;
  emptyState?: React.ReactNode;
  animationDelay?: number;
  showAllItems?: boolean;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  className = '',
  emptyState,
  animationDelay = 0.03,
  showAllItems = false,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedItemsRef = useRef<Set<string | number>>(new Set());
  const [, forceUpdate] = useState(0);

  const {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
  } = useVirtualList(items, itemHeight, containerHeight, overscan);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    onScroll(e);
  }, [onScroll]);

  const markAnimated = useCallback((key: string | number) => {
    if (!animatedItemsRef.current.has(key)) {
      animatedItemsRef.current.add(key);
    }
  }, []);

  const checkShouldAnimate = useCallback((key: string | number): boolean => {
    return !animatedItemsRef.current.has(key);
  }, []);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  if (showAllItems || items.length <= 20) {
    return (
      <div className={className}>
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const key = keyExtractor(item);
            const shouldAnimate = checkShouldAnimate(key);
            
            return (
              <motion.div
                key={key}
                initial={shouldAnimate ? { opacity: 0, y: 15 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{
                  duration: 0.25,
                  delay: shouldAnimate ? index * animationDelay : 0,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                onAnimationComplete={() => markAnimated(key)}
              >
                {renderItem(item, index, true)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  const startIndex = Math.max(0, Math.floor(offsetY / itemHeight));

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, localIndex) => {
              const globalIndex = startIndex + localIndex;
              const key = keyExtractor(item);
              const shouldAnimate = checkShouldAnimate(key);

              return (
                <motion.div
                  key={key}
                  initial={shouldAnimate ? { opacity: 0, y: 15 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.2,
                    delay: shouldAnimate ? localIndex * 0.02 : 0,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  onAnimationComplete={() => markAnimated(key)}
                  style={{ height: itemHeight }}
                >
                  {renderItem(item, globalIndex, true)}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerHeight: number;
  columns: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  gap?: number;
  className?: string;
  emptyState?: React.ReactNode;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerHeight,
  columns,
  renderItem,
  keyExtractor,
  gap = 16,
  className = '',
  emptyState,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedItemsRef = useRef<Set<string | number>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  const overscan = 2;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  const visibleItems: Array<{ item: T; row: number; col: number; index: number }> = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < items.length) {
        visibleItems.push({ item: items[index], row, col, index });
      }
    }
  }

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const markAnimated = useCallback((key: string | number) => {
    if (!animatedItemsRef.current.has(key)) {
      animatedItemsRef.current.add(key);
    }
  }, []);

  const checkShouldAnimate = useCallback((key: string | number): boolean => {
    return !animatedItemsRef.current.has(key);
  }, []);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  if (items.length <= columns * 4) {
    return (
      <div 
        className={`grid gap-4 ${className}`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const key = keyExtractor(item);
            const shouldAnimate = checkShouldAnimate(key);
            
            return (
              <motion.div
                key={key}
                initial={shouldAnimate ? { opacity: 0, y: 20, scale: 0.95 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.3,
                  delay: shouldAnimate ? index * 0.05 : 0,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                onAnimationComplete={() => markAnimated(key)}
              >
                {renderItem(item, index)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <AnimatePresence mode="popLayout">
          {visibleItems.map(({ item, row, col, index }) => {
            const key = keyExtractor(item);
            const shouldAnimate = checkShouldAnimate(key);
            const localIndex = index - startRow * columns;

            return (
              <motion.div
                key={key}
                initial={shouldAnimate ? { opacity: 0, y: 20, scale: 0.95 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.25,
                  delay: shouldAnimate ? localIndex * 0.03 : 0,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                onAnimationComplete={() => markAnimated(key)}
                style={{
                  position: 'absolute',
                  top: row * rowHeight,
                  left: col * (itemWidth + gap),
                  width: itemWidth,
                  height: itemHeight,
                }}
              >
                {renderItem(item, index)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function InfiniteScrollList<T>({
  items,
  itemHeight,
  renderItem,
  keyExtractor,
  onLoadMore,
  hasMore,
  isLoading,
  className = '',
  emptyState,
  loadingIndicator,
}: {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
  emptyState?: React.ReactNode;
  loadingIndicator?: React.ReactNode;
}) {
  const observerRef = useRef<HTMLDivElement>(null);
  const animatedItemsRef = useRef<Set<string | number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  const markAnimated = useCallback((key: string | number) => {
    if (!animatedItemsRef.current.has(key)) {
      animatedItemsRef.current.add(key);
    }
  }, []);

  const checkShouldAnimate = useCallback((key: string | number): boolean => {
    return !animatedItemsRef.current.has(key);
  }, []);

  if (items.length === 0 && emptyState && !isLoading) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const key = keyExtractor(item);
          const shouldAnimate = checkShouldAnimate(key);
          const recentlyAdded = index >= items.length - 10;

          return (
            <motion.div
              key={key}
              initial={shouldAnimate ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                duration: 0.25,
                delay: shouldAnimate && recentlyAdded ? (index % 10) * 0.03 : 0,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              onAnimationComplete={() => markAnimated(key)}
              style={{ minHeight: itemHeight }}
            >
              {renderItem(item, index)}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div ref={observerRef} className="h-4" />

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 flex justify-center"
        >
          {loadingIndicator || (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function CollapsibleList<T>({
  items,
  renderItem,
  keyExtractor,
  initialVisible = 5,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  className = '',
  emptyState,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  initialVisible?: number;
  showMoreLabel?: string;
  showLessLabel?: string;
  className?: string;
  emptyState?: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const seenItemsRef = useRef<Set<string | number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = isExpanded ? items : items.slice(0, initialVisible);
  const hasMore = items.length > initialVisible;

  const checkAndMarkSeen = useCallback((key: string | number): boolean => {
    if (seenItemsRef.current.has(key)) {
      return false;
    }
    seenItemsRef.current.add(key);
    return true;
  }, []);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div ref={containerRef} className={className}>
      <AnimatePresence mode="sync">
        {visibleItems.map((item, index) => {
          const key = keyExtractor(item);
          const shouldAnimate = checkAndMarkSeen(key);
          const isNewlyVisible = isExpanded && index >= initialVisible;

          return (
            <motion.div
              key={key}
              initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.2,
                delay: shouldAnimate && isNewlyVisible ? (index - initialVisible) * 0.025 : (shouldAnimate ? Math.min(index * 0.025, 0.15) : 0),
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {renderItem(item, index)}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {hasMore && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleToggle}
          className="w-full py-3 text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="button-toggle-list-expansion"
        >
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.span>
          {isExpanded ? showLessLabel : `${showMoreLabel} (${items.length - initialVisible} more)`}
        </motion.button>
      )}
    </div>
  );
}
