'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Generic reusable input component
 * Standardizes input styling across the application
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    const baseStyles = 'w-full px-3 py-2 border rounded-md bg-background';
    const errorStyles = error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500';
    const focusStyles = 'focus:outline-none focus:ring-2 focus:border-transparent';

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${errorStyles} ${focusStyles} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
