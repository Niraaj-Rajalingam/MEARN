'use server';

import type { UUID } from 'crypto';
import { getGroupById } from '@/app/services/group.service';
import { getUserById } from '@/app/services/user.service';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchGroupWithMembersAction(groupUuid: string) {
  try {
    if (!groupUuid || !uuidRegex.test(groupUuid)) {
      return { success: false, error: 'Invalid group id' } as const;
    }

    const group = await getGroupById(groupUuid as unknown as UUID);
    if (!group) {
      return { success: false, error: 'Group not found' } as const;
    }

    const memberDetails = await Promise.all(
      group.members.map(async (member) => {
        const user = await getUserById(member.user_uuid);
        const fullName = [user?.first_name, user?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();

        return {
          user_uuid: member.user_uuid,
          role: member.role,
          name: fullName || user?.user_email || 'Unknown user',
          email: user?.user_email || 'Unknown email',
        };
      })
    );

    return {
      success: true,
      group,
      members: memberDetails,
    } as const;
  } catch (error) {
    console.error('Failed to load group members:', error);
    return {
      success: false,
      error: 'Failed to load group members',
    } as const;
  }
}
