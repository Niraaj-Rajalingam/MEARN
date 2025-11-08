'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GenericPage from '@/components/layout/GenericPage';
import { createTaskAction } from './actions';

type FormErrors = {
  title?: string;
  assigneeEmail?: string;
  dueDate?: string;
};

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

type AddTaskClientProps = {
  userUuid: string;
};

export default function AddTaskClient({ userUuid }: AddTaskClientProps) {
  const searchParams = useSearchParams();
  const selectedGroupUuid = searchParams.get('group');
  const selectedGroupName = searchParams.get('groupName');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'1' | '2' | '3'>('2');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'success' | 'error' | ''>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const allowAssigneeInput = Boolean(selectedGroupUuid);

  useEffect(() => {
    if (!allowAssigneeInput && assigneeEmail) {
      setAssigneeEmail('');
      setErrors((prev) => ({ ...prev, assigneeEmail: undefined }));
    }
  }, [allowAssigneeInput, assigneeEmail]);

  const groupSummary = useMemo(() => {
    if (selectedGroupUuid) {
      if (selectedGroupName) {
        return `Task will be created inside group "${selectedGroupName}".`;
      }
      return 'Task will be created inside the selected group.';
    }
    return 'No group selected from dashboard. Task will not belong to a group.';
  }, [selectedGroupUuid, selectedGroupName]);

  const flash = (kind: 'success' | 'error', text: string) => {
    setMessageKind(kind);
    setMessage(text);
  };

  const resetFlash = () => {
    setMessage('');
    setMessageKind('');
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!title.trim()) {
      nextErrors.title = 'Please enter a task title.';
    }

    if (allowAssigneeInput && assigneeEmail.trim() && !isEmail(assigneeEmail.trim())) {
      nextErrors.assigneeEmail = 'Enter a valid email address.';
    }

    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      nextErrors.dueDate = 'Enter a valid date.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateTask = async () => {
    resetFlash();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await createTaskAction({
        title,
        description,
        dueDate,
        priority,
        assigneeEmail: allowAssigneeInput ? assigneeEmail : '',
        creatorUuid: userUuid,
        groupUuid: selectedGroupUuid,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to create task.');
        return;
      }

      flash('success', `Task "${result.task.title}" created successfully.`);
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('2');
      setAssigneeEmail('');
      setErrors({});
    } catch (error) {
      console.error('Unable to create task:', error);
      flash('error', 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GenericPage
      title="Create Task"
      description="Add a task with a due date, priority, and assigned teammate."
      showSearch={false}
      showSubmit={true}
      homeHref={`/dashboard/${userUuid}`}
      submitLabel={isSubmitting ? 'Creating...' : 'Create Task'}
      onSubmit={handleCreateTask}
    >
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            messageKind === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }`}
        >
          {message}
        </div>
      )}

      <div className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
        {groupSummary}
      </div>

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

      {allowAssigneeInput ? (
        <div className="space-y-1">
          <label className="text-sm font-medium">Assignee email (optional)</label>
          <input
            type="email"
            value={assigneeEmail}
            onChange={(e) => {
              setAssigneeEmail(e.target.value);
              if (errors.assigneeEmail) {
                setErrors((prev) => ({ ...prev, assigneeEmail: undefined }));
              }
            }}
            className="w-full px-3 py-2 border rounded-md bg-background"
            placeholder="member@example.com"
          />
          {errors.assigneeEmail && (
            <p className="text-xs text-red-600">{errors.assigneeEmail}</p>
          )}
          {!errors.assigneeEmail && (
            <p className="text-xs text-muted-foreground">Only members of this group can be assigned.</p>
          )}
        </div>
      ) : (
        <div className="space-y-1 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          Select a group to assign tasks to other members. Without a group, the task will be assigned to you.
        </div>
      )}
    </GenericPage>
  );
}
