import AddTaskClient from './AddTaskClient';

export default async function AddTaskPage({ params }: { params: Promise<{ user_uuid: string }> }) {
  const { user_uuid } = await params;
  return <AddTaskClient userUuid={user_uuid} />;
}
