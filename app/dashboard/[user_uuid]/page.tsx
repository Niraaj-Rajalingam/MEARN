import DashboardClient from './DashboardClient';

export default async function DashboardPage({ params }: { params: Promise<{ user_uuid: string }> }) {
  const { user_uuid } = await params;
  return <DashboardClient userUuid={user_uuid} />;
}
