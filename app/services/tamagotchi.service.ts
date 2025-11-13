import { UUID } from "crypto";
import { Tamagotchi } from "../types/tamagotchi.type";
import { poolQuery } from "./database.service";

export const getTamagotchisForUser = async (
  user_uuid: UUID
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `SELECT * FROM tamagotchis
      WHERE user_uuid = $1;`,
      [
        user_uuid
      ]
    );
  
    return result;
  } catch (error) {
    console.log(`An error occurred when getting tamagotchis for user ${user_uuid}`);
    console.log(error);
  }
}

export const createTamagotchiForUser = async (
  user_uuid: UUID,
  image_path: string
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `INSERT INTO tamagotchis (
        user_uuid, 
        image_path
      )
      VALUES (
        $1,
        $2
      )
      RETURNING *;`,
      [
        user_uuid,
        image_path
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when creating a tamagotchi for user ${user_uuid} with image_path ${image_path}`);
    console.log(error);
  }
}

export const updateTamagotchi = async (
  tamagotchi_uuid: UUID,
  image_path: string
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `UPDATE tamagotchis SET 
        image_path = $1
      WHERE 
        tamagotchi_uuid = $2
      RETURNING *;`,
      [
        image_path,
        tamagotchi_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when updating tamagotchi with id ${tamagotchi_uuid} and new image_path ${image_path}`);
    console.log(error);
  }
}

export const deleteTamagotchi = async (
  tamagotchi_uuid: UUID
): Promise<Tamagotchi[] | undefined> => {
  try {
    const result: Tamagotchi[] | undefined = await poolQuery(
      `DELETE FROM tamagotchis
      WHERE
        tamagotchi_uuid = $1
      RETURNING *;`,
      [
        tamagotchi_uuid
      ]
    );

    return result;
  } catch (error) {
    console.log(`An error occurred when deleting tamagotchi with id ${tamagotchi_uuid}`);
    console.log(error);
  }
}



// Calculate happiness based on tasks from the last 30 days
export const calculateTamagotchiPoints = async (
  user_uuid: UUID
): Promise<number> => {
  try {
    const result = await poolQuery(
      `SELECT
        COUNT(CASE WHEN status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days' THEN 1 END) as completed_tasks,
        COUNT(CASE
          WHEN status IN ('pending', 'in_progress', 'draft')
          AND created_at >= NOW() - INTERVAL '30 days'
          THEN 1
        END) as incomplete_tasks
      FROM todos t
      WHERE t.todo_uuid IN (
        SELECT ta.task_uuid
        FROM task_assignees ta
        WHERE ta.user_uuid = $1
      )
      AND (
        (status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days')
        OR (status IN ('pending', 'in_progress', 'draft') AND created_at >= NOW() - INTERVAL '30 days')
      );`,
      [user_uuid]
    );

    const D = parseInt(result?.[0]?.completed_tasks || '0');
    const N = parseInt(result?.[0]?.incomplete_tasks || '0');
    const T = D + N;

    const happiness_score = T > 0
      ? 5 * Math.tanh((2 * D - N) / (T + 1)) + 5
      : 5;

    return Math.round(happiness_score * 10) / 10;
  } catch (error) {
    console.log(`An error occurred when calculating points for user ${user_uuid}`);
    console.log(error);
    return 5;
  }
}

// Update tamagotchi experience points
export const updateTamagotchiPoints = async (
  user_uuid: UUID
): Promise<Tamagotchi | undefined> => {
  try {
    const points = await calculateTamagotchiPoints(user_uuid);

    const result: Tamagotchi[] | undefined = await poolQuery(
      `UPDATE tamagotchis SET
        experience_points = $1
      WHERE
        user_uuid = $2
      RETURNING *;`,
      [
        points,
        user_uuid
      ]
    );

    return result?.[0];
  } catch (error) {
    console.log(`An error occurred when updating tamagotchi points for user ${user_uuid}`);
    console.log(error);
  }
}

// Get task stats and happiness score for the last 30 days
export const getTamagotchiStats = async (
  user_uuid: UUID
): Promise<{
  completed_tasks: number;
  incomplete_tasks: number;
  total_tasks: number;
  happiness_score: number;
} | undefined> => {
  try {
    const result = await poolQuery(
      `SELECT
        COUNT(CASE WHEN status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days' THEN 1 END) as completed_tasks,
        COUNT(CASE
          WHEN status IN ('pending', 'in_progress', 'draft')
          AND created_at >= NOW() - INTERVAL '30 days'
          THEN 1
        END) as incomplete_tasks
      FROM todos t
      WHERE t.todo_uuid IN (
        SELECT ta.task_uuid
        FROM task_assignees ta
        WHERE ta.user_uuid = $1
      )
      AND (
        (status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days')
        OR (status IN ('pending', 'in_progress', 'draft') AND created_at >= NOW() - INTERVAL '30 days')
      );`,
      [user_uuid]
    );

    const D = parseInt(result?.[0]?.completed_tasks || '0');
    const N = parseInt(result?.[0]?.incomplete_tasks || '0');
    const T = D + N;

    const happiness_score = T > 0
      ? 5 * Math.tanh((2 * D - N) / (T + 1)) + 5
      : 5;

    return {
      completed_tasks: D,
      incomplete_tasks: N,
      total_tasks: T,
      happiness_score: Math.round(happiness_score * 10) / 10,
    };
  } catch (error) {
    console.log(`An error occurred when getting tamagotchi stats for user ${user_uuid}`);
    console.log(error);
  }
}

