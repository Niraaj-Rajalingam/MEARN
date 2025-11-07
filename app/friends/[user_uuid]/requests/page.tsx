'use client';

import { useEffect, useState } from 'react';
import GenericPage from '@/components/layout/GenericPage';
import { fetchPendingRequestsAction, respondToFriendRequestAction } from './actions';

type PendingRequestItem = {
  request_uuid: string;
  requester_uuid: string;
  title: string;
  subtitle?: string;
};

export default function FriendRequestsPage({ params }: { params: { user_uuid: string } }) {
  const [requests, setRequests] = useState<PendingRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const currentUserId = params.user_uuid;

  useEffect(() => {
    let active = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      try {
        const result = await fetchPendingRequestsAction(currentUserId);
        if (!active) return;

        if (!result.success) {
          setError(result.error || 'Failed to load requests.');
          setRequests([]);
          return;
        }

        setRequests(result.requests);
      } catch (err) {
        if (!active) return;
        console.error('Failed to fetch pending requests:', err);
        setError('Failed to load requests. Please try again.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const handleResponse = async (requestUuid: string, action: 'accept' | 'decline') => {
    setError(null);
    setMessage(null);
    setProcessing(requestUuid + action);
    try {
      const result = await respondToFriendRequestAction({
        requestUuid,
        recipientUuid: currentUserId,
        action,
      });

      if (!result.success) {
        setError(result.error || 'Failed to update request.');
        return;
      }

      setRequests((prev) => prev.filter((req) => req.request_uuid !== requestUuid));
      setMessage(
        action === 'accept'
          ? 'Friend request accepted successfully.'
          : 'Friend request declined.'
      );
    } catch (err) {
      console.error('Failed to respond to friend request:', err);
      setError('Failed to update request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <GenericPage
      title="Friendship Requests"
      description="Review pending friend requests and choose to accept or decline."
      showSearch={false}
      showSubmit={false}
      homeHref={`/dashboard/${currentUserId}`}
    >
      {message && (
        <div className="rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-100">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          You do not have any pending friend requests.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const isProcessingAccept = processing === `${request.request_uuid}accept`;
            const isProcessingDecline = processing === `${request.request_uuid}decline`;
            const isProcessingRequest = isProcessingAccept || isProcessingDecline;
            return (
              <div
                key={request.request_uuid}
                className="flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{request.title}</p>
                  {request.subtitle && (
                    <p className="text-sm text-muted-foreground">{request.subtitle}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResponse(request.request_uuid, 'decline')}
                    disabled={isProcessingRequest}
                    className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {isProcessingDecline ? 'Declining...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleResponse(request.request_uuid, 'accept')}
                    disabled={isProcessingRequest}
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {isProcessingAccept ? 'Accepting...' : 'Accept'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GenericPage>
  );
}
