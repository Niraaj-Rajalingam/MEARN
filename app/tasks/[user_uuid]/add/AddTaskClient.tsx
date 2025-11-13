'use client';

import TaskForm from '@/app/components/TaskForm';
import { createTaskAction } from './actions';

type AddTaskClientProps = {
  userUuid: string;
};

export default function AddTaskClient({ userUuid }: AddTaskClientProps) {
  const handleSubmit = async (data: any) => {
    return createTaskAction({
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      assigneeEmail: data.assigneeEmail,
      creatorUuid: userUuid,
      groupUuid: data.groupUuid,
    });
  };

  return <TaskForm mode="create" userUuid={userUuid} onSubmit={handleSubmit} />;
}
