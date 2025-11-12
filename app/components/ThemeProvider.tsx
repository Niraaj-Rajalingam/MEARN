'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MuiRootThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
    MODE_STORAGE_KEY,
    THEME_OPTIONS,
    THEME_STORAGE_KEY,
    type ColorMode,
    type ThemeName,
} from '@/app/utils/theme';

interface ThemeContextValue {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    mode: ColorMode;
    setMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyThemeTokens = (theme: ThemeName, mode: ColorMode) => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty('color-scheme', mode);

    if (mode === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};

const getInitialMode = (): ColorMode => {
    if (typeof window === 'undefined') {
        return 'light';
    }
    const stored = localStorage.getItem(MODE_STORAGE_KEY) as ColorMode | null;
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const VALID_THEME_VALUES = new Set(THEME_OPTIONS.map((option) => option.value));

const getInitialTheme = (): ThemeName => {
    if (typeof window === 'undefined') {
        return 'default';
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
    return stored && VALID_THEME_VALUES.has(stored) ? stored : 'default';
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>('default');
    const [mode, setModeState] = useState<ColorMode>('light');
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const initialTheme = getInitialTheme();
        const initialMode = getInitialMode();
        setThemeState(initialTheme);
        setModeState(initialMode);
        applyThemeTokens(initialTheme, initialMode);
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated || typeof window === 'undefined') {
            return;
        }
        applyThemeTokens(theme, mode);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        localStorage.setItem(MODE_STORAGE_KEY, mode);
    }, [theme, mode, hydrated]);

    const setTheme = useCallback((nextTheme: ThemeName) => {
        setThemeState(nextTheme);
    }, []);

    const setMode = useCallback((nextMode: ColorMode) => {
        setModeState(nextMode);
    }, []);

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme,
            setTheme,
            mode,
            setMode,
        }),
        [theme, setTheme, mode, setMode],
    );

    const muiTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode],
    );

    return (
        <ThemeContext.Provider value={value}>
            <MuiRootThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </MuiRootThemeProvider>
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
