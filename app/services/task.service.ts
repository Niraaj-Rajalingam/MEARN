//app/services/task.service.ts
import { UUID } from "crypto";
import { Task, CreateTaskDTO, UpdateTaskDTO } from "../types/task.type";
import { poolQuery } from "./database.service";

export const getTasksForUser = async (
  user_uuid: UUID,
  group_uuid?: UUID
): Promise<Task[] | undefined> => {
  try {
    // Base query
    let query = `
      SELECT 
        t.*,
        COALESCE(json_agg(ta.user_uuid) FILTER (WHERE ta.user_uuid IS NOT NULL), '[]') AS assignees
      FROM todos t
      LEFT JOIN task_assignees ta ON t.todo_uuid = ta.task_uuid
      WHERE t.todo_uuid IN (
        SELECT ta_user.task_uuid 
        FROM task_assignees ta_user 
        WHERE ta_user.user_uuid = $1
      )
    `;

    // Add group filter if provided
    const params: (UUID)[] = [user_uuid];
    if (group_uuid) {
      params.push(group_uuid);
      query += ` AND t.group_uuid = $2`;
    }

    // Grouping and ordering
    query += `
      GROUP BY t.todo_uuid
      ORDER BY 
        CASE 
          WHEN t.status = 'in_progress' THEN 1
          WHEN t.status = 'pending' THEN 2
          WHEN t.status = 'completed' THEN 3
          WHEN t.status = 'cancelled' THEN 4
          WHEN t.status = 'draft' THEN 5
        END,
        t.priority DESC,
        t.due_date ASC NULLS LAST,
        t.created_at DESC;
    `;

    const result: Task[] | undefined = await poolQuery(query, params);
    return result;
  } catch (error) {
    console.log(`An error occurred when getting tasks for user ${user_uuid}`);
    console.log(error);
    throw error;
  }
};


