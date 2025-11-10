import { NextResponse } from 'next/server';
import { getTasksForUser } from '@/app/services/task.service';
import { getTamagotchisForUser, getTamagotchiStats } from '@/app/services/tamagotchi.service';
import { poolQuery } from '@/app/services/database.service';
import { getGroupsForUser } from '@/app/services/group.service';
import { UUID } from 'crypto';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: { user_uuid: UUID } }
) {
  const user_uuid: UUID = await params.user_uuid;
  const { searchParams } = new URL(request.url);
  const groupParam = searchParams.get('group');
  const group_uuid = groupParam && uuidRegex.test(groupParam)
    ? (groupParam as unknown as UUID)
    : undefined;

  try {
    const tasks = await getTasksForUser(user_uuid, group_uuid);
    const groups = await getGroupsForUser(user_uuid, null);
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
    console.log('Fetched groups for dashboard:', groups);

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
      groups: groups ?? [],
    });
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
