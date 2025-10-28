import { UUID } from "crypto";
import { Task, CreateTaskDTO, UpdateTaskDTO } from "../types/task.type";
import { poolQuery } from "./database.service";

export const getTasksForUser = async (
  user_uuid: UUID
): Promise<Task[] | undefined> => {
  try {
    const result: Task[] | undefined = await poolQuery(
      `SELECT * FROM todos
      WHERE user_uuid = '${user_uuid}'
      ORDER BY 
        CASE 
          WHEN status = 'in_progress' THEN 1
          WHEN status = 'pending' THEN 2
          WHEN status = 'completed' THEN 3
          WHEN status = 'cancelled' THEN 4
        END,
        priority DESC,
        due_date ASC NULLS LAST,
        created_at DESC;`
    );
    
    return result;
  } catch (error) {
    console.log(`An error occurred when getting tasks for user ${user_uuid}`);
    console.log(error);
    throw error;
  }
}

export const getTaskById = async (
  todo_uuid: UUID
): Promise<Task | undefined> => {
  try {
    const result: Task[] | undefined = await poolQuery(
      `SELECT * FROM todos
      WHERE todo_uuid = '${todo_uuid}';`
    );
    
    return result?.[0];
  } catch (error) {
    console.log(`An error occurred when getting task ${todo_uuid}`);
    console.log(error);
    throw error;
  }
}

export const createTask = async (
  taskData: CreateTaskDTO
): Promise<Task | undefined> => {
  try {
    const result: Task[] | undefined = await poolQuery(
      `INSERT INTO todos (
        user_uuid,
        title,
        description,
        due_date,
        priority
      )
      VALUES (
        '${taskData.user_uuid}',
        '${taskData.title}',
        ${taskData.description ? `'${taskData.description}'` : 'NULL'},
        ${taskData.due_date ? `'${taskData.due_date.toISOString()}'` : 'NULL'},
        ${taskData.priority || 1}
      )
      RETURNING *;`
    );

    return result?.[0];
  } catch (error) {
    console.log(`An error occurred when creating a task for user ${taskData.user_uuid}`);
    console.log(error);
    throw error;
  }
}

export const updateTask = async (
  todo_uuid: UUID,
  updateData: UpdateTaskDTO
): Promise<Task | undefined> => {
  try {
    const setClause = Object.entries(updateData)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (value instanceof Date) {
          return `${key} = '${value.toISOString()}'`;
        }
        if (typeof value === 'string') {
          return `${key} = '${value}'`;
        }
        return `${key} = ${value}`;
      })
      .join(', ');

    if (!setClause) {
      return await getTaskById(todo_uuid);
    }

    const result: Task[] | undefined = await poolQuery(
      `UPDATE todos
      SET ${setClause}
      WHERE todo_uuid = '${todo_uuid}'
      RETURNING *;`
    );

    return result?.[0];
  } catch (error) {
    console.log(`An error occurred when updating task ${todo_uuid}`);
    console.log(error);
    throw error;
  }
}

export const deleteTask = async (todo_uuid: UUID): Promise<void> => {
  try {
    await poolQuery(
      `DELETE FROM todos
      WHERE todo_uuid = '${todo_uuid}';`
    );
  } catch (error) {
    console.log(`An error occurred when deleting task ${todo_uuid}`);
    console.log(error);
    throw error;
  }
}

export const completeTask = async (todo_uuid: UUID): Promise<Task | undefined> => {
  try {
    const result: Task[] | undefined = await poolQuery(
      `UPDATE todos
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
      WHERE todo_uuid = '${todo_uuid}'
      RETURNING *;`
    );

    return result?.[0];
  } catch (error) {
    console.log(`An error occurred when completing task ${todo_uuid}`);
    console.log(error);
    throw error;
  }
}
