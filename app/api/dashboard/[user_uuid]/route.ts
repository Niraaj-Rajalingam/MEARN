import { NextResponse } from 'next/server';
import { getTasksForUser } from '@/app/services/task.service';
import { UUID } from 'crypto';

export async function GET(
  _request: Request,
  { params }: { params: { user_uuid: UUID } }
) {
  const user_uuid: UUID = await params.user_uuid;

  try {
    const tasks = await getTasksForUser(user_uuid);
    console.log('Fetched tasks for dashboard:', tasks);

    return NextResponse.json({
      user_uuid,
      tasks: tasks ?? [],
    });
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
