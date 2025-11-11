import { NextResponse } from 'next/server';
import type { UUID } from 'crypto';
import { updateTask, getTaskById } from '@/app/services/task.service';
import { updateUserLevel } from '@/app/services/level.service';
import { updateTodaysHappiness } from '@/app/services/tamagotchi.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ todo_uuid: UUID }> }
) {
  const { todo_uuid } = await params;

  try {
    let status = 'cancelled';
    if (request.headers.get('content-type')?.includes('application/json')) {
      const payload = await request.json();
      if (payload?.status) {
        status = payload.status;
      }
    }

    const allowedStatuses = ['completed', 'pending', 'in_progress', 'cancelled', 'draft'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status update.' },
        { status: 400 }
      );
    }

    const updatePayload: any = { status };
    if (status === 'completed') {
      updatePayload.completed_at = new Date();
    } else if (status === 'cancelled') {
      updatePayload.completed_at = null;
    }

    const updatedTask = await updateTask(todo_uuid, updatePayload);

    const task = await getTaskById(todo_uuid);

    if (task && task.assignees) {
      for (const user_uuid of task.assignees) {
        try {
          await updateTodaysHappiness(user_uuid);
          await updateUserLevel(user_uuid);
        } catch (error) {
          console.error(`Failed to update happiness/level for user ${user_uuid}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(`Failed to update task ${todo_uuid}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task.' },
      { status: 500 }
    );
  }
}
