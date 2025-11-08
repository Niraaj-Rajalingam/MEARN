import Link from 'next/link';
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
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Group</p>
          <h1 className="text-3xl font-semibold">{group.group_name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {members.length} member{members.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href={`/dashboard/${user_uuid}`}
          className="inline-flex justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </header>

      <section className="border rounded-lg overflow-hidden">
        <div className="border-b px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold">Group Members</h2>
        </div>
        {members.length === 0 ? (
          <p className="p-6 text-gray-500">No members in this group yet.</p>
        ) : (
          <ul className="divide-y">
            {members.map((member) => (
              <li key={String(member.user_uuid)} className="flex items-center justify-between px-6 py-4">
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
      </section>
    </div>
  );
}
