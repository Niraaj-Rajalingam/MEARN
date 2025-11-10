'use server';

import type { UUID } from 'crypto';
import { getGroupById, addUserToGroup, removeUserFromGroup, deleteGroup } from '@/app/services/group.service';
import { getUserById, findUserByEmail } from '@/app/services/user.service';
import { getTasksAssignedToUser, updateTask, searchTasksForUser } from '@/app/services/task.service';
import { sendFriendRequest } from '@/app/services/friends.service';
import { isUUID, isEmail } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

export async function fetchGroupWithMembersAction(groupUuid: string) {
  try {
    if (!groupUuid || !isUUID(groupUuid)) {
      return errorResponse('Invalid group id');
    }

    const group = await getGroupById(groupUuid as unknown as UUID);
    if (!group) {
      return errorResponse('Group not found');
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

    return successResponse({
      group,
      members: memberDetails,
    });
  } catch (error) {
    console.error('Failed to load group members:', error);
    return errorResponse('Failed to load group members');
  }
}

export async function addMemberToGroupAction(args: {
  groupUuid: string;
  recipientEmail: string;
}) {
  try {
    const { groupUuid, recipientEmail } = args;
    const email = (recipientEmail || '').trim().toLowerCase();

    if (!groupUuid || !isUUID(groupUuid)) {
      return errorResponse('Invalid group id');
    }

    if (!email || !isEmail(email)) {
      return errorResponse('Enter a valid email address.');
    }

    // Get the group to check if it exists and get current members
    const group = await getGroupById(groupUuid as unknown as UUID);
    if (!group) {
      return errorResponse('Group not found');
    }

    // Find the user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse('No user found with that email.');
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (m) => String(m.user_uuid) === String(user.user_uuid)
    );
    if (isMember) {
      return errorResponse('This user is already a member of the group.');
    }

    // Add user to group
    await addUserToGroup({
      group_uuid: groupUuid as unknown as UUID,
      user_uuid: user.user_uuid,
      role: 'member',
    });

    return successResponse({
      user: {
        user_uuid: user.user_uuid,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || null,
        email: user.user_email,
      },
    });
  } catch (error) {
    console.error('addMemberToGroupAction error:', error);
    return errorResponse('Failed to add member to group.');
  }
}

export async function removeMembersFromGroupAction(args: {
  groupUuid: string;
  memberUuids: string[];
}) {
  try {
    const { groupUuid, memberUuids } = args;

    if (!groupUuid || !isUUID(groupUuid)) {
      return errorResponse('Invalid group id');
    }

    if (!memberUuids || memberUuids.length === 0) {
      return errorResponse('No members specified');
    }

    // Validate all member UUIDs
    for (const uuid of memberUuids) {
      if (!isUUID(uuid)) {
        return errorResponse('Invalid member UUID');
      }
    }

    const groupUuidAsUUID = groupUuid as unknown as UUID;

    // Get the group to verify it exists
    const group = await getGroupById(groupUuidAsUUID);
    if (!group) {
      return errorResponse('Group not found');
    }

    // For each member being removed, cancel their tasks
    for (const memberUuid of memberUuids) {
      const memberUuidAsUUID = memberUuid as unknown as UUID;

      // Get tasks assigned to this member within this group
      const tasksAssignedToMember = await getTasksAssignedToUser(memberUuidAsUUID, {
        group_uuid: groupUuidAsUUID,
        statuses: ['draft', 'pending', 'in_progress'],
        limit: 1000,
        offset: 0,
      });

      // Cancel all their tasks in this group
      if (tasksAssignedToMember && tasksAssignedToMember.length > 0) {
        for (const task of tasksAssignedToMember) {
          await updateTask(task.todo_uuid, {
            status: 'cancelled',
          });
        }
      }

      // Remove the user from the group
      await removeUserFromGroup(groupUuidAsUUID, memberUuidAsUUID);
    }

    return successResponse({
      removedCount: memberUuids.length,
    });
  } catch (error) {
    console.error('removeMembersFromGroupAction error:', error);
    return errorResponse('Failed to remove members from group.');
  }
}

export async function sendFriendRequestsToMembersAction(args: {
  requesterUuid: string;
  recipientUuids: string[];
}) {
  try {
    const { requesterUuid, recipientUuids } = args;

    if (!requesterUuid || !isUUID(requesterUuid)) {
      return errorResponse('Invalid requester UUID');
    }

    if (!recipientUuids || recipientUuids.length === 0) {
      return errorResponse('No recipients specified');
    }

    // Validate all recipient UUIDs
    for (const uuid of recipientUuids) {
      if (!isUUID(uuid)) {
        return errorResponse('Invalid recipient UUID');
      }
    }

    const requesterUuidAsUUID = requesterUuid as unknown as UUID;
    let successCount = 0;
    const failedRecipients: string[] = [];

    // Send friend requests to each recipient
    for (const recipientUuid of recipientUuids) {
      try {
        const recipientUuidAsUUID = recipientUuid as unknown as UUID;

        // Check if already friends or request already sent
        const result = await sendFriendRequest(requesterUuidAsUUID, recipientUuidAsUUID);

        if (result && result.length > 0) {
          successCount++;
        } else {
          failedRecipients.push(recipientUuid);
        }
      } catch (err) {
        console.error(`Failed to send friend request to ${recipientUuid}:`, err);
        failedRecipients.push(recipientUuid);
      }
    }

    if (successCount === 0) {
      return errorResponse('Failed to send friend requests to any members. They may already be friends or requests may already exist.');
    }

    return successResponse({
      successCount,
      failedCount: failedRecipients.length,
      message: `Friend requests sent to ${successCount} member(s)${failedRecipients.length > 0 ? `. ${failedRecipients.length} failed.` : '.'}`,
    });
  } catch (error) {
    console.error('sendFriendRequestsToMembersAction error:', error);
    return errorResponse('Failed to send friend requests.');
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
