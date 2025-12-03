/**
 * Unit tests for debounce utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution by specified delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should reset delay on subsequent calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(50);

    debouncedFn('second');
    vi.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledWith('second');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should batch multiple rapid calls into single execution', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');
    debouncedFn('call4');

    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('call4');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should flush pending call immediately', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    debouncedFn.flush();
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not execute if flushed with no pending calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn.flush();
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should cancel pending call', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test');
    debouncedFn.cancel();

    vi.advanceTimersByTime(100);
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should handle async functions', async () => {
    const mockAsyncFn = vi.fn(async (value: string) => {
      return `processed: ${value}`;
    });
    const debouncedFn = debounce(mockAsyncFn, 100);

    debouncedFn('test');
    vi.advanceTimersByTime(100);

    expect(mockAsyncFn).toHaveBeenCalledWith('test');
  });

  it('should preserve last arguments when flushed', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    debouncedFn.flush();
    expect(mockFn).toHaveBeenCalledWith('third');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple executions after delay completes', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('first');

    debouncedFn('second');
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('second');

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple arguments', () => {
    const mockFn = vi.fn((a: number, b: string, c: boolean) => {});
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn(42, 'test', true);
    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith(42, 'test', true);
  });
});
