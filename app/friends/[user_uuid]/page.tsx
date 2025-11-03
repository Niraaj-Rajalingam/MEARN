'use client'

import { useState } from 'react';
import GenericPage from '@/components/layout/GenericPage';
import GenericList, { GenericListItem } from '@/components/layout/GenericList';

export default function FriendsPage() {
  const [friends, setFriends] = useState<GenericListItem[]>([
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Niraaj Rajalingam',
      subtitle: 'niraaj@gmail.com'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Ridvik Pal',
      subtitle: 'ridvik@gmail.com'
    }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      // TODO: Replace with actual API call
      // await removeFriend(currentUserId, friendId);

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Remove friend from local state
      setFriends(friends.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Failed to remove friend:', error);
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
      onSearch={handleSearch}
      showSearch={true}
      showSubmit={false}
    >
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
