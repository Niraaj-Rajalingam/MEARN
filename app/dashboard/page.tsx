import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Header } from '@/components/layout';

export default async function DashboardPage() {
  const user = await getSession();

  // redirect to signup if not logged in
  if (!user) {
    redirect('/signup');
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />

      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {/* tamagotchi display section */}
          <section className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">My Tamagotchi</h2>
            {/* tamagotchi component will go here */}
          </section>

          {/* to-do list section */}
          <section className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
            {/* to-do list component will go here */}
          </section>
        </div>
      </div>
    </div>
  );
}