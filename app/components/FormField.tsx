'use client';

import { ReactNode } from 'react';

interface FormFieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
  helpText?: string;
  required?: boolean;
}

/**
 * Generic reusable form field wrapper component
 * Handles label, error display, and help text
 */
export default function FormField({
  label,
  error,
  children,
  helpText,
  required = false,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
