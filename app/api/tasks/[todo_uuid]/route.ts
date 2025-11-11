import { NextResponse } from 'next/server';
import type { UUID } from 'crypto';
import { updateTask } from '@/app/services/task.service';

// Cast string to UUID type
const castToUUID = (val: string): UUID => val as UUID;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ todo_uuid: string }> }
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

    const updatedTask = await updateTask(castToUUID(todo_uuid), updatePayload);
    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error(`Failed to update task ${todo_uuid}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task.' },
      { status: 500 }
    );
  }
}
