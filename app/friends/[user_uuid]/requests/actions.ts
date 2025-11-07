'use server';

import { getPendingRequestsForUser, updateRequestStatus } from '@/app/services/friends.service';
import { getUserById } from '@/app/services/user.service';
import { UUID } from 'crypto';

type PendingRequestItem = {
  request_uuid: string;
  requester_uuid: string;
  title: string;
  subtitle?: string;
};

type FetchPendingResult =
  | { success: true; requests: PendingRequestItem[] }
  | { success: false; error: string };

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchPendingRequestsAction(userUuid: string): Promise<FetchPendingResult> {
  try {
    const normalized = (userUuid || '').trim();

    if (!isUUID(normalized)) {
      return { success: false, error: 'Invalid user identifier.' };
    }

    const pending = await getPendingRequestsForUser(normalized as unknown as UUID);
    const requests: PendingRequestItem[] = [];

    if (pending && pending.length > 0) {
      for (const request of pending) {
        const requesterUuid = String(request.requester_uuid);
        const requesterUser = await getUserById(requesterUuid as unknown as UUID);

        if (!requesterUser) {
          continue;
        }

        requests.push({
          request_uuid: String(request.request_uuid),
          requester_uuid: requesterUuid,
          title: [requesterUser.first_name, requesterUser.last_name].filter(Boolean).join(' ') || requesterUser.user_email,
          subtitle: requesterUser.user_email,
        });
      }
    }

    return { success: true, requests };
  } catch (error) {
    console.error('fetchPendingRequestsAction error:', error);
    return { success: false, error: 'Failed to load requests.' };
  }
}

export async function respondToFriendRequestAction(args: {
  requestUuid: string;
  recipientUuid: string;
  action: 'accept' | 'decline';
}) {
  try {
    const requestUuid = (args.requestUuid || '').trim();
    const recipientUuid = (args.recipientUuid || '').trim();

    if (!isUUID(requestUuid) || !isUUID(recipientUuid)) {
      return { success: false, error: 'Invalid request identifier.' } as const;
    }

    const pending = await getPendingRequestsForUser(recipientUuid as unknown as UUID);
    const match = pending?.find((req) => String(req.request_uuid) === requestUuid);

    if (!match) {
      return { success: false, error: 'Request not found or already processed.' } as const;
    }

    const status = args.action === 'accept' ? 'accepted' : 'declined';
    const result = await updateRequestStatus(requestUuid as unknown as UUID, status);

    if (!result || result.length === 0) {
      return { success: false, error: 'Failed to update request.' } as const;
    }

    return { success: true, status } as const;
  } catch (error) {
    console.error('respondToFriendRequestAction error:', error);
    return { success: false, error: 'Failed to respond to request.' } as const;
  }
}
