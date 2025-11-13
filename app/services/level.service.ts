import { UUID } from "crypto";
import { poolQuery } from "./database.service";
import { getHappinessHistory, backfillHappinessHistory } from "./tamagotchi.service";

// Level requirements (no max level)
const LEVEL_THRESHOLDS = [
  { level: 1, threshold: 0, daysRequired: 0 },
  { level: 2, threshold: 6, daysRequired: 7 },
  { level: 3, threshold: 7, daysRequired: 7 },
  { level: 4, threshold: 8, daysRequired: 7 },
  { level: 5, threshold: 8.5, daysRequired: 7 },
  { level: 6, threshold: 9, daysRequired: 7 },
  { level: 7, threshold: 9.5, daysRequired: 7 },
  { level: 8, threshold: 9.8, daysRequired: 7 },
];

// Calculate happiness for a specific date based on tasks from the previous 30 days
async function calculateHappinessForDate(
  user_uuid: UUID,
  targetDate: Date
): Promise<number> {
  try {
    const endDate = targetDate;
    const startDate = new Date(targetDate);
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

    return Math.round(happiness_score * 10) / 10;
  } catch (error) {
    console.error(`Error calculating happiness for date ${targetDate}:`, error);
    return 5;
  }
}

// Calculate user level based on 7-day happiness history
export async function calculateUserLevel(user_uuid: UUID): Promise<{
  level: number;
  daysAtThreshold: number;
  daysAtNextThreshold: number;
  nextLevelThreshold: number | null;
  daysNeeded: number | null;
}> {
  try {
    let history = await getHappinessHistory(user_uuid, 7);

    if (history.length < 7) {
      await backfillHappinessHistory(user_uuid, 7);
      history = await getHappinessHistory(user_uuid, 7);
    }

    const happinessHistory: number[] = history.map(h => h.happiness_score);

    if (happinessHistory.length === 0) {
      return {
        level: 1,
        daysAtThreshold: 0,
        daysAtNextThreshold: 0,
        nextLevelThreshold: LEVEL_THRESHOLDS[1].threshold,
        daysNeeded: LEVEL_THRESHOLDS[1].daysRequired
      };
    }

    let currentLevel = 1;
    let daysAtThreshold = 0;

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      const { level, threshold, daysRequired } = LEVEL_THRESHOLDS[i];

      let consecutiveDays = 0;
      for (let j = happinessHistory.length - 1; j >= 0; j--) {
        if (happinessHistory[j] >= threshold) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      if (consecutiveDays >= daysRequired) {
        currentLevel = level;
        daysAtThreshold = consecutiveDays;
        break;
      }
    }

    const nextLevelIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === currentLevel + 1);
    const nextLevelThreshold = nextLevelIndex !== -1
      ? LEVEL_THRESHOLDS[nextLevelIndex].threshold
      : null;
    const daysNeeded = nextLevelIndex !== -1
      ? LEVEL_THRESHOLDS[nextLevelIndex].daysRequired
      : null;

    let daysAtNextThreshold = 0;
    if (nextLevelThreshold !== null) {
      for (let j = happinessHistory.length - 1; j >= 0; j--) {
        if (happinessHistory[j] >= nextLevelThreshold) {
          daysAtNextThreshold++;
        } else {
          break;
        }
      }
    }

    return {
      level: currentLevel,
      daysAtThreshold,
      daysAtNextThreshold,
      nextLevelThreshold,
      daysNeeded
    };
  } catch (error) {
    console.error(`Error calculating user level for ${user_uuid}:`, error);
    return {
      level: 1,
      daysAtThreshold: 0,
      daysAtNextThreshold: 0,
      nextLevelThreshold: LEVEL_THRESHOLDS[1].threshold,
      daysNeeded: LEVEL_THRESHOLDS[1].daysRequired
    };
  }
}

// Update user's tamagotchi level in database
export async function updateUserLevel(user_uuid: UUID): Promise<void> {
  try {
    const { level } = await calculateUserLevel(user_uuid);

    await poolQuery(
      `UPDATE tamagotchis
       SET level = $1
       WHERE user_uuid = $2;`,
      [level, user_uuid]
    );

    console.log(`Updated level for user ${user_uuid} to level ${level}`);
  } catch (error) {
    console.error(`Error updating level for user ${user_uuid}:`, error);
  }
}

export function getLevelProgressMessage(
  currentLevel: number,
  daysAtNextThreshold: number,
  currentHappiness: number,
  nextLevelThreshold: number | null,
  daysNeeded: number | null
): string {
  if (nextLevelThreshold === null || daysNeeded === null) {
    return "";
  }

  const daysRemaining = Math.max(0, daysNeeded - daysAtNextThreshold);

  if (currentHappiness >= nextLevelThreshold) {
    if (daysRemaining === 0) {
      return `⭐ Keep a happiness score of ${nextLevelThreshold}+ to reach Level ${currentLevel + 1}!`;
    }
    return `⭐ Keep a happiness score of ${nextLevelThreshold}+ for ${daysRemaining} more ${daysRemaining === 1 ? 'day' : 'days'} to reach Level ${currentLevel + 1}!`;
  } else {
    return `📈 Keep a happiness score of ${nextLevelThreshold}+ for ${daysNeeded} ${daysNeeded === 1 ? 'day' : 'days'} to reach Level ${currentLevel + 1}`;
  }
}
