'use client';

import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutAction();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const colorThemes = [
    { value: 'default', label: 'Default', color: 'bg-gradient-to-r from-purple-600 to-purple-700' },
    { value: 'halloween', label: '🎃 Halloween', color: 'bg-gradient-to-r from-orange-600 to-purple-700' },
    { value: 'christmas', label: '🎄 Christmas', color: 'bg-gradient-to-r from-red-600 to-green-600' },
    { value: 'spring', label: '🌸 Spring', color: 'bg-gradient-to-r from-pink-400 to-purple-400' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-4 sm:mb-6 md:mb-8">
        <button
          onClick={() => router.back()}
          className="p-1 sm:p-2 rounded-md hover:bg-muted transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">Settings</h1>
      </div>

      <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
        {/* Theme Settings */}
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 md:mb-6">Theme Settings</h2>

          {/* Color Theme */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 md:mb-4">Color Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
              {colorThemes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  type="button"
                  className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-lg flex-shrink-0 ${themeOption.color}`} />
                  <span className="text-xs font-medium text-center break-words">
                    {themeOption.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 md:mb-4">Dark Mode</h3>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
              <button
                type="button"
                className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-lg flex-shrink-0 bg-gradient-to-r from-yellow-300 to-yellow-400" />
                <span className="text-xs sm:text-sm font-medium text-center">Light</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-lg flex-shrink-0 bg-gradient-to-r from-slate-700 to-slate-900" />
                <span className="text-xs sm:text-sm font-medium text-center">Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-card border border-destructive/20 rounded-lg p-3 sm:p-4 md:p-6">
          <h2 className="text-sm sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 md:mb-6 text-destructive">Account</h2>
          <button
            onClick={handleLogout}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-destructive text-destructive-foreground rounded-md text-xs sm:text-sm hover:opacity-90 transition-opacity font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
