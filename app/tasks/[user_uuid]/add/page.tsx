import AddTaskClient from './AddTaskClient';

export default function AddTaskPage({ params }: { params: { user_uuid: string } }) {
  return <AddTaskClient userUuid={params.user_uuid} />;
}
