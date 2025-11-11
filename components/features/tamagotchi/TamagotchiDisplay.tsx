'use client'

import { TamagotchiCharacter } from './TamagotchiCharacter';
import { getTamagotchiMood, getMoodDescription } from '@/app/utils/tamagotchi.utils';

interface TamagotchiDisplayProps {
  points?: number; // Happiness score from completed tasks
  level?: number;
  levelProgressMessage?: string;
  lastCompletedTask?: {
    title: string;
    completedAt: Date;
  } | null;
  completedTasks?: number;
  incompleteTasks?: number;
  userColor?: number[]; // User's RGB color scheme
}

export function TamagotchiDisplay({
  points = 0,
  level = 1,
  levelProgressMessage,
  lastCompletedTask = null,
  completedTasks = 0,
  incompleteTasks = 0,
  userColor = [79, 70, 229] // Default indigo
}: TamagotchiDisplayProps) {

  const mood = getTamagotchiMood(points);
  const moodDescription = getMoodDescription(mood);

  // Convert RGB to hex for display
  const userColorHex = `rgb(${userColor[0]}, ${userColor[1]}, ${userColor[2]})`;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Tamagotchi Character */}
      <div className="flex flex-col items-center justify-center py-6">
        <TamagotchiCharacter
          mood={mood}
          userColor={userColor}
          size={150}
        />
        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400 max-w-xs">
          {moodDescription}
        </p>
      </div>

      {/* Task Progress */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Task Progress</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/20">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
          </div>
          <div className="p-3 border rounded-md bg-orange-50 dark:bg-orange-900/20">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{incompleteTasks}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
          </div>
        </div>
      </div>

      {/* Last Completed Task */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Last Completed Task</h3>
        {lastCompletedTask ? (
          <div className="p-3 border rounded-md bg-card">
            <p className="font-medium text-sm">{lastCompletedTask.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Completed {formatTimeAgo(lastCompletedTask.completedAt)}
            </p>
          </div>
        ) : (
          <div className="p-3 border rounded-md bg-card">
            <p className="text-sm text-muted-foreground">No tasks completed yet</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="pt-4 border-t space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: userColorHex }}>{points}</p>
            <p className="text-xs text-muted-foreground">Happiness Score</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{level}</p>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
        </div>

        {/* Level Progress Message */}
        {levelProgressMessage && (
          <div className="p-3 border rounded-md bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <p className="text-sm text-center font-semibold text-black dark:text-white">
              {levelProgressMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
