import GenericPage from '@/components/layout/GenericPage';
import TaskListClient from './TaskListClient';
import { fetchTasksByStatusAction } from './actions';

type PageProps = {
  params: Promise<{ user_uuid: string }>;
  searchParams?: Promise<{ group?: string; groupName?: string; status?: string; page?: string }>;
};

const statusConfig = {
  completed: {
    title: 'Completed Tasks',
    badgeColor: 'bg-green-100 text-green-600',
    badgeLabel: 'Completed',
    dateLabel: 'Completed on',
  },
  cancelled: {
    title: 'Deleted Tasks',
    badgeColor: 'bg-red-100 text-red-600',
    badgeLabel: 'Deleted',
    dateLabel: 'Deleted on',
  },
};

export default async function TasksFilterPage({ params, searchParams }: PageProps) {
  const { user_uuid } = await params;
  const searchParamsResolved = await searchParams;
  const groupUuid = searchParamsResolved?.group || null;
  const groupName = searchParamsResolved?.groupName;
  const status = (searchParamsResolved?.status as 'completed' | 'cancelled') || 'completed';
  const page = Number.parseInt(searchParamsResolved?.page || '1', 10);

  const config = statusConfig[status];
  const result = await fetchTasksByStatusAction(user_uuid, status, groupUuid, page);

  const description = groupName
    ? `${config.title.toLowerCase()} in ${groupName}`
    : `All ${config.title.toLowerCase()} assigned to you.`;

  return (
    <GenericPage
      title={config.title}
      description={description}
      showSearch={false}
      showBackButton
      showSubmit={false}
    >
      {!result.success ? (
        <p className="text-sm text-red-600">{result.error ?? `Unable to load ${status} tasks.`}</p>
      ) : result.tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {status} tasks yet.</p>
      ) : (
        <TaskListClient
          tasks={result.tasks}
          userUuid={user_uuid}
          status={status}
          statusConfig={config}
          currentPage={result.page || 1}
          hasMore={result.hasMore || false}
          groupUuid={groupUuid}
        />
      )}
    </GenericPage>
  );
}
