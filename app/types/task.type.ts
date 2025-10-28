import { UUID } from "crypto";

export type Task = {
  todo_uuid: UUID;
  user_uuid: UUID;
  title: string;
  description?: string;
  created_at: Date;
  due_date?: Date;
  completed_at?: Date;
  priority: 1 | 2 | 3;  // 1: Low, 2: Medium, 3: High
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export type CreateTaskDTO = {
  user_uuid: UUID;
  title: string;
  description?: string;
  due_date?: Date;
  priority?: 1 | 2 | 3;
}

export type UpdateTaskDTO = {
  title?: string;
  description?: string;
  due_date?: Date;
  priority?: 1 | 2 | 3;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed_at?: Date;
}