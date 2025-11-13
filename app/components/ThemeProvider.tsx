'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeMode, AccentColor, getAccentColorValue, ACCENT_COLORS } from '@/app/types/theme.type';

type ThemeContextType = {
    themeMode: ThemeMode;
    accentColor: AccentColor;
    effectiveTheme: 'light' | 'dark'; // Resolved theme (system -> light or dark)
    setThemeMode: (mode: ThemeMode) => void;
    setAccentColor: (color: AccentColor) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
    children: ReactNode;
    initialThemeMode?: ThemeMode;
    initialAccentColor?: AccentColor;
};

export function ThemeProvider({
    children,
    initialThemeMode = 'light',
    initialAccentColor = 'indigo'
}: ThemeProviderProps) {
    const [themeMode, setThemeModeState] = useState<ThemeMode>(initialThemeMode);
    const [accentColor, setAccentColorState] = useState<AccentColor>(initialAccentColor);
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

    // Resolve system theme preference
    useEffect(() => {
        if (themeMode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const updateTheme = () => {
                setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
            };

            updateTheme();
            mediaQuery.addEventListener('change', updateTheme);

            return () => mediaQuery.removeEventListener('change', updateTheme);
        } else {
            setEffectiveTheme(themeMode);
        }
    }, [themeMode]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        // Apply dark/light mode class
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Apply accent color CSS variables
        const isDark = effectiveTheme === 'dark';
        const accentValue = getAccentColorValue(accentColor, isDark);

        root.style.setProperty('--accent', accentValue);
        root.style.setProperty('--accent-foreground', isDark ? '0 0% 9%' : '0 0% 98%');

        // Also set primary to match accent for consistency across components
        root.style.setProperty('--primary', accentValue);
        root.style.setProperty('--primary-foreground', isDark ? '0 0% 9%' : '0 0% 98%');

        // Store in localStorage for persistence
        localStorage.setItem('theme-mode', themeMode);
        localStorage.setItem('accent-color', accentColor);
    }, [effectiveTheme, accentColor, themeMode]);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
    };

    const setAccentColor = (color: AccentColor) => {
        setAccentColorState(color);
    };

    return (
        <ThemeContext.Provider value={{
            themeMode,
            accentColor,
            effectiveTheme,
            setThemeMode,
            setAccentColor
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Hook to get accent color options for UI
export function useAccentColorOptions() {
    return Object.entries(ACCENT_COLORS).map(([value, config]) => ({
        value: value as AccentColor,
        name: config.name,
        lightColor: config.light,
        darkColor: config.dark,
    }));
}