// Save happiness score for a date (upsert)
export async function saveHappinessHistory(
  user_uuid: UUID,
  date: Date,
  happiness_score: number,
  completed_tasks: number,
  incomplete_tasks: number
): Promise<void> {
  try {
    const dateStr = date.toISOString().split('T')[0];

    await poolQuery(
      `INSERT INTO happiness_history (user_uuid, date, happiness_score, completed_tasks, incomplete_tasks)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_uuid, date)
       DO UPDATE SET
         happiness_score = $3,
         completed_tasks = $4,
         incomplete_tasks = $5,
         created_at = CURRENT_TIMESTAMP;`,
      [user_uuid, dateStr, happiness_score, completed_tasks, incomplete_tasks]
    );

    console.log(`Saved happiness history for user ${user_uuid} on ${dateStr}: ${happiness_score}`);
  } catch (error) {
    console.error(`Error saving happiness history:`, error);
    throw new Error('Failed to save happiness history');
  }
}

// Get happiness history for the last N days
export async function getHappinessHistory(
  user_uuid: UUID,
  days: number = 7
): Promise<Array<{
  date: string;
  happiness_score: number;
  completed_tasks: number;
  incomplete_tasks: number;
}>> {
  try {
    const result = await poolQuery(
      `SELECT
         date::text,
         happiness_score,
         completed_tasks,
         incomplete_tasks
       FROM happiness_history
       WHERE user_uuid = $1
         AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date ASC;`,
      [user_uuid]
    );

    if (!result || result.length === 0) {
      return [];
    }

    return result.map(row => ({
      date: row.date,
      happiness_score: parseFloat(row.happiness_score),
      completed_tasks: parseInt(row.completed_tasks || '0'),
      incomplete_tasks: parseInt(row.incomplete_tasks || '0')
    }));
  } catch (error) {
    console.error(`Error getting happiness history for user ${user_uuid}:`, error);
    return [];
  }
}

// Calculate and save today's happiness score
export async function updateTodaysHappiness(user_uuid: UUID): Promise<void> {
  try {
    const today = new Date();

    const result = await poolQuery(
      `SELECT
        COUNT(CASE WHEN status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days' THEN 1 END) as completed_tasks,
        COUNT(CASE
          WHEN status IN ('pending', 'in_progress', 'draft')
          AND created_at >= NOW() - INTERVAL '30 days'
          THEN 1
        END) as incomplete_tasks
      FROM todos t
      WHERE t.todo_uuid IN (
        SELECT ta.task_uuid
        FROM task_assignees ta
        WHERE ta.user_uuid = $1
      )
      AND (
        (status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days')
        OR (status IN ('pending', 'in_progress', 'draft') AND created_at >= NOW() - INTERVAL '30 days')
      );`,
      [user_uuid]
    );

    const D = parseInt(result?.[0]?.completed_tasks || '0');
    const N = parseInt(result?.[0]?.incomplete_tasks || '0');
    const T = D + N;

    const happiness_score = T > 0
      ? 5 * Math.tanh((2 * D - N) / (T + 1)) + 5
      : 5;

    const roundedScore = Math.round(happiness_score * 10) / 10;

    await saveHappinessHistory(user_uuid, today, roundedScore, D, N);
  } catch (error) {
    console.error(`Error updating today's happiness for user ${user_uuid}:`, error);
  }
}

// Backfill happiness history for the last N days
export async function backfillHappinessHistory(
  user_uuid: UUID,
  days: number = 7
): Promise<void> {
  try {
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const endDate = date;
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - 30);

      const result = await poolQuery(
        `SELECT
          COUNT(CASE
            WHEN status = 'completed'
            AND completed_at >= $2
            AND completed_at <= $3
            THEN 1
          END) as completed_tasks,
          COUNT(CASE
            WHEN status IN ('pending', 'in_progress', 'draft')
            AND created_at >= $2
            AND created_at <= $3
            THEN 1
          END) as incomplete_tasks
        FROM todos t
        WHERE t.todo_uuid IN (
          SELECT ta.task_uuid
          FROM task_assignees ta
          WHERE ta.user_uuid = $1
        )
        AND (
          (status = 'completed' AND completed_at >= $2 AND completed_at <= $3)
          OR (status IN ('pending', 'in_progress', 'draft') AND created_at >= $2 AND created_at <= $3)
        );`,
        [user_uuid, startDate.toISOString(), endDate.toISOString()]
      );

      const D = parseInt(result?.[0]?.completed_tasks || '0');
      const N = parseInt(result?.[0]?.incomplete_tasks || '0');
      const T = D + N;

      const happiness_score = T > 0
        ? 5 * Math.tanh((2 * D - N) / (T + 1)) + 5
        : 5;

      const roundedScore = Math.round(happiness_score * 10) / 10;

      await saveHappinessHistory(user_uuid, date, roundedScore, D, N);
    }

    console.log(`Backfilled ${days} days of happiness history for user ${user_uuid}`);
  } catch (error) {
    console.error(`Error backfilling happiness history for user ${user_uuid}:`, error);
  }
}
