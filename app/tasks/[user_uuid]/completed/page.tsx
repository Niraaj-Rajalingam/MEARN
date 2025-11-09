import GenericPage from '@/components/layout/GenericPage';
import { fetchCompletedTasksAction } from './actions';

type PageProps = {
  params: { user_uuid: string };
  searchParams?: { group?: string; groupName?: string };
};

export default async function CompletedTasksPage({ params, searchParams }: PageProps) {
  const { user_uuid } = params;
  const groupUuid = searchParams?.group || null;
  const groupName = searchParams?.groupName;

  const result = await fetchCompletedTasksAction(user_uuid, groupUuid);

  const description = groupName
    ? `Completed tasks in ${groupName}`
    : 'All completed tasks assigned to you.';

  return (
    <GenericPage
      title="Completed Tasks"
      description={description}
      showSearch={false}
      showSubmit={false}
      homeHref={`/dashboard/${user_uuid}`}
    >
      {!result.success ? (
        <p className="text-sm text-red-600">{result.error ?? 'Unable to load completed tasks.'}</p>
      ) : result.tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {result.tasks.map((task) => (
            <li key={String(task.todo_uuid)} className="px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  Completed
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {task.completed_at
                  ? `Completed on ${new Date(task.completed_at).toDateString()}`
                  : 'Completed date unavailable'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </GenericPage>
  );
}
