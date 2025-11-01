'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage({ params }: { params: { user_uuid: string } }) {
  const [activePage, setActivePage] = useState('home');
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const user_uuid = params.user_uuid;
    async function fetchDashboard() {
      const res = await fetch(`/api/dashboard/${user_uuid}`);
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks || []);
    }
    fetchDashboard();
  }, [params]);
  const handleToggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const pages = [
    { id: 'home', label: 'Tamagotchi →' },
    { id: 'groups', label: 'Groups' },
    { id: 'school', label: 'School' },
    { id: 'errands', label: 'Errands' },
    { id: 'chores', label: 'Chores' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-1/5 bg-white border-r border-gray-200 flex flex-col p-4">
        <div className="space-y-2">
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-150 ${activePage === p.id
                ? 'bg-indigo-100 text-indigo-600 font-semibold'
                : 'hover:bg-gray-100'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button className="mt-auto bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-xl font-medium transition-all duration-150">
          + Create Group
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <button className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl transition-all duration-150">
            Logout
          </button>
        </header>

        {/* Task list */}
        <section className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border ${task.completed ? 'opacity-60 line-through' : ''
                  }`}
              >
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-500">
                    Due {task.due_date} • Priority: {task.priority}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-150 ${task.completed
                    ? 'bg-gray-200 hover:bg-gray-300'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                >
                  {task.completed ? 'Undo' : 'Complete'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
