'use client'

import { useEffect, useState } from 'react';
import GenericPage from '@/components/layout/GenericPage';
import GenericList, { GenericListItem } from '@/components/layout/GenericList';
import { fetchFriendsAction, removeFriendAction } from './actions';

export default function FriendsPage({ params }: { params: Promise<{ user_uuid: string }> }) {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [friends, setFriends] = useState<GenericListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let active = true;

    const loadFriends = async () => {
      if (!currentUserId) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchFriendsAction(currentUserId);
        if (!active) return;

        if (!result.success) {
          setError(result.error || 'Failed to load friends.');
          setFriends([]);
          return;
        }

        setFriends(result.friends);
      } catch (err) {
        if (!active) return;
        console.error('Failed to fetch friends:', err);
        setError('Failed to load friends. Please try again.');
        setFriends([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadFriends();

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRemoveFriend = async (friendId: string) => {
    setError(null);
    try {
      const result = await removeFriendAction({
        userUuid: currentUserId,
        friendUuid: friendId,
      });

      if (!result.success) {
        setError(result.error || 'Failed to remove friend.');
        return;
      }

      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err) {
      console.error('Failed to remove friend:', err);
      setError('Failed to remove friend. Please try again.');
    }
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.subtitle && friend.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <GenericPage
      title="My Friends"
      description="View and manage your friends"
      searchPlaceholder="Search friends..."
      showBackButton
      onSearch={handleSearch}
      showSearch={true}
      showSubmit={false}
    >
      {error && (
        <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-100">
          {error}
        </div>
      )}
      <GenericList
        items={filteredFriends}
        onAction={handleRemoveFriend}
        actionLabel="Remove"
        isLoading={isLoading}
        emptyMessage={searchQuery ? 'No friends found matching your search.' : 'No friends yet. Add some friends to get started!'}
      />
    </GenericPage>
  );
}
