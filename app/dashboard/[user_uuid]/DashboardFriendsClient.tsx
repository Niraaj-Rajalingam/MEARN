'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UsersRound, UserPlus, MailQuestion } from 'lucide-react';
import { fetchPendingRequestsAction } from '@/app/friends/[user_uuid]/requests/actions';

type DashboardFriendsClientProps = {
    userUuid: string;
};

export default function DashboardFriendsClient({ userUuid }: DashboardFriendsClientProps) {
    const [pendingCount, setPendingCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const loadPendingRequests = async () => {
            try {
                const result = await fetchPendingRequestsAction(userUuid);
                if (!active) return;
                if (result.success) {
                    setPendingCount(result.requests.length);
                } else {
                    setPendingCount(0);
                }
            } catch (error) {
                console.error('Failed to fetch pending requests count:', error);
                if (active) {
                    setPendingCount(0);
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        loadPendingRequests();

        return () => {
            active = false;
        };
    }, [userUuid]);

    const displayedCount = pendingCount ?? 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold sm:text-2xl md:text-3xl">Friends</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your friendships, respond to new requests, and explore your network.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    <MailQuestion className="h-4 w-4" aria-hidden="true" />
                    <span>Pending Requests:</span>
                    <span className="text-foreground">{isLoading ? '—' : displayedCount}</span>
                </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2">
                <article className="border rounded-lg bg-card p-5 sm:p-6 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UsersRound className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold">Your Friends</h2>
                            <p className="text-sm text-muted-foreground">View and manage the friends you have added so far.</p>
                        </div>
                    </div>
                    <Link
                        href={`/friends/${userUuid}`}
                        className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                        Open friends list
                    </Link>
                </article>

                <article className="border rounded-lg bg-card p-5 sm:p-6 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <MailQuestion className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold">Friend Requests</h2>
                            <p className="text-sm text-muted-foreground">Accept or decline new friend requests waiting for you.</p>
                        </div>
                    </div>
                    <Link
                        href={`/friends/${userUuid}/requests`}
                        className="inline-flex items-center justify-center rounded-full border border-amber-400 px-4 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50"
                    >
                        View requests ({displayedCount})
                    </Link>
                </article>

                <article className="border rounded-lg bg-card p-5 sm:p-6 sm:col-span-2 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <UserPlus className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold">Add New Friends</h2>
                            <p className="text-sm text-muted-foreground">Send invitations to teammates or classmates to collaborate on tasks.</p>
                        </div>
                    </div>
                    <Link
                        href={`/friends/${userUuid}/add`}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                    >
                        Add friend
                    </Link>
                </article>
            </section>
        </div>
    );
}
