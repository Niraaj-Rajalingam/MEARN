# Theming System Documentation

## Overview

The MEARN app now includes a comprehensive theming system that allows users to customize their experience with:
- **Theme Modes**: Light, Dark, or System preference
- **Accent Colors**: 8 color options (Indigo, Pink, Orange, Green, Purple, Blue, Red, Teal)

## Architecture

### Components

1. **ThemeProvider** (`app/components/ThemeProvider.tsx`)
   - Client-side React context provider
   - Manages theme state and syncs with localStorage
   - Applies CSS custom properties to `<html>` element
   - Resolves system preference when theme mode is 'system'

2. **MuiThemeProvider** (`app/components/MuiThemeProvider.tsx`)
   - Wraps Material UI ThemeProvider
   - Dynamically creates MUI theme based on current theme mode and accent color
   - Ensures all MUI components respect the user's theme preferences

3. **Settings Page** (`app/dashboard/[user_uuid]/settings/`)
   - User-facing interface for theme customization
   - Allows selecting theme mode and accent color
   - Saves preferences to database

### Database

**Table**: `user_preferences`
```sql
CREATE TABLE user_preferences (
    user_uuid UUID PRIMARY KEY REFERENCES users (user_uuid) ON DELETE CASCADE,
    theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
    accent_color TEXT DEFAULT 'indigo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Service Layer

**File**: `app/services/theme.service.ts`

Key methods:
- `getUserThemePreferences(userUuid)` - Fetch user's saved preferences
- `updateUserThemePreferences(userUuid, updates)` - Update preferences
- `createUserThemePreferences(userUuid)` - Create default preferences for new users
- `getOrCreateThemePreferences(userUuid)` - Ensure preferences exist

## Usage

### Accessing Theme in Components

```typescript
'use client';

import { useTheme } from '@/app/components/ThemeProvider';

export function MyComponent() {
  const { themeMode, accentColor, effectiveTheme, setThemeMode, setAccentColor } = useTheme();
  
  return (
    <div>
      <p>Current theme: {effectiveTheme}</p>
      <button onClick={() => setThemeMode('dark')}>
        Switch to Dark Mode
      </button>
    </div>
  );
}
```

### Using Accent Colors in Tailwind

The accent color is available as a CSS custom property:

```jsx
<button className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
  Accent Button
</button>
```

### Available CSS Variables

Light mode:
```css
--background: 0 0% 100%;
--foreground: 0 0% 3.9%;
--accent: 239 84% 67%; /* Dynamic based on user selection */
--accent-foreground: 0 0% 98%;
/* ... other variables */
```

Dark mode:
```css
--background: 0 0% 3.9%;
--foreground: 0 0% 98%;
--accent: 244 58% 70%; /* Dynamic based on user selection */
--accent-foreground: 0 0% 9%;
/* ... other variables */
```

### Material UI Components

All Material UI components automatically inherit the theme:

```jsx
import { Button } from '@mui/material';

export function MyButton() {
  return (
    <Button variant="contained" color="primary">
      Themed Button
    </Button>
  );
}
```

## Available Accent Colors

| Color  | Light HSL         | Dark HSL          |
|--------|-------------------|-------------------|
| Indigo | 239 84% 67%       | 244 58% 70%       |
| Pink   | 330 81% 60%       | 330 81% 65%       |
| Orange | 25 95% 53%        | 31 97% 72%        |
| Green  | 160 84% 39%       | 158 64% 52%       |
| Purple | 258 90% 66%       | 258 90% 70%       |
| Blue   | 221 83% 53%       | 213 94% 68%       |
| Red    | 0 84% 60%         | 0 91% 71%         |
| Teal   | 173 80% 40%       | 172 66% 50%       |

## User Flow

1. User navigates to Settings via navbar
2. Selects desired theme mode (Light/Dark/System)
3. Selects accent color from color picker
4. Clicks "Save Preferences"
5. Preferences are saved to database
6. Theme is immediately applied across all pages
7. Theme preferences persist across sessions via localStorage and database

## Implementation Details

### Initialization Flow

1. **Server-side** (`app/layout.tsx`):
   - Fetches user session
   - Loads theme preferences from database
   - Passes initial values to ThemeProvider

2. **Client-side** (`ThemeProvider.tsx`):
   - Initializes with server-provided values
   - Syncs with localStorage for instant theme application
   - Listens to system preference changes when mode is 'system'
   - Applies theme via CSS custom properties

3. **Material UI** (`MuiThemeProvider.tsx`):
   - Consumes theme context
   - Generates dynamic MUI theme
   - Updates automatically when theme changes

### Performance Considerations

- Theme preferences are cached in localStorage for instant application on page load
- Server-side fetching prevents flash of wrong theme (FOUC)
- CSS custom properties enable theme changes without re-rendering entire app
- MUI theme is memoized and only updates when theme values change

## Testing

To test the theming system:

1. Start the app: `npm run docker-dev`
2. Navigate to `/dashboard/{user_uuid}/settings`
3. Try different theme modes and accent colors
4. Verify changes persist after page refresh
5. Test system preference by changing OS theme settings

## Migration Guide

To apply the new schema:

```bash
npm run docker-clean  # Destroys volumes and images
npm run docker-dev    # Rebuilds with new schema
```

Or for existing databases, run:

```sql
CREATE TABLE user_preferences (
    user_uuid UUID PRIMARY KEY REFERENCES users (user_uuid) ON DELETE CASCADE,
    theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
    accent_color TEXT DEFAULT 'indigo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_preferences (user_uuid, theme_mode, accent_color)
SELECT user_uuid, 'light', 'indigo'
FROM users;
```
