'use client'

import { logoutAction } from '@/app/actions/auth';
import { User } from '@/app/types/user.type';

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-lg sm:text-xl font-bold">MEARN Tamagotchi</h1>

        <nav className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {user && (
            <>
              <span className="text-xs sm:text-sm text-muted-foreground break-all">
                Welcome, {user.first_name || user.user_email}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-destructive text-destructive-foreground rounded-md hover:opacity-90 active:opacity-75 touch-manipulation whitespace-nowrap"
                >
                  Logout
                </button>
              </form>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}