/**
 * Debounce utility with flush capability
 * Ensures final state is always saved even on unmount
 */

/**
 * Debounced function with flush method
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  flush(): void;
  cancel(): void;
}

/**
 * Create a debounced function that delays execution
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with flush and cancel methods
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      lastArgs = null;
      timeoutId = null;
    }, delay);
  };

  /**
   * Immediately execute pending function call
   */
  debouncedFn.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  /**
   * Cancel pending function call
   */
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return debouncedFn;
}
