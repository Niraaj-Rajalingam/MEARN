'use client'

import { useState, ReactNode } from 'react';

export interface GenericListItem {
  id: string;
  title: string;
  subtitle?: string;
  [key: string]: any;
}

export interface GenericListProps {
  items: GenericListItem[];
  onAction?: (itemId: string) => void | Promise<void>;
  actionLabel?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  renderCustomItem?: (item: GenericListItem) => ReactNode;
}

export default function GenericList({
  items,
  onAction,
  actionLabel = 'Action',
  isLoading = false,
  emptyMessage = 'No items found.',
  renderCustomItem
}: GenericListProps) {
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  const handleAction = async (itemId: string) => {
    if (!onAction) return;

    setProcessingItem(itemId);
    try {
      await onAction(itemId);
    } finally {
      setProcessingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 border rounded-md bg-card"
        >
          {renderCustomItem ? (
            renderCustomItem(item)
          ) : (
            <>
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
              {onAction && (
                <button
                  onClick={() => handleAction(item.id)}
                  disabled={processingItem === item.id}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {processingItem === item.id ? 'Processing...' : actionLabel}
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
