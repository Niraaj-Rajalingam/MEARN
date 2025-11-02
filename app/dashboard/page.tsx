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

          {/* friends section */}
          <section className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Friends</h2>
              <a
                href="/friends/add"
                className="text-sm text-primary hover:underline"
              >
                Add Friend
              </a>
            </div>
            <a
              href="/friends"
              className="block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              View All Friends
            </a>
          </section>

          {/* to-do group section */}
          <section className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold mb-4">My Groups</h2>
              <a
                href="/groups/add"
                className="text-sm text-primary hover:underline"
              >
                Create New Group
              </a>
            </div>
            {/* to-do list component will go here */}
          </section>

          {/* to-do tasks section */}
          <section className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
            {/* to-do list component will go here */}
          </section>

        </div>
      </div>
    </div>
  );
}