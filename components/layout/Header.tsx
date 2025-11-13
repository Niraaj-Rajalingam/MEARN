'use client'

import { User } from '@/app/types/user.type';
import { Settings } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-3">
        <h1 className="text-lg sm:text-xl font-bold">MEARN Tamagotchi</h1>

        <nav className="flex items-center gap-2 sm:gap-4">
          {user && (
            <>
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                Welcome, {user.first_name || user.user_email}
              </span>
              <Link
                href={`/dashboard/${user.user_uuid}/settings`}
                className="p-2 rounded-md hover:bg-muted transition-colors flex-shrink-0"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}