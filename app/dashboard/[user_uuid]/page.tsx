'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Task } from '@/app/types/task.type';
import type { Tamagotchi } from '@/app/types/tamagotchi.type';
import { TamagotchiDisplay } from '@/components/features/tamagotchi/TamagotchiDisplay';
import { fetchPendingRequestsAction } from '@/app/friends/[user_uuid]/requests/actions';

export default function DashboardPage({ params }: { params: { user_uuid: string } }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [tamagotchiStats, setTamagotchiStats] = useState({
    completed_tasks: 0,
    incomplete_tasks: 0,
    total_tasks: 0,
    happiness_score: 0
  });
  const [userColor, setUserColor] = useState<number[]>([79, 70, 229]); // Default indigo
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const user_uuid = params.user_uuid;
    async function fetchDashboard() {
      const res = await fetch(`/api/dashboard/${user_uuid}`);
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks || []);
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
  }, [params]);

  useEffect(() => {
    let active = true;

    const loadPendingRequests = async () => {
      try {
        const result = await fetchPendingRequestsAction(params.user_uuid);
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
  }, [params.user_uuid]);

  const handleToggleTask = (todo_uuid: string) => {
    setTasks(tasks.map(t => t.todo_uuid === todo_uuid ? { ...t, completed: !t.completed_at } : t));
  };

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
              href={`/friends/${params.user_uuid}/requests`}
              className="text-sm text-indigo-600 hover:underline"
            >
              View Friendship Requests ({pendingCount})
            </Link>
            <Link
              href={`/friends/${params.user_uuid}/add`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Add Friend
            </Link>
          </div>
        </div>
        <Link
          href={`/friends/${params.user_uuid}`}
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
            href={`/groups/${params.user_uuid}/add`}
            className="text-sm text-primary hover:underline"
          >
            Create New Group
          </Link>
        </div>
        {/* to-do list component will go here */}
      </section>
      {/* To-do list section */}
      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
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
