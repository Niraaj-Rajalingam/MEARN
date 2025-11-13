import { UUID } from 'crypto';
import { poolQuery } from './database.service';
import { ThemePreferences, UpdateThemePreferencesDTO, AccentColor, ThemeMode } from '@/app/types/theme.type';

/**
 * Get user theme preferences from the database
 */
export async function getUserThemePreferences(userUuid: UUID): Promise<ThemePreferences | null> {
    try {
        const rows = await poolQuery(
            `SELECT user_uuid, theme_mode, accent_color, created_at, updated_at 
       FROM user_preferences 
       WHERE user_uuid = $1`,
            [userUuid]
        );

        if (!rows || rows.length === 0) {
            return null;
        }

        return rows[0] as ThemePreferences;
    } catch (error) {
        console.error('Error fetching theme preferences:', error);
        throw 'Failed to fetch theme preferences';
    }
}

/**
 * Update user theme preferences
 */
export async function updateUserThemePreferences(
    userUuid: UUID,
    updates: UpdateThemePreferencesDTO
): Promise<ThemePreferences> {
    try {
        // Build dynamic update query
        const fields: string[] = [];
        const values: (string | UUID)[] = [];
        let paramCount = 1;

        if (updates.theme_mode !== undefined) {
            fields.push(`theme_mode = $${paramCount++}`);
            values.push(updates.theme_mode);
        }

        if (updates.accent_color !== undefined) {
            fields.push(`accent_color = $${paramCount++}`);
            values.push(updates.accent_color);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userUuid);

        const query = `
      UPDATE user_preferences 
      SET ${fields.join(', ')}
      WHERE user_uuid = $${paramCount}
      RETURNING user_uuid, theme_mode, accent_color, created_at, updated_at
    `;

        const rows = await poolQuery(query, values);

        if (!rows || rows.length === 0) {
            throw 'Theme preferences not found';
        }

        return rows[0] as ThemePreferences;
    } catch (error) {
        console.error('Error updating theme preferences:', error);
        throw 'Failed to update theme preferences';
    }
}

/**
 * Create default theme preferences for a new user
 */
export async function createUserThemePreferences(
    userUuid: UUID,
    themeMode: ThemeMode = 'light',
    accentColor: AccentColor = 'indigo'
): Promise<ThemePreferences> {
    try {
        const rows = await poolQuery(
            `INSERT INTO user_preferences (user_uuid, theme_mode, accent_color)
       VALUES ($1, $2, $3)
       RETURNING user_uuid, theme_mode, accent_color, created_at, updated_at`,
            [userUuid, themeMode, accentColor]
        );

        if (!rows || rows.length === 0) {
            throw 'Failed to insert theme preferences';
        }

        return rows[0] as ThemePreferences;
    } catch (error) {
        console.error('Error creating theme preferences:', error);
        throw 'Failed to create theme preferences';
    }
}

/**
 * Get or create theme preferences (ensures preferences exist)
 */
export async function getOrCreateThemePreferences(userUuid: UUID): Promise<ThemePreferences> {
    const existing = await getUserThemePreferences(userUuid);

    if (existing) {
        return existing;
    }

    return await createUserThemePreferences(userUuid);
}
