'use server';

import { getFriendsForUser, removeFriend } from '@/app/services/friends.service';
import { getUserById } from '@/app/services/user.service';
import { UUID } from 'crypto';
import { isUUID } from '@/app/utils/validation';
import { errorResponse, successResponse } from '@/app/utils/response';

type FriendListItem = {
  id: string;
  title: string;
  subtitle?: string;
  friend_uuid: string;
};

type FetchFriendsResult =
  | { success: true; friends: FriendListItem[] }
  | { success: false; error: string };

export async function fetchFriendsAction(userUuid: string): Promise<FetchFriendsResult> {
  try {
    const normalized = (userUuid || '').trim();

    if (!isUUID(normalized)) {
      return errorResponse('Invalid user identifier.');
    }

    const requests = await getFriendsForUser(normalized as unknown as UUID);

    const friends: FriendListItem[] = [];
    if (requests && requests.length > 0) {
      for (const request of requests) {
        const requesterUuid = String(request.requester_uuid);
        const recipientUuid = String(request.recipient_uuid);
        const friendUuid = requesterUuid === normalized ? recipientUuid : requesterUuid;

        const friendUser = await getUserById(friendUuid as unknown as UUID);

        if (!friendUser) {
          continue;
        }

        friends.push({
          id: String(friendUuid),
          friend_uuid: String(friendUuid),
          title: [friendUser.first_name, friendUser.last_name].filter(Boolean).join(' ') || friendUser.user_email,
          subtitle: friendUser.user_email,
        });
      }
    }

    return { success: true, friends };
  } catch (error) {
    console.error('fetchFriendsAction error:', error);
    return errorResponse('Failed to load friends.');
  }
}

export async function removeFriendAction(args: { userUuid: string; friendUuid: string }) {
  try {
    const user = (args.userUuid || '').trim();
    const friend = (args.friendUuid || '').trim();

    if (!isUUID(user) || !isUUID(friend)) {
      return errorResponse('Invalid friend identifier.');
    }

    const result = await removeFriend(user as unknown as UUID, friend as unknown as UUID);

    if (!result || result.length === 0) {
      return errorResponse('Friend relationship not found.');
    }

    return successResponse({});
  } catch (error) {
    console.error('removeFriendAction error:', error);
    return errorResponse('Failed to remove friend.');
  }
}
