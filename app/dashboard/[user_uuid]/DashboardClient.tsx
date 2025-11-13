'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { Task } from '@/app/types/task.type';
import type { Group } from '@/app/types/group.type';
import TaskFilter, { type TaskFilterType } from '@/app/components/TaskFilter';
import FlashMessage from '@/app/components/FlashMessage';
import type { Tamagotchi } from '@/app/types/tamagotchi.type';
import { TamagotchiDisplay } from '@/components/features/tamagotchi/TamagotchiDisplay';
import { TamagotchiCharacter } from '@/components/features/tamagotchi/TamagotchiCharacter';
import { getTamagotchiMood } from '@/app/utils/tamagotchi.utils';
import { fetchPendingRequestsAction } from '@/app/friends/[user_uuid]/requests/actions';
import { fetchFriendsAction, removeFriendAction } from '@/app/friends/[user_uuid]/actions';
import { searchActiveDashboardTasksAction, getFilteredDashboardTasksAction, deleteGroupAction } from './actions';
import { useFlashMessage } from '@/app/utils/hooks';

type DashboardClientProps = {
  userUuid: string;
};

type FriendTamagotchi = {
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

export default function DashboardClient({ userUuid }: DashboardClientProps) {
  const { message, messageKind, flash, resetFlash } = useFlashMessage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [friends, setFriends] = useState<Array<{ id: string; title: string; subtitle?: string; friend_uuid: string }>>([]);
  const [friendsTamagotchis, setFriendsTamagotchis] = useState<FriendTamagotchi[]>([]);
  const [friendsViewMode, setFriendsViewMode] = useState<'list' | 'tamagotchi'>('tamagotchi');
  const [selectedGroupUuid, setSelectedGroupUuid] = useState<Group['group_uuid'] | null>(null);
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [tamagotchiStats, setTamagotchiStats] = useState({
    completed_tasks: 0,
    incomplete_tasks: 0,
    total_tasks: 0,
    happiness_score: 0
  });
  const [levelInfo, setLevelInfo] = useState({
    level: 1,
    daysAtThreshold: 0,
    nextLevelThreshold: null as number | null,
    daysNeeded: null as number | null,
    progressMessage: ''
  });
  const [userColor, setUserColor] = useState<number[]>([79, 70, 229]); // Default indigo
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteGroupUuid, setDeleteGroupUuid] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const activeTasks = useMemo(() => (
    tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled')
  ), [tasks]);

  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTasks(activeTasks);
    }
  }, [activeTasks]);

  useEffect(() => {
    async function fetchDashboard() {
      const query = selectedGroupUuid ? `?group=${selectedGroupUuid}` : '';
      const res = await fetch(`/api/dashboard/${userUuid}${query}`);
      if (!res.ok) return;
      const data = await res.json();
      const normalizedTasks = (data.tasks || []).map((task: Task) => ({
        ...task,
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
        created_at: new Date(task.created_at),
      }));
      setTasks(normalizedTasks);
      setGroups(data.groups || []);
      setSelectedGroupUuid((prev) => {
        if (!prev) return null;
        return data.groups?.some((group: Group) => group.group_uuid === prev) ? prev : null;
      });
      setTamagotchi(data.tamagotchi || null);
      setTamagotchiStats(data.tamagotchiStats || {
        completed_tasks: 0,
        incomplete_tasks: 0,
        total_tasks: 0,
        happiness_score: 0
      });
      setLevelInfo(data.levelInfo || {
        level: 1,
        daysAtThreshold: 0,
        nextLevelThreshold: null,
        daysNeeded: null,
        progressMessage: ''
      });
      setUserColor(data.userColor || [79, 70, 229]);
    }
    fetchDashboard();
  }, [userUuid, selectedGroupUuid]);

  useEffect(() => {
    let active = true;

    const loadPendingRequests = async () => {
      try {
        const result = await fetchPendingRequestsAction(userUuid);
        if (!active) return;
        if (result.success) {
          setPendingCount(result.requests.length);
        } else {
          setPendingCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch pending requests count:', error);
        if (active) {
          setPendingCount(0);
        }
      }
    };

    loadPendingRequests();

    return () => {
      active = false;
    };
  }, [userUuid]);

  useEffect(() => {
    let active = true;

    const loadFriends = async () => {
      try {
        // Load list view data
        const result = await fetchFriendsAction(userUuid);
        if (!active) return;
        if (result.success) {
          setFriends(result.friends);
        } else {
          setFriends([]);
        }

        // Load tamagotchi view data
        const response = await fetch(`/api/friends/${userUuid}/tamagotchis`);
        if (!response.ok) {
          throw new Error('Failed to fetch friends tamagotchis');
        }
        const data = await response.json();
        if (active) {
          setFriendsTamagotchis(data.friends || []);
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error);
        if (active) {
          setFriends([]);
          setFriendsTamagotchis([]);
        }
      }
    };

    loadFriends();

    return () => {
      active = false;
    };
  }, [userUuid]);

  const handleCompleteTask = async (todo_uuid: string) => {
    try {
      const res = await fetch(`/api/tasks/${todo_uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!res.ok) {
        throw new Error('Failed to complete task');
      }

      const data = await res.json();
      const completedAtValue = data.task?.completed_at ? new Date(data.task.completed_at) : new Date();

      setTasks((prevTasks) =>
        prevTasks.map(t =>
          t.todo_uuid === todo_uuid
            ? { ...t, status: 'completed', completed_at: completedAtValue }
            : t
        )
      );

      // Refresh dashboard to update happiness score and level
      const query = selectedGroupUuid ? `?group=${selectedGroupUuid}` : '';
      const dashboardRes = await fetch(`/api/dashboard/${userUuid}${query}`);
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setTamagotchi(dashboardData.tamagotchi || null);
        setTamagotchiStats(dashboardData.tamagotchiStats || {
          completed_tasks: 0,
          incomplete_tasks: 0,
          total_tasks: 0,
          happiness_score: 0
        });
        setLevelInfo(dashboardData.levelInfo || {
          level: 1,
          daysAtThreshold: 0,
          nextLevelThreshold: null,
          daysNeeded: null,
          progressMessage: ''
        });
      }
    } catch (error) {
      console.error('Unable to complete task:', error);
    }
  };

  const handleDeleteTask = async (todo_uuid: string) => {
    try {
      const res = await fetch(`/api/tasks/${todo_uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) {
        throw new Error('Failed to delete task');
      }
      setTasks((prevTasks) => prevTasks.filter((task) => task.todo_uuid !== todo_uuid));
    } catch (error) {
      console.error('Unable to delete task:', error);
    }
  };

  const handleSelectGroup = (group_uuid: Group['group_uuid']) => {
    setSelectedGroupUuid((prev) => (prev === group_uuid ? null : group_uuid));
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const result = await removeFriendAction({
        userUuid: userUuid,
        friendUuid: friendId,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to remove friend.');
        return;
      }

      flash('success', 'Friend removed successfully');
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err) {
      console.error('Failed to remove friend:', err);
      flash('error', 'Failed to remove friend. Please try again.');
    }
  };

  const handleDeleteGroupClick = (groupUuid: string) => {
    setDeleteGroupUuid(groupUuid);
    setShowDeleteModal(true);
    setDeleteConfirmInput('');
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupUuid) return;

    const groupToDelete = groups.find((g) => String(g.group_uuid) === deleteGroupUuid);
    if (!groupToDelete) return;

    if (deleteConfirmInput.trim() !== groupToDelete.group_name.trim()) {
      flash('error', 'Group name does not match.');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteGroupAction({
        groupUuid: deleteGroupUuid,
        userUuid,
        groupName: groupToDelete.group_name,
        confirmationInput: deleteConfirmInput,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to delete group.');
        return;
      }

      flash('success', result.message || 'Group deleted successfully');
      setShowDeleteModal(false);
      setDeleteConfirmInput('');
      setDeleteGroupUuid(null);

      // Remove the deleted group from the list
      setGroups((prev) => prev.filter((g) => String(g.group_uuid) !== deleteGroupUuid));

      // Clear selection if the deleted group was selected
      if (selectedGroupUuid === deleteGroupUuid) {
        setSelectedGroupUuid(null);
      }

      // Refresh dashboard after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error deleting group:', err);
      flash('error', 'Failed to delete group.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Apply filter when filter type changes (without search)
  useEffect(() => {
    if (searchQuery.trim()) return; // Skip if searching

    async function applyFilter() {
      try {
        const result = await getFilteredDashboardTasksAction(
          userUuid,
          selectedGroupUuid,
          taskFilter
        );

        if (result.success) {
          const normalizedTasks = (result.tasks || []).map((task: Task) => ({
            ...task,
            due_date: task.due_date ? new Date(task.due_date) : undefined,
            completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
            created_at: new Date(task.created_at),
          }));
          setFilteredTasks(normalizedTasks);
        }
      } catch (error) {
        console.error('Filter error:', error);
      }
    }

    applyFilter();
  }, [taskFilter, selectedGroupUuid, userUuid, searchQuery]);

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
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
        const result = await searchActiveDashboardTasksAction(
          userUuid,
          searchQuery,
          selectedGroupUuid,
          taskFilter
        );

        if (result.success) {
          const normalizedTasks = (result.tasks || []).map((task: Task) => ({
            ...task,
            due_date: task.due_date ? new Date(task.due_date) : undefined,
            completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
            created_at: new Date(task.created_at),
          }));
          setFilteredTasks(normalizedTasks);
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
  }, [searchQuery, userUuid, selectedGroupUuid, taskFilter, activeTasks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupUuid) return null;
    return groups.find(group => group.group_uuid === selectedGroupUuid) || null;
  }, [groups, selectedGroupUuid]);

  const createTaskHref = selectedGroupUuid
    ? (() => {
      const paramsObj = new URLSearchParams({ group: String(selectedGroupUuid) });
      if (selectedGroup?.group_name) {
        paramsObj.set('groupName', selectedGroup.group_name);
      }
      return `/tasks/${userUuid}/add?${paramsObj.toString()}`;
    })()
    : `/tasks/${userUuid}/add`;

  // Get last completed task for tamagotchi display
  const completedTasks = tasks.filter(t => t.completed_at);
  const lastCompletedTask = completedTasks.length > 0
    ? {
      title: completedTasks[0].title,
      completedAt: new Date(completedTasks[0].completed_at!)
    }
    : null;
  const getViewTasksHref = (status: 'completed' | 'cancelled') => {
    if (selectedGroupUuid) {
      const paramsObj = new URLSearchParams({ group: String(selectedGroupUuid), status });
      if (selectedGroup?.group_name) {
        paramsObj.set('groupName', selectedGroup.group_name);
      }
      return `/tasks/${userUuid}/completed?${paramsObj.toString()}`;
    }
    return `/tasks/${userUuid}/completed?status=${status}`;
  };

  return (
    <>
      {/* Tamagotchi display section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Tamagotchi</h2>
        </div>
        <TamagotchiDisplay
          points={tamagotchiStats.happiness_score}
          level={tamagotchi?.level || 1}
          levelProgressMessage={levelInfo.progressMessage}
          lastCompletedTask={lastCompletedTask}
          completedTasks={tamagotchiStats.completed_tasks}
          incompleteTasks={tamagotchiStats.incomplete_tasks}
          userColor={userColor}
        />
      </section>


      {/* Friends section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Friends</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFriendsViewMode(friendsViewMode === 'list' ? 'tamagotchi' : 'list')}
              className="text-sm px-3 py-1.5 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-md hover:opacity-90 transition-opacity"
            >
              {friendsViewMode === 'list' ? 'Tamagotchi View' : 'List View'}
            </button>
            <Link
              href={`/friends/${userUuid}/requests`}
              className="text-sm text-[hsl(var(--accent))] hover:underline"
            >
              Requests ({pendingCount})
            </Link>
            <Link
              href={`/friends/${userUuid}/add`}
              className="text-sm text-[hsl(var(--accent))] hover:underline"
            >
              Add Friend
            </Link>
          </div>
        </div>

        {friendsViewMode === 'list' ? (
          friends.length === 0 ? (
            <p className="text-gray-500">No friends yet. Add some friends to get started!</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{friend.title}</h3>
                    {friend.subtitle && (
                      <p className="text-sm text-gray-500">{friend.subtitle}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="px-4 py-2 rounded-xl font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          friendsTamagotchis.length === 0 ? (
            <p className="text-gray-500">No friends yet. Add some friends to see their tamagotchis!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {friendsTamagotchis.map((friend) => {
                const friendColor = friend.color_scheme || [79, 70, 229];
                const displayName = friend.first_name && friend.last_name
                  ? `${friend.first_name} ${friend.last_name}`
                  : friend.email;

                return (
                  <div
                    key={friend.user_uuid}
                    className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col items-center"
                  >
                    {friend.tamagotchi ? (
                      <>
                        <TamagotchiCharacter
                          mood={getTamagotchiMood(friend.stats.happiness_score)}
                          userColor={friendColor}
                          size={100}
                        />
                        <div className="mt-3 text-center">
                          <p className="font-semibold text-foreground">{displayName}</p>
                          <p className="text-xs text-muted-foreground mt-1">Level {friend.tamagotchi.level}</p>
                          <p className="text-sm font-medium mt-1" style={{ color: `rgb(${friendColor[0]}, ${friendColor[1]}, ${friendColor[2]})` }}>
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
          )
        )}
      </section>
      {/* to-do group section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">My Groups</h2>
          <Link
            href={`/groups/${userUuid}/add`}
            className="text-sm text-[hsl(var(--accent))] hover:underline"
          >
            Create New Group
          </Link>
        </div>

        <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />

        {groups.length === 0 ? (
          <p className="text-gray-500">You are not part of any groups yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map(group => {
              const selected = selectedGroupUuid === group.group_uuid;
              return (
                <button
                  key={group.group_uuid}
                  type="button"
                  onClick={() => handleSelectGroup(group.group_uuid)}
                  className={`text-left px-4 py-3 border rounded-lg transition-all ${selected
                    ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 shadow-sm'
                    : 'border-gray-200 hover:border-[hsl(var(--accent))]/50'
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{group.group_name}</span>
                    {selected && (
                      <span className="text-xs font-semibold text-[hsl(var(--accent))] border border-[hsl(var(--accent))]/30 rounded-full px-2 py-0.5">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {selectedGroup && (
          <div className="mt-4 space-y-3">
            <Link
              href={`/groups/${userUuid}/${selectedGroup.group_uuid}`}
              className="inline-flex w-full justify-center rounded-md border border-[hsl(var(--accent))]/30 px-4 py-2 text-sm font-medium text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10"
            >
              View Group Members
            </Link>
            <button
              onClick={() => handleDeleteGroupClick(String(selectedGroup.group_uuid))}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Delete Group
            </button>
          </div>
        )}
      </section>

      {/* Delete group confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Group</h2>
            <p className="text-gray-700 mb-4">
              This action cannot be undone. All tasks in this group will be cancelled and the group will be permanently deleted.
            </p>
            {deleteGroupUuid && groups.find((g) => String(g.group_uuid) === deleteGroupUuid) && (
              <p className="text-gray-700 font-semibold mb-4">
                Type <span className="bg-gray-100 px-2 py-1 rounded">{groups.find((g) => String(g.group_uuid) === deleteGroupUuid)?.group_name}</span> to confirm:
              </p>
            )}
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={deleteGroupUuid && groups.find((g) => String(g.group_uuid) === deleteGroupUuid) ? `Enter "${groups.find((g) => String(g.group_uuid) === deleteGroupUuid)?.group_name}" to confirm` : 'Confirm'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              disabled={isDeleting}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput('');
                  setDeleteGroupUuid(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={
                  isDeleting ||
                  (deleteGroupUuid && groups.find((g) => String(g.group_uuid) === deleteGroupUuid)
                    ? deleteConfirmInput.trim() !== groups.find((g) => String(g.group_uuid) === deleteGroupUuid)!.group_name.trim()
                    : true)
                }
                className="flex-1 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* To-do list section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
          <Link
            href={createTaskHref}
            className="text-sm text-[hsl(var(--accent))] hover:underline"
          >
            Create Task
          </Link>
        </div>

        {activeTasks.length > 0 && (
          <TaskFilter selectedFilter={taskFilter} onFilterChange={setTaskFilter} />
        )}

        {activeTasks.length > 0 && (
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {activeTasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet</p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-gray-500">No tasks match your search.</p>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.todo_uuid}
                className={`flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border ${task.completed_at ? 'opacity-60 line-through' : ''
                  }`}
              >
                <button
                  onClick={() => window.location.href = `/tasks/${userUuid}/edit/${task.todo_uuid}`}
                  className="flex-1 hover:opacity-75 transition-opacity text-left"
                >
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500">
                    Due {task.due_date?.toDateString()} • Priority: {task.priority}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCompleteTask(task.todo_uuid)}
                    className="px-4 py-2 rounded-xl font-medium transition-all duration-150 bg-[hsl(var(--accent))] hover:opacity-90 text-[hsl(var(--accent-foreground))]"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.todo_uuid)}
                    className="px-4 py-2 rounded-xl font-medium border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 text-right">
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Tasks ▼
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-gray-200 z-10">
                <Link
                  href={getViewTasksHref('completed')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  ✓ View Completed Tasks
                </Link>
                <Link
                  href={getViewTasksHref('cancelled')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  ✗ View Deleted Tasks
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
