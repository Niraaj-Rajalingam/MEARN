'use client'

import { useState, ReactNode } from 'react';

export interface GenericPageProps {
  title: string;
  description: string;
  searchPlaceholder?: string;
  submitLabel?: string;
  onSearch?: (query: string) => void;
  onSubmit?: () => void;
  showSearch?: boolean;
  showSubmit?: boolean;
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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 border rounded-lg bg-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-6">
          {showSearch && (
            <div className="space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          <div className="space-y-4">
            {children}
          </div>

          {showSubmit && (
            <button
              onClick={handleSubmit}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
