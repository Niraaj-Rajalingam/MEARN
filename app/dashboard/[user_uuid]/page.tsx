import DashboardClient from './DashboardClient';

export default function DashboardPage({ params }: { params: { user_uuid: string } }) {
  return <DashboardClient userUuid={params.user_uuid} />;
}
