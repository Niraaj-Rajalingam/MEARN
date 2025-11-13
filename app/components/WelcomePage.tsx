'use client';

import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white from-40% to-purple-100 dark:from-slate-900 dark:from-40% dark:to-purple-900">
      <div className="w-full max-w-2xl space-y-12 p-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Welcome to MEARN</h1>
          <p className="text-xl text-muted-foreground">
            A task management app where your friend grows with you
          </p>
        </div>

        {/* Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">What you can do:</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 border rounded-lg bg-white dark:bg-slate-800 hover:shadow-lg transition-all hover:-translate-y-1 border-gray-200 dark:border-slate-700">
              <div className="text-lg font-semibold mb-2">Make tasks</div>
              <p className="text-muted-foreground">Create and manage your personal tasks with ease</p>
            </div>
            <div className="p-6 border rounded-lg bg-white dark:bg-slate-800 hover:shadow-lg transition-all hover:-translate-y-1 border-gray-200 dark:border-slate-700">
              <div className="text-lg font-semibold mb-2">Assign tasks with groups</div>
              <p className="text-muted-foreground">Collaborate by assigning tasks to your groups</p>
            </div>
            <div className="p-6 border rounded-lg bg-white dark:bg-slate-800 hover:shadow-lg transition-all hover:-translate-y-1 border-gray-200 dark:border-slate-700">
              <div className="text-lg font-semibold mb-2">See your friends progress</div>
              <p className="text-muted-foreground">Track how your friends are doing on their tasks</p>
            </div>
            <div className="p-6 border rounded-lg bg-white dark:bg-slate-800 hover:shadow-lg transition-all hover:-translate-y-1 border-gray-200 dark:border-slate-700">
              <div className="text-lg font-semibold mb-2">Build the ABC's of productivity</div>
              <p className="text-muted-foreground">Accountability, consistency, and commitment matter</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/signup"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:shadow-lg hover:scale-105 transition-all font-medium text-center"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-primary text-primary rounded-md hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:scale-105 transition-all font-medium text-center"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
