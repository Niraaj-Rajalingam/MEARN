'use client';

import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/components/ThemeProvider';
import {
  COLOR_MODE_OPTIONS,
  THEME_OPTIONS,
  type ColorMode,
  type ThemeName,
} from '@/app/utils/theme';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, mode, setMode } = useTheme();

  const handleLogout = async () => {
    try {
      await logoutAction();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleThemeChange = (value: ThemeName) => () => {
    setTheme(value);
  };

  const handleModeChange = (value: ColorMode) => () => {
    setMode(value);
  };

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
              {THEME_OPTIONS.map((themeOption) => (
                <button
                  key={themeOption.value}
                  type="button"
                  onClick={handleThemeChange(themeOption.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    theme === themeOption.value
                      ? 'border-primary/70 bg-muted/60 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  )}
                  aria-pressed={theme === themeOption.value}
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-lg flex-shrink-0 ${themeOption.previewClass}`} />
                  <span className="text-xs font-medium text-center break-words">
                    {themeOption.label}
                  </span>
                  {theme === themeOption.value && (
                    <Check className="absolute top-1 right-1 h-3 w-3 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 md:mb-4">Dark Mode</h3>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
              {COLOR_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={handleModeChange(option.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    mode === option.value
                      ? 'border-primary/70 bg-muted/60 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  )}
                  aria-pressed={mode === option.value}
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-lg flex-shrink-0 ${option.previewClass}`} />
                  <span className="text-xs sm:text-sm font-medium text-center">{option.label}</span>
                  {mode === option.value && (
                    <Check className="absolute top-1 right-1 h-3 w-3 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
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
