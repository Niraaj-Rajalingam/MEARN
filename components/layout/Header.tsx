'use client'

import { logoutAction } from '@/app/actions/auth';
import { User } from '@/app/types/user.type';

interface HeaderProps {
  user?: User | null;
}

import { useState } from 'react';

export function Header({ user }: HeaderProps) {
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logoutAction();
      setError(null);
    } catch (err) {
      setError('Logout failed. Please try again.');
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">MEARN Tamagotchi</h1>

        <nav className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {user.first_name || user.user_email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:opacity-90"
              >
                Logout
              </button>
            </>
          )}
        </nav>
        {error && (
          <div className="text-sm text-red-600 mt-2">
            {error}
          </div>
        )}
      </div>
    </header>
  );
}