'use client';

import { useEffect } from 'react';

interface FlashMessageProps {
  message: string;
  kind: 'success' | 'error' | '';
  onDismiss: () => void;
  autoDismissDelay?: number;
}

/**
 * Reusable flash message component
 * Displays success or error messages with styling
 */
export default function FlashMessage({
  message,
  kind,
  onDismiss,
  autoDismissDelay = 5000,
}: FlashMessageProps) {
  useEffect(() => {
    if (message && autoDismissDelay > 0) {
      const timer = setTimeout(onDismiss, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [message, autoDismissDelay, onDismiss]);

  if (!message || !kind) return null;

  const baseStyles = 'px-4 py-2 rounded-md text-sm font-medium transition-all duration-300';
  const kindStyles = {
    success: 'bg-green-100 text-green-800 border border-green-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
  };

  return (
    <div
      className={`${baseStyles} ${kindStyles[kind]} flex items-center justify-between gap-3`}
      role="alert"
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 inline-flex text-current hover:opacity-70"
        aria-label="Dismiss message"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
