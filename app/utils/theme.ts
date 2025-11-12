export type ThemeName = 'default' | 'halloween' | 'christmas' | 'spring';
export type ColorMode = 'light' | 'dark';

export type ThemeOption = {
    value: ThemeName;
    label: string;
    previewClass: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
    {
        value: 'default',
        label: 'Default',
        previewClass: 'bg-gradient-to-r from-purple-600 to-purple-700',
    },
    {
        value: 'halloween',
        label: 'Halloween',
        previewClass: 'bg-gradient-to-r from-orange-600 to-purple-700',
    },
    {
        value: 'christmas',
        label: 'Christmas',
        previewClass: 'bg-gradient-to-r from-red-600 to-green-600',
    },
    {
        value: 'spring',
        label: 'Spring',
        previewClass: 'bg-gradient-to-r from-pink-400 to-purple-400',
    },
];

export const COLOR_MODE_OPTIONS: { value: ColorMode; label: string; previewClass: string }[] = [
    {
        value: 'light',
        label: 'Light',
        previewClass: 'bg-gradient-to-r from-yellow-300 to-yellow-400',
    },
    {
        value: 'dark',
        label: 'Dark',
        previewClass: 'bg-gradient-to-r from-slate-700 to-slate-900',
    },
];

export const THEME_STORAGE_KEY = 'mearn-color-theme';
export const MODE_STORAGE_KEY = 'mearn-color-mode';
