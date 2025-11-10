import { NextResponse } from 'next/server';
import { getTasksForUser } from '@/app/services/task.service';
import { getTamagotchisForUser, getTamagotchiStats } from '@/app/services/tamagotchi.service';
import { poolQuery } from '@/app/services/database.service';
import { UUID } from 'crypto';

export async function GET(
  _request: Request,
  { params }: { params: { user_uuid: UUID } }
) {
  const user_uuid: UUID = await params.user_uuid;

  try {
    const tasks = await getTasksForUser(user_uuid);
    const tamagotchis = await getTamagotchisForUser(user_uuid);
    const tamagotchiStats = await getTamagotchiStats(user_uuid);

    // Fetch user's color scheme
    const userResult = await poolQuery(
      `SELECT color_scheme FROM users WHERE user_uuid = $1;`,
      [user_uuid]
    );
    const userColor = userResult?.[0]?.color_scheme || [79, 70, 229]; // Default indigo

    console.log('Fetched tasks for dashboard:', tasks);
    console.log('Fetched tamagotchi stats:', tamagotchiStats);
    console.log('Fetched user color:', userColor);

    return NextResponse.json({
      user_uuid,
      tasks: tasks ?? [],
      tamagotchi: tamagotchis?.[0] ?? null,
      tamagotchiStats: tamagotchiStats ?? {
        completed_tasks: 0,
        incomplete_tasks: 0,
        total_tasks: 0,
        happiness_score: 0
      },
      userColor: userColor,
    });
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
