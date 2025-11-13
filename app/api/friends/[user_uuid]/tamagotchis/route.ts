import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '@/app/services/database.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ user_uuid: string }> }
) {
  try {
    const { user_uuid } = await params;

    // Fetch all accepted friends
    const friendsQuery = `
      SELECT
        u.user_uuid,
        u.first_name,
        u.last_name,
        u.user_email as email,
        u.color_scheme,
        tm.tamagotchi_uuid,
        tm.level
      FROM friend_requests fr
      JOIN users u ON (
        (fr.requester_uuid = $1 AND fr.recipient_uuid = u.user_uuid) OR
        (fr.recipient_uuid = $1 AND fr.requester_uuid = u.user_uuid)
      )
      LEFT JOIN tamagotchis tm ON tm.user_uuid = u.user_uuid
      WHERE fr.status = 'accepted'
      ORDER BY u.first_name, u.last_name;
    `;

    const friendsResults = await poolQuery(friendsQuery, [user_uuid]);

    if (!friendsResults) {
      return NextResponse.json(
        { error: 'Failed to fetch friends tamagotchis' },
        { status: 500 }
      );
    }

    // For each friend, calculate their happiness score and get task stats
    const friends = await Promise.all(
      friendsResults.map(async (row: any) => {
        // Calculate happiness score using same formula as getTamagotchiStats
        const statsQuery = `
          SELECT
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
          );
        `;

        const statsResult = await poolQuery(statsQuery, [row.user_uuid]);
        const D = parseInt(statsResult?.[0]?.completed_tasks || '0');
        const N = parseInt(statsResult?.[0]?.incomplete_tasks || '0');
        const T = D + N;

        const happiness_score = T > 0
          ? 5 * Math.tanh((2 * D - N) / (T + 1)) + 5
          : 5;
        const roundedHappinessScore = Math.round(happiness_score * 10) / 10;

        // Get last completed task
        const lastTaskQuery = `
          SELECT ta.title, ta.completed_at
          FROM todos ta
          JOIN task_assignees taa ON ta.todo_uuid = taa.task_uuid
          WHERE taa.user_uuid = $1
          AND ta.status = 'completed'
          ORDER BY ta.completed_at DESC
          LIMIT 1;
        `;

        const lastTaskResult = await poolQuery(lastTaskQuery, [row.user_uuid]);

        return {
          user_uuid: row.user_uuid,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          color_scheme: row.color_scheme,
          tamagotchi: row.tamagotchi_uuid ? {
            tamagotchi_uuid: row.tamagotchi_uuid,
            level: row.level
          } : null,
          stats: {
            happiness_score: roundedHappinessScore,
            completed_tasks: D,
            incomplete_tasks: N
          },
          lastCompletedTask: lastTaskResult?.[0] ? {
            title: lastTaskResult[0].title,
            completedAt: lastTaskResult[0].completed_at
          } : null
        };
      })
    );

    return NextResponse.json({ friends });
  } catch (error) {
    console.error('Error fetching friends tamagotchis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends tamagotchis' },
      { status: 500 }
    );
  }
}
