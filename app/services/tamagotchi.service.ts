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



// used for displaying the tamagotchi 
/**
 * Calculate happiness score for a user's Tamagotchi based on tasks in the last 30 days
 * Formula: H = 10 * tanh((2D - N) / (T + 1))
 * Where D = done tasks, N = not done tasks, T = total tasks
 *
 * @param user_uuid - The user's UUID
 * @returns The calculated happiness score (between -10 and 10) or 0 if an error occurs
 */
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

    // Calculate happiness score: H = 10 * tanh((2D - N) / (T + 1))
    const happiness_score = T > 0
      ? 10 * Math.tanh((2 * D - N) / (T + 1))
      : 0;

    return Math.round(happiness_score * 10) / 10; // Round to 1 decimal
  } catch (error) {
    console.log(`An error occurred when calculating points for user ${user_uuid}`);
    console.log(error);
    return 0;
  }
}

/**
 * Update the Tamagotchi's experience points based on the user's task completion
 * This should be called whenever a task is completed or uncompleted
 *
 * @param user_uuid - The user's UUID
 * @returns The updated Tamagotchi or undefined if an error occurs
 */
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

/**
 * Get detailed task statistics for a user's Tamagotchi over the last 30 days
 * Uses the happiness formula: H = 10 * tanh((2D - N) / (T + 1))
 * Where:
 *   D = tasks done in last 30 days
 *   N = tasks not done in last 30 days
 *   T = total tasks attempted = D + N
 *
 * @param user_uuid - The user's UUID
 * @returns Object with task statistics and happiness score
 */
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

    const D = parseInt(result?.[0]?.completed_tasks || '0');  // Done tasks
    const N = parseInt(result?.[0]?.incomplete_tasks || '0'); // Not done tasks
    const T = D + N; // Total tasks

    // Calculate happiness score: H = 10 * tanh((2D - N) / (T + 1))
    const happiness_score = T > 0
      ? 10 * Math.tanh((2 * D - N) / (T + 1))
      : 0;

    return {
      completed_tasks: D,
      incomplete_tasks: N,
      total_tasks: T,
      happiness_score: Math.round(happiness_score * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.log(`An error occurred when getting tamagotchi stats for user ${user_uuid}`);
    console.log(error);
  }
}
