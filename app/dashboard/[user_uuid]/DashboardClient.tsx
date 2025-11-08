'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Task } from '@/app/types/task.type';
import type { Group } from '@/app/types/group.type';
import type { Tamagotchi } from '@/app/types/tamagotchi.type';
import { TamagotchiDisplay } from '@/components/features/tamagotchi/TamagotchiDisplay';
import { fetchPendingRequestsAction } from '@/app/friends/[user_uuid]/requests/actions';

type DashboardClientProps = {
  userUuid: string;
};

export default function DashboardClient({ userUuid }: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedGroupUuid, setSelectedGroupUuid] = useState<Group['group_uuid'] | null>(null);
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [tamagotchiStats, setTamagotchiStats] = useState({
    completed_tasks: 0,
    incomplete_tasks: 0,
    total_tasks: 0,
    happiness_score: 0
  });
  const [userColor, setUserColor] = useState<number[]>([79, 70, 229]); // Default indigo

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
        created_at: task.created_at ? new Date(task.created_at) : undefined,
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

  const handleToggleTask = (todo_uuid: string) => {
    setTasks((prevTasks) =>
      prevTasks.map(t => t.todo_uuid === todo_uuid ? { ...t, completed: !t.completed_at } : t)
    );
  };

  const handleSelectGroup = (group_uuid: Group['group_uuid']) => {
    setSelectedGroupUuid((prev) => (prev === group_uuid ? null : group_uuid));
  };

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

  return (
    <>
      {/* Tamagotchi display section */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">My Tamagotchi</h2>
        <TamagotchiDisplay
          points={tamagotchiStats.happiness_score}
          level={tamagotchi?.level || 1}
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
          <div className="flex items-center gap-8">
            <Link
              href={`/friends/${userUuid}/requests`}
              className="text-sm text-indigo-600 hover:underline"
            >
              View Friendship Requests ({pendingCount})
            </Link>
            <Link
              href={`/friends/${userUuid}/add`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Add Friend
            </Link>
          </div>
        </div>
        <Link
          href={`/friends/${userUuid}`}
          className="block text-center px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
        >
          View All Friends
        </Link>
      </section>
      {/* to-do group section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">My Groups</h2>
          <Link
            href={`/groups/${userUuid}/add`}
            className="text-sm text-primary hover:underline"
          >
            Create New Group
          </Link>
        </div>
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
                  className={`text-left px-4 py-3 border rounded-lg transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900">{group.group_name}</span>
                    {selected && (
                      <span className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5">
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
          <Link
            href={`/groups/${userUuid}/${selectedGroup.group_uuid}`}
            className="mt-4 inline-flex w-full justify-center rounded-md border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            View Group Members
          </Link>
        )}
      </section>
      {/* To-do list section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
          <Link
            href={createTaskHref}
            className="text-sm text-primary hover:underline"
          >
            Create Task
          </Link>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet</p>
          ) : (
            tasks.map(task => (
              <div
                key={task.todo_uuid}
                className={`flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border ${task.completed_at ? 'opacity-60 line-through' : ''
                  }`}
              >
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-500">
                    Due {task.due_date?.toDateString()} • Priority: {task.priority}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleTask(task.todo_uuid)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-150 ${task.completed_at
                    ? 'bg-gray-200 hover:bg-gray-300'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                >
                  {task.completed_at ? 'Undo' : 'Complete'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
