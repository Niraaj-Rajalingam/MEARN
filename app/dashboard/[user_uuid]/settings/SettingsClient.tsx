'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GenericPage from '@/components/layout/GenericPage';
import { useTheme, useAccentColorOptions } from '@/app/components/ThemeProvider';
import { ThemeMode, AccentColor } from '@/app/types/theme.type';
import { Button } from '@mui/material';
import { Moon, Sun, Monitor } from 'lucide-react';
import { updateThemePreferencesAction } from './actions';
import FlashMessage from '@/app/components/FlashMessage';
import { useFlashMessage } from '@/app/utils/hooks';

type SettingsClientProps = {
    userUuid: string;
    initialThemeMode: ThemeMode;
    initialAccentColor: AccentColor;
};

export default function SettingsClient({
    userUuid,
    initialThemeMode,
    initialAccentColor
}: SettingsClientProps) {
    const router = useRouter();
    const { themeMode, accentColor, setThemeMode, setAccentColor } = useTheme();
    const accentColorOptions = useAccentColorOptions();
    const { message, messageKind, flash, resetFlash } = useFlashMessage();

    const [isSaving, setIsSaving] = useState(false);

    const handleThemeModeChange = (mode: ThemeMode) => {
        setThemeMode(mode);
    };

    const handleAccentColorChange = (color: AccentColor) => {
        setAccentColor(color);
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        resetFlash();

        try {
            const result = await updateThemePreferencesAction(userUuid, {
                theme_mode: themeMode,
                accent_color: accentColor,
            });

            if (result.success) {
                flash('success', 'Theme preferences saved successfully!');
                router.refresh();
            } else {
                flash('error', result.error || 'Failed to save preferences');
            }
        } catch (error) {
            flash('error', 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="col-span-full flex justify-center">
            <div className="w-full max-w-2xl space-y-8">
                {message && <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />}

                {/* Theme Mode Section */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Theme Mode</h2>
                <p className="text-sm text-muted-foreground">
                    Choose how the app appears. System setting will automatically adjust based on your device preferences.
                </p>

                <div className="flex gap-3 flex-wrap">
                    <Button
                        variant={themeMode === 'light' ? 'contained' : 'outlined'}
                        onClick={() => handleThemeModeChange('light')}
                        startIcon={<Sun className="h-4 w-4" />}
                    >
                        Light
                    </Button>
                    <Button
                        variant={themeMode === 'dark' ? 'contained' : 'outlined'}
                        onClick={() => handleThemeModeChange('dark')}
                        startIcon={<Moon className="h-4 w-4" />}
                    >
                        Dark
                    </Button>
                    <Button
                        variant={themeMode === 'system' ? 'contained' : 'outlined'}
                        onClick={() => handleThemeModeChange('system')}
                        startIcon={<Monitor className="h-4 w-4" />}
                    >
                        System
                    </Button>
                </div>
            </section>

            {/* Accent Color Section */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Accent Color</h2>
                <p className="text-sm text-muted-foreground">
                    Select an accent color for buttons and interactive elements.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {accentColorOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleAccentColorChange(option.value)}
                            className={`
                  relative rounded-lg p-4 border-2 transition-all
                  ${accentColor === option.value
                                    ? 'border-foreground ring-2 ring-offset-2 ring-foreground'
                                    : 'border-border hover:border-muted-foreground'
                                }
                `}
                        >
                            <div
                                className="h-12 w-full rounded mb-2"
                                style={{
                                    backgroundColor: `hsl(${option.lightColor})`
                                }}
                            />
                            <div className="text-sm font-medium text-center">
                                {option.name}
                            </div>
                            {accentColor === option.value && (
                                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs">
                                    ✓
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outlined"
                    onClick={() => router.push(`/dashboard/${userUuid}`)}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
        </div>
    );
}
