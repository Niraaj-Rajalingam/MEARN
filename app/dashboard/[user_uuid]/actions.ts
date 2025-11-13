'use server';

import type { UUID } from 'crypto';
import { searchTasksForUser, getTasksAssignedToUser, getTasksAssignedByUser, updateTask } from '@/app/services/task.service';
import { getGroupById, deleteGroup } from '@/app/services/group.service';
import { isUUID } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

export async function searchActiveDashboardTasksAction(
  userUuid: string,
  keyword: string = '',
  groupUuid?: string | null,
  filterType: 'all' | 'assigned_to_me' | 'assigned_by_me' = 'all'
) {
  try {
    if (!userUuid || !isUUID(userUuid)) {
      return errorResponse('Invalid user id');
    }

    let normalizedGroup: UUID | undefined;
    if (groupUuid) {
      if (!isUUID(groupUuid)) {
        return errorResponse('Invalid group id');
      }
      normalizedGroup = groupUuid as unknown as UUID;
    }

    const userUuidAsUUID = userUuid as unknown as UUID;
    const options = {
      statuses: ['draft', 'pending', 'in_progress'] as Array<'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>,
      group_uuid: normalizedGroup,
      keyword: keyword || undefined,
    };

    let tasks;
    switch (filterType) {
      case 'assigned_to_me':
        tasks = await getTasksAssignedToUser(userUuidAsUUID, options);
        break;
      case 'assigned_by_me':
        tasks = await getTasksAssignedByUser(userUuidAsUUID, options);
        break;
      case 'all':
      default:
        tasks = await searchTasksForUser(userUuidAsUUID, options);
        break;
    }

    return successResponse({
      tasks: tasks || [],
    });
  } catch (error) {
    console.error('searchActiveDashboardTasksAction error:', error);
    return errorResponse('Failed to search tasks.');
  }
}

export async function getFilteredDashboardTasksAction(
  userUuid: string,
  groupUuid?: string | null,
<<<<<<< HEAD
  filterType: 'all' | 'assigned_to_me' | 'assigned_by_me' = 'all',
  page: number = 1
=======
  filterType: 'all' | 'assigned_to_me' | 'assigned_by_me' = 'all'
>>>>>>> main
) {
  try {
    if (!userUuid || !isUUID(userUuid)) {
      return errorResponse('Invalid user id');
    }

    let normalizedGroup: UUID | undefined;
    if (groupUuid) {
      if (!isUUID(groupUuid)) {
        return errorResponse('Invalid group id');
      }
      normalizedGroup = groupUuid as unknown as UUID;
    }

    const userUuidAsUUID = userUuid as unknown as UUID;
<<<<<<< HEAD
    const pageSize = 5;
    const offset = calculatePaginationOffset(page, pageSize);

    const options = {
      statuses: ['draft', 'pending', 'in_progress'] as Array<'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>,
      group_uuid: normalizedGroup,
      limit: pageSize + 1, // Fetch one extra to determine if there are more
      offset,
    };

    let tasks: any[] = [];
    switch (filterType) {
      case 'assigned_to_me':
        tasks = (await getTasksAssignedToUser(userUuidAsUUID, options)) || [];
        break;
      case 'assigned_by_me':
        tasks = (await getTasksAssignedByUser(userUuidAsUUID, options)) || [];
        break;
      case 'all':
      default:
        tasks = (await searchTasksForUser(userUuidAsUUID, options)) || [];
        break;
    }

    // Determine if there are more tasks
    const hasMore = tasks.length > pageSize;
    const paginatedTasks = hasMore ? tasks.slice(0, pageSize) : tasks;

    return successResponse({
      tasks: paginatedTasks || [],
      page,
      pageSize,
      hasMore,
=======
    const options = {
      statuses: ['draft', 'pending', 'in_progress'] as Array<'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>,
      group_uuid: normalizedGroup,
    };

    let tasks;
    switch (filterType) {
      case 'assigned_to_me':
        tasks = await getTasksAssignedToUser(userUuidAsUUID, options);
        break;
      case 'assigned_by_me':
        tasks = await getTasksAssignedByUser(userUuidAsUUID, options);
        break;
      case 'all':
      default:
        tasks = await searchTasksForUser(userUuidAsUUID, options);
        break;
    }

    return successResponse({
      tasks: tasks || [],
>>>>>>> main
    });
  } catch (error) {
    console.error('getFilteredDashboardTasksAction error:', error);
    return errorResponse('Failed to fetch tasks.');
  }
}

export async function deleteGroupAction(args: {
  groupUuid: string;
  userUuid: string;
  groupName: string;
  confirmationInput: string;
}) {
  try {
    const { groupUuid, userUuid, groupName, confirmationInput } = args;

    if (!groupUuid || !isUUID(groupUuid)) {
      return errorResponse('Invalid group id');
    }

    if (!userUuid || !isUUID(userUuid)) {
      return errorResponse('Invalid user id');
    }

    if (confirmationInput.trim() !== groupName.trim()) {
      return errorResponse('Group name does not match. Please type the correct group name to confirm deletion.');
    }

    const groupUuidAsUUID = groupUuid as unknown as UUID;
    const userUuidAsUUID = userUuid as unknown as UUID;

    // Get the group to verify it exists and check if user is admin
    const group = await getGroupById(groupUuidAsUUID);
    if (!group) {
      return errorResponse('Group not found');
    }

    // Check if current user is an admin of the group
    const isAdmin = group.members.some(
      (m) => String(m.user_uuid) === userUuid && m.role === 'admin'
    );

    if (!isAdmin) {
      return errorResponse('Only group admins can delete the group.');
    }

    // Get all tasks in this group and cancel them
    const tasksInGroup = await searchTasksForUser(userUuidAsUUID, {
      group_uuid: groupUuidAsUUID,
      statuses: ['draft', 'pending', 'in_progress', 'completed'],
      limit: 10000,
      offset: 0,
    });

    // Cancel all tasks in this group
    if (tasksInGroup && tasksInGroup.length > 0) {
      for (const task of tasksInGroup) {
        await updateTask(task.todo_uuid, {
          status: 'cancelled',
        });
      }
    }

    // Delete the group
    await deleteGroup(groupUuidAsUUID);

    return successResponse({
      message: `Group "${groupName}" has been deleted. All associated tasks have been cancelled.`,
    });
  } catch (error) {
    console.error('deleteGroupAction error:', error);
    return errorResponse('Failed to delete group.');
  }
}
