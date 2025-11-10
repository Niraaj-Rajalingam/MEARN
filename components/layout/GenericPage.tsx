'use client'

import { useState, ReactNode } from 'react';
import Link from 'next/link';

export interface GenericPageProps {
  title: string;
  description: string;
  searchPlaceholder?: string;
  submitLabel?: string;
  onSearch?: (query: string) => void;
  onSubmit?: () => void;
  showSearch?: boolean;
  showSubmit?: boolean;
  homeHref?: string;
  children: ReactNode;
}

export default function GenericPage({
  title,
  description,
  searchPlaceholder = "Search...",
  submitLabel = "Submit",
  onSearch,
  onSubmit,
  showSearch = true,
  showSubmit = true,
  homeHref,
  children
}: GenericPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-4 sm:py-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 p-4 sm:p-8 border rounded-lg bg-card">
        <div className="space-y-2 sm:space-y-3 text-center">
          <div className={`flex justify-end ${!homeHref ? 'hidden' : ''}`}>
            <Link
              href={homeHref || '/'}
              className="text-xs sm:text-sm font-medium text-primary hover:underline"
            >
              Home
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className={`space-y-2 ${!showSearch ? 'hidden' : ''}`}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            {children}
          </div>

          <button
            onClick={handleSubmit}
            className={`w-full px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-md hover:opacity-90 active:opacity-75 touch-manipulation ${!showSubmit ? 'hidden' : ''}`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
