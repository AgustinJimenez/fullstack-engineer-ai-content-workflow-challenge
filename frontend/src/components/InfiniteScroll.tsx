'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUpIcon } from 'lucide-react';

interface InfiniteScrollProps<T> {
  items: T[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  error?: string | null;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  colSpan?: number; // For table layouts
  tableMode?: boolean; // Whether to render without wrapper div for table usage
}

export default function InfiniteScroll<T>({
  items,
  hasMore,
  loading,
  onLoadMore,
  renderItem,
  keyExtractor,
  className = '',
  loadingComponent,
  emptyComponent,
  errorComponent,
  error,
  threshold = 200,
  colSpan = 1,
  tableMode = false,
}: InfiniteScrollProps<T>) {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLElement>(null);
  const loadingRef = useRef(false);

  // Intersection Observer for detecting when we're near the bottom
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading && hasMore && !loadingRef.current) {
          loadingRef.current = true;
          onLoadMore();
          // Reset the loading flag after a short delay to prevent rapid firing
          setTimeout(() => {
            loadingRef.current = false;
          }, 500);
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold, items.length]); // Added items.length as dependency

  // Scroll listener for better UX feedback
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNear = scrollHeight - scrollTop - clientHeight < threshold * 2;
    setIsNearBottom(isNear);
  }, [threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    // Check initial state
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (error && items.length === 0) {
    if (tableMode) {
      return errorComponent || (
        <tr>
          <td colSpan={colSpan} className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600">{error}</p>
          </td>
        </tr>
      );
    }
    return (
      <div className={className}>
        {errorComponent || (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    if (tableMode) {
      return emptyComponent || (
        <tr>
          <td colSpan={colSpan} className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-600">No items found</p>
          </td>
        </tr>
      );
    }
    return (
      <div className={className}>
        {emptyComponent || (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-600">No items found</p>
          </div>
        )}
      </div>
    );
  }

  const content = (
    <>
      {/* Items */}
      {items.map((item, index) => renderItem(item, index))}

      {/* Loading indicator */}
      {loading && (
        tableMode ? (
          <tr>
            <td colSpan={colSpan} className="text-center py-8">
              {loadingComponent || (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Loading...</span>
                </div>
              )}
            </td>
          </tr>
        ) : (
          <div className="text-center py-8">
            {loadingComponent || (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading...</span>
              </div>
            )}
          </div>
        )
      )}

      {/* Error during loading more */}
      {error && items.length > 0 && (
        tableMode ? (
          <tr>
            <td colSpan={colSpan} className="text-center py-4">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              <Button
                onClick={onLoadMore}
                variant="link"
                size="sm"
              >
                Try again
              </Button>
            </td>
          </tr>
        ) : (
          <div className="text-center py-4">
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <Button
              onClick={onLoadMore}
              variant="link"
              size="sm"
            >
              Try again
            </Button>
          </div>
        )
      )}

      {/* End indicator */}
      {!hasMore && items.length > 0 && (
        tableMode ? (
          <tr>
            <td colSpan={colSpan} className="text-center py-8">
              <div className="inline-flex items-center text-sm text-gray-500">
                <div className="w-8 h-px bg-gray-300 mr-3"></div>
                You've reached the end
                <div className="w-8 h-px bg-gray-300 ml-3"></div>
              </div>
            </td>
          </tr>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center text-sm text-gray-500">
              <div className="w-8 h-px bg-gray-300 mr-3"></div>
              You've reached the end
              <div className="w-8 h-px bg-gray-300 ml-3"></div>
            </div>
          </div>
        )
      )}

      {/* Trigger element for intersection observer */}
      {hasMore && !loading && (
        tableMode ? (
          <tr ref={loadMoreRef as any} className="h-4">
            <td colSpan={colSpan} className="h-4 text-transparent text-xs">
              Loading more...
            </td>
          </tr>
        ) : (
          <div ref={loadMoreRef as any} className="h-4 text-transparent text-xs">
            Loading more...
          </div>
        )
      )}
    </>
  );

  if (tableMode) {
    return (
      <>
        {content}
        {/* Scroll to top button - only for non-table mode since table is inside another container */}
      </>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {content}
      
      {/* Scroll to top button */}
      {isNearBottom && items.length > 5 && (
        <Button
          onClick={() => {
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-10"
          size="icon"
          title="Scroll to top"
        >
          <ChevronUpIcon className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}