import EditTaskClient from '../EditTaskClient';

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ user_uuid: string; task_uuid: string }>;
}) {
  const { user_uuid, task_uuid } = await params;
  return <EditTaskClient userUuid={user_uuid} taskUuid={task_uuid} />;
}
