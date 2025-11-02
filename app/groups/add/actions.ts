'use server';

import { findUserByEmail } from '@/app/services/user.service';
import { createGroup, addUserToGroup } from '@/app/services/group.service';
import { CreateGroupDTO } from '@/app/types/group.type';
import { UUID } from 'crypto';

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}
function isEmail(v: string) {
  return /\S+@\S+\.\S+/.test(v);
}

export async function findUserByEmailAction(email: string) {
  try {
    const e = (email || '').trim().toLowerCase();
    if (!e || !isEmail(e)) {
      return {
        success: false,
        code: 'INVALID_EMAIL',
        error: 'Enter a valid email address.',
      } as const;
    }

    const user = await findUserByEmail(e);
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
    console.error('findUserByEmailAction error:', err);
    return {
      success: false,
      code: 'SERVER_ERROR',
      error: 'Internal server error.',
    } as const;
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
      return { success: false, error: 'Please enter a group name.' } as const;
    }
    if (!creatorUuid || !isUUID(creatorUuid)) {
      return { success: false, error: 'Invalid creator UUID.' } as const;
    }
    if (parentGroupUuid && !isUUID(parentGroupUuid)) {
      return { success: false, error: 'Invalid parent group UUID.' } as const;
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
      return { success: false, error: 'Failed to create group.' } as const;
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

    return {
      success: true,
      group,
      addedCount: toAddUuids.length,
    } as const;
  } catch (err: any) {
    console.error('createGroupAction error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to create group. Please try again.',
    } as const;
  }
}
