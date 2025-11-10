'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({
  children,
  isLoading = false,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'w-full px-3 py-3 rounded-full font-medium text-primary-foreground transition-all duration-200 active:opacity-75 touch-manipulation whitespace-nowrap';

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 disabled:opacity-60',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-60',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
