'use client';

import { useState, useEffect } from 'react';
import GenericPage from '@/components/layout/GenericPage';
import { sendFriendRequestAction } from './actions';

export default function AddFriendPage({ params }: { params: Promise<{ user_uuid: string }> }) {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [friendEmail, setFriendEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const extractParams = async () => {
      const resolvedParams = await params;
      if (active) {
        setCurrentUserId(resolvedParams.user_uuid);
      }
    };

    extractParams();

    return () => {
      active = false;
    };
  }, [params]);

  const handleSearch = (query: string) => {
    setFriendEmail(query);
  };

  const handleSubmit = async () => {
    const trimmed = friendEmail.trim();
    console.log('Submitting friend request to email:', trimmed);
    console.log('Submitting friend request from:', currentUserId);
    if (!trimmed) {
      setMessage('Please enter a friend email address');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {

      const result = await sendFriendRequestAction({
        requesterUuid: currentUserId,
        recipientEmail: trimmed,
      });

      if (!result.success) {
        setMessage(result.error || 'Failed to send friend request. Please try again.');
        return;
      } else {
        setMessage('Friend request sent successfully!');
        setFriendEmail('');
      }
    } catch (error) {
      setMessage('Failed to send friend request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GenericPage
      title="Add Friend"
      description="Enter a friend's email address to send a friend request"
      searchPlaceholder="Enter friend email address"
      submitLabel={isLoading ? 'Sending...' : 'Send Friend Request'}
      homeHref={`/dashboard/${currentUserId}`}
      onSearch={handleSearch}
      onSubmit={handleSubmit}
      showSearch={true}
      showSubmit={true}
    >
      <div className="space-y-4">
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('success')
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }`}>
            {message}
          </div>
        )}
      </div>
    </GenericPage>
  );
}
