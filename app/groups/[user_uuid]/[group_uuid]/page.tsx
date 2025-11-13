import GenericPage from '@/components/layout/GenericPage';
import { notFound } from 'next/navigation';
import GroupMembersClient from './GroupMembersClient';
import { fetchGroupWithMembersAction } from './actions';

type Params = {
  params: Promise<{
    user_uuid: string;
    group_uuid: string;
  }>;
};

export default async function GroupMembersPage({ params }: Params) {
  const { user_uuid, group_uuid } = await params;
  const payload = await fetchGroupWithMembersAction(group_uuid);

  if (!payload.success || !payload.group) {
    notFound();
  }

  const { group, members } = payload;

  return (
    <GenericPage
      title="Group Members"
      description="View and manage group members"
      showSearch={false}
      showSubmit={false}
      showBackButton
    >
      <GroupMembersClient
        userUuid={user_uuid}
        groupUuid={group_uuid}
        groupName={group.group_name}
        members={members}
      />
    </GenericPage>
  );
}
