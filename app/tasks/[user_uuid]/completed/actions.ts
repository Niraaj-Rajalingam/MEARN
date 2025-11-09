'use server';

import type { UUID } from 'crypto';
import { getTasksForUser } from '@/app/services/task.service';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchCompletedTasksAction(userUuid: string, groupUuid?: string | null) {
  try {
    if (!userUuid || !uuidRegex.test(userUuid)) {
      return { success: false, error: 'Invalid user id' } as const;
    }

    let normalizedGroup: UUID | undefined;
    if (groupUuid) {
      if (!uuidRegex.test(groupUuid)) {
        return { success: false, error: 'Invalid group id' } as const;
      }
      normalizedGroup = groupUuid as unknown as UUID;
    }

    const tasks = await getTasksForUser(userUuid as unknown as UUID, normalizedGroup);
    const completedTasks = (tasks || []).filter((task) => task.status === 'completed');

    return {
      success: true,
      tasks: completedTasks,
    } as const;
  } catch (error) {
    console.error('fetchCompletedTasksAction error:', error);
    return {
      success: false,
      error: 'Failed to load completed tasks.',
    } as const;
  }
}
