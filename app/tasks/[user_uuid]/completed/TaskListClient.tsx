'use client';

import { useState, useEffect, useRef } from 'react';
import type { Task } from '@/app/types/task.type';
import TaskDetailModal from './TaskDetailModal';
import { searchTasksByKeywordAction } from './actions';

type TaskListClientProps = {
  tasks: Task[];
  userUuid: string;
  status: 'completed' | 'cancelled';
  statusConfig: {
    badgeColor: string;
    badgeLabel: string;
    dateLabel: string;
  };
  groupUuid?: string | null;
  currentPage?: number;
  hasMore?: boolean;
};

export default function TaskListClient({
  tasks,
  userUuid,
  status,
  statusConfig,
  groupUuid,
  currentPage = 1,
  hasMore = false,
}: TaskListClientProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTasks(tasks);
      setIsSearching(false);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsSearching(true);

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await searchTasksByKeywordAction(
          userUuid,
          status,
          searchQuery,
          groupUuid
        );

        if (result.success) {
          setFilteredTasks(result.tasks);
        } else {
          console.error('Search failed:', result.error);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, userUuid, status, groupUuid, tasks]);

  return (
    <>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search tasks by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isSearching && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          {searchQuery ? 'No tasks match your search.' : 'No tasks found.'}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-md border">
            {filteredTasks.map((task) => (
              <li key={String(task.todo_uuid)} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="font-medium text-gray-900 hover:text-blue-600 text-left cursor-pointer"
                  >
                    {task.title}
                  </button>
                  <span className={`text-xs font-semibold ${statusConfig.badgeColor} px-3 py-1 rounded-full`}>
                    {statusConfig.badgeLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {task.completed_at
                    ? `${statusConfig.dateLabel} ${new Date(task.completed_at).toDateString()}`
                    : `${statusConfig.dateLabel} unavailable`}
                </p>
              </li>
            ))}
          </ul>

          {/* Pagination Controls */}
          {!searchQuery && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> {hasMore && '(more available)'}
              </div>
              <div className="flex gap-2">
                <a
                  href={`?status=${status}${groupUuid ? `&group=${groupUuid}` : ''}${currentPage > 1 ? `&page=${currentPage - 1}` : '&page=1'}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  onClick={(e) => currentPage === 1 && e.preventDefault()}
                >
                  Previous
                </a>
                <a
                  href={`?status=${status}${groupUuid ? `&group=${groupUuid}` : ''}&page=${currentPage + 1}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    !hasMore
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  onClick={(e) => !hasMore && e.preventDefault()}
                >
                  Next
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          userUuid={userUuid}
          status={status}
        />
      )}
    </>
  );
}
