'use server';

import { sendFriendRequest } from '@/app/services/friends.service';
import { findUserByEmail } from '@/app/services/user.service';
import { UUID } from 'crypto';
import { isUUID, isEmail } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

export async function sendFriendRequestAction(args: {
  requesterUuid: string;
  recipientEmail: string;
}) {
  try {
    const requester = (args.requesterUuid || '').trim();
    const recipientEmail = (args.recipientEmail || '').trim().toLowerCase();

    if (!isUUID(requester)) {
      return errorResponse('Invalid requester UUID.');
    }
    if (!recipientEmail) {
      return errorResponse('Please enter a friend email address.');
    }
    if (!isEmail(recipientEmail)) {
      return errorResponse('Enter a valid email address.');
    }
    const recipientUser = await findUserByEmail(recipientEmail);

    if (!recipientUser) {
      return errorResponse('No user found with that email.');
    }

    if (requester === recipientUser.user_uuid) {
      return errorResponse('You cannot send a friend request to yourself.');
    }

    // Service returns FriendRequest[] | undefined
    const result = await sendFriendRequest(
      requester as unknown as UUID,
      recipientUser.user_uuid
    );

    if (!result || result.length === 0) {
      // friends.service logs DB errors and returns undefined on failure
      return errorResponse('Could not send request. It may already exist or be blocked.');
    }

    return successResponse({ request: result[0] });
  } catch (err) {
    console.error('sendFriendRequestAction error:', err);
    return errorResponse('An unexpected error occurred.');
  }
}
