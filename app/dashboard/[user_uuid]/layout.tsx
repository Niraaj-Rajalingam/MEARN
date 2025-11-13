import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DashboardNavbar from './DashboardNavbar';

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
        <div className="min-h-screen bg-background">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 md:px-6 lg:px-8">
                <DashboardNavbar userUuid={user_uuid} />
                <main className="flex-1 overflow-y-auto pb-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
