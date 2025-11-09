import GenericPage from '@/components/layout/GenericPage';
import { notFound } from 'next/navigation';
import { fetchGroupWithMembersAction } from './actions';

type Params = {
  params: {
    user_uuid: string;
    group_uuid: string;
  };
};

export default async function GroupMembersPage({ params }: Params) {
  const { user_uuid, group_uuid } = params;
  const payload = await fetchGroupWithMembersAction(group_uuid);

  if (!payload.success || !payload.group) {
    notFound();
  }

  const { group, members } = payload;

  return (
    <GenericPage
      title={group.group_name}
      description={`${members.length} member${members.length === 1 ? '' : 's'}`}
      showSearch={false}
      showSubmit={false}
      homeHref={`/dashboard/${user_uuid}`}
    >
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members in this group yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {members.map((member) => (
            <li key={String(member.user_uuid)} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide rounded-full bg-indigo-50 text-indigo-600 px-3 py-1">
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </GenericPage>
  );
}
