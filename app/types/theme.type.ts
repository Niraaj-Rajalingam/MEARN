import { UUID } from "crypto";

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor = 'indigo' | 'pink' | 'orange' | 'green' | 'purple' | 'blue' | 'red' | 'teal';

export type ThemePreferences = {
    user_uuid: UUID;
    theme_mode: ThemeMode;
    accent_color: AccentColor;
    created_at: Date;
    updated_at: Date;
};

export type UpdateThemePreferencesDTO = {
    theme_mode?: ThemeMode;
    accent_color?: AccentColor;
};

// Predefined accent color values (HSL format for easy manipulation)
export const ACCENT_COLORS: Record<AccentColor, { light: string; dark: string; name: string }> = {
    indigo: {
        light: '239 84% 67%',  // Indigo-500
        dark: '244 58% 70%',   // Indigo-400
        name: 'Indigo'
    },
    pink: {
        light: '330 81% 60%',  // Pink-500
        dark: '330 81% 65%',   // Pink-400
        name: 'Pink'
    },
    orange: {
        light: '25 95% 53%',   // Orange-500
        dark: '31 97% 72%',    // Orange-400
        name: 'Orange'
    },
    green: {
        light: '160 84% 39%',  // Green-500
        dark: '158 64% 52%',   // Green-400
        name: 'Green'
    },
    purple: {
        light: '258 90% 66%',  // Purple-500
        dark: '258 90% 70%',   // Purple-400
        name: 'Purple'
    },
    blue: {
        light: '221 83% 53%',  // Blue-500
        dark: '213 94% 68%',   // Blue-400
        name: 'Blue'
    },
    red: {
        light: '0 84% 60%',    // Red-500
        dark: '0 91% 71%',     // Red-400
        name: 'Red'
    },
    teal: {
        light: '173 80% 40%',  // Teal-500
        dark: '172 66% 50%',   // Teal-400
        name: 'Teal'
    }
};

export function getAccentColorValue(color: AccentColor, isDark: boolean): string {
    return isDark ? ACCENT_COLORS[color].dark : ACCENT_COLORS[color].light;
}
