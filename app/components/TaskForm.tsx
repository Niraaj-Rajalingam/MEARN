'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GenericPage from '@/components/layout/GenericPage';
import FlashMessage from '@/app/components/FlashMessage';
import FormField from '@/app/components/FormField';
import Input from '@/app/components/Input';
import { isEmail } from '@/app/utils/validation';
import { useFlashMessage } from '@/app/utils/hooks';

type TaskFormMode = 'create' | 'edit';

type FormErrors = {
  title?: string;
  assigneeEmail?: string;
  dueDate?: string;
};

interface TaskFormProps {
  mode: TaskFormMode;
  userUuid: string;
  taskUuid?: string;
  initialData?: {
    title: string;
    description: string;
    dueDate: string;
    priority: '1' | '2' | '3';
  };
  onSubmit: (data: {
    title: string;
    description: string;
    dueDate: string;
    priority: '1' | '2' | '3';
    assigneeEmail?: string;
    groupUuid?: string | null;
  }) => Promise<any>;
  onSubmitSuccess?: () => void;
}

/**
 * Generic reusable task form component
 * Handles both creating and editing tasks with form validation
 */
export default function TaskForm({
  mode,
  userUuid,
  initialData,
  onSubmit,
  onSubmitSuccess,
}: TaskFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedGroupUuid = searchParams.get('group');
  const selectedGroupName = searchParams.get('groupName');

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [priority, setPriority] = useState<'1' | '2' | '3'>(initialData?.priority || '2');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { message, messageKind, flash, resetFlash } = useFlashMessage();

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

  const handleSubmit = async () => {
    resetFlash();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        title,
        description,
        dueDate,
        priority,
        assigneeEmail: allowAssigneeInput ? assigneeEmail : '',
        groupUuid: selectedGroupUuid,
      });

      if (!result.success) {
        flash('error', result.error || `Failed to ${mode === 'create' ? 'create' : 'update'} task.`);
        return;
      }

      const action = mode === 'create' ? 'created' : 'updated';
      flash('success', `Task "${result.task.title}" ${action} successfully.`);

      if (mode === 'create') {
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority('2');
        setAssigneeEmail('');
        setErrors({});
      } else {
        setTimeout(() => {
          router.push(`/dashboard/${userUuid}`);
        }, 1000);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error(`Unable to ${mode} task:`, error);
      flash('error', `Failed to ${mode === 'create' ? 'create' : 'update'} task. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = mode === 'create' ? 'Create Task' : 'Edit Task';
  const pageDescription =
    mode === 'create'
      ? 'Add a task with a due date, priority, and assigned teammate.'
      : 'Update the task details.';
  const submitLabel = isSubmitting
    ? mode === 'create'
      ? 'Creating...'
      : 'Updating...'
    : mode === 'create'
    ? 'Create Task'
    : 'Update Task';

  return (
    <GenericPage
      title={pageTitle}
      description={pageDescription}
      showSearch={false}
      showSubmit={true}
      showBackButton
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
    >
      <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />

      {mode === 'create' && (
        <div className="rounded-md border bg-card p-3 text-sm text-muted-foreground">{groupSummary}</div>
      )}

      <FormField label="Task title" error={errors.title} required>
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          error={Boolean(errors.title)}
          placeholder="e.g., Finish project outline"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Add extra details for this task"
        />
      </FormField>

      <FormField label="Due date" error={errors.dueDate}>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
          }}
          error={Boolean(errors.dueDate)}
        />
      </FormField>

      <FormField label="Priority">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as '1' | '2' | '3')}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>
      </FormField>

      {allowAssigneeInput ? (
        <FormField label="Assignee email (optional)" error={errors.assigneeEmail}>
          <Input
            type="email"
            value={assigneeEmail}
            onChange={(e) => {
              setAssigneeEmail(e.target.value);
              if (errors.assigneeEmail) {
                setErrors((prev) => ({ ...prev, assigneeEmail: undefined }));
              }
            }}
            error={Boolean(errors.assigneeEmail)}
            placeholder="member@example.com"
          />
          {!errors.assigneeEmail && (
            <p className="text-xs text-muted-foreground">Only members of this group can be assigned.</p>
          )}
        </FormField>
      ) : (
        <div className="space-y-1 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          Select a group to assign tasks to other members. Without a group, the task will be assigned to you.
        </div>
      )}
    </GenericPage>
  );
}
