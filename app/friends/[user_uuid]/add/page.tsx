'use client'

import { useState } from 'react';
import GenericPage from '@/components/layout/GenericPage';

export default function AddFriendPage() {
  const [friendId, setFriendId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (query: string) => {
    setFriendId(query);
  };

  const handleSubmit = async () => {
    if (!friendId.trim()) {
      setMessage('Please enter a friend ID');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // TODO: Replace with actual API call
      // const result = await sendFriendRequest(currentUserId, friendId);

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage('Friend request sent successfully!');
      setFriendId('');
    } catch (error) {
      setMessage('Failed to send friend request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GenericPage
      title="Add Friend"
      description="Enter a friend's user ID to send a friend request"
      searchPlaceholder="Enter friend user ID (UUID)"
      submitLabel={isLoading ? 'Sending...' : 'Send Friend Request'}
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
