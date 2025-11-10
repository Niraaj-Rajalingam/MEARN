'use server';

import { UUID } from 'crypto';
import { createTask } from '@/app/services/task.service';
import { findUserByEmail } from '@/app/services/user.service';
import { getGroupById } from '@/app/services/group.service';
import { isUUID, isEmail, parsePriority, isValidDate } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

type CreateTaskActionArgs = {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: number | string;
  assigneeEmail?: string;
  creatorUuid: string;
  groupUuid?: string | null;
};

export async function createTaskAction(args: CreateTaskActionArgs) {
  try {
    const title = args.title?.trim();
    if (!title) {
      return errorResponse('Please enter a task title.');
    }

    const creatorUuid = args.creatorUuid?.trim();
    if (!creatorUuid || !isUUID(creatorUuid)) {
      return errorResponse('Invalid creator ID.');
    }

    const creatorUuidAsUUID = creatorUuid as unknown as UUID;

    const assigneeEmail = args.assigneeEmail?.trim().toLowerCase();
    if (assigneeEmail && !isEmail(assigneeEmail)) {
      return errorResponse('Enter a valid assignee email.');
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

    const groupUuid = args.groupUuid && args.groupUuid !== 'null' ? args.groupUuid.trim() : null;
    if (groupUuid && !isUUID(groupUuid)) {
      return errorResponse('Invalid group selection.');
    }

    let assigneeUuid: UUID = creatorUuidAsUUID;
    if (groupUuid) {
      const group = await getGroupById(groupUuid as unknown as UUID);
      if (!group) {
        return errorResponse('Selected group no longer exists.');
      }

      if (assigneeEmail) {
        const assignee = await findUserByEmail(assigneeEmail);
        if (!assignee) {
          return errorResponse('Assignee email was not found.');
        }

        const isMember = group.members.some((member) => String(member.user_uuid) === String(assignee.user_uuid));
        if (!isMember) {
          return errorResponse('Assignee must be a member of the selected group.');
        }

        assigneeUuid = assignee.user_uuid as unknown as UUID;
      }
    } else if (assigneeEmail) {
      return errorResponse('Select a group before assigning someone else.');
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
      return errorResponse('Failed to create task.');
    }

    return successResponse({ task });
  } catch (error: any) {
    console.error('createTaskAction error:', error);
    return errorResponse(error?.message || 'Failed to create task. Please try again.');
  }
}
