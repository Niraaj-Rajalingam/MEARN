'use server';

import { updateUserThemePreferences } from '@/app/services/theme.service';
import { successResponse, errorResponse, ActionResponse } from '@/app/utils/response';
import { UpdateThemePreferencesDTO, ThemePreferences } from '@/app/types/theme.type';
import { isUUID } from '@/app/utils/validation';
import { UUID } from 'crypto';

export async function updateThemePreferencesAction(
    userUuid: string,
    updates: UpdateThemePreferencesDTO
): Promise<ActionResponse<{ preferences: ThemePreferences }>> {
    try {
        // Validate user UUID
        if (!isUUID(userUuid)) {
            return errorResponse('Invalid user ID');
        }

        // Update preferences
        const preferences = await updateUserThemePreferences(userUuid as UUID, updates);

        return successResponse({ preferences });
    } catch (error) {
        console.error('Error in updateThemePreferencesAction:', error);
        return errorResponse(typeof error === 'string' ? error : 'Failed to update theme preferences');
    }
}
