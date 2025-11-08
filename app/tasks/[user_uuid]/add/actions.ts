'use server';

import { UUID } from 'crypto';
import { createTask } from '@/app/services/task.service';
import { findUserByEmail } from '@/app/services/user.service';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailRegex = /\S+@\S+\.\S+/;

type CreateTaskActionArgs = {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: number | string;
  assigneeEmail?: string;
  creatorUuid: string;
  groupUuid?: string | null;
};

function parsePriority(value?: number | string) {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  if (num === 1 || num === 2 || num === 3) {
    return num;
  }
  return 2;
}

export async function createTaskAction(args: CreateTaskActionArgs) {
  try {
    const title = args.title?.trim();
    if (!title) {
      return { success: false, error: 'Please enter a task title.' } as const;
    }

    const creatorUuid = args.creatorUuid?.trim();
    if (!creatorUuid || !uuidRegex.test(creatorUuid)) {
      return { success: false, error: 'Invalid creator ID.' } as const;
    }

    const creatorUuidAsUUID = creatorUuid as unknown as UUID;

    const assigneeEmail = args.assigneeEmail?.trim().toLowerCase();
    if (assigneeEmail && !emailRegex.test(assigneeEmail)) {
      return { success: false, error: 'Enter a valid assignee email.' } as const;
    }

    const dueDateValue = args.dueDate?.trim();
    let dueDate: Date | undefined;
    if (dueDateValue) {
      const parsed = new Date(dueDateValue);
      if (Number.isNaN(parsed.getTime())) {
        return { success: false, error: 'Invalid due date.' } as const;
      }
      dueDate = parsed;
    }

    const priority = parsePriority(args.priority);

    const groupUuid = args.groupUuid && args.groupUuid !== 'null' ? args.groupUuid.trim() : null;
    if (groupUuid && !uuidRegex.test(groupUuid)) {
      return { success: false, error: 'Invalid group selection.' } as const;
    }

    let assigneeUuid: UUID = creatorUuidAsUUID;
    if (assigneeEmail) {
      const assignee = await findUserByEmail(assigneeEmail);
      if (!assignee) {
        return { success: false, error: 'Assignee email was not found.' } as const;
      }
      assigneeUuid = assignee.user_uuid as unknown as UUID;
    }

    const task = await createTask({
      created_by: creatorUuidAsUUID,
      assignee_uuids: [assigneeUuid],
      title,
      description: args.description?.trim() || undefined,
      due_date: dueDate,
      priority,
      group_uuid: groupUuid ? (groupUuid as unknown as UUID) : undefined,
    });

    if (!task) {
      return { success: false, error: 'Failed to create task.' } as const;
    }

    return { success: true, task } as const;
  } catch (error: any) {
    console.error('createTaskAction error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to create task. Please try again.',
    } as const;
  }
}
