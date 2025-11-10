'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GenericPage from '@/components/layout/GenericPage';
import FlashMessage from '@/app/components/FlashMessage';
import { fetchTaskAction, updateTaskAction } from './actions';
import { useFlashMessage } from '@/app/utils/hooks';

type FormErrors = {
  title?: string;
  dueDate?: string;
};

type EditTaskClientProps = {
  userUuid: string;
  taskUuid: string;
};

export default function EditTaskClient({ userUuid, taskUuid }: EditTaskClientProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'1' | '2' | '3'>('2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const { message, messageKind, flash, resetFlash } = useFlashMessage();

  useEffect(() => {
    const loadTask = async () => {
      try {
        setIsLoading(true);
        const result = await fetchTaskAction(taskUuid, userUuid);

        if (!result.success) {
          flash('error', result.error || 'Failed to load task');
          return;
        }

        const task = result.task;
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(String(task.priority) as '1' | '2' | '3');

        if (task.due_date) {
          const date = new Date(task.due_date);
          setDueDate(date.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Failed to load task:', error);
        flash('error', 'Failed to load task. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskUuid, userUuid]);

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!title.trim()) {
      nextErrors.title = 'Please enter a task title.';
    }

    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      nextErrors.dueDate = 'Enter a valid date.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdateTask = async () => {
    resetFlash();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await updateTaskAction({
        taskUuid,
        title,
        description,
        dueDate,
        priority,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to update task.');
        return;
      }

      flash('success', `Task "${result.task.title}" updated successfully.`);
      setTimeout(() => {
        router.push(`/dashboard/${userUuid}`);
      }, 1000);
    } catch (error) {
      console.error('Unable to update task:', error);
      flash('error', 'Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <GenericPage
        title="Edit Task"
        description="Loading task details..."
        showSearch={false}
        showSubmit={false}
        homeHref={`/dashboard/${userUuid}`}
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </GenericPage>
    );
  }

  return (
    <GenericPage
      title="Edit Task"
      description="Update the task details."
      showSearch={false}
      showSubmit={true}
      homeHref={`/dashboard/${userUuid}`}
      submitLabel={isSubmitting ? 'Updating...' : 'Update Task'}
      onSubmit={handleUpdateTask}
    >
      <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />

      <div className="space-y-1">
        <label className="text-sm font-medium">Task title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          className="w-full px-3 py-2 border rounded-md bg-background"
          placeholder="e.g., Finish project outline"
        />
        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
          rows={4}
          placeholder="Add extra details for this task"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Due date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
          }}
          className="w-full px-3 py-2 border rounded-md bg-background"
        />
        {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as '1' | '2' | '3')}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>
      </div>
    </GenericPage>
  );
}
