'use server';

import type { UUID } from 'crypto';
import { getTaskById, updateTask } from '@/app/services/task.service';
import { isUUID, parsePriority, isValidDate } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

type UpdateTaskActionArgs = {
  taskUuid: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string | number;
};

export async function fetchTaskAction(taskUuid: string, userUuid: string) {
  try {
    if (!taskUuid || !isUUID(taskUuid)) {
      return errorResponse('Invalid task ID');
    }

    if (!userUuid || !isUUID(userUuid)) {
      return errorResponse('Invalid user ID');
    }

    const task = await getTaskById(taskUuid as unknown as UUID);

    if (!task) {
      return errorResponse('Task not found');
    }

    return successResponse({ task });
  } catch (error) {
    console.error('fetchTaskAction error:', error);
    return errorResponse('Failed to load task.');
  }
}

export async function updateTaskAction(args: UpdateTaskActionArgs) {
  try {
    const taskUuid = args.taskUuid?.trim();
    if (!taskUuid || !isUUID(taskUuid)) {
      return errorResponse('Invalid task ID.');
    }

    const title = args.title?.trim();
    if (!title) {
      return errorResponse('Please enter a task title.');
    }

    const dueDateValue = args.dueDate?.trim();
    let dueDate: Date | undefined;
    if (dueDateValue) {
      if (!isValidDate(dueDateValue)) {
        return errorResponse('Invalid due date.');
      }
      dueDate = new Date(dueDateValue);
    }

    const priority = parsePriority(args.priority);

    const task = await updateTask(taskUuid as unknown as UUID, {
      title,
      description: args.description?.trim() || undefined,
      due_date: dueDate,
      priority,
    });

    if (!task) {
      return errorResponse('Failed to update task.');
    }

    return successResponse({ task });
  } catch (error: any) {
    console.error('updateTaskAction error:', error);
    return errorResponse(error?.message || 'Failed to update task. Please try again.');
  }
}
