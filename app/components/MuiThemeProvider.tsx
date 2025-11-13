'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, useMemo } from 'react';
import { useTheme } from './ThemeProvider';
import { ACCENT_COLORS } from '@/app/types/theme.type';

export default function MuiThemeProvider({ children }: { children: ReactNode }) {
  const { effectiveTheme, accentColor } = useTheme();

  const theme = useMemo(() => {
    const isDark = effectiveTheme === 'dark';
    const accentColorConfig = ACCENT_COLORS[accentColor];

    // Convert HSL string to RGB for MUI
    const hslToRgb = (h: number, s: number, l: number) => {
      s /= 100;
      l /= 100;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [
        Math.round(255 * f(0)),
        Math.round(255 * f(8)),
        Math.round(255 * f(4))
      ];
    };

    // Parse HSL from string "239 84% 67%"
    const parseHsl = (hslString: string): [number, number, number] => {
      const [h, s, l] = hslString.split(' ').map(v => parseFloat(v));
      return [h, s, l];
    };

    const [h, s, l] = parseHsl(isDark ? accentColorConfig.dark : accentColorConfig.light);
    const [r, g, b] = hslToRgb(h, s, l);

    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: `rgb(${r}, ${g}, ${b})`,
        },
        background: {
          default: isDark ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
          paper: isDark ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)',
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
      },
    });
  }, [effectiveTheme, accentColor]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}