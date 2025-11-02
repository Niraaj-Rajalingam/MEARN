'use server';

import { getUserById } from '@/app/services/user.service';
import { createGroup, addUserToGroup } from '@/app/services/group.service';
import { CreateGroupDTO } from '@/app/types/group.type';
import { UUID } from 'crypto';

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function findUserByIdAction(user_uuid: string) {
  try {
    const id = user_uuid?.trim();

    if (!id || !isUUID(id)) {
      return {
        success: false,
        code: 'INVALID_UUID',
        error: 'Invalid or missing user UUID.',
      } as const;
    }

    const user = await getUserById(id as unknown as UUID);
    if (!user) {
      return {
        success: false,
        code: 'NOT_FOUND',
        error: 'User not found.',
      } as const;
    }

    return {
      success: true,
      user: {
        user_uuid: user.user_uuid,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
        email: user.user_email,
      },
    } as const;
  } catch (err) {
    console.error('findUserByIdAction error:', err);
    return {
      success: false,
      code: 'SERVER_ERROR',
      error: 'Internal server error.',
    } as const;
  }
}

export async function createGroupAction(args: {
  groupName: string;
  creatorUuid: string;
  memberIds: string[];          
  parentGroupUuid?: string; 
}) {
  try {
    const { groupName, creatorUuid, memberIds, parentGroupUuid } = args;

    if (!groupName?.trim()) {
      return { success: false, error: 'Please enter a group name.' } as const;
    }
    if (!creatorUuid || !isUUID(creatorUuid)) {
      return { success: false, error: 'Invalid creator UUID.' } as const;
    }
    if (parentGroupUuid && !isUUID(parentGroupUuid)) {
      return { success: false, error: 'Invalid parent group UUID.' } as const;
    }

    // Create the group
    const dto: CreateGroupDTO = {
      group_name: groupName.trim(),
      creator_uuid: creatorUuid as unknown as UUID,
      parent_group_uuid: parentGroupUuid
        ? (parentGroupUuid as unknown as UUID)
        : undefined,
    };

    const group = await createGroup(dto);
    if (!group) {
      return { success: false, error: 'Failed to create group.' } as const;
    }

    // Build set of UUIDs (skip creator)
    const toAdd = Array.from(
      new Set(
        (memberIds || [])
          .map((id) => id?.trim())
          .filter((id): id is string => !!id && isUUID(id) && id !== creatorUuid)
      )
    );

    // Add each member
    for (const user_uuid of toAdd) {
      const res = await addUserToGroup({
        group_uuid: group.group_uuid as unknown as UUID,
        user_uuid: user_uuid as unknown as UUID,
        role: 'member',
      });
    }

    return {
      success: true,
      group,
      addedCount: toAdd.length,
    } as const;
  } catch (err: any) {
    console.error('createGroupAction error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to create group. Please try again.',
    } as const;
  }
}
