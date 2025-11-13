import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Header } from '@/components/layout';
import DashboardNavbar from '@/app/dashboard/[user_uuid]/DashboardNavbar';
import FriendsPage from '@/app/friends/[user_uuid]/page';

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ user_uuid: string }>;
}) {
    const { user_uuid } = await params;
    const user = await getSession();

    // redirect to signup if not logged in
    if (!user) {
        redirect('/signup');
    }

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardNavbar userUuid={user_uuid} />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 auto-rows-max">
                    {children}
                </div>
            </div>
        </div>
    );
}
