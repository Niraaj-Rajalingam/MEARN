'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TamagotchiCharacter } from '@/components/features/tamagotchi/TamagotchiCharacter';
import { getTamagotchiMood } from '@/app/utils/tamagotchi.utils';

type Friend = {
  user_uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  color_scheme: number[];
  tamagotchi: {
    tamagotchi_uuid: string;
    level: number;
    happiness_score: number;
  } | null;
  stats: {
    happiness_score: number;
    completed_tasks: number;
    incomplete_tasks: number;
  };
  lastCompletedTask: {
    title: string;
    completedAt: string;
  } | null;
};

export default function FriendsTamagotchisPage({
  params
}: {
  params: Promise<{ user_uuid: string }>;
}) {
  const [userUuid, setUserUuid] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const resolvedParams = await params;
        if (!active) return;

        setUserUuid(resolvedParams.user_uuid);

        const response = await fetch(`/api/friends/${resolvedParams.user_uuid}/tamagotchis`);
        if (!response.ok) {
          throw new Error('Failed to fetch friends tamagotchis');
        }

        const data = await response.json();
        if (active) {
          setFriends(data.friends || []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Loading friends' tamagotchis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-red-500">Error: {error}</p>
          <div className="mt-4 text-center">
            <Link
              href={`/dashboard/${userUuid}`}
              className="text-indigo-500 hover:text-indigo-600 underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">

          <div>
            <h1 className="text-3xl font-bold">Friends' Tamagotchis</h1>
            <p className="text-muted-foreground mt-1">
              See how your friends' tamagotchis are doing!
            </p>
          </div>
        </div>

        {/* Friends List */}
        {friends.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground">
              You don't have any friends yet. Add some friends to see their tamagotchis!
            </p>
            <Link
              href={`/friends/${userUuid}`}
              className="inline-block mt-4 text-indigo-500 hover:text-indigo-600 underline"
            >
              View Friends
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {friends.map((friend) => {
              const userColor = friend.color_scheme || [79, 70, 229];
              const displayName = friend.first_name && friend.last_name
                ? `${friend.first_name} ${friend.last_name}`
                : friend.email;

              return (
                <div
                  key={friend.user_uuid}
                  className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col items-center"
                >
                  {/* Tamagotchi Character */}
                  {friend.tamagotchi ? (
                    <>
                      <TamagotchiCharacter
                        mood={getTamagotchiMood(friend.stats.happiness_score)}
                        userColor={userColor}
                        size={120}
                      />
                      <div className="mt-3 text-center">
                        <p className="font-semibold text-gray-900">{displayName}</p>
                        <p className="text-xs text-muted-foreground mt-1">Level {friend.tamagotchi.level}</p>
                        <p className="text-sm font-medium mt-1" style={{ color: `rgb(${userColor[0]}, ${userColor[1]}, ${userColor[2]})` }}>
                          {friend.stats.happiness_score} happiness
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">{displayName}</p>
                      <p className="text-xs mt-2">No tamagotchi</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