export const getTaskById = async (
  todo_uuid: UUID
): Promise<Task | undefined> => {
  try {
    const result: Task[] | undefined = await poolQuery(
      `SELECT 
        t.*,
        COALESCE(json_agg(ta.user_uuid) FILTER (WHERE ta.user_uuid IS NOT NULL), '[]') AS assignees
      FROM todos t
      LEFT JOIN task_assignees ta ON t.todo_uuid = ta.task_uuid
      WHERE t.todo_uuid = $1
      GROUP BY t.todo_uuid;`,
      [todo_uuid]
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
    const taskResult: Task[] | undefined = await poolQuery(
      `INSERT INTO todos (
        created_by,
        group_uuid,
        parent_task_uuid,
        title,
        description,
        due_date,
        priority,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING *;`,
      [
        taskData.created_by,
        taskData.group_uuid || null,
        taskData.parent_task_uuid || null,
        taskData.title,
        taskData.description || null,
        taskData.due_date ? taskData.due_date.toISOString() : null,
        taskData.priority || 1,
        taskData.status || 'pending'
      ]
    );

    const newTask = taskResult?.[0];
    if (!newTask) {
      throw new Error("Task creation failed");
    }

    if (taskData.assignee_uuids && taskData.assignee_uuids.length > 0) {
      const values = taskData.assignee_uuids
        .map((_, index) => `($1, $${index + 2})`)
        .join(', ');

      await poolQuery(
        `INSERT INTO task_assignees (task_uuid, user_uuid) VALUES ${values};`,
        [newTask.todo_uuid, ...taskData.assignee_uuids]
      );
    }

    return {
      ...newTask,
      assignees: taskData.assignee_uuids || []
    };

  } catch (error) {
    console.log(`An error occurred when creating a task by user ${taskData.created_by}`);
    console.log(error);
    throw new Error("A database error occurred");
  }
}

export const updateTask = async (
  todo_uuid: UUID,
  updateData: UpdateTaskDTO
): Promise<Task | undefined> => {
  try {
    const { assignee_uuids, ...otherUpdates } = updateData;

    const setClause = Object.entries(otherUpdates)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value], index) => {
        if (value === null) {
          return `${key} = NULL`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');

    const queryParams = Object.values(otherUpdates)
      .filter(value => value !== undefined && value !== null);

    if (setClause) {
      await poolQuery(
        `UPDATE todos
        SET ${setClause}
        WHERE todo_uuid = $1;`,
        [todo_uuid, ...queryParams]
      );
    }

    if (assignee_uuids) {
      await poolQuery(
        `DELETE FROM task_assignees WHERE task_uuid = $1;`,
        [todo_uuid]
      );

      if (assignee_uuids.length > 0) {
        const values = assignee_uuids
          .map((_, index) => `($1, $${index + 2})`)
          .join(', ');

        await poolQuery(
          `INSERT INTO task_assignees (task_uuid, user_uuid) VALUES ${values};`,
          [todo_uuid, ...assignee_uuids]
        );
      }
    }

    return await getTaskById(todo_uuid);

  } catch (error) {
    console.log(`An error occurred when updating task ${todo_uuid}`);
    console.log(error);
    throw new Error("A database error occurred");
  }
}

export const deleteTask = async (todo_uuid: UUID): Promise<void> => {
  try {
    await poolQuery(
      `DELETE FROM todos
      WHERE todo_uuid = $1;`,
      [todo_uuid]
    );
  } catch (error) {
    console.log(`An error occurred when deleting task ${todo_uuid}`);
    console.log(error);
    throw new Error("A database error occurred");
  }
}

export const completeTask = async (todo_uuid: UUID): Promise<Task | undefined> => {
  try {
    await poolQuery(
      `UPDATE todos
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
      WHERE todo_uuid = $1;`,
      [todo_uuid]
    );

    return await getTaskById(todo_uuid);

  } catch (error) {
    console.log(`An error occurred when completing task ${todo_uuid}`);
    console.log(error);
    throw new Error("A database error occurred");
  }
}

export const searchTasksForUser = async (
  user_uuid: UUID,
  options?: {
    keyword?: string;
    dueFrom?: Date;
    dueTo?: Date;
    priorities?: number[];
    statuses?: Array<'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>;
    limit?: number;
    offset?: number;
  }
): Promise<Task[] | undefined> => {
  try {
    const { keyword, dueFrom, dueTo, priorities, statuses, limit = 50, offset = 0 } = options || {};

    let queryParams: any[] = [user_uuid];
    let paramIndex = 2;

    let sql = `
      SELECT 
        t.*,
        COALESCE(json_agg(ta.user_uuid) FILTER (WHERE ta.user_uuid IS NOT NULL), '[]') AS assignees
      FROM todos t
      LEFT JOIN task_assignees ta ON t.todo_uuid = ta.task_uuid
      WHERE t.todo_uuid IN (
        SELECT ta_user.task_uuid 
        FROM task_assignees ta_user 
        WHERE ta_user.user_uuid = $1
      )
    `;

    if (keyword) {
      sql += ` AND (lower(t.title) % lower($${paramIndex}) OR lower(t.description) % lower($${paramIndex}))`;
      queryParams.push(keyword);
      paramIndex++;
    }

    if (dueFrom) {
      sql += ` AND t.due_date >= $${paramIndex}`;
      queryParams.push(dueFrom.toISOString());
      paramIndex++;
    }
    if (dueTo) {
      sql += ` AND t.due_date <= $${paramIndex}`;
      queryParams.push(dueTo.toISOString());
      paramIndex++;
    }

    if (priorities && priorities.length > 0) {
      sql += ` AND t.priority IN (${priorities.map(() => `$${paramIndex++}`).join(',')})`;
      queryParams.push(...priorities);
    }

    if (statuses && statuses.length > 0) {
      sql += ` AND t.status IN (${statuses.map(() => `$${paramIndex++}`).join(',')})`;
      queryParams.push(...statuses);
    }

    sql += `
      GROUP BY t.todo_uuid
      ORDER BY 
        CASE 
          WHEN t.status = 'in_progress' THEN 1
          WHEN t.status = 'pending' THEN 2
          WHEN t.status = 'completed' THEN 3
          WHEN t.status = 'cancelled' THEN 4
          WHEN t.status = 'draft' THEN 5
        END,
        t.priority DESC,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    queryParams.push(limit, offset);

    const result: Task[] | undefined = await poolQuery(sql, queryParams);
    return result;

  } catch (error) {
    console.log(`An error occurred when searching tasks for user ${user_uuid}`);
    console.log(error);
    throw new Error("A database error occurred");
  }
}
