/**
 * Example showcasing how to use the theming system
 * 
 * The app now supports:
 * 1. Dark mode / Light mode / System preference
 * 2. 8 accent colors: indigo, pink, orange, green, purple, blue, red, teal
 * 
 * Theming is applied via:
 * - CSS custom properties (--accent, --accent-foreground, etc.)
 * - Tailwind utilities (bg-accent, text-accent, etc.)
 * - Material UI components (automatically themed via MuiThemeProvider)
 */

// Example 1: Using Tailwind classes with accent color
export function AccentButton() {
    return (
        <button className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-4 py-2 rounded">
            Accent Button
        </button>
    );
}

// Example 2: Using Material UI Button (automatically themed)
import { Button } from '@mui/material';

export function MuiButton() {
    return (
        <Button variant="contained" color="primary">
            MUI Button
        </Button>
    );
}

// Example 3: Using theme context in a client component
'use client';

import { useTheme } from '@/app/components/ThemeProvider';

export function ThemeAwareComponent() {
    const { themeMode, accentColor, effectiveTheme } = useTheme();

    return (
        <div>
            <p>Current theme mode: {themeMode}</p>
            <p>Effective theme: {effectiveTheme}</p>
            <p>Accent color: {accentColor}</p>
        </div>
    );
}

// Example 4: Programmatically changing theme
export function ThemeController() {
    const { setThemeMode, setAccentColor } = useTheme();

    return (
        <div>
            <button onClick={() => setThemeMode('dark')}>
                Dark Mode
            </button>
            <button onClick={() => setAccentColor('pink')}>
                Pink Accent
            </button>
        </div>
    );
}
