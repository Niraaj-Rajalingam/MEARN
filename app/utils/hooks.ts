'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook for debouncing a search query or value
 * Delays execution of a callback until the value hasn't changed for the specified delay
 * @param callback The function to call after the debounce delay
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns Cleanup function for the effect
 */
export const useDebounce = (callback: () => void, delay: number = 500) => {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [callback, delay]);
};

/**
 * Hook for managing flash messages with auto-clear
 * @param autoClearDelay Time in milliseconds before auto-clearing (default: 5000ms, 0 to disable)
 * @returns Object with flash state and setter functions
 */
export const useFlashMessage = (autoClearDelay: number = 5000) => {
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'success' | 'error' | ''>('');
  const clearTimer = useRef<NodeJS.Timeout | null>(null);

  const flash = (kind: 'success' | 'error', text: string) => {
    setMessageKind(kind);
    setMessage(text);

    if (autoClearDelay > 0) {
      if (clearTimer.current) {
        clearTimeout(clearTimer.current);
      }
      clearTimer.current = setTimeout(() => {
        resetFlash();
      }, autoClearDelay);
    }
  };

  const resetFlash = () => {
    setMessage('');
    setMessageKind('');
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }
  };

  return { message, messageKind, flash, resetFlash };
};
