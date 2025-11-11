'use client';

import { useState, useEffect } from 'react';
import Input from './Input';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  confirmInputValue: string;
  onConfirmInputChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Generic reusable delete confirmation modal
 * Requires user to type the item name to confirm deletion
 */
export default function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  itemName,
  confirmInputValue,
  onConfirmInputChange,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setLocalLoading(isLoading);
  }, [isLoading]);

  const isConfirmDisabled = confirmInputValue.trim() !== itemName.trim() || localLoading;

  const handleConfirm = async () => {
    setLocalLoading(true);
    try {
      await onConfirm();
    } finally {
      setLocalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <p className="text-gray-700 font-semibold mb-4">
          Type <span className="bg-gray-100 px-2 py-1 rounded">{itemName}</span> to confirm:
        </p>
        <Input
          type="text"
          value={confirmInputValue}
          onChange={(e) => onConfirmInputChange(e.target.value)}
          placeholder={`Enter "${itemName}" to confirm`}
          disabled={localLoading}
          className="mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={localLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="flex-1 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {localLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
