import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Header } from '@/components/layout';

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ user_uuid: string }>;
}) {
    await params;
    const user = await getSession();

    // redirect to signup if not logged in
    if (!user) {
        redirect('/signup');
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header user={user} />

            <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 md:mb-6">Dashboard</h1>
                <div className="grid gap-2 sm:gap-4 md:gap-6 md:grid-cols-2 auto-rows-max">
                    {children}
                </div>
            </div>
        </div>
    );
}
