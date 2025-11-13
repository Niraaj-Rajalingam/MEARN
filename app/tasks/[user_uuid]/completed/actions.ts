'use server';

import type { UUID } from 'crypto';
import { searchTasksForUser, updateTask, deleteTask } from '@/app/services/task.service';
import { isUUID } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

type TaskStatus = 'completed' | 'cancelled';

const calculatePaginationOffset = (page: number, pageSize: number = 5): number => {
  const pageNum = Math.max(1, Number.isNaN(page) ? 1 : page);
  return (pageNum - 1) * pageSize;
};

export async function fetchTasksByStatusAction(
  userUuid: string,
  status: TaskStatus = 'completed',
  groupUuid?: string | null,
  page: number = 1
) {
  try {
    if (!userUuid || !isUUID(userUuid)) {
      return errorResponse('Invalid user id');
    }

    if (!['completed', 'cancelled'].includes(status)) {
      return errorResponse('Invalid task status');
    }

    let normalizedGroup: UUID | undefined;
    if (groupUuid) {
      if (!isUUID(groupUuid)) {
        return errorResponse('Invalid group id');
      }
      normalizedGroup = groupUuid as unknown as UUID;
    }

    // Validate and normalize page number
    const pageNum = Math.max(1, Number.isNaN(page) ? 1 : page);
    const pageSize = 5;
    const offset = calculatePaginationOffset(pageNum, pageSize);

    const tasks = await searchTasksForUser(userUuid as unknown as UUID, {
      statuses: [status as 'completed' | 'cancelled'],
      group_uuid: normalizedGroup,
      limit: pageSize,
      offset,
    });

    return successResponse({
      tasks: tasks || [],
      page: pageNum,
      pageSize,
      hasMore: (tasks?.length || 0) === pageSize,
    });
  } catch (error) {
    console.error('fetchTasksByStatusAction error:', error);
    return errorResponse(`Failed to load ${status} tasks.`);
  }
}

export async function fetchCompletedTasksAction(userUuid: string, groupUuid?: string | null) {
  return fetchTasksByStatusAction(userUuid, 'completed', groupUuid);
}

export async function unresolveTaskAction(taskUuid: string) {
  try {
    if (!taskUuid || !isUUID(taskUuid)) {
      return errorResponse('Invalid task ID.');
    }

    const task = await updateTask(taskUuid as unknown as UUID, {
      status: 'pending',
    });

    if (!task) {
      return errorResponse('Failed to unresolve task.');
    }

    return successResponse({ task });
  } catch (error: any) {
    console.error('unresolveTaskAction error:', error);
    return errorResponse(error?.message || 'Failed to unresolve task.');
  }
}

export async function deleteTaskPermanentlyAction(taskUuid: string) {
  try {
    if (!taskUuid || !isUUID(taskUuid)) {
      return errorResponse('Invalid task ID.');
    }

    await deleteTask(taskUuid as unknown as UUID);
    return successResponse({});
  } catch (error: any) {
    console.error('deleteTaskPermanentlyAction error:', error);
    return errorResponse(error?.message || 'Failed to delete task.');
  }
}

export async function recoverTaskAction(taskUuid: string) {
  try {
    if (!taskUuid || !isUUID(taskUuid)) {
      return errorResponse('Invalid task ID.');
    }

    const task = await updateTask(taskUuid as unknown as UUID, {
      status: 'pending',
    });

    if (!task) {
      return errorResponse('Failed to recover task.');
    }

    return successResponse({ task });
  } catch (error: any) {
    console.error('recoverTaskAction error:', error);
    return errorResponse(error?.message || 'Failed to recover task.');
  }
}

export async function searchTasksByKeywordAction(
  userUuid: string,
  status: TaskStatus = 'completed',
  keyword: string = '',
  groupUuid?: string | null
) {
  try {
    if (!userUuid || !isUUID(userUuid)) {
      return errorResponse('Invalid user id');
    }

    if (!['completed', 'cancelled'].includes(status)) {
      return errorResponse('Invalid task status');
    }

    let normalizedGroup: UUID | undefined;
    if (groupUuid) {
      if (!isUUID(groupUuid)) {
        return errorResponse('Invalid group id');
      }
      normalizedGroup = groupUuid as unknown as UUID;
    }

    const tasks = await searchTasksForUser(userUuid as unknown as UUID, {
      statuses: [status as 'completed' | 'cancelled'],
      group_uuid: normalizedGroup,
      keyword: keyword || undefined,
    });

    return successResponse({
      tasks: tasks || [],
    });
  } catch (error) {
    console.error('searchTasksByKeywordAction error:', error);
    return errorResponse(`Failed to search ${status} tasks.`);
  }
}
