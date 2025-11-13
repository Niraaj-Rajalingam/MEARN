import DashboardFriendsClient from '../DashboardFriendsClient';

export default function DashboardFriendsPage({ params }: { params: { user_uuid: string } }) {
    return <DashboardFriendsClient userUuid={params.user_uuid} />;
}
