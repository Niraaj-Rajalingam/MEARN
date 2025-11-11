'use server';

import { findUserByEmail } from '@/app/services/user.service';
import { createGroup, addUserToGroup } from '@/app/services/group.service';
import { CreateGroupDTO } from '@/app/types/group.type';
import { UUID } from 'crypto';
import { isUUID, isEmail } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

export async function findUserByEmailAction(email: string) {
  try {
    const e = (email || '').trim().toLowerCase();
    if (!e || !isEmail(e)) {
      return errorResponse('Enter a valid email address.');
    }

    const user = await findUserByEmail(e);
    if (!user) {
      return errorResponse('User not found.');
    }

    return successResponse({
      user: {
        user_uuid: user.user_uuid,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
        email: user.user_email,
      },
    });
  } catch (err) {
    console.error('findUserByEmailAction error:', err);
    return errorResponse('Internal server error.');
  }
}

export async function createGroupAction(args: {
  groupName: string;
  creatorUuid: string;      // must be a UUID from session
  memberEmails: string[];   // emails entered in the UI
  parentGroupUuid?: string;
}) {
  try {
    const { groupName, creatorUuid, memberEmails, parentGroupUuid } = args;

    if (!groupName?.trim()) {
      return errorResponse('Please enter a group name.');
    }
    if (!creatorUuid || !isUUID(creatorUuid)) {
      return errorResponse('Invalid creator UUID.');
    }
    if (parentGroupUuid && !isUUID(parentGroupUuid)) {
      return errorResponse('Invalid parent group UUID.');
    }

    // 1) Create the group (creator becomes admin inside the service)
    const dto: CreateGroupDTO = {
      group_name: groupName.trim(),
      creator_uuid: creatorUuid as unknown as UUID,
      parent_group_uuid: parentGroupUuid
        ? (parentGroupUuid as unknown as UUID)
        : undefined,
    };

    const group = await createGroup(dto);
    if (!group) {
      return errorResponse('Failed to create group.');
    }

    // 2) Resolve emails -> UUIDs, skip creator and duplicates
    const lookups = await Promise.all(
      (memberEmails || [])
        .map((e) => (e || '').trim().toLowerCase())
        .filter(Boolean)
        .map((email) => findUserByEmail(email))
    );

    const toAddUuids = Array.from(
      new Set(
        lookups
          .filter((u): u is NonNullable<typeof u> => !!u)
          .map((u) => String(u.user_uuid))
          .filter((uuid) => uuid !== creatorUuid)
      )
    );

    // 3) Add each member as 'member'
    for (const user_uuid of toAddUuids) {
      await addUserToGroup({
        group_uuid: group.group_uuid as unknown as UUID,
        user_uuid: user_uuid as unknown as UUID,
        role: 'member',
      });
    }

    return successResponse({
      group,
      addedCount: toAddUuids.length,
    });
  } catch (err: any) {
    console.error('createGroupAction error:', err);
    return errorResponse(err?.message || 'Failed to create group. Please try again.');
  }
}
