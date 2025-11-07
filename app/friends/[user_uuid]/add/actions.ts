'use server';

import { sendFriendRequest } from '@/app/services/friends.service';
import { findUserByEmail } from '@/app/services/user.service';
import { UUID } from 'crypto';

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function sendFriendRequestAction(args: {
  requesterUuid: string;
  recipientEmail: string;
}) {
  try {
    const requester = (args.requesterUuid || '').trim();
    const recipientEmail = (args.recipientEmail || '').trim().toLowerCase();

    if (!isUUID(requester)) {
      return { success: false, error: 'Invalid requester UUID.' } as const;
    }
    if (!recipientEmail) {
      return { success: false, error: 'Please enter a friend email address.' } as const;
    }
    if (!isEmail(recipientEmail)) {
      return { success: false, error: 'Enter a valid email address.' } as const;
    }
    const recipientUser = await findUserByEmail(recipientEmail);

    if (!recipientUser) {
      return { success: false, error: 'No user found with that email.' } as const;
    }

    if (requester === recipientUser.user_uuid) {
      return { success: false, error: 'You cannot send a friend request to yourself.' } as const;
    }

    // Service returns FriendRequest[] | undefined
    const result = await sendFriendRequest(
      requester as unknown as UUID,
      recipientUser.user_uuid
    );

    if (!result || result.length === 0) {
      // friends.service logs DB errors and returns undefined on failure
      return {
        success: false,
        error: 'Could not send request. It may already exist or be blocked.',
      } as const;
    }

    return { success: true, request: result[0] } as const;
  } catch (err) {
    console.error('sendFriendRequestAction error:', err);
    return { success: false, error: 'An unexpected error occurred.' } as const;
  }
}
