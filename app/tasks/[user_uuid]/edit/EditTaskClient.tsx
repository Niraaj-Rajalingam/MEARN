'use client';

import { useEffect, useState } from 'react';
import TaskForm from '@/app/components/TaskForm';
import { fetchTaskAction, updateTaskAction } from './actions';

type EditTaskClientProps = {
  userUuid: string;
  taskUuid: string;
};

export default function EditTaskClient({ userUuid, taskUuid }: EditTaskClientProps) {
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadTask = async () => {
      try {
        setIsLoading(true);
        const result = await fetchTaskAction(taskUuid, userUuid);

        if (!result.success) {
          setError(result.error || 'Failed to load task');
          return;
        }

        const task = result.task;
        const dueDate = task.due_date
          ? new Date(task.due_date).toISOString().split('T')[0]
          : '';

        setInitialData({
          title: task.title,
          description: task.description || '',
          dueDate,
          priority: String(task.priority) as '1' | '2' | '3',
        });
      } catch (err) {
        console.error('Failed to load task:', err);
        setError('Failed to load task. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskUuid, userUuid]);

  const handleSubmit = async (data: any) => {
    return updateTaskAction({
      taskUuid,
      ...data,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error || !initialData) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error || 'Failed to load task'}</div>;
  }

  return (
    <TaskForm
      mode="edit"
      userUuid={userUuid}
      taskUuid={taskUuid}
      initialData={initialData}
      onSubmit={handleSubmit}
    />
  );
}
