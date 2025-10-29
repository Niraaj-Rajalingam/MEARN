import { UUID } from "crypto";

export type Task = {
  todo_uuid: UUID;
  parent_task_uuid: UUID | null;
  created_by: UUID;
  group_uuid: UUID | null;
  title: string;
  description?: string;
  created_at: Date;
  due_date?: Date;
  completed_at?: Date;
  priority: 1 | 2 | 3;
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignees: UUID[];
}

export type CreateTaskDTO = {
  created_by: UUID;
  assignee_uuids: UUID[];
  title: string;
  parent_task_uuid?: UUID;
  group_uuid?: UUID;
  description?: string;
  due_date?: Date;
  priority?: 1 | 2 | 3;
  status?: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export type UpdateTaskDTO = {
  title?: string;
  description?: string;
  due_date?: Date;
  priority?: 1 | 2 | 3;
  status?: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed_at?: Date;
  parent_task_uuid?: UUID | null;
  group_uuid?: UUID | null;
  assignee_uuids?: UUID[];
}