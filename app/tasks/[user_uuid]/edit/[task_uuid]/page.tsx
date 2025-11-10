import EditTaskClient from '../EditTaskClient';

export default function EditTaskPage({
  params,
}: {
  params: { user_uuid: string; task_uuid: string };
}) {
  return <EditTaskClient userUuid={params.user_uuid} taskUuid={params.task_uuid} />;
}
